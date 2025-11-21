import {
	getSignedMsgUserAccountPublicKey,
	OrderType,
	SignedMsgOrderParamsDelegateMessage,
	SignedMsgOrderParamsMessage,
	SLOT_TIME_ESTIMATE_MS,
} from '@drift-labs/sdk';
import {
	BN,
	DriftClient,
	generateSignedMsgUuid,
	getOrderParams,
	OptionalOrderParams,
	PublicKey,
} from '@drift-labs/sdk';
import {
	ENUM_UTILS,
	getSwiftConfirmationTimeoutMs,
} from '../../../../../../utils';
import {
	SwiftClient,
	SwiftOrderConfirmedEvent,
	SwiftOrderErroredEvent,
	SwiftOrderEvent,
	SwiftOrderEventWithParams,
	SwiftOrderSentEvent,
} from '../../../../../../clients/swiftClient';
import { MarketId } from '../../../../../../types';
import { Observable, Subscription } from 'rxjs';
import { OptionalTriggerOrderParams } from '../types';
import { TRADING_UTILS } from '../../../../../../common-ui-utils/trading';
import { Connection } from '@solana/web3.js';

/**
 * Buffer slots to account for signing of message by the user (default: 7 slots ~3 second, assumes user have to approves the signing in a UI wallet).
 */
export const USER_SIGNING_MESSAGE_BUFFER_SLOTS = 7;

/**
 * Orders without auction require a higher buffer (kink of the SWIFT server handling non-auction orders)
 */
export const MINIMUM_SWIFT_NON_AUCTION_ORDER_SIGNING_EXPIRATION_BUFFER_SLOTS = 35;

/**
 * Buffer slots from the end of the auction to prevent the signing of the order message.
 */
export const SWIFT_ORDER_SIGNING_EXPIRATION_BUFFER_SLOTS = 5;
export const MINIMUM_SWIFT_ORDER_SIGNING_EXPIRATION_BUFFER_SLOTS = 5;

export interface SwiftOrderOptions {
	wallet: {
		signMessage: (message: Uint8Array) => Promise<Uint8Array>;
		takerAuthority: PublicKey;
		signingAuthority?: PublicKey;
	};
	swiftServerUrl: string;
	/**
	 * Buffer slots to account for the user to sign the message. Affects the auction start slot.
	 * If order is not an auction order, it is not encouraged to use this buffer.
	 */
	userSigningSlotBuffer?: number;
	isDelegate?: boolean;
	/**
	 * Multiplier for the SWIFT confirmation timeout (after sending SWIFT order). Default is 1.
	 */
	confirmationMultiplier?: number;
	callbacks?: {
		onOrderParamsMessagePrepped?: (
			orderParamsMessage:
				| SignedMsgOrderParamsMessage
				| SignedMsgOrderParamsDelegateMessage
		) => void;
		onSigningExpiry?: (
			orderParamsMessage:
				| SignedMsgOrderParamsMessage
				| SignedMsgOrderParamsDelegateMessage
		) => void;
		onSigningSuccess?: (
			signedMessage: Uint8Array,
			// we add the following here, because the onSigningSuccess callback is called before the order is sent to the swift server
			orderUuid: Uint8Array,
			orderParamsMessage:
				| SignedMsgOrderParamsMessage
				| SignedMsgOrderParamsDelegateMessage
		) => void;
		onSent?: (
			swiftSentEvent: SwiftOrderEventWithParams<SwiftOrderSentEvent>
		) => void;
		onConfirmed?: (
			swiftConfirmedEvent: SwiftOrderEventWithParams<SwiftOrderConfirmedEvent>
		) => void;
		onExpired?: (
			swiftExpiredEvent: SwiftOrderEventWithParams<SwiftOrderErroredEvent>
		) => void;
		onErrored?: (
			swiftErroredEvent: SwiftOrderEventWithParams<SwiftOrderErroredEvent>
		) => void;
	};
	/**
	 * Used for internal tracking of the source of the swift order.
	 */
	source?: string;
}

export type SwiftOrderObservable = Observable<SwiftOrderEvent>;

interface PrepSwiftOrderParams {
	/** The Drift client instance */
	driftClient: DriftClient;
	/** The taker user account information */
	takerUserAccount: {
		/** Public key of the user account */
		pubKey: PublicKey;
		/** User account ID */
		subAccountId: number;
	};
	/** Current blockchain slot number */
	currentSlot: number;
	/** Whether this is a delegate order */
	isDelegate: boolean;
	/** Order parameters including main order and optional stop loss/take profit */
	orderParams: {
		/** Main order parameters */
		main: OptionalOrderParams;
		/** Optional stop loss order parameters */
		stopLoss?: OptionalTriggerOrderParams;
		/** Optional take profit order parameters */
		takeProfit?: OptionalTriggerOrderParams;
		/** Optional max leverage for the position */
		positionMaxLeverage?: number;
		/** Optional isolated position deposit amount */
		isolatedPositionDeposit?: BN;
	};
	/**
	 * Buffer slots to account for the user to sign the message. Affects the auction start slot.
	 * If order is not an auction order, it is not encouraged to use this buffer.
	 */
	userSigningSlotBuffer?: number;
	/**
	 * Optional builder code parameters for revenue sharing.
	 * If provided, the builder will receive a portion of the trading fees.
	 *
	 * Prerequisites:
	 * - User must have initialized a RevenueShareEscrow account
	 * - Builder must be in the user's approved_builders list
	 * - builderFeeTenthBps must not exceed the builder's max_fee_tenth_bps
	 */
	builderParams?: {
		/**
		 * Index of the builder in the user's approved_builders list.
		 * This is the position (0-indexed) of the builder in the RevenueShareEscrow.approved_builders array.
		 */
		builderIdx: number;
		/**
		 * Fee to charge for this order, in tenths of basis points.
		 * Must be <= the builder's max_fee_tenth_bps.
		 *
		 * Examples:
		 * - 10 = 1 bps = 0.01%
		 * - 50 = 5 bps = 0.05%
		 * - 100 = 10 bps = 0.1%
		 */
		builderFeeTenthBps: number;
	};
}

/**
 * Prepares a swift order by encoding the order parameters into a message format
 * suitable for signing and sending to the Swift server.
 *
 * @param driftClient - The Drift client instance
 * @param takerUserAccount - The taker user account information
 * @param currentSlot - Current blockchain slot number
 * @param isDelegate - Whether this is a delegate order
 * @param orderParams - Order parameters including main order and optional stop loss/take profit
 * @param userSigningSlotBuffer - Buffer slots to account for the user to sign the message. Affects the auction start slot. If order is not an auction order, it is not encouraged to use this buffer.
 *
 * @returns An object containing:
 *   - `hexEncodedSwiftOrderMessage`: The encoded order message in both Uint8Array and string formats. The Uint8Array format is for a wallet to sign, while the string format is used to send to the SWIFT server.
 *   - `signedMsgOrderParamsMessage`: The signed message order parameters
 *   - `slotForSignedMsg`: The slot number for the signed message
 *   - `signedMsgOrderUuid`: Unique identifier for the signed message order
 */
export const prepSwiftOrder = ({
	driftClient,
	takerUserAccount,
	currentSlot,
	isDelegate,
	orderParams,
	userSigningSlotBuffer,
	builderParams,
}: PrepSwiftOrderParams): {
	hexEncodedSwiftOrderMessage: {
		uInt8Array: Uint8Array;
		string: string;
	};
	signedMsgOrderParamsMessage:
		| SignedMsgOrderParamsMessage
		| SignedMsgOrderParamsDelegateMessage;
	slotForSignedMsg: BN;
	signedMsgOrderUuid: Uint8Array;
} => {
	const mainOrderParams = getOrderParams({
		...orderParams.main,
		auctionDuration: orderParams.main.auctionDuration || null, // swift server expects auctionDuration to be null if not set, won't handle 0
	});

	if (!userSigningSlotBuffer) {
		userSigningSlotBuffer = mainOrderParams.auctionDuration
			? USER_SIGNING_MESSAGE_BUFFER_SLOTS
			: MINIMUM_SWIFT_NON_AUCTION_ORDER_SIGNING_EXPIRATION_BUFFER_SLOTS;
	}

	// if it is not an auction order, there should be a minimum buffer used
	if (!mainOrderParams.auctionDuration) {
		userSigningSlotBuffer = Math.max(
			userSigningSlotBuffer,
			MINIMUM_SWIFT_NON_AUCTION_ORDER_SIGNING_EXPIRATION_BUFFER_SLOTS
		);
	}

	// buffer for time the user takes to sign a message and send to the swift server
	const auctionStartSlot = new BN(currentSlot + userSigningSlotBuffer);

	const signedMsgOrderUuid = generateSignedMsgUuid();

	const baseSignedMsgOrderParamsMessage = {
		signedMsgOrderParams: mainOrderParams,
		uuid: signedMsgOrderUuid,
		slot: auctionStartSlot,
		stopLossOrderParams: orderParams.stopLoss
			? {
					baseAssetAmount: orderParams.stopLoss.baseAssetAmount,
					triggerPrice: orderParams.stopLoss.triggerPrice,
			  }
			: null,
		takeProfitOrderParams: orderParams.takeProfit
			? {
					baseAssetAmount: orderParams.takeProfit.baseAssetAmount,
					triggerPrice: orderParams.takeProfit.triggerPrice,
			  }
			: null,
		maxMarginRatio: orderParams.positionMaxLeverage
			? TRADING_UTILS.convertLeverageToMarginRatio(
					orderParams.positionMaxLeverage
			  )
			: null,
		isolatedPositionDeposit: orderParams.isolatedPositionDeposit ?? null,
		// Include builder params if provided
		builderIdx: builderParams?.builderIdx ?? null,
		builderFeeTenthBps: builderParams?.builderFeeTenthBps ?? null,
	};

	const signedMsgOrderParamsMessage:
		| SignedMsgOrderParamsMessage
		| SignedMsgOrderParamsDelegateMessage = isDelegate
		? {
				...baseSignedMsgOrderParamsMessage,
				takerPubkey: takerUserAccount.pubKey,
		  }
		: {
				...baseSignedMsgOrderParamsMessage,
				subAccountId: takerUserAccount.subAccountId,
		  };

	const encodedOrderMessage = driftClient.encodeSignedMsgOrderParamsMessage(
		signedMsgOrderParamsMessage,
		isDelegate
	);
	const hexEncodedSwiftOrderMessage = Buffer.from(
		encodedOrderMessage.toString('hex')
	);

	return {
		hexEncodedSwiftOrderMessage: {
			uInt8Array: new Uint8Array(hexEncodedSwiftOrderMessage),
			string: hexEncodedSwiftOrderMessage.toString(),
		},
		signedMsgOrderParamsMessage,
		slotForSignedMsg: auctionStartSlot,
		signedMsgOrderUuid,
	};
};

/**
 * Error thrown when an auction slot has expired
 */
export class AuctionSlotExpiredError extends Error {
	name = 'AuctionSlotExpiredError';

	/**
	 * Creates an instance of AuctionSlotExpiredError
	 * @param message - Error message (default: 'Auction slot expired')
	 */
	constructor(message: string = 'Auction slot expired') {
		super(message);
		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, AuctionSlotExpiredError);
		}
	}
}

interface SignOrderMsgParams {
	/** Wallet instance with message signing capability */
	wallet: {
		/** Function to sign a message */
		signMessage: (message: Uint8Array) => Promise<Uint8Array>;
	};
	/** Hex-encoded swift order message to sign */
	hexEncodedSwiftOrderMessage: Uint8Array;
	/** Time in milliseconds till the auction expires */
	expirationTimeMs: number;
	/** Callback function called when the auction expires */
	onExpired?: () => void;
}

/**
 * Signs a swift order message with slot expiration monitoring.
 * Continuously monitors the current slot and rejects with AuctionSlotExpiredError
 * if the auction slot expires before signing is complete.
 *
 * @param wallet - Wallet instance with message signing capability
 * @param hexEncodedSwiftOrderMessage - Hex-encoded swift order message to sign
 * @param expirationTimeMs - Time in milliseconds till the auction expires
 * @param onExpired - Callback function called when the auction expires
 *
 * @returns Promise resolving to the signed message as Uint8Array
 * @throws {AuctionSlotExpiredError} When the auction slot expires before signing completes
 */
export const signSwiftOrderMsg = async ({
	wallet,
	hexEncodedSwiftOrderMessage,
	expirationTimeMs,
	onExpired,
}: SignOrderMsgParams): Promise<Uint8Array> => {
	let timeoutId: ReturnType<typeof setTimeout> | undefined;

	try {
		// Sign the message
		const signedMessagePromise = wallet.signMessage(
			hexEncodedSwiftOrderMessage
		);

		const signingExpiredPromise = new Promise<never>((_resolve, reject) => {
			timeoutId = setTimeout(() => {
				onExpired?.();
				reject(new AuctionSlotExpiredError());
			}, expirationTimeMs);
		});

		// Ensure that the user signs the message before the expiration time
		const signedMessage = await Promise.race([
			signedMessagePromise,
			signingExpiredPromise,
		]);

		return signedMessage;
	} finally {
		if (timeoutId) {
			clearTimeout(timeoutId);
		}
	}
};

/**
 * Parameters for sending a swift order to the Swift server
 * @interface SendSwiftOrderParams
 */
interface SendSwiftOrderParams {
	/** The Drift client instance */
	driftClient: DriftClient;
	/** Market identifier for the order */
	marketId: MarketId;
	/** Hex-encoded swift order message as string */
	hexEncodedSwiftOrderMessageString: string;
	/** The signed message from the wallet */
	signedMessage: Uint8Array;
	/** Unique identifier for the signed message order */
	signedMsgOrderUuid: Uint8Array;
	/** Public key of the taker authority */
	takerAuthority: PublicKey;
	/** Public key of the signing authority */
	signingAuthority: PublicKey;
	/** Number of slots till the end of the auction (optional) */
	slotsTillAuctionEnd: number;
	/** Multiplier for the SWIFT confirmation timeout (after sending SWIFT order) */
	confirmationMultiplier?: number;
	/** Optionally send a different connection for the confirmation step, possibly for a faster commitment */
	confirmationConnection?: Connection;
}

/**
 * Sends a swift order to the Swift server and handles the response.
 * Monitors the order status and calls appropriate callback functions based on the response type.
 *
 * @param driftClient - The Drift client instance
 * @param marketId - Market identifier for the order
 * @param hexEncodedSwiftOrderMessageString - Hex-encoded swift order message as string
 * @param signedMessage - The signed message from the wallet
 * @param signedMsgOrderUuid - Unique identifier for the signed message order
 * @param takerAuthority - Public key of the taker authority
 * @param signingAuthority - Public key of the signing authority
 * @param slotsTillAuctionEnd - Number of slots till the end of the auction (optional)
 * @param swiftConfirmationSlotBuffer - Slot buffer for swift server confirmation time (default: 15)
 * @param onExpired - Callback function called when the order expires
 * @param onErrored - Callback function called when the order encounters an error
 * @param onConfirmed - Callback function called when the order is confirmed
 *
 * @returns Promise that resolves when the order processing is complete
 *
 */
export const sendSwiftOrder = ({
	driftClient,
	marketId,
	hexEncodedSwiftOrderMessageString,
	signedMessage,
	signedMsgOrderUuid,
	takerAuthority,
	signingAuthority,
	slotsTillAuctionEnd,
	confirmationMultiplier,
	confirmationConnection,
}: SendSwiftOrderParams): SwiftOrderObservable => {
	const signedMsgUserOrdersAccountPubkey = getSignedMsgUserAccountPublicKey(
		driftClient.program.programId,
		takerAuthority
	);

	const swiftOrderObservable = SwiftClient.sendAndConfirmSwiftOrderWS(
		confirmationConnection ?? driftClient.connection,
		driftClient,
		marketId.marketIndex,
		marketId.marketType,
		hexEncodedSwiftOrderMessageString,
		Buffer.from(signedMessage),
		takerAuthority,
		signedMsgUserOrdersAccountPubkey,
		signedMsgOrderUuid,
		getSwiftConfirmationTimeoutMs(slotsTillAuctionEnd, confirmationMultiplier),
		signingAuthority
	);

	return swiftOrderObservable;
};

type PrepSignAndSendSwiftOrderParams = {
	driftClient: DriftClient;
	subAccountId: number;
	userAccountPubKey: PublicKey;
	marketIndex: number;
	userSigningSlotBuffer: number;
	swiftOptions: SwiftOrderOptions;
	/** Multiplier for the SWIFT confirmation timeout (after sending SWIFT order). Default is 1.
	 *
	 * Higher multiplier means longer confirmation timeout.
	 */
	confirmationMultiplier?: number;
	confirmationConnection?: Connection;
	orderParams: {
		main: OptionalOrderParams;
		takeProfit?: OptionalTriggerOrderParams;
		stopLoss?: OptionalTriggerOrderParams;
		/**
		 * Adjusts the max leverage of a position.
		 */
		positionMaxLeverage?: number;
		/**
		 * Optional isolated position deposit amount for isolated positions.
		 */
		isolatedPositionDeposit?: BN;
	};
	/**
	 * Optional builder code parameters for revenue sharing.
	 * If provided, the builder will receive a portion of the trading fees.
	 *
	 * Prerequisites:
	 * - User must have initialized a RevenueShareEscrow account
	 * - Builder must be in the user's approved_builders list
	 * - builderFeeTenthBps must not exceed the builder's max_fee_tenth_bps
	 *
	 * @example
	 * ```typescript
	 * builderParams: {
	 *   builderIdx: 0,          // First builder in approved list
	 *   builderFeeTenthBps: 50  // 5 bps = 0.05%
	 * }
	 * ```
	 */
	builderParams?: {
		/**
		 * Index of the builder in the user's approved_builders list.
		 */
		builderIdx: number;
		/**
		 * Fee to charge for this order, in tenths of basis points.
		 * Must be <= the builder's max_fee_tenth_bps.
		 */
		builderFeeTenthBps: number;
	};
};

/**
 * Handles the full flow of the swift order, from preparing to signing and sending to the Swift server.
 * Callbacks can be provided to handle the events of the Swift order.
 * Returns a promise that resolves when the Swift order has reached a terminal state (i.e. confirmed, expired, or errored).
 */
export const prepSignAndSendSwiftOrder = async ({
	driftClient,
	subAccountId,
	userAccountPubKey,
	marketIndex,
	userSigningSlotBuffer,
	swiftOptions,
	orderParams,
	builderParams,
	confirmationMultiplier,
}: PrepSignAndSendSwiftOrderParams): Promise<void> => {
	const currentSlot = await driftClient.connection.getSlot('confirmed');

	const {
		hexEncodedSwiftOrderMessage,
		signedMsgOrderUuid,
		signedMsgOrderParamsMessage,
	} = prepSwiftOrder({
		driftClient,
		takerUserAccount: {
			pubKey: userAccountPubKey,
			subAccountId: subAccountId,
		},
		currentSlot,
		isDelegate: swiftOptions.isDelegate || false,
		orderParams,
		userSigningSlotBuffer,
		builderParams,
	});

	swiftOptions.callbacks?.onOrderParamsMessagePrepped?.(
		signedMsgOrderParamsMessage
	);

	// both market and non-market orders can have auction durations.
	//
	// for market orders, the auction duration + user signing slot buffer is a good gauge for slots until auction end
	//
	// for non-market orders, if they have an auction duration, we use the maximum of MINIMUM_SWIFT_NON_AUCTION_ORDER_SIGNING_EXPIRATION_BUFFER_SLOTS
	// and the (auction duration + user signing slot buffer). This is because limit auctions can have very small auction durations,
	// but the limit order is still valid to be placed even after the auction ends, hence we enforce a minimum duration so that
	// short limit auction durations can still be placed
	const isMarketOrder =
		ENUM_UTILS.match(orderParams.main.orderType, OrderType.ORACLE) ||
		ENUM_UTILS.match(orderParams.main.orderType, OrderType.MARKET);
	const slotsTillAuctionEnd = orderParams.main.auctionDuration
		? isMarketOrder
			? userSigningSlotBuffer + orderParams.main.auctionDuration
			: Math.max(
					MINIMUM_SWIFT_NON_AUCTION_ORDER_SIGNING_EXPIRATION_BUFFER_SLOTS,
					userSigningSlotBuffer + orderParams.main.auctionDuration
			  )
		: MINIMUM_SWIFT_NON_AUCTION_ORDER_SIGNING_EXPIRATION_BUFFER_SLOTS;
	const expirationTimeMs =
		Math.max(
			slotsTillAuctionEnd - SWIFT_ORDER_SIGNING_EXPIRATION_BUFFER_SLOTS,
			MINIMUM_SWIFT_ORDER_SIGNING_EXPIRATION_BUFFER_SLOTS
		) * SLOT_TIME_ESTIMATE_MS;

	// Ensure that the user signs the message before the expiration time
	const signedMessage = await signSwiftOrderMsg({
		wallet: swiftOptions.wallet,
		hexEncodedSwiftOrderMessage: hexEncodedSwiftOrderMessage.uInt8Array,
		expirationTimeMs,
		onExpired: () =>
			swiftOptions.callbacks?.onSigningExpiry?.(signedMsgOrderParamsMessage),
	});

	swiftOptions.callbacks?.onSigningSuccess?.(
		signedMessage,
		signedMsgOrderUuid,
		signedMsgOrderParamsMessage
	);

	// Initialize SwiftClient (required before using sendSwiftOrder)
	SwiftClient.init(swiftOptions.swiftServerUrl, swiftOptions.source ?? '');

	// Create a promise-based wrapper for the sendSwiftOrder callback-based API
	const swiftOrderObservable = sendSwiftOrder({
		driftClient,
		marketId: MarketId.createPerpMarket(marketIndex),
		hexEncodedSwiftOrderMessageString: hexEncodedSwiftOrderMessage.string,
		signedMessage,
		signedMsgOrderUuid,
		takerAuthority: swiftOptions.wallet.takerAuthority,
		signingAuthority:
			swiftOptions.wallet.signingAuthority ??
			swiftOptions.wallet.takerAuthority,
		slotsTillAuctionEnd,
		confirmationMultiplier,
		confirmationConnection: new Connection(
			driftClient.connection.rpcEndpoint,
			'processed'
		),
	});

	const wrapSwiftOrderEvent = <T extends SwiftOrderEvent>(
		swiftOrderEvent: T
	) => {
		return {
			...swiftOrderEvent,
			swiftOrderUuid: signedMsgOrderUuid,
			orderParamsMessage: signedMsgOrderParamsMessage,
		};
	};

	let promiseResolver: (value: void | PromiseLike<void>) => void;
	const promise = new Promise<void>((resolve) => {
		promiseResolver = resolve;
	});

	const handleTerminalEvent = (subscription: Subscription) => {
		subscription.unsubscribe();
		promiseResolver();
	};

	const subscription = swiftOrderObservable.subscribe((swiftOrderEvent) => {
		if (swiftOrderEvent.type === 'sent') {
			swiftOptions.callbacks?.onSent?.(wrapSwiftOrderEvent(swiftOrderEvent));
		}
		if (swiftOrderEvent.type === 'confirmed') {
			swiftOptions.callbacks?.onConfirmed?.(
				wrapSwiftOrderEvent(swiftOrderEvent)
			);
			handleTerminalEvent(subscription);
		}
		if (swiftOrderEvent.type === 'expired') {
			swiftOptions.callbacks?.onExpired?.(wrapSwiftOrderEvent(swiftOrderEvent));
			handleTerminalEvent(subscription);
		}
		if (swiftOrderEvent.type === 'errored') {
			swiftOptions.callbacks?.onErrored?.(wrapSwiftOrderEvent(swiftOrderEvent));
			handleTerminalEvent(subscription);
		}
	});

	return promise;
};

import {
	getSignedMsgUserAccountPublicKey,
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
	SwiftClient,
	SwiftOrderConfirmedEvent,
	SwiftOrderErroredEvent,
} from '../../../../../clients/swiftClient';
import { MarketId } from 'src/types';
import { firstValueFrom } from 'rxjs';

export interface OptionalTriggerOrderParams extends OptionalOrderParams {
	/** The trigger price for the order */
	triggerPrice: BN;
}

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
	};
	/** Buffer slots to account for signing time (default: 2 slots ~1 second). If a user is required to manually sign the message, this should be a higher number. */
	slotBuffer?: number;
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
 * @param slotBuffer - Buffer slots to account for signing time (default: 2 slots ~1 second).  If a user is required to manually sign the message, this should be a higher number.
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
	slotBuffer = 2, // ~1 second
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

	// buffer for time the user takes to sign a message and send to the swift server
	const slotForSignedMsg = new BN(currentSlot + slotBuffer);

	const signedMsgOrderUuid = generateSignedMsgUuid();

	const baseSignedMsgOrderParamsMessage = {
		signedMsgOrderParams: mainOrderParams,
		uuid: signedMsgOrderUuid,
		slot: slotForSignedMsg,
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
		slotForSignedMsg,
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
	/** Slot number when the auction expires */
	auctionExpirationSlot: BN;
	/** Function to get the current blockchain slot */
	getCurrentSlot: () => number;
	/** Callback function called when the auction expires */
	onExpired: () => void;
}

// TODO: Signing the swift order should be part of the Drift wrapper, not here
/**
 * Signs a swift order message with slot expiration monitoring.
 * Continuously monitors the current slot and rejects with AuctionSlotExpiredError
 * if the auction slot expires before signing is complete.
 *
 * @param wallet - Wallet instance with message signing capability
 * @param hexEncodedSwiftOrderMessage - Hex-encoded swift order message to sign
 * @param auctionExpirationSlot - Slot number when the auction expires
 * @param getCurrentSlot - Function to get the current blockchain slot
 * @param onExpired - Callback function called when the auction expires
 *
 * @returns Promise resolving to the signed message as Uint8Array
 * @throws {AuctionSlotExpiredError} When the auction slot expires before signing completes
 */
export const signSwiftOrderMsg = async ({
	wallet,
	hexEncodedSwiftOrderMessage,
	auctionExpirationSlot,
	getCurrentSlot,
	onExpired,
}: SignOrderMsgParams): Promise<Uint8Array> => {
	return new Promise((resolve, reject) => {
		const interval = setInterval(() => {
			const currentSlot = getCurrentSlot();
			if (currentSlot >= auctionExpirationSlot.toNumber()) {
				onExpired();
				clearInterval(interval);
				reject(new AuctionSlotExpiredError());
			}
		}, SLOT_TIME_ESTIMATE_MS);

		wallet
			.signMessage(hexEncodedSwiftOrderMessage)
			.then((signedMessage) => {
				resolve(signedMessage);
			})
			.catch((error) => {
				reject(error);
			})
			.finally(() => {
				clearInterval(interval);
			});
	});
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
	/** Duration of the auction in slots (optional) */
	auctionDurationSlot?: number;

	/**
	 * This is a slot buffer to account for the time it takes for the swift server to confirm the order.
	 * If there is an auction duration component, it will be added to the final confirmation delay.
	 * @default 15
	 */
	swiftConfirmationSlotBuffer?: number;

	/** Callback function called when the order expires */
	onExpired: (event: SwiftOrderErroredEvent) => void;
	/** Callback function called when the order encounters an error */
	onErrored: (event: SwiftOrderErroredEvent) => void;
	/** Callback function called when the order is confirmed */
	onConfirmed: (event: SwiftOrderConfirmedEvent) => void;
}

// TODO: Sending the swift order should be part of the Drift wrapper, not here
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
 * @param auctionDurationSlot - Duration of the auction in slots (optional)
 * @param swiftConfirmationSlotBuffer - Slot buffer for swift server confirmation time (default: 15)
 * @param onExpired - Callback function called when the order expires
 * @param onErrored - Callback function called when the order encounters an error
 * @param onConfirmed - Callback function called when the order is confirmed
 *
 * @returns Promise that resolves when the order processing is complete
 *
 */
export const sendSwiftOrder = async ({
	driftClient,
	marketId,
	hexEncodedSwiftOrderMessageString: hexEncodedSwiftOrderMessage,
	signedMessage,
	signedMsgOrderUuid,
	takerAuthority,
	signingAuthority,
	auctionDurationSlot,
	swiftConfirmationSlotBuffer = 15,
	onExpired,
	onErrored,
	onConfirmed,
}: SendSwiftOrderParams): Promise<void> => {
	const signedMsgUserOrdersAccountPubkey = getSignedMsgUserAccountPublicKey(
		driftClient.program.programId,
		takerAuthority
	);

	const swiftResponseObservable = await SwiftClient.sendAndConfirmSwiftOrderWS(
		driftClient.connection,
		driftClient,
		marketId.marketIndex,
		marketId.marketType,
		hexEncodedSwiftOrderMessage.toString(),
		Buffer.from(signedMessage),
		takerAuthority,
		signedMsgUserOrdersAccountPubkey,
		signedMsgOrderUuid,
		((auctionDurationSlot ?? 0) + swiftConfirmationSlotBuffer) *
			SLOT_TIME_ESTIMATE_MS,
		signingAuthority
	);

	const swiftResponse = await firstValueFrom(swiftResponseObservable); // `sendAndConfirmSwiftOrderWS` could be better designed to return a promise rather than an observable

	switch (swiftResponse.type) {
		case 'expired':
			onExpired(swiftResponse);
			break;
		case 'errored':
			onErrored(swiftResponse);
			break;
		case 'confirmed':
			onConfirmed(swiftResponse);
			break;
		default: {
			const _exhaustiveCheck: never = swiftResponse;
			throw new Error(`Unknown swift response type: ${_exhaustiveCheck}`);
		}
	}
};

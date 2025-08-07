import {
	AMM_RESERVE_PRECISION_EXP,
	AMM_TO_QUOTE_PRECISION_RATIO,
	BASE_PRECISION_EXP,
	BN,
	BigNum,
	DriftClient,
	IWallet,
	MarketType,
	OptionalOrderParams,
	OrderType,
	PRICE_PRECISION,
	PRICE_PRECISION_EXP,
	PositionDirection,
	PublicKey,
	QUOTE_PRECISION_EXP,
	SpotMarketConfig,
	User,
	UserAccount,
	ZERO,
	deriveOracleAuctionParams,
	getMarketOrderParams,
	isVariant,
} from '@drift-labs/sdk';
import { ENUM_UTILS, sleep } from '../utils';
import {
	AccountInfo,
	Connection,
	Keypair,
	ParsedAccountData,
} from '@solana/web3.js';
import bcrypt from 'bcryptjs-react';
import nacl, { sign } from 'tweetnacl';
import { getAssociatedTokenAddress } from '@solana/spl-token';
import { AuctionParams, TradeOffsetPrice } from 'src/types';
import { USER_UTILS } from './user';
import { TRADING_UTILS } from './trading';
import { MARKET_UTILS } from './market';
import { ORDER_COMMON_UTILS } from './order';
import { EMPTY_AUCTION_PARAMS } from '../constants/trade';

// When creating an account, try 5 times over 5 seconds to wait for the new account to hit the blockchain.
const ACCOUNT_INITIALIZATION_RETRY_DELAY_MS = 1000;
const ACCOUNT_INITIALIZATION_RETRY_ATTEMPTS = 5;

const abbreviateAddress = (address: string | PublicKey, length = 4) => {
	if (!address) return '';
	const authString = address.toString();
	return `${authString.slice(0, length)}...${authString.slice(-length)}`;
};

/**
 * Get a unique key for an authority's subaccount
 * @param userId
 * @param authority
 * @returns
 */
const getUserKey = (userId: number, authority: PublicKey) => {
	if (userId == undefined || !authority) return '';
	return `${userId}_${authority.toString()}`;
};

/**
 * Get the authority and subAccountId from a user's account key
 * @param key
 * @returns
 */
const getIdAndAuthorityFromKey = (
	key: string
): { userId: number; userAuthority: PublicKey } => {
	const splitKey = key?.split('_');

	if (!splitKey || splitKey.length !== 2)
		return { userId: undefined, userAuthority: undefined };

	return {
		userId: Number(splitKey[0]),
		userAuthority: new PublicKey(splitKey[1]),
	};
};

const fetchCurrentSubaccounts = (driftClient: DriftClient): UserAccount[] => {
	return driftClient.getUsers().map((user) => user.getUserAccount());
};

const fetchUserClientsAndAccounts = (
	driftClient: DriftClient
): { user: User; userAccount: UserAccount }[] => {
	const accounts = fetchCurrentSubaccounts(driftClient);
	const allUsersAndUserAccounts = accounts.map((acct) => {
		return {
			user: driftClient.getUser(acct.subAccountId, acct.authority),
			userAccount: acct,
		};
	});

	return allUsersAndUserAccounts;
};

const awaitAccountInitializationChainState = async (
	driftClient: DriftClient,
	userId: number,
	authority: PublicKey
) => {
	const user = driftClient.getUser(userId, authority);

	if (!user.isSubscribed) {
		await user.subscribe();
	}

	let retryCount = 0;

	do {
		try {
			await updateUserAccount(user);
			if (user?.getUserAccountAndSlot()?.data !== undefined) {
				return true;
			}
		} catch (err) {
			retryCount++;
			await sleep(ACCOUNT_INITIALIZATION_RETRY_DELAY_MS);
		}
	} while (retryCount < ACCOUNT_INITIALIZATION_RETRY_ATTEMPTS);

	throw new Error('awaitAccountInitializationFailed');
};

/**
 * Using your own callback to do the account initialization, this method will run the initialization step, switch to the drift user, await for the account to be available on chain, subscribe to the user account, and switch to the user account using the drift client.
 *
 * It provides extra callbacks to handle steps directly after the initialiation tx, and after fully initializing+subscribing to the account.
 *
 * Callbacks available:
 * - initializationStep: This callback should send the transaction to initialize the user account
 * - postInitializationStep: This callback will run after the successful initialization transaction, but before trying to load/subscribe to the new account
 * - handleSuccessStep: This callback will run after everything has initialized+subscribed successfully
 *
 * // TODO : Need to do the subscription step
 */
const initializeAndSubscribeToNewUserAccount = async (
	driftClient: DriftClient,
	userIdToInit: number,
	authority: PublicKey,
	callbacks: {
		initializationStep: () => Promise<boolean>;
		postInitializationStep?: () => Promise<boolean>;
		handleSuccessStep?: (accountAlreadyExisted: boolean) => Promise<boolean>;
	}
): Promise<
	| 'ok'
	| 'failed_initializationStep'
	| 'failed_postInitializationStep'
	| 'failed_awaitAccountInitializationChainState'
	| 'failed_handleSuccessStep'
> => {
	await driftClient.addUser(userIdToInit, authority);

	const accountAlreadyExisted = await driftClient
		.getUser(userIdToInit)
		?.exists();

	// Do the account initialization step
	let result = await callbacks.initializationStep();

	// Fetch account to make sure it's loaded
	await updateUserAccount(driftClient.getUser(userIdToInit));

	if (!result) {
		return 'failed_initializationStep';
	}

	// Do the post-initialization step
	result = callbacks.postInitializationStep
		? await callbacks.postInitializationStep()
		: result;

	if (!result) {
		return 'failed_postInitializationStep';
	}

	// Await the account initialization step to update the blockchain
	result = await awaitAccountInitializationChainState(
		driftClient,
		userIdToInit,
		authority
	);

	if (!result) {
		return 'failed_awaitAccountInitializationChainState';
	}

	await driftClient.switchActiveUser(userIdToInit, authority);

	// Do the subscription step

	// Run the success handler
	result = callbacks.handleSuccessStep
		? await callbacks.handleSuccessStep(accountAlreadyExisted)
		: result;

	if (!result) {
		return 'failed_handleSuccessStep';
	}

	return 'ok';
};

async function updateUserAccount(user: User): Promise<void> {
	const publicKey = user.userAccountPublicKey;
	try {
		const dataAndContext =
			await user.driftClient.program.account.user.fetchAndContext(
				publicKey,
				'processed'
			);
		user.accountSubscriber.updateData(
			dataAndContext.data as UserAccount,
			dataAndContext.context.slot
		);
	} catch (e) {
		// noop
	}
}

const getMarketKey = (marketIndex: number, marketType: MarketType) =>
	`${ENUM_UTILS.toStr(marketType)}_${marketIndex}`;

/**
 * @deprecated Use createPlaceholderIWallet instead, since this is poorly named.
 */
const createThrowawayIWallet = (walletPubKey?: PublicKey) => {
	const newKeypair = walletPubKey
		? new Keypair({
				publicKey: walletPubKey.toBytes(),
				secretKey: new Keypair().publicKey.toBytes(),
		  })
		: new Keypair();

	const newWallet: IWallet = {
		publicKey: newKeypair.publicKey,
		//@ts-ignore
		signTransaction: () => {
			return Promise.resolve();
		},
		//@ts-ignore
		signAllTransactions: () => {
			return Promise.resolve();
		},
	};

	return newWallet;
};

/**
 * Creates an IWallet wrapper, with redundant methods. If a `walletPubKey` is passed in,
 * the `publicKey` will be based on that.
 */
const createPlaceholderIWallet = (walletPubKey?: PublicKey) => {
	const newKeypair = walletPubKey
		? new Keypair({
				publicKey: walletPubKey.toBytes(),
				secretKey: new Keypair().publicKey.toBytes(),
		  })
		: new Keypair();

	const newWallet: IWallet = {
		publicKey: newKeypair.publicKey,
		//@ts-ignore
		signTransaction: () => {
			return Promise.resolve();
		},
		//@ts-ignore
		signAllTransactions: () => {
			return Promise.resolve();
		},
	};

	return newWallet;
};

const getSignatureVerificationMessageForSettings = (
	authority: PublicKey,
	signTs: number
): Uint8Array => {
	return new TextEncoder().encode(
		`Verify you are the owner of this wallet to update trade settings: \n${authority.toBase58()}\n\nThis signature will be valid for the next 30 minutes.\n\nTS: ${signTs.toString()}`
	);
};

const verifySignature = (
	signature: Uint8Array,
	message: Uint8Array,
	pubKey: PublicKey
): boolean => {
	return sign.detached.verify(message, signature, pubKey.toBytes());
};

const hashSignature = async (signature: string): Promise<string> => {
	bcrypt.setRandomFallback((num: number) => {
		return Array.from(nacl.randomBytes(num));
	});
	const hashedSignature = await bcrypt.hash(signature, bcrypt.genSaltSync(10));
	return hashedSignature;
};

const compareSignatures = async (
	original: string,
	hashed: string
): Promise<boolean> => {
	const signaturesMatch = await bcrypt.compare(original, hashed);
	return signaturesMatch;
};

/* Trading-related helper functions */

const calculateAverageEntryPrice = (
	quoteAssetAmount: BigNum,
	baseAssetAmount: BigNum
): BigNum => {
	if (baseAssetAmount.eqZero()) return BigNum.zero();

	return BigNum.from(
		quoteAssetAmount.val
			.mul(PRICE_PRECISION)
			.mul(AMM_TO_QUOTE_PRECISION_RATIO)
			.div(baseAssetAmount.shiftTo(BASE_PRECISION_EXP).val)
			.abs(),
		PRICE_PRECISION_EXP
	);
};

const getMarketOrderLimitPrice = ({
	direction,
	baselinePrice,
	slippageTolerance,
}: {
	direction: PositionDirection;
	baselinePrice: BN;
	slippageTolerance: number;
}): BN => {
	let limitPrice;

	if (!baselinePrice) return ZERO;

	if (slippageTolerance === 0) return baselinePrice;

	// infinite slippage capped at 15% currently
	if (slippageTolerance == undefined) slippageTolerance = 15;

	// if manually entered, cap at 99%
	if (slippageTolerance > 99) slippageTolerance = 99;

	let limitPricePctDiff;
	if (isVariant(direction, 'long')) {
		limitPricePctDiff = PRICE_PRECISION.add(
			new BN(slippageTolerance * PRICE_PRECISION.toNumber()).div(new BN(100))
		);
		limitPrice = baselinePrice.mul(limitPricePctDiff).div(PRICE_PRECISION);
	} else {
		limitPricePctDiff = PRICE_PRECISION.sub(
			new BN(slippageTolerance * PRICE_PRECISION.toNumber()).div(new BN(100))
		);
		limitPrice = baselinePrice.mul(limitPricePctDiff).div(PRICE_PRECISION);
	}

	return limitPrice;
};

const getMarketAuctionParams = ({
	direction,
	startPriceFromSettings,
	endPriceFromSettings,
	limitPrice,
	duration,
	auctionStartPriceOffset,
	auctionEndPriceOffset,
	additionalEndPriceBuffer,
	forceUpToSlippage,
}: {
	direction: PositionDirection;
	startPriceFromSettings: BN;
	endPriceFromSettings: BN;
	/**
	 * Limit price is the oracle limit price - market orders use the oracle order type under the hood on Drift UI
	 * So oracle limit price is the oracle price + oracle offset
	 */
	limitPrice: BN;
	duration: number;
	auctionStartPriceOffset: number;
	auctionEndPriceOffset: number;
	additionalEndPriceBuffer?: BN;
	forceUpToSlippage?: boolean;
}): AuctionParams => {
	let auctionStartPrice: BN;
	let auctionEndPrice: BN;
	let constrainedBySlippage: boolean;

	const auctionEndPriceBuffer = BigNum.from(PRICE_PRECISION).scale(
		Math.abs(auctionEndPriceOffset * 100),
		10000
	).val;

	const auctionStartPriceBuffer = BigNum.from(startPriceFromSettings).scale(
		Math.abs(auctionStartPriceOffset * 100),
		10000
	).val;

	if (isVariant(direction, 'long')) {
		auctionStartPrice = startPriceFromSettings.sub(auctionStartPriceBuffer);

		const worstPriceToUse = BN.max(
			endPriceFromSettings,
			startPriceFromSettings
		); // Handles edge cases like if the worst price on the book was better than the oracle price, and the settings are asking to be relative to the oracle price

		auctionEndPrice = PRICE_PRECISION.add(auctionEndPriceBuffer)
			.mul(worstPriceToUse)
			.div(PRICE_PRECISION);

		constrainedBySlippage = limitPrice.lt(auctionEndPrice);

		// if forceUpToSlippage is passed, use max slippage price as end price
		if (forceUpToSlippage) {
			auctionEndPrice = limitPrice;
			constrainedBySlippage = false;
		} else {
			// use BEST (limit price, auction end price) as end price
			auctionEndPrice = BN.min(limitPrice, auctionEndPrice);
		}

		// apply additional buffer if provided
		if (additionalEndPriceBuffer) {
			auctionEndPrice = auctionEndPrice.add(additionalEndPriceBuffer);
			constrainedBySlippage = limitPrice.lt(auctionEndPrice);
		}

		auctionStartPrice = BN.min(auctionStartPrice, auctionEndPrice);
	} else {
		auctionStartPrice = startPriceFromSettings.add(auctionStartPriceBuffer);

		const worstPriceToUse = BN.min(
			endPriceFromSettings,
			startPriceFromSettings
		); // Handles edge cases like if the worst price on the book was better than the oracle price, and the settings are asking to be relative to the oracle price

		auctionEndPrice = PRICE_PRECISION.sub(auctionEndPriceBuffer)
			.mul(worstPriceToUse)
			.div(PRICE_PRECISION);

		constrainedBySlippage = limitPrice.gt(auctionEndPrice);

		// if forceUpToSlippage is passed, use max slippage price as end price
		if (forceUpToSlippage) {
			auctionEndPrice = limitPrice;
			constrainedBySlippage = false;
		} else {
			// use BEST (limit price, auction end price) as end price
			auctionEndPrice = BN.max(limitPrice, auctionEndPrice);
		}

		// apply additional buffer if provided
		if (additionalEndPriceBuffer) {
			auctionEndPrice = auctionEndPrice.sub(additionalEndPriceBuffer);
			constrainedBySlippage = limitPrice.gt(auctionEndPrice);
		}

		auctionStartPrice = BN.max(auctionStartPrice, auctionEndPrice);
	}

	return {
		auctionStartPrice,
		auctionEndPrice,
		auctionDuration: duration,
		constrainedBySlippage,
	};
};

/**
 * Helper function which derived market order params from the CORE data that is used to create them.
 * @param param0
 * @returns
 */
const deriveMarketOrderParams = ({
	marketType,
	marketIndex,
	direction,
	maxLeverageSelected,
	maxLeverageOrderSize,
	baseAmount,
	reduceOnly,
	allowInfSlippage,
	oraclePrice,
	bestPrice,
	entryPrice,
	worstPrice,
	markPrice,
	auctionDuration,
	auctionStartPriceOffset,
	auctionEndPriceOffset,
	auctionStartPriceOffsetFrom,
	auctionEndPriceOffsetFrom,
	auctionPriceCaps,
	slippageTolerance,
	isOracleOrder,
	additionalEndPriceBuffer,
	forceUpToSlippage,
}: {
	marketType: MarketType;
	marketIndex: number;
	direction: PositionDirection;
	maxLeverageSelected: boolean;
	maxLeverageOrderSize: BN;
	baseAmount: BN;
	reduceOnly: boolean;
	allowInfSlippage: boolean;
	oraclePrice: BN;
	bestPrice: BN;
	entryPrice: BN;
	worstPrice: BN;
	markPrice: BN;
	auctionDuration: number;
	auctionStartPriceOffset: number;
	auctionEndPriceOffset: number;
	auctionPriceCaps?: {
		min: BN;
		max: BN;
	};
	auctionStartPriceOffsetFrom: TradeOffsetPrice;
	auctionEndPriceOffsetFrom: TradeOffsetPrice;
	slippageTolerance: number;
	isOracleOrder?: boolean;
	additionalEndPriceBuffer?: BN;
	forceUpToSlippage?: boolean;
}): OptionalOrderParams & { constrainedBySlippage?: boolean } => {
	const priceObject = getPriceObject({
		oraclePrice,
		markPrice,
		bestOffer: bestPrice,
		entryPrice,
		worstPrice,
		direction,
	});

	// max slippage price
	let limitPrice = getMarketOrderLimitPrice({
		direction,
		baselinePrice: priceObject[auctionStartPriceOffsetFrom],
		slippageTolerance: allowInfSlippage ? undefined : slippageTolerance,
	});

	if (additionalEndPriceBuffer) {
		limitPrice = isVariant(direction, 'long')
			? limitPrice.add(additionalEndPriceBuffer)
			: limitPrice.sub(additionalEndPriceBuffer);
	}

	const auctionParams = getMarketAuctionParams({
		direction,
		startPriceFromSettings: priceObject[auctionStartPriceOffsetFrom],
		endPriceFromSettings: priceObject[auctionEndPriceOffsetFrom],
		limitPrice,
		duration: auctionDuration,
		auctionStartPriceOffset: auctionStartPriceOffset,
		auctionEndPriceOffset: auctionEndPriceOffset,
		additionalEndPriceBuffer,
		forceUpToSlippage,
	});

	let orderParams = getMarketOrderParams({
		marketType,
		marketIndex,
		direction,
		baseAssetAmount: maxLeverageSelected ? maxLeverageOrderSize : baseAmount,
		reduceOnly,
		price: allowInfSlippage ? undefined : limitPrice,
		...auctionParams,
	});

	if (isOracleOrder) {
		// wont work if oracle is zero
		if (!oraclePrice.eq(ZERO)) {
			// BEST (slippageLimitPrice, auctionEndPrice)
			const oracleAuctionEndPrice = isVariant(direction, 'long')
				? BN.min(limitPrice, auctionParams.auctionEndPrice)
				: BN.max(limitPrice, auctionParams.auctionEndPrice);

			const oracleAuctionParams = deriveOracleAuctionParams({
				direction: direction,
				oraclePrice,
				auctionStartPrice: auctionParams.auctionStartPrice,
				auctionEndPrice: oracleAuctionEndPrice,
				limitPrice: oracleAuctionEndPrice,
				auctionPriceCaps: auctionPriceCaps,
			});

			orderParams = {
				...orderParams,
				...oracleAuctionParams,
				price: undefined,
				orderType: OrderType.ORACLE,
			};
		}
	}

	return orderParams;
};

const getLimitAuctionParams = ({
	direction,
	inputPrice,
	startPriceFromSettings,
	duration,
	auctionStartPriceOffset,
	oraclePriceBands,
}: {
	direction: PositionDirection;
	inputPrice: BigNum;
	startPriceFromSettings: BN;
	duration: number;
	auctionStartPriceOffset: number;
	oraclePriceBands?: [BN, BN];
}): AuctionParams => {
	let limitAuctionParams = EMPTY_AUCTION_PARAMS;

	const auctionStartPriceBuffer = inputPrice.scale(
		Math.abs(auctionStartPriceOffset * 100),
		10000
	).val;

	if (
		isVariant(direction, 'long') &&
		startPriceFromSettings &&
		startPriceFromSettings.lt(inputPrice.val) &&
		startPriceFromSettings.gt(ZERO)
	) {
		limitAuctionParams = {
			auctionStartPrice: startPriceFromSettings.sub(auctionStartPriceBuffer),
			auctionEndPrice: inputPrice.val,
			auctionDuration: duration,
		};
	} else if (
		isVariant(direction, 'short') &&
		startPriceFromSettings &&
		startPriceFromSettings.gt(ZERO) &&
		startPriceFromSettings.gt(inputPrice.val)
	) {
		limitAuctionParams = {
			auctionStartPrice: startPriceFromSettings.add(auctionStartPriceBuffer),
			auctionEndPrice: inputPrice.val,
			auctionDuration: duration,
		};
	}

	if (oraclePriceBands && limitAuctionParams.auctionDuration) {
		const [minPrice, maxPrice] = oraclePriceBands;

		// start and end price cant be outside of the oracle price bands
		limitAuctionParams.auctionStartPrice = BN.max(
			BN.min(limitAuctionParams.auctionStartPrice, maxPrice),
			minPrice
		);

		limitAuctionParams.auctionEndPrice = BN.max(
			BN.min(limitAuctionParams.auctionEndPrice, maxPrice),
			minPrice
		);
	}

	return limitAuctionParams;
};

const getPriceObject = ({
	oraclePrice,
	bestOffer,
	entryPrice,
	worstPrice,
	markPrice,
	direction,
}: {
	oraclePrice: BN;
	bestOffer: BN;
	entryPrice: BN;
	worstPrice: BN;
	markPrice: BN;
	direction: PositionDirection;
}) => {
	let best: BN;

	const nonZeroOptions = [oraclePrice, bestOffer, markPrice].filter(
		(price) => price !== undefined && price?.gt(ZERO)
	);

	if (nonZeroOptions.length === 0) {
		// console.error('Unable to create valid auction params');
		return {
			oracle: ZERO,
			bestOffer: ZERO,
			entry: ZERO,
			best: ZERO,
			worst: ZERO,
			mark: ZERO,
		};
	}

	if (isVariant(direction, 'long')) {
		best = nonZeroOptions.reduce((a, b) => (a.lt(b) ? a : b)); // lowest price
	} else {
		best = nonZeroOptions.reduce((a, b) => (a.gt(b) ? a : b)); // highest price
	}

	// if zero values come through, fallback to nonzero value
	return {
		oracle: oraclePrice?.gt(ZERO) ? oraclePrice : best,
		bestOffer: bestOffer?.gt(ZERO) ? bestOffer : best,
		entry: entryPrice,
		best,
		worst: worstPrice,
		mark: markPrice?.gt(ZERO) ? markPrice : best,
	};
};

/* LP Utils */
const getLpSharesAmountForQuote = (
	driftClient: DriftClient,
	marketIndex: number,
	quoteAmount: BN
): BigNum => {
	const tenMillionBigNum = BigNum.fromPrint('10000000', QUOTE_PRECISION_EXP);

	const pricePerLpShare = BigNum.from(
		driftClient.getQuoteValuePerLpShare(marketIndex),
		QUOTE_PRECISION_EXP
	);

	return BigNum.from(quoteAmount, QUOTE_PRECISION_EXP)
		.scale(
			tenMillionBigNum.toNum(),
			pricePerLpShare.mul(tenMillionBigNum).toNum()
		)
		.shiftTo(AMM_RESERVE_PRECISION_EXP);
};

const getQuoteValueForLpShares = (
	driftClient: DriftClient,
	marketIndex: number,
	sharesAmount: BN
): BigNum => {
	const pricePerLpShare = BigNum.from(
		driftClient.getQuoteValuePerLpShare(marketIndex),
		QUOTE_PRECISION_EXP
	).shiftTo(AMM_RESERVE_PRECISION_EXP);
	const lpSharesBigNum = BigNum.from(sharesAmount, AMM_RESERVE_PRECISION_EXP);
	return lpSharesBigNum.mul(pricePerLpShare).shiftTo(QUOTE_PRECISION_EXP);
};

const getTokenAddress = (
	mintAddress: PublicKey,
	userPubKey: PublicKey
): Promise<PublicKey> => {
	return getAssociatedTokenAddress(mintAddress, userPubKey, true);
};

const getBalanceFromTokenAccountResult = (account: {
	pubkey: PublicKey;
	account: AccountInfo<ParsedAccountData>;
}) => {
	return account?.account.data?.parsed?.info?.tokenAmount?.uiAmount;
};

const getTokenAccount = async (
	connection: Connection,
	mintAddress: PublicKey,
	userPubKey: PublicKey
): Promise<{
	tokenAccount: {
		pubkey: PublicKey;
		account: import('@solana/web3.js').AccountInfo<
			import('@solana/web3.js').ParsedAccountData
		>;
	};
	tokenAccountWarning: boolean;
}> => {
	const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
		userPubKey,
		{ mint: mintAddress }
	);

	const associatedAddress = await getAssociatedTokenAddress(
		mintAddress,
		userPubKey,
		true
	);

	const targetAccount =
		tokenAccounts.value.filter((account) =>
			account.pubkey.equals(associatedAddress)
		)[0] || tokenAccounts.value[0];

	const anotherBalanceExists = tokenAccounts.value.find((account) => {
		return (
			!!getBalanceFromTokenAccountResult(account) &&
			!account.pubkey.equals(targetAccount.pubkey)
		);
	});

	let tokenAccountWarning = false;

	if (anotherBalanceExists) {
		tokenAccountWarning = true;
	}

	return {
		tokenAccount: targetAccount,
		tokenAccountWarning,
	};
};

const getMultipleAccounts = async (
	connection: any,
	keys: string[],
	commitment: string
) => {
	const result = await Promise.all(
		chunks(keys, 99).map((chunk) =>
			getMultipleAccountsCore(connection, chunk, commitment)
		)
	);

	const array = result
		.map(
			(a) =>
				a.array
					.map((acc) => {
						if (!acc) {
							return undefined;
						}

						const { data, ...rest } = acc;
						const obj = {
							...rest,
							data: Buffer.from(data[0], 'base64'),
						} as AccountInfo<Buffer>;
						return obj;
					})
					.filter((_) => _) as AccountInfo<Buffer>[]
		)
		.flat();
	return { keys, array };
};

const getMultipleAccountsCore = async (
	connection: any,
	keys: string[],
	commitment: string
) => {
	const args = connection._buildArgs([keys], commitment, 'base64');

	const unsafeRes = await connection._rpcRequest('getMultipleAccounts', args);
	if (unsafeRes.error) {
		throw new Error(
			'failed to get info about account ' + unsafeRes.error.message
		);
	}

	if (unsafeRes.result.value) {
		const array = unsafeRes.result.value as AccountInfo<string[]>[];
		return { keys, array };
	}

	// TODO: fix
	throw new Error();
};

const userExists = async (
	driftClient: DriftClient,
	userId: number,
	authority: PublicKey
) => {
	let userAccountExists = false;

	try {
		const user = driftClient.getUser(userId, authority);
		userAccountExists = await user.exists();
	} catch (e) {
		// user account does not exist so we leave userAccountExists false
	}

	return userAccountExists;
};

function chunks<T>(array: T[], size: number): T[][] {
	return Array.apply(0, new Array(Math.ceil(array.length / size))).map(
		(_, index) => array.slice(index * size, (index + 1) * size)
	);
}

/**
 * Trim trailing zeros from a numerical string
 * @param str - numerical string to format
 * @param zerosToShow - max number of zeros to show after the decimal. Similar to number.toFixed() but won't trim non-zero values. Optional, default value is 1
 */
const trimTrailingZeros = (str: string, zerosToShow = 1) => {
	// Ignore strings with no decimal point
	if (!str.includes('.')) return str;

	const sides = str.split('.');

	sides[1] = sides[1].replace(/0+$/, '');

	if (sides[1].length < zerosToShow) {
		const zerosToAdd = zerosToShow - sides[1].length;
		sides[1] = `${sides[1]}${Array(zerosToAdd).fill('0').join('')}`;
	}

	if (sides[1].length === 0) {
		return sides[0];
	} else {
		return sides.join('.');
	}
};

const formatTokenInputCurried =
	(setAmount: (amount: string) => void, spotMarketConfig: SpotMarketConfig) =>
	(newAmount: string) => {
		if (isNaN(+newAmount)) return;

		if (newAmount === '') {
			setAmount('');
			return;
		}

		const lastChar = newAmount[newAmount.length - 1];

		// if last char of string is a decimal point, don't format
		if (lastChar === '.') {
			setAmount(newAmount);
			return;
		}

		if (lastChar === '0') {
			// if last char of string is a zero in the decimal places, cut it off if it exceeds precision
			const numOfDigitsAfterDecimal = newAmount.split('.')[1]?.length ?? 0;
			if (numOfDigitsAfterDecimal > spotMarketConfig.precisionExp.toNumber()) {
				setAmount(newAmount.slice(0, -1));
			} else {
				setAmount(newAmount);
			}
			return;
		}

		const formattedAmount = Number(
			(+newAmount).toFixed(spotMarketConfig.precisionExp.toNumber())
		);
		setAmount(formattedAmount.toString());
	};

// --- Export The Utils

export const COMMON_UI_UTILS = {
	abbreviateAddress,
	calculateAverageEntryPrice,
	chunks,
	compareSignatures,
	createThrowawayIWallet,
	createPlaceholderIWallet,
	deriveMarketOrderParams,
	fetchCurrentSubaccounts,
	fetchUserClientsAndAccounts,
	formatTokenInputCurried,
	getBalanceFromTokenAccountResult,
	getIdAndAuthorityFromKey,
	getLimitAuctionParams,
	getLpSharesAmountForQuote,
	getMarketAuctionParams,
	getMarketKey,
	getMarketOrderLimitPrice,
	getMultipleAccounts,
	getMultipleAccountsCore,
	getPriceObject,
	getQuoteValueForLpShares,
	getSignatureVerificationMessageForSettings,
	getTokenAccount,
	getTokenAddress,
	getUserKey,
	hashSignature,
	initializeAndSubscribeToNewUserAccount,
	userExists,
	verifySignature,
	trimTrailingZeros,
	...USER_UTILS,
	...TRADING_UTILS,
	...MARKET_UTILS,
	...ORDER_COMMON_UTILS,
};

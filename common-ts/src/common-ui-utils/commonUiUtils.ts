import {
	AMM_RESERVE_PRECISION_EXP,
	AMM_TO_QUOTE_PRECISION_RATIO,
	BASE_PRECISION_EXP,
	BN,
	BigNum,
	DriftClient,
	IWallet,
	MarketType,
	OrderType,
	PRICE_PRECISION,
	PRICE_PRECISION_EXP,
	PositionDirection,
	PublicKey,
	QUOTE_PRECISION_EXP,
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
import { AuctionParams } from 'src/types';
import { USER_COMMON_UTILS } from './user';
import { TRADING_COMMON_UTILS } from './trading';
import { MARKET_COMMON_UTILS } from './market';
import { ORDER_COMMON_UTILS } from './order';

// When creating an account, try 5 times over 5 seconds to wait for the new account to hit the blockchain.
const ACCOUNT_INITIALIZATION_RETRY_DELAY_MS = 1000;
const ACCOUNT_INITIALIZATION_RETRY_ATTEMPTS = 5;

export const EMPTY_AUCTION_PARAMS: AuctionParams = {
	auctionStartPrice: null,
	auctionEndPrice: null,
	auctionDuration: null,
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

const fetchUserClientsAndAccounts = async (
	driftClient: DriftClient
): Promise<{ user: User; userAccount: UserAccount }[]> => {
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
	entryPrice,
	slippageTolerance,
}: {
	direction: PositionDirection;
	entryPrice: BN;
	slippageTolerance: number;
}): BN => {
	let limitPrice;

	if (slippageTolerance === 0) return entryPrice;

	if (slippageTolerance == undefined) slippageTolerance = 100;

	const numberPrecision = 1000;
	const mantissaPrecision = PRICE_PRECISION.div(new BN(numberPrecision));

	let limitPricePctDiff;
	if (isVariant(direction, 'long')) {
		limitPricePctDiff = 1 + slippageTolerance / 100;
		limitPrice = entryPrice
			.mul(new BN(limitPricePctDiff * numberPrecision))
			.mul(mantissaPrecision)
			.div(PRICE_PRECISION);
	} else {
		limitPricePctDiff = 1 - slippageTolerance / 100;
		limitPrice = entryPrice
			.mul(new BN(limitPricePctDiff * numberPrecision))
			.mul(mantissaPrecision)
			.div(PRICE_PRECISION);
	}

	return limitPrice;
};

const getMarketAuctionParams = ({
	direction,
	startPriceFromSettings,
	worstPrice,
	limitPrice,
	duration,
	marketTickSize,
	auctionStartPriceOffset,
	auctionEndPriceOffset,
}: {
	direction: PositionDirection;
	startPriceFromSettings: BN;
	worstPrice: BN;
	limitPrice: BN;
	duration: number;
	marketTickSize: BN;
	auctionStartPriceOffset: number;
	auctionEndPriceOffset: number;
}): AuctionParams => {
	let auctionStartPrice: BN;
	let auctionEndPrice: BN;

	const auctionEndPriceBuffer = BigNum.from(PRICE_PRECISION).scale(
		auctionEndPriceOffset * 100,
		10000
	).val;

	const auctionStartPriceBuffer = BigNum.from(startPriceFromSettings).scale(
		Math.abs(auctionStartPriceOffset * 100),
		10000
	).val;

	if (isVariant(direction, 'long')) {
		auctionStartPrice = startPriceFromSettings.sub(auctionStartPriceBuffer);
		auctionEndPrice = PRICE_PRECISION.add(auctionEndPriceBuffer)
			.mul(worstPrice)
			.div(PRICE_PRECISION);

		auctionEndPrice = BN.min(limitPrice, auctionEndPrice);

		auctionStartPrice = BN.min(
			auctionStartPrice,
			auctionEndPrice.sub(marketTickSize)
		);
	} else {
		auctionStartPrice = startPriceFromSettings.add(auctionStartPriceBuffer);
		auctionEndPrice = PRICE_PRECISION.sub(auctionEndPriceBuffer)
			.mul(worstPrice)
			.div(PRICE_PRECISION);

		auctionEndPrice = BN.max(limitPrice, auctionEndPrice);

		auctionStartPrice = BN.max(
			auctionStartPrice,
			auctionEndPrice.add(marketTickSize)
		);
	}

	return {
		auctionStartPrice,
		auctionEndPrice,
		auctionDuration: duration,
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
	limitPrice,
	oraclePrice,
	bestPrice,
	entryPrice,
	worstPrice,
	marketTickSize,
	auctionDuration,
	auctionStartPriceOffset,
	auctionEndPriceOffset,
	auctionStartPriceOffsetFrom,
	isOracleOrder,
}: {
	marketType: MarketType;
	marketIndex: number;
	direction: PositionDirection;
	maxLeverageSelected: boolean;
	maxLeverageOrderSize: BN;
	baseAmount: BN;
	reduceOnly: boolean;
	allowInfSlippage: boolean;
	limitPrice: BN;
	oraclePrice: BN;
	bestPrice: BN;
	entryPrice: BN;
	worstPrice: BN;
	marketTickSize: BN;
	auctionDuration: number;
	auctionStartPriceOffset: number;
	auctionEndPriceOffset: number;
	auctionStartPriceOffsetFrom: 'oracle' | 'bestOffer' | 'entry' | 'best';
	isOracleOrder?: boolean;
}) => {
	const startPrices = getPriceObject({
		oraclePrice,
		bestOffer: bestPrice,
		entryPrice,
		direction,
	});

	const auctionParams = getMarketAuctionParams({
		direction,
		startPriceFromSettings: startPrices[auctionStartPriceOffsetFrom],
		worstPrice,
		limitPrice,
		duration: auctionDuration,
		marketTickSize,
		auctionStartPriceOffset: auctionStartPriceOffset,
		auctionEndPriceOffset: auctionEndPriceOffset,
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
			const oracleAuctionParams = deriveOracleAuctionParams({
				direction: direction,
				oraclePrice: startPrices.oracle,
				auctionStartPrice: auctionParams.auctionStartPrice,
				auctionEndPrice: auctionParams.auctionEndPrice,
				limitPrice,
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
}: {
	direction: PositionDirection;
	inputPrice: BigNum;
	startPriceFromSettings: BN;
	duration: number;
	auctionStartPriceOffset: number;
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

	return limitAuctionParams;
};

const getPriceObject = ({
	oraclePrice,
	bestOffer,
	entryPrice,
	direction,
}: {
	oraclePrice: BN;
	bestOffer: BN;
	entryPrice: BN;
	direction: PositionDirection;
}) => {
	return {
		oracle: oraclePrice,
		bestOffer,
		entry: entryPrice,
		best: isVariant(direction, 'long')
			? BN.min(oraclePrice, bestOffer)
			: BN.max(oraclePrice, bestOffer),
	};
};

/* LP Utils */
const getLpSharesAmountForQuote = (
	driftClient: DriftClient,
	marketIndex: number,
	quoteAmount: BN
): BigNum => {
	const pricePerLpShare = BigNum.from(
		driftClient.getQuoteValuePerLpShare(marketIndex),
		QUOTE_PRECISION_EXP
	);

	return BigNum.from(quoteAmount, QUOTE_PRECISION_EXP)
		.scale(
			10000,
			pricePerLpShare
				.mul(BigNum.fromPrint('10000', QUOTE_PRECISION_EXP))
				.toNum()
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
	mintAddress: string,
	userPubKey: string
): Promise<PublicKey> => {
	return getAssociatedTokenAddress(
		new PublicKey(mintAddress),
		new PublicKey(userPubKey),
		true
	);
};

const getBalanceFromTokenAccountResult = (account: {
	pubkey: PublicKey;
	account: AccountInfo<ParsedAccountData>;
}) => {
	return account?.account.data?.parsed?.info?.tokenAmount?.uiAmount;
};

const getTokenAccount = async (
	connection: Connection,
	mintAddress: string,
	userPubKey: string
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
		new PublicKey(userPubKey),
		{ mint: new PublicKey(mintAddress) }
	);

	const associatedAddress = await getAssociatedTokenAddress(
		new PublicKey(mintAddress),
		new PublicKey(userPubKey),
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

// --- Export The Utils

export const COMMON_UI_UTILS = {
	calculateAverageEntryPrice,
	chunks,
	compareSignatures,
	createThrowawayIWallet,
	deriveMarketOrderParams,
	fetchCurrentSubaccounts,
	fetchUserClientsAndAccounts,
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
	...USER_COMMON_UTILS,
	...TRADING_COMMON_UTILS,
	...MARKET_COMMON_UTILS,
	...ORDER_COMMON_UTILS,
};

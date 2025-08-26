import {
	BN,
	DriftClient,
	JupiterClient,
	QuoteResponse,
	TxParams,
	User,
} from '@drift-labs/sdk';
import {
	AddressLookupTableAccount,
	Transaction,
	TransactionInstruction,
	VersionedTransaction,
} from '@solana/web3.js';

/**
 * Parameters for creating swap instruction details
 */
interface CreateSwapIxDetailsParams {
	/** The Drift client instance for interacting with the Drift protocol */
	driftClient: DriftClient;
	/** Quote response from Jupiter containing swap route information */
	quote: QuoteResponse;
	/** Jupiter client instance for performing the swap */
	jupiterClient: JupiterClient;
	/** Market index of the token being swapped from */
	swapFromMarketIndex: number;
	/** Market index of the token being swapped to */
	swapToMarketIndex: number;
	/** Amount to swap in base units */
	amount: BN;
	/** User instance containing account information */
	user: User;
}

/**
 * Creates swap instruction details for a Jupiter swap through Drift
 *
 * @param driftClient - The Drift client instance
 * @param jupiterClient - The Jupiter client instance
 * @param quote - Quote response from Jupiter with routing information
 * @param swapFromMarketIndex - Source token market index
 * @param swapToMarketIndex - Destination token market index
 * @param amount - Amount to swap in base units
 * @param user - User account instance
 * @returns Promise resolving to an object containing transaction instructions and lookup tables
 * @returns ixs - Array of Solana transaction instructions for the swap
 * @returns lookupTables - Address lookup table accounts for transaction compression
 */
export const createSwapIxDetails = async ({
	driftClient,
	jupiterClient,
	quote,
	swapFromMarketIndex,
	swapToMarketIndex,
	amount,
	user,
}: CreateSwapIxDetailsParams): Promise<{
	ixs: TransactionInstruction[];
	lookupTables: AddressLookupTableAccount[];
}> => {
	const userPublicKey = user.getUserAccountPublicKey();

	const swapIxsDetails = await driftClient.getJupiterSwapIxV6({
		jupiterClient,
		outMarketIndex: swapToMarketIndex,
		inMarketIndex: swapFromMarketIndex,
		amount,
		quote,
		userAccountPublicKey: userPublicKey,
		// we skip passing in the associated token accounts and have getJupiterSwapIxV6 derive them instead.
		// getJupiterSwapIxV6 will also add the ixs to create the associated token accounts if they don't exist.
	});

	return swapIxsDetails;
};

/**
 * Parameters for creating a complete swap transaction
 * Extends CreateSwapIxDetailsParams with additional transaction parameters
 */
interface CreateSwapTxnParams extends CreateSwapIxDetailsParams {
	/** Transaction parameters including compute units, priority fees, and other options */
	txParams?: TxParams;
}

/**
 * Creates a complete swap transaction ready for signing and submission
 *
 * @param driftClient - The Drift client instance
 * @param jupiterClient - The Jupiter client instance
 * @param quote - Quote response from Jupiter with routing information
 * @param swapFromMarketIndex - Source token market index
 * @param swapToMarketIndex - Destination token market index
 * @param amount - Amount to swap in base units
 * @param user - User account instance
 * @param txParams - Transaction parameters for fees and compute units
 * @returns Promise resolving to either a legacy Transaction or VersionedTransaction ready for signing
 */
export const createSwapTxn = async ({
	driftClient,
	jupiterClient,
	quote,
	swapFromMarketIndex,
	swapToMarketIndex,
	amount,
	user,
	txParams,
}: CreateSwapTxnParams): Promise<Transaction | VersionedTransaction> => {
	const swapIxsDetails = await createSwapIxDetails({
		driftClient,
		jupiterClient,
		quote,
		swapFromMarketIndex,
		swapToMarketIndex,
		amount,
		user,
	});

	const tx = await driftClient.buildTransaction(
		swapIxsDetails.ixs,
		txParams,
		0,
		swapIxsDetails.lookupTables
	);

	return tx;
};

import {
	BN,
	DriftClient,
	JupiterClient,
	QuoteResponse,
	TxParams,
	UnifiedSwapClient,
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
	/** Quote response from swap provider containing swap route information */
	quote: QuoteResponse;
	/** Swap client instance for performing the swap (supports UnifiedSwapClient or JupiterClient) */
	swapClient?: UnifiedSwapClient | JupiterClient;
	/**
	 * @deprecated Use swapClient instead. This parameter is kept for backwards compatibility.
	 * Swap client instance for performing the swap
	 */
	jupiterClient?: JupiterClient;
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
 * Creates swap instruction details for a swap through Drift
 *
 * @param driftClient - The Drift client instance
 * @param swapClient - The swap client instance for performing the swap (supports UnifiedSwapClient or JupiterClient)
 * @param jupiterClient - @deprecated Use swapClient instead. Kept for backwards compatibility.
 * @param quote - Quote response from swap provider with routing information
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
	swapClient,
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
	// Use swapClient if provided, otherwise fall back to jupiterClient for backwards compatibility
	const clientToUse = swapClient || jupiterClient;

	if (!clientToUse) {
		throw new Error('Either swapClient or jupiterClient must be provided');
	}

	const userPublicKey = user.getUserAccountPublicKey();

	let swapIxsDetails: {
		ixs: TransactionInstruction[];
		lookupTables: AddressLookupTableAccount[];
	};

	// Use the appropriate method based on client type
	if (clientToUse instanceof UnifiedSwapClient) {
		swapIxsDetails = await driftClient.getSwapIxV2({
			swapClient: clientToUse,
			outMarketIndex: swapToMarketIndex,
			inMarketIndex: swapFromMarketIndex,
			amount,
			quote,
		});
	} else {
		// JupiterClient path
		swapIxsDetails = await driftClient.getJupiterSwapIxV6({
			jupiterClient: clientToUse,
			outMarketIndex: swapToMarketIndex,
			inMarketIndex: swapFromMarketIndex,
			amount,
			quote,
			userAccountPublicKey: userPublicKey,
			// we skip passing in the associated token accounts and have the swap client derive them instead.
			// The swap client will also add the ixs to create the associated token accounts if they don't exist.
		});
	}

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
 * @param swapClient - The swap client instance for performing the swap (supports UnifiedSwapClient or JupiterClient)
 * @param jupiterClient - @deprecated Use swapClient instead. Kept for backwards compatibility.
 * @param quote - Quote response from swap provider with routing information
 * @param swapFromMarketIndex - Source token market index
 * @param swapToMarketIndex - Destination token market index
 * @param amount - Amount to swap in base units
 * @param user - User account instance
 * @param txParams - Transaction parameters for fees and compute units
 * @returns Promise resolving to either a legacy Transaction or VersionedTransaction ready for signing
 */
export const createSwapTxn = async ({
	driftClient,
	swapClient,
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
		swapClient,
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

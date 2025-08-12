import * as anchor from '@coral-xyz/anchor';
import { PublicKey, VersionedTransaction } from '@solana/web3.js';
import { BN, loadKeypair } from '@drift-labs/sdk';
import { CentralServerDrift } from './Drift/clients/CentralServerDrift';
import * as path from 'path';

// Load environment variables from .env file
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * Example usage of CentralServerDrift client
 *
 * This example demonstrates how to:
 * 1. Set up an Anchor wallet with a private key
 * 2. Initialize a CentralServerDrift instance
 * 3. Create deposit transactions
 * 4. Create withdraw transactions
 * 5. Sign and send transactions
 *
 * Prerequisites:
 * - Create a .env file in the same directory as this example file with:
 *   ANCHOR_WALLET=[private key byte array]
 *   ENDPOINT=https://your-rpc-endpoint.com
 */

async function runCentralServerDriftExample() {
	console.log('🚀 Starting CentralServerDrift Example...\n');

	// Validate required environment variables
	if (!process.env.ANCHOR_WALLET) {
		throw new Error('ANCHOR_WALLET must be set');
	}

	if (!process.env.ENDPOINT) {
		throw new Error(
			'ENDPOINT environment variable must be set to your Solana RPC endpoint'
		);
	}

	// Set up the wallet
	const wallet = new anchor.Wallet(
		loadKeypair(process.env.ANCHOR_WALLET as string)
	);

	console.log(`✅ Wallet Public Key: ${wallet.publicKey.toString()}`);
	console.log(`✅ RPC Endpoint: ${process.env.ENDPOINT}\n`);

	// Initialize CentralServerDrift
	console.log('🏗️  Initializing CentralServerDrift...');
	const centralServerDrift = new CentralServerDrift({
		solanaRpcEndpoint: process.env.ENDPOINT as string,
		driftEnv: 'mainnet-beta', // Change to 'devnet' for devnet testing
		additionalDriftClientConfig: {
			// Optional: Add additional DriftClient configuration
			txVersion: 0,
			txParams: {
				computeUnits: 200000,
				computeUnitsPrice: 1000,
			},
		},
		// Optional: Specify active trade market for more frequent updates
		// activeTradeMarket: { kind: 'perp', marketIndex: 0 },

		// Optional: Specify specific markets to subscribe to
		// marketsToSubscribe: [
		// 	{ kind: 'spot', marketIndex: 0 }, // USDC
		// 	{ kind: 'spot', marketIndex: 1 }, // SOL
		// ],
	});

	console.log('✅ CentralServerDrift instance created successfully\n');

	// Subscribe to market data
	console.log('📡 Subscribing to market data...');
	await centralServerDrift.subscribe();
	console.log('✅ Successfully subscribed to market data\n');

	// Configuration (shared between examples)
	const userAccountPublicKey = new PublicKey(
		'11111111111111111111111111111111'
	); // enter the publickey for the drift account here
	const amount = new BN(1000000); // 1 USDC (6 decimals)
	const spotMarketIndex = 0; // USDC market index

	/**
	 * Reusable function to handle transaction signing and sending
	 */
	async function executeVersionedTransaction(
		txn: VersionedTransaction,
		transactionType: string
	): Promise<void> {
		console.log(`✅ ${transactionType} transaction created successfully`);
		console.log(`📋 Transaction Type: ${txn.constructor.name}`);
		console.log('\n📝 Signing Transaction...');
		// Sign with the wallet's keypair
		txn.sign([wallet.payer]);

		console.log('✅ Transaction signed successfully');
		console.log(`  Signatures Count After Signing: ${txn.signatures.length}`);
		console.log(
			`  First Signature Present: ${
				txn.signatures[0] && txn.signatures[0].length > 0
			}`
		);

		console.log('\n🚀 Sending transaction to the network...');

		const txSig = await centralServerDrift.sendSignedTransaction(txn);

		console.log('✅ Transaction sent successfully!');
		console.log(`📋 Transaction Signature: ${txSig}`);
		console.log(`🔍 View on Solscan: https://solscan.io/tx/${txSig}`);
	}

	// Example 1: Create a deposit transaction
	console.log('--- 📥 Example 1: Creating Deposit Transaction ---');

	try {
		console.log(`💰 Deposit Amount: ${amount.toString()} raw units`);
		console.log(`🏪 Spot Market Index: ${spotMarketIndex}`);

		const depositTxn = await centralServerDrift.getDepositTxn(
			userAccountPublicKey,
			amount,
			spotMarketIndex
		);

		await executeVersionedTransaction(
			depositTxn as VersionedTransaction,
			'Deposit'
		);
	} catch (error) {
		console.error('❌ Error during deposit transaction flow:', error);
	}

	// Example 2: Create a withdraw transaction
	console.log('\n--- 📤 Example 2: Creating Withdraw Transaction ---');

	try {
		console.log(`💰 Withdraw Amount: ${amount.toString()} raw units`);
		console.log(`🏪 Spot Market Index: ${spotMarketIndex}`);

		const withdrawTxn = await centralServerDrift.getWithdrawTxn(
			userAccountPublicKey,
			amount,
			spotMarketIndex,
			{
				isBorrow: false, // true = borrow, false = reduce-only withdraw
				isMax: false, // true = withdraw maximum available
			}
		);

		await executeVersionedTransaction(
			withdrawTxn as VersionedTransaction,
			'Withdraw'
		);
	} catch (error) {
		console.error('❌ Error during withdraw transaction flow:', error);
	}
}

// Export the example function for use in other files
export { runCentralServerDriftExample };

// Run the example if this file is executed directly
if (require.main === module) {
	runCentralServerDriftExample()
		.then(() => {
			console.log('✨ Example execution completed');
			process.exit(0);
		})
		.catch((error) => {
			console.error('💥 Example execution failed:', error);
			process.exit(1);
		});
}

import * as anchor from '@coral-xyz/anchor';
import { PublicKey, VersionedTransaction } from '@solana/web3.js';
import {
	BN,
	loadKeypair,
	PositionDirection,
	OrderType,
	PostOnlyParams,
	BASE_PRECISION,
	QUOTE_PRECISION,
	PRICE_PRECISION,
} from '@drift-labs/sdk';
import { sign } from 'tweetnacl';
import { CentralServerDrift } from './Drift/clients/CentralServerDrift';
import { SwiftOrderResult } from './base/actions/trade/openPerpOrder/openPerpMarketOrder';
import { ENUM_UTILS } from '../utils';
import { API_URLS } from './constants/apiUrls';
import * as path from 'path';
import { NonMarketOrderType } from './utils/orderParams';

// Load environment variables from .env file
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * CLI Tool for CentralServerDrift client
 *
 * This CLI tool allows you to execute various Drift protocol operations via command line
 * with human-readable parameters that are automatically converted to the proper precision.
 *
 * Prerequisites:
 * - Create a .env file in the same directory as this CLI file with:
 *   ANCHOR_WALLET=[private key byte array]
 *   ENDPOINT=https://your-rpc-endpoint.com
 *
 * Usage Examples:
 *   ts-node cli.ts deposit --marketIndex=0 --amount=2 --userAccount=11111111111111111111111111111111
 *   ts-node cli.ts withdraw --marketIndex=0 --amount=1.5 --userAccount=11111111111111111111111111111111
 *   ts-node cli.ts settleFunding --userAccount=11111111111111111111111111111111
 *   ts-node cli.ts settlePnl --marketIndexes=0,1 --userAccount=11111111111111111111111111111111
 *   ts-node cli.ts openPerpMarketOrder --marketIndex=0 --direction=long --amount=0.1 --assetType=base --userAccount=11111111111111111111111111111111
 *   ts-node cli.ts openPerpMarketOrderSwift --marketIndex=0 --direction=short --amount=100 --assetType=quote --userAccount=11111111111111111111111111111111
 *   ts-node cli.ts openPerpNonMarketOrder --marketIndex=0 --direction=long --baseAssetAmount=0.1 --orderType=limit --limitPrice=100 --userAccount=11111111111111111111111111111111
 *   ts-node cli.ts openPerpNonMarketOrderSwift --marketIndex=0 --direction=long --baseAssetAmount=0.1 --orderType=limit --limitPrice=99.5 --userAccount=11111111111111111111111111111111
 */

// Shared configuration
let centralServerDrift: CentralServerDrift;
let wallet: anchor.Wallet;

interface CliArgs {
	[key: string]: string | string[];
}

/**
 * Parse command line arguments into a key-value object
 */
function parseArgs(args: string[]): CliArgs {
	const parsed: CliArgs = {};

	for (let i = 0; i < args.length; i++) {
		const arg = args[i];
		if (arg.startsWith('--')) {
			const [key, value] = arg.substring(2).split('=');
			if (value !== undefined) {
				// Handle comma-separated arrays
				if (value.includes(',')) {
					parsed[key] = value.split(',');
				} else {
					parsed[key] = value;
				}
			} else if (i + 1 < args.length && !args[i + 1].startsWith('--')) {
				// Handle space-separated values
				const nextValue = args[i + 1];
				if (nextValue.includes(',')) {
					parsed[key] = nextValue.split(',');
				} else {
					parsed[key] = nextValue;
				}
				i++; // Skip the next argument as it's the value
			} else {
				parsed[key] = 'true'; // Boolean flag
			}
		}
	}

	return parsed;
}

/**
 * Convert human-readable amount to BN with proper precision
 */
function parseAmount(amount: string, precision: BN = QUOTE_PRECISION): BN {
	const floatAmount = parseFloat(amount);
	if (isNaN(floatAmount)) {
		throw new Error(`Invalid amount: ${amount}`);
	}

	// Convert to the proper precision
	const scaledAmount = Math.floor(floatAmount * precision.toNumber());
	return new BN(scaledAmount);
}

/**
 * Parse direction string to PositionDirection
 */
function parseDirection(direction: string): PositionDirection {
	const normalized = direction.toLowerCase();
	if (normalized === 'long' || normalized === 'buy') {
		return PositionDirection.LONG;
	} else if (normalized === 'short' || normalized === 'sell') {
		return PositionDirection.SHORT;
	} else {
		throw new Error(
			`Invalid direction: ${direction}. Use 'long', 'short', 'buy', or 'sell'`
		);
	}
}

/**
 * Parse order type string to OrderType
 */
function _parseOrderType(orderType: string): OrderType {
	const normalized = orderType.toLowerCase();
	switch (normalized) {
		case 'limit':
			return OrderType.LIMIT;
		case 'market':
			return OrderType.MARKET;
		case 'oracle':
			return OrderType.ORACLE;
		case 'trigger_market':
		case 'stopmarket':
			return OrderType.TRIGGER_MARKET;
		case 'trigger_limit':
		case 'stoplimit':
			return OrderType.TRIGGER_LIMIT;
		default:
			throw new Error(
				`Invalid order type: ${orderType}. Use 'limit', 'market', 'oracle', 'trigger_market', or 'trigger_limit'`
			);
	}
}

/**
 * Parse post only string to PostOnlyParams
 */
function parsePostOnly(postOnly: string): PostOnlyParams {
	const normalized = postOnly.toLowerCase();
	switch (normalized) {
		case 'none':
		case 'false':
			return PostOnlyParams.NONE;
		case 'must_post_only':
		case 'true':
			return PostOnlyParams.MUST_POST_ONLY;
		case 'try_post_only':
			return PostOnlyParams.TRY_POST_ONLY;
		case 'slide':
			return PostOnlyParams.SLIDE;
		default:
			throw new Error(
				`Invalid post only: ${postOnly}. Use 'none', 'must_post_only', 'try_post_only', or 'slide'`
			);
	}
}

/**
 * Initialize CentralServerDrift instance
 */
async function initializeCentralServerDrift(): Promise<void> {
	console.log('🚀 Initializing CentralServerDrift...\n');

	// Validate required environment variables
	if (!process.env.ANCHOR_WALLET) {
		throw new Error('ANCHOR_WALLET must be set in .env file');
	}

	if (!process.env.ENDPOINT) {
		throw new Error(
			'ENDPOINT environment variable must be set to your Solana RPC endpoint'
		);
	}

	// Set up the wallet
	wallet = new anchor.Wallet(loadKeypair(process.env.ANCHOR_WALLET as string));

	console.log(`✅ Wallet Public Key: ${wallet.publicKey.toString()}`);
	console.log(`✅ RPC Endpoint: ${process.env.ENDPOINT}\n`);

	// Initialize CentralServerDrift
	console.log('🏗️  Initializing CentralServerDrift...');
	centralServerDrift = new CentralServerDrift({
		solanaRpcEndpoint: process.env.ENDPOINT as string,
		driftEnv: 'mainnet-beta', // Change to 'devnet' for devnet testing
		additionalDriftClientConfig: {
			txVersion: 0,
			txParams: {
				computeUnits: 200000,
				computeUnitsPrice: 1000,
			},
		},
	});

	console.log('✅ CentralServerDrift instance created successfully\n');

	// Subscribe to market data
	console.log('📡 Subscribing to market data...');
	await centralServerDrift.subscribe();
	console.log('✅ Successfully subscribed to market data\n');
}

/**
 * Execute a regular transaction
 */
async function executeTransaction(
	txn: VersionedTransaction,
	transactionType: string
): Promise<void> {
	console.log(`✅ ${transactionType} transaction created successfully`);
	console.log('\n📝 Signing Transaction...');

	txn.sign([wallet.payer]);
	console.log('✅ Transaction signed successfully');

	console.log('\n🚀 Sending transaction to the network...');
	const { txSig } = await centralServerDrift.sendSignedTransaction(txn);

	console.log('✅ Transaction sent successfully!');
	console.log(`📋 Transaction Signature: ${txSig?.toString()}`);
	console.log(`🔍 View on Solscan: https://solscan.io/tx/${txSig?.toString()}`);
}

/**
 * Handle Swift order observable
 */
function handleSwiftOrder(
	swiftResult: SwiftOrderResult,
	orderType: string
): void {
	console.log(`✅ ${orderType} Swift order submitted successfully`);
	console.log(
		`📋 Order UUID: ${Buffer.from(swiftResult.signedMsgOrderUuid).toString(
			'hex'
		)}`
	);

	if (swiftResult.orderObservable) {
		console.log('\n👁️  Monitoring order status...');

		swiftResult.orderObservable.subscribe({
			next: (event) => {
				if (event.type === 'confirmed') {
					console.log('✅ Order confirmed!');
					console.log(`📋 Order ID: ${event.orderId}`);
					console.log(`📋 Hash: ${event.hash}`);
				} else if (event.type === 'errored') {
					console.error('❌ Order failed:', event.message);
					console.error(`📋 Status: ${event.status}`);
				} else if (event.type === 'expired') {
					console.error('⏰ Order expired:', event.message);
				}
			},
			error: (error) => {
				console.error('❌ Observable error:', error);
			},
			complete: () => {
				console.log('🏁 Order monitoring completed');
			},
		});
	} else {
		console.log('🏁 Order confirmed and processing complete');
	}
}

/**
 * CLI Command: deposit
 */
async function depositCommand(args: CliArgs): Promise<void> {
	const userAccount = args.userAccount as string;
	const marketIndex = parseInt(args.marketIndex as string);
	const amount = args.amount as string;

	if (!userAccount || isNaN(marketIndex) || !amount) {
		throw new Error(
			'Required arguments: --userAccount, --marketIndex, --amount'
		);
	}

	const userAccountPubkey = new PublicKey(userAccount);
	const amountBN = parseAmount(amount, QUOTE_PRECISION); // Most deposits are USDC (quote precision)

	console.log('--- 📥 Deposit Transaction ---');
	console.log(`👤 User Account: ${userAccount}`);
	console.log(`🏪 Market Index: ${marketIndex}`);
	console.log(`💰 Amount: ${amount} (${amountBN.toString()} raw units)`);

	const depositTxn = await centralServerDrift.getDepositTxn(
		userAccountPubkey,
		amountBN,
		marketIndex
	);

	await executeTransaction(depositTxn as VersionedTransaction, 'Deposit');
}

/**
 * CLI Command: withdraw
 */
async function withdrawCommand(args: CliArgs): Promise<void> {
	const userAccount = args.userAccount as string;
	const marketIndex = parseInt(args.marketIndex as string);
	const amount = args.amount as string;
	const isBorrow = args.isBorrow === 'true';
	const isMax = args.isMax === 'true';

	if (!userAccount || isNaN(marketIndex) || !amount) {
		throw new Error(
			'Required arguments: --userAccount, --marketIndex, --amount'
		);
	}

	const userAccountPubkey = new PublicKey(userAccount);
	const amountBN = parseAmount(amount, QUOTE_PRECISION);

	console.log('--- 📤 Withdraw Transaction ---');
	console.log(`👤 User Account: ${userAccount}`);
	console.log(`🏪 Market Index: ${marketIndex}`);
	console.log(`💰 Amount: ${amount} (${amountBN.toString()} raw units)`);
	console.log(`💳 Is Borrow: ${isBorrow}`);
	console.log(`📊 Is Max: ${isMax}`);

	const withdrawTxn = await centralServerDrift.getWithdrawTxn(
		userAccountPubkey,
		amountBN,
		marketIndex,
		{ isBorrow, isMax }
	);

	await executeTransaction(withdrawTxn as VersionedTransaction, 'Withdraw');
}

/**
 * CLI Command: settleFunding
 */
async function settleFundingCommand(args: CliArgs): Promise<void> {
	const userAccount = args.userAccount as string;

	if (!userAccount) {
		throw new Error('Required arguments: --userAccount');
	}

	const userAccountPubkey = new PublicKey(userAccount);

	console.log('--- 💰 Settle Funding Transaction ---');
	console.log(`👤 User Account: ${userAccount}`);

	const settleFundingTxn = await centralServerDrift.getSettleFundingTxn(
		userAccountPubkey
	);

	await executeTransaction(
		settleFundingTxn as VersionedTransaction,
		'Settle Funding'
	);
}

/**
 * CLI Command: settlePnl
 */
async function settlePnlCommand(args: CliArgs): Promise<void> {
	const userAccount = args.userAccount as string;
	const marketIndexesArg = args.marketIndexes;

	if (!userAccount || !marketIndexesArg) {
		throw new Error(
			'Required arguments: --userAccount, --marketIndexes (comma-separated)'
		);
	}

	const userAccountPubkey = new PublicKey(userAccount);
	const marketIndexes = Array.isArray(marketIndexesArg)
		? marketIndexesArg.map((idx) => parseInt(idx))
		: [parseInt(marketIndexesArg as string)];

	console.log('--- 📈 Settle PnL Transaction ---');
	console.log(`👤 User Account: ${userAccount}`);
	console.log(`📊 Market Indexes: ${marketIndexes.join(', ')}`);

	const settlePnlTxn = await centralServerDrift.getSettlePnlTxn(
		userAccountPubkey,
		marketIndexes
	);

	await executeTransaction(settlePnlTxn as VersionedTransaction, 'Settle PnL');
}

/**
 * CLI Command: openPerpMarketOrder (regular transaction)
 */
async function openPerpMarketOrderCommand(args: CliArgs): Promise<void> {
	const userAccount = args.userAccount as string;
	const marketIndex = parseInt(args.marketIndex as string);
	const direction = args.direction as string;
	const amount = args.amount as string;
	const assetType = (args.assetType as string) || 'base';
	const dlobServerHttpUrl = API_URLS.DLOB;

	if (!userAccount || isNaN(marketIndex) || !direction || !amount) {
		throw new Error(
			'Required arguments: --userAccount, --marketIndex, --direction, --amount'
		);
	}

	const userAccountPubkey = new PublicKey(userAccount);
	const directionEnum = parseDirection(direction);
	const precision = assetType === 'base' ? BASE_PRECISION : QUOTE_PRECISION;
	const amountBN = parseAmount(amount, precision);

	console.log('--- 🎯 Open Perp Order Transaction ---');
	console.log(`👤 User Account: ${userAccount}`);
	console.log(`🏪 Market Index: ${marketIndex}`);
	console.log(
		`📊 Direction: ${direction} (${ENUM_UTILS.toStr(directionEnum)})`
	);
	console.log(`💰 Amount: ${amount} (${amountBN.toString()} raw units)`);
	console.log(`💱 Asset Type: ${assetType}`);
	console.log(`🌐 DLOB Server: ${dlobServerHttpUrl}`);

	const orderTxn = await centralServerDrift.getOpenPerpMarketOrderTxn(
		userAccountPubkey,
		assetType as 'base' | 'quote',
		marketIndex,
		directionEnum,
		amountBN,
		dlobServerHttpUrl,
		undefined, // auctionParamsOptions
		false // useSwift
	);

	await executeTransaction(orderTxn as VersionedTransaction, 'Open Perp Order');
}

/**
 * CLI Command: openPerpMarketOrderSwift (Swift signed message order)
 */
async function openPerpMarketOrderSwiftCommand(args: CliArgs): Promise<void> {
	const userAccount = args.userAccount as string;
	const marketIndex = parseInt(args.marketIndex as string);
	const direction = args.direction as string;
	const amount = args.amount as string;
	const assetType = (args.assetType as string) || 'base';
	const dlobServerHttpUrl = API_URLS.DLOB;
	const swiftServerUrl = (args.swiftServerUrl as string) || API_URLS.SWIFT;

	if (!userAccount || isNaN(marketIndex) || !direction || !amount) {
		throw new Error(
			'Required arguments: --userAccount, --marketIndex, --direction, --amount'
		);
	}

	const userAccountPubkey = new PublicKey(userAccount);
	const directionEnum = parseDirection(direction);
	const precision = assetType === 'base' ? BASE_PRECISION : QUOTE_PRECISION;
	const amountBN = parseAmount(amount, precision);

	console.log('--- ⚡ Open Perp Order Swift ---');
	console.log(`👤 User Account: ${userAccount}`);
	console.log(`🏪 Market Index: ${marketIndex}`);
	console.log(
		`📊 Direction: ${direction} (${ENUM_UTILS.toStr(directionEnum)})`
	);
	console.log(`💰 Amount: ${amount} (${amountBN.toString()} raw units)`);
	console.log(`💱 Asset Type: ${assetType}`);
	console.log(`🌐 DLOB Server: ${dlobServerHttpUrl}`);
	console.log(`⚡ Swift Server: ${swiftServerUrl}`);
	console.log(`🔑 Wallet Public Key: ${wallet.publicKey.toString()}`);

	let swiftResult: SwiftOrderResult;
	try {
		swiftResult = (await centralServerDrift.getOpenPerpMarketOrderTxn(
			userAccountPubkey,
			assetType as 'base' | 'quote',
			marketIndex,
			directionEnum,
			amountBN,
			dlobServerHttpUrl,
			undefined, // auctionParamsOptions
			true, // useSwift
			{
				wallet: {
					signMessage: async (message: Uint8Array) => {
						// Sign the message using the keypair
						const signature = sign.detached(message, wallet.payer.secretKey);
						return new Uint8Array(signature);
					},
					publicKey: wallet.publicKey,
				},
				swiftServerUrl,
				confirmDuration: 30000,
			}
		)) as SwiftOrderResult;
		console.log('✅ [CLI] Swift order transaction created successfully!');
	} catch (error) {
		console.error('❌ [CLI] Error creating Swift order:', error);
		throw error;
	}

	handleSwiftOrder(swiftResult, 'Open Perp Order');
}

/**
 * CLI Command: openPerpNonMarketOrder (regular limit/oracle order)
 */
async function openPerpNonMarketOrderCommand(args: CliArgs): Promise<void> {
	const userAccount = args.userAccount as string;
	const marketIndex = parseInt(args.marketIndex as string);
	const direction = args.direction as string;
	const amount = args.amount as string;
	const assetType = (args.assetType as string) || 'base';
	const baseAssetAmount = args.baseAssetAmount as string;
	const orderType = args.orderType as string;
	const limitPrice = args.limitPrice as string;
	const triggerPrice = args.triggerPrice as string;
	const reduceOnly = (args.reduceOnly as string) === 'true';
	const postOnly = (args.postOnly as string) || 'none';
	const oraclePriceOffset = args.oraclePriceOffset as string;

	if (!userAccount || isNaN(marketIndex) || !direction || !orderType) {
		throw new Error(
			'Required arguments: --userAccount, --marketIndex, --direction, --orderType'
		);
	}

	if (!amount && !baseAssetAmount) {
		throw new Error('Either --amount or --baseAssetAmount must be provided');
	}

	// Validate price requirements based on order type
	if (orderType === 'limit') {
		if (!limitPrice) {
			throw new Error(`Order type '${orderType}' requires --limitPrice`);
		}
	} else if (orderType === 'takeProfit' || orderType === 'stopLoss') {
		if (!triggerPrice) {
			throw new Error(`Order type '${orderType}' requires --triggerPrice`);
		}
	} else if (orderType === 'oracleLimit') {
		if (!oraclePriceOffset) {
			throw new Error(`Order type '${orderType}' requires --oraclePriceOffset`);
		}
	}

	const userAccountPubkey = new PublicKey(userAccount);
	const directionEnum = parseDirection(direction);
	const postOnlyEnum = parsePostOnly(postOnly);
	const limitPriceBN = limitPrice
		? parseAmount(limitPrice, PRICE_PRECISION)
		: undefined;
	const triggerPriceBN = triggerPrice
		? parseAmount(triggerPrice, PRICE_PRECISION)
		: undefined;

	console.log('--- 📋 Open Perp Non-Market Order ---');
	console.log(`👤 User Account: ${userAccount}`);
	console.log(`🏪 Market Index: ${marketIndex}`);
	console.log(
		`📊 Direction: ${direction} (${ENUM_UTILS.toStr(directionEnum)})`
	);

	if (amount) {
		const precision = assetType === 'base' ? BASE_PRECISION : QUOTE_PRECISION;
		const amountBN = parseAmount(amount, precision);
		console.log(`💰 Amount: ${amount} (${amountBN.toString()} raw units)`);
		console.log(`💱 Asset Type: ${assetType}`);
	} else {
		const amountBN = parseAmount(baseAssetAmount, BASE_PRECISION);
		console.log(
			`💰 Base Asset Amount: ${baseAssetAmount} (${amountBN.toString()} raw units)`
		);
	}

	if (limitPriceBN) {
		console.log(
			`💵 Limit Price: ${limitPrice} (${limitPriceBN.toString()} raw units)`
		);
	}
	if (triggerPriceBN) {
		console.log(
			`🎯 Trigger Price: ${triggerPrice} (${triggerPriceBN.toString()} raw units)`
		);
	}
	console.log(`📝 Order Type: ${orderType}`);
	console.log(`🔄 Reduce Only: ${reduceOnly}`);
	console.log(`📌 Post Only: ${postOnly} (${ENUM_UTILS.toStr(postOnlyEnum)})`);

	// Just call the main method - it will handle both approaches internally
	const orderTxn = await centralServerDrift.getOpenPerpNonMarketOrderTxn(
		userAccountPubkey,
		marketIndex,
		directionEnum,
		amount
			? parseAmount(
					amount,
					assetType === 'base' ? BASE_PRECISION : QUOTE_PRECISION
			  )
			: parseAmount(baseAssetAmount, BASE_PRECISION),
		amount ? (assetType as 'base' | 'quote') : 'base',
		limitPriceBN,
		triggerPriceBN,
		orderType as NonMarketOrderType,
		reduceOnly,
		postOnlyEnum,
		false // useSwift
	);

	await executeTransaction(
		orderTxn as VersionedTransaction,
		'Open Perp Non-Market Order'
	);
}

/**
 * CLI Command: openPerpNonMarketOrderSwift (Swift signed message limit order)
 */
async function openPerpNonMarketOrderSwiftCommand(
	args: CliArgs
): Promise<void> {
	const userAccount = args.userAccount as string;
	const marketIndex = parseInt(args.marketIndex as string);
	const direction = args.direction as string;
	const amount = args.amount as string;
	const assetType = (args.assetType as string) || 'base';
	const baseAssetAmount = args.baseAssetAmount as string;
	const orderType = args.orderType as string;
	const limitPrice = args.limitPrice as string;
	const reduceOnly = (args.reduceOnly as string) === 'true';
	const postOnly = (args.postOnly as string) || 'none';
	const swiftServerUrl = API_URLS.SWIFT;

	if (!userAccount || isNaN(marketIndex) || !direction || !orderType) {
		throw new Error(
			'Required arguments: --userAccount, --marketIndex, --direction, --orderType'
		);
	}

	if (!amount && !baseAssetAmount) {
		throw new Error('Either --amount or --baseAssetAmount must be provided');
	}

	// Swift orders only support LIMIT order type
	if (orderType.toLowerCase() !== 'limit') {
		throw new Error('Swift orders only support LIMIT order type');
	}

	// LIMIT orders require limitPrice
	if (!limitPrice) {
		throw new Error('LIMIT orders require --limitPrice');
	}

	const userAccountPubkey = new PublicKey(userAccount);
	const directionEnum = parseDirection(direction);
	const postOnlyEnum = parsePostOnly(postOnly);
	const limitPriceBN = parseAmount(limitPrice, PRICE_PRECISION);

	console.log('--- ⚡ Open Perp Non-Market Order Swift ---');
	console.log(`👤 User Account: ${userAccount}`);
	console.log(`🏪 Market Index: ${marketIndex}`);
	console.log(
		`📊 Direction: ${direction} (${ENUM_UTILS.toStr(directionEnum)})`
	);

	if (amount) {
		const precision = assetType === 'base' ? BASE_PRECISION : QUOTE_PRECISION;
		const amountBN = parseAmount(amount, precision);
		console.log(`💰 Amount: ${amount} (${amountBN.toString()} raw units)`);
		console.log(`💱 Asset Type: ${assetType}`);
	} else {
		const amountBN = parseAmount(baseAssetAmount, BASE_PRECISION);
		console.log(
			`💰 Base Asset Amount: ${baseAssetAmount} (${amountBN.toString()} raw units)`
		);
	}

	console.log(
		`💵 Limit Price: ${limitPrice} (${limitPriceBN.toString()} raw units)`
	);
	console.log(`📝 Order Type: ${orderType})`);
	console.log(`🔄 Reduce Only: ${reduceOnly}`);
	console.log(`📌 Post Only: ${postOnly} (${ENUM_UTILS.toStr(postOnlyEnum)})`);
	console.log(`⚡ Swift Server: ${swiftServerUrl}`);
	console.log(`🔑 Wallet Public Key: ${wallet.publicKey.toString()}`);

	let swiftResult: SwiftOrderResult;
	try {
		const swiftOptions = {
			wallet: {
				signMessage: async (message: Uint8Array) => {
					const signature = sign.detached(message, wallet.payer.secretKey);
					return new Uint8Array(signature);
				},
				publicKey: wallet.publicKey,
			},
			swiftServerUrl,
			confirmDuration: 30000,
		};

		// Use the main method - it handles both approaches internally
		swiftResult = (await centralServerDrift.getOpenPerpNonMarketOrderTxn(
			userAccountPubkey,
			marketIndex,
			directionEnum,
			amount
				? parseAmount(
						amount,
						assetType === 'base' ? BASE_PRECISION : QUOTE_PRECISION
				  )
				: parseAmount(baseAssetAmount, BASE_PRECISION),
			amount ? (assetType as 'base' | 'quote') : 'base',
			limitPriceBN,
			undefined, // triggerPrice - not used for LIMIT orders
			orderType as NonMarketOrderType,
			reduceOnly,
			postOnlyEnum,
			true, // useSwift
			swiftOptions
		)) as SwiftOrderResult;
		console.log(
			'✅ [CLI] Swift non-market order transaction created successfully!'
		);
	} catch (error) {
		console.error('❌ [CLI] Error creating Swift non-market order:', error);
		throw error;
	}

	handleSwiftOrder(swiftResult, 'Open Perp Non-Market Order');
}

/**
 * Show CLI usage information
 */
function showUsage(): void {
	console.log('📋 Drift CLI Usage');
	console.log('');
	console.log('Available Commands:');
	console.log('');

	console.log('💰 deposit');
	console.log(
		'  ts-node cli.ts deposit --userAccount=<pubkey> --marketIndex=<num> --amount=<num>'
	);
	console.log(
		'  Example: ts-node cli.ts deposit --userAccount=11111111111111111111111111111111 --marketIndex=0 --amount=100'
	);
	console.log('');

	console.log('💸 withdraw');
	console.log(
		'  ts-node cli.ts withdraw --userAccount=<pubkey> --marketIndex=<num> --amount=<num> [--isBorrow=<bool>] [--isMax=<bool>]'
	);
	console.log(
		'  Example: ts-node cli.ts withdraw --userAccount=11111111111111111111111111111111 --marketIndex=0 --amount=50'
	);
	console.log('');

	console.log('🏦 settleFunding');
	console.log('  ts-node cli.ts settleFunding --userAccount=<pubkey>');
	console.log(
		'  Example: ts-node cli.ts settleFunding --userAccount=11111111111111111111111111111111'
	);
	console.log('');

	console.log('📊 settlePnl');
	console.log(
		'  ts-node cli.ts settlePnl --userAccount=<pubkey> --marketIndexes=<comma-separated>'
	);
	console.log(
		'  Example: ts-node cli.ts settlePnl --userAccount=11111111111111111111111111111111 --marketIndexes=0,1'
	);
	console.log('');

	console.log('🎯 openPerpMarketOrder');
	console.log(
		'  ts-node cli.ts openPerpMarketOrder --userAccount=<pubkey> --marketIndex=<num> --direction=<long|short> --amount=<num> [--assetType=<base|quote>]'
	);
	console.log(
		'  Example: ts-node cli.ts openPerpMarketOrder --userAccount=11111111111111111111111111111111 --marketIndex=0 --direction=long --amount=0.1 --assetType=base'
	);
	console.log('');

	console.log('⚡ openPerpMarketOrderSwift');
	console.log(
		'  ts-node cli.ts openPerpMarketOrderSwift --userAccount=<pubkey> --marketIndex=<num> --direction=<long|short> --amount=<num> [--assetType=<base|quote>]'
	);
	console.log(
		'  Example: ts-node cli.ts openPerpMarketOrderSwift --userAccount=11111111111111111111111111111111 --marketIndex=0 --direction=short --amount=100 --assetType=quote'
	);
	console.log('');

	console.log('📋 openPerpNonMarketOrder');
	console.log(
		'  ts-node cli.ts openPerpNonMarketOrder --userAccount=<pubkey> --marketIndex=<num> --direction=<long|short> --amount=<num> [--assetType=<base|quote>] --orderType=<limit|trigger_limit|trigger_market|oracle> [--limitPrice=<num>] [--triggerPrice=<num>] [--reduceOnly=<true|false>] [--postOnly=<none|must_post_only|try_post_only|slide>]'
	);
	console.log(
		'  New LIMIT: ts-node cli.ts openPerpNonMarketOrder --userAccount=11111111111111111111111111111111 --marketIndex=0 --direction=long --amount=0.1 --assetType=base --orderType=limit --limitPrice=100'
	);
	console.log(
		'  New QUOTE: ts-node cli.ts openPerpNonMarketOrder --userAccount=11111111111111111111111111111111 --marketIndex=0 --direction=long --amount=100 --assetType=quote --orderType=limit --limitPrice=100'
	);
	console.log(
		'  Legacy: ts-node cli.ts openPerpNonMarketOrder --userAccount=11111111111111111111111111111111 --marketIndex=0 --direction=long --baseAssetAmount=0.1 --orderType=limit --limitPrice=100'
	);
	console.log('');

	console.log('⚡ openPerpNonMarketOrderSwift');
	console.log(
		'  ts-node cli.ts openPerpNonMarketOrderSwift --userAccount=<pubkey> --marketIndex=<num> --direction=<long|short> --amount=<num> [--assetType=<base|quote>] --orderType=limit --limitPrice=<num> [--reduceOnly=<true|false>] [--postOnly=<none|must_post_only|try_post_only|slide>]'
	);
	console.log(
		'  New: ts-node cli.ts openPerpNonMarketOrderSwift --userAccount=11111111111111111111111111111111 --marketIndex=0 --direction=long --amount=0.1 --assetType=base --orderType=limit --limitPrice=99.5'
	);
	console.log(
		'  Legacy: ts-node cli.ts openPerpNonMarketOrderSwift --userAccount=11111111111111111111111111111111 --marketIndex=0 --direction=long --baseAssetAmount=0.1 --orderType=limit --limitPrice=99.5'
	);
	console.log('');

	console.log('Options:');
	console.log('  --help, -h          Show this help message');
	console.log('');
	console.log('Notes:');
	console.log(
		'  - Amounts are in human-readable format (e.g., 1.5 USDC, 0.1 SOL)'
	);
	console.log('  - Direction can be: long, short, buy, sell');
	console.log(
		'  - Asset type: base (for native tokens like SOL) or quote (for USDC amounts)'
	);
	console.log('  - Ensure your .env file contains ANCHOR_WALLET and ENDPOINT');
}

/**
 * Main CLI entry point
 */
async function main(): Promise<void> {
	const args = process.argv.slice(2);

	if (
		args.length === 0 ||
		args[0] === '--help' ||
		args[0] === '-h' ||
		args[0] === 'help'
	) {
		showUsage();
		return;
	}

	const command = args[0];
	const parsedArgs = parseArgs(args.slice(1));

	// Initialize the client first
	await initializeCentralServerDrift();

	// Route to appropriate command
	switch (command) {
		case 'deposit':
			await depositCommand(parsedArgs);
			break;
		case 'withdraw':
			await withdrawCommand(parsedArgs);
			break;
		case 'settleFunding':
			await settleFundingCommand(parsedArgs);
			break;
		case 'settlePnl':
			await settlePnlCommand(parsedArgs);
			break;
		case 'openPerpMarketOrder':
			await openPerpMarketOrderCommand(parsedArgs);
			break;
		case 'openPerpMarketOrderSwift':
			await openPerpMarketOrderSwiftCommand(parsedArgs);
			break;
		case 'openPerpNonMarketOrder':
			await openPerpNonMarketOrderCommand(parsedArgs);
			break;
		case 'openPerpNonMarketOrderSwift':
			await openPerpNonMarketOrderSwiftCommand(parsedArgs);
			break;
		default:
			console.error(`❌ Unknown command: ${command}`);
			console.error('');
			showUsage();
			process.exit(1);
	}
}

// Run CLI if this file is executed directly
if (require.main === module) {
	main()
		.then(() => {
			console.log('\n✨ Command executed successfully!');
			// Don't exit immediately for Swift orders (they need time to process)
			setTimeout(() => process.exit(0), 2000);
		})
		.catch((error) => {
			console.error('\n💥 Command failed:', error.message || error);
			process.exit(1);
		});
}

export { main, parseArgs, parseAmount, parseDirection };

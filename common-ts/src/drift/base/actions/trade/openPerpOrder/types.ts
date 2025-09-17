import { TxParams } from '@drift-labs/sdk';
import { Transaction, VersionedTransaction } from '@solana/web3.js';

export type WithTxnParams<T> = T & { txParams?: TxParams };

export type TxnOrSwiftResult<T extends boolean> = T extends true
	? void
	: Transaction | VersionedTransaction;

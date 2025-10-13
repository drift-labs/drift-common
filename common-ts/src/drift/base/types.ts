import { TxParams } from '@drift-labs/sdk';

export type WithTxnParams<T> = T & { txParams?: TxParams };

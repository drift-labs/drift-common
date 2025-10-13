import { SwiftOrderOptions } from '../../../base/actions/trade/openPerpOrder/openSwiftOrder';
import { WithTxnParams } from '../../../base/types';
import { OpenPerpMarketOrderParams } from '../../../base/actions/trade/openPerpOrder/openPerpMarketOrder';
import { OpenPerpNonMarketOrderParams } from '../../../base/actions/trade/openPerpOrder/openPerpNonMarketOrder';
import { PublicKey } from '@solana/web3.js';

export type CentralServerSwiftOrderOptions = Omit<
	SwiftOrderOptions,
	'swiftServerUrl'
>;

export type CentralServerGetOpenPerpMarketOrderTxnParams<
	T extends boolean = boolean
> = WithTxnParams<
	Omit<
		OpenPerpMarketOrderParams<T, CentralServerSwiftOrderOptions>,
		'driftClient' | 'user' | 'dlobServerHttpUrl'
	>
> & {
	userAccountPublicKey: PublicKey;
};

export type CentralServerGetOpenPerpNonMarketOrderTxnParams<
	T extends boolean = boolean
> = WithTxnParams<
	Omit<
		OpenPerpNonMarketOrderParams<T, CentralServerSwiftOrderOptions>,
		'driftClient' | 'user' | 'dlobServerHttpUrl'
	>
> & {
	userAccountPublicKey: PublicKey;
};

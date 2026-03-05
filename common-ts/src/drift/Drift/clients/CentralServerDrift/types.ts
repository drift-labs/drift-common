import { BN, PositionDirection, TxParams } from '@drift-labs/sdk';
import { SwiftOrderOptions } from '../../../base/actions/trade/openPerpOrder/openSwiftOrder';
import { WithTxnParams } from '../../../base/types';
import { OpenPerpMarketOrderParams } from '../../../base/actions/trade/openPerpOrder/openPerpMarketOrder';
import { OpenPerpNonMarketOrderParams } from '../../../base/actions/trade/openPerpOrder/openPerpNonMarketOrder';
import { PlaceAndTakeParams } from '../../../base/actions/trade/openPerpOrder/types';
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

/** Params for withdrawing collateral from an isolated perp position (transfer to cross). */
export interface CentralServerGetWithdrawIsolatedPerpPositionCollateralTxnParams {
	userAccountPublicKey: PublicKey;
	marketIndex: number;
	/** Positive amount to withdraw in QUOTE_PRECISION. Ignored when isFullWithdrawal is true. */
	amount: BN;
	/** If true, transfers all available isolated margin (use when position is closed). Prepends settle PnL ix. */
	isFullWithdrawal?: boolean;
	/** If true, prepends settle PnL ix before transfer (recommended for full withdrawal or when position base is zero). */
	settlePnlFirst?: boolean;
	txParams?: import('@drift-labs/sdk').TxParams;
	/** Optional signer override for transaction signing; defaults to user authority. */
	mainSignerOverride?: PublicKey;
}

/** Params for single-tx close + withdraw (best-effort; fill-dependent). */
export interface CentralServerGetCloseAndWithdrawIsolatedPerpPositionTxnParams {
	userAccountPublicKey: PublicKey;
	marketIndex: number;
	/** Base asset amount to close. */
	baseAssetAmount: BN;
	/** Direction of the close order (opposite of position). */
	direction: PositionDirection;
	/** If true, includes collateral transfer ix after close order (will withdraw available isolated margin; amount is fill-dependent). */
	withdrawCollateralAfterClose?: boolean;
	/** If true and withdrawCollateralAfterClose, prepends settle PnL ix. */
	settlePnlBeforeClose?: boolean;
	assetType?: 'base' | 'quote';
	placeAndTake?: PlaceAndTakeParams;
	txParams?: TxParams;
	/** Optional signer override for transaction signing; defaults to user authority. */
	mainSignerOverride?: PublicKey;
}

/** Params for deposit from wallet + open isolated perp position (wallet → isolated → place). */
export interface CentralServerGetDepositAndOpenIsolatedPerpPositionTxnParams
	extends Omit<
		CentralServerGetOpenPerpMarketOrderTxnParams<false>,
		'isolatedPositionDeposit'
	> {
	/** Amount to deposit from wallet directly into isolated (QUOTE_PRECISION, e.g. USDC). */
	depositAmount: BN;
}

/** Params for close isolated position + withdraw to wallet (close → withdraw from isolated to wallet). */
export interface CentralServerGetCloseAndWithdrawIsolatedPerpPositionToWalletTxnParams {
	userAccountPublicKey: PublicKey;
	marketIndex: number;
	/** Base asset amount to close. */
	baseAssetAmount: BN;
	/** Direction of the close order (opposite of position). */
	direction: PositionDirection;
	/**
	 * Amount to withdraw (QUOTE_PRECISION). When omitted or larger than available,
	 * the SDK withdraws all. Pass a specific amount for partial withdrawal.
	 */
	estimatedWithdrawAmount?: BN;
	assetType?: 'base' | 'quote';
	placeAndTake?: PlaceAndTakeParams;
	txParams?: TxParams;
	/** Optional signer override and withdrawal destination; when provided, used for signing and as the wallet that receives the withdrawal; defaults to user authority. */
	mainSignerOverride?: PublicKey;
}

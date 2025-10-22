import { BN, PublicKey, SpotPosition } from '@drift-labs/sdk';

export type OpenPosition = {
	marketIndex: number;
	marketSymbol: string;
	direction: 'short' | 'long';
	notional: BN;
	baseSize: BN;
	entryPrice: BN;
	exitPrice: BN;
	liqPrice: BN;
	pnlVsOracle: BN;
	pnlVsMark: BN;
	quoteAssetNotionalAmount: BN;
	quoteEntryAmount: BN;
	quoteBreakEvenAmount: BN;
	unrealizedFundingPnl: BN;
	feesAndFundingPnl: BN;
	lastCumulativeFundingRate: BN;
	openOrders: number;
	/**
	 * This is the unsettled pnl that is claimable. Naming is a bit confusing here.
	 */
	unsettledPnl: BN;
	unsettledFundingPnl: BN;
	/**
	 * This is the total of unsettled pnl and unsettled funding.
	 */
	totalUnrealizedPnl: BN;
	costBasis: BN;
	realizedPnl: BN;
	lpShares: BN;
	pnlIsClaimable: boolean;
	remainderBaseAmount?: number; // LP only
	lpDeriskPrice?: BN; //LP only
	maxMarginRatio: number;
	isolatedPositionScaledBalance: BN;
	positionFlag: number;
};

export type BankBalanceUI = SpotPosition & {
	accountId: number;
	accountName: string;
	accountAuthority: PublicKey;
};

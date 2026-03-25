export type IfStakingEvents = {
	if_staking_stake_submitted: {
		spot_market_symbol: string;
	};
	if_staking_unstake_submitted: {
		spot_market_symbol: string;
	};
	if_staking_unstake_canceled: {
		spot_market_symbol: string;
	};
	if_staking_unstaked_assets_withdrawn: {
		spot_market_symbol: string;
	};
};

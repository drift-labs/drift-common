import type { NoProperties } from '../eventMap';

export type CollateralEvents = {
	collateral_deposit_submitted: {
		spot_market_symbol?: string;
		newAccount: boolean;
		depositAmount: number;
	};
	collateral_withdrawal_submitted: {
		spot_market_symbol: string;
		withdrawal_amount: string;
	};
	collateral_borrow_submitted: {
		spot_market_symbol: string;
		borrow_amount: string;
	};
	collateral_transfer_submitted: NoProperties;
	collateral_deposit_modal_opened: {
		cta: string;
		from: string;
	};
	collateral_funxyz_address_copied: {
		from_chain_id: number | string | null;
		from_chain_name?: string | null;
		from_asset_symbol: string | null;
		to_chain: string;
		to_asset_symbol: string;
		receiving_address: string;
	};
};

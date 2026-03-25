export type AmplifyEvents = {
	amplify_deposit_cta_clicked: {
		amplify_deposit_amount: number;
		amplify_deposit_leverage: number;
		amplify_deposit_asset: string;
		amplify_deposit_pair: string;
	};
	amplify_deposit_succeeded: {
		amplify_deposit_amount: number;
		amplify_deposit_leverage: number;
		amplify_deposit_asset: string;
		amplify_deposit_pair: string;
		amplify_last_withdrawal_quote_30_mins: number;
	};
};

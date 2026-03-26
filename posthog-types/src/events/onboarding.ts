import type { NoProperties } from '../eventMap';

type PrivyErrorProperties = {
	error_message: string;
	error_stack?: string;
	error_name?: string;
	error_raw: string;
	env: string;
	wallet_address: string;
	use_fee_payer: boolean;
};

export type OnboardingEvents = {
	onboarding_wallet_connected: {
		name: string;
	};
	onboarding_magic_auth_login: {
		auth_type: 'email' | 'other';
		success: boolean;
	};
	onboarding_subaccount_created: NoProperties;
	onboarding_signless_modal_opened: NoProperties;
	onboarding_signless_delegated_confirmed: {
		success: boolean;
		delegated_selected_option: string;
	};
	onboarding_signless_setup_succeeded: {
		is_ledger: boolean;
	};
	onboarding_wallet_connection_error: {
		provider: string;
		error: unknown;
	};
	onboarding_referral_creation_error: {
		error: unknown;
	};
	onboarding_privy_sign_send_error: PrivyErrorProperties;
	onboarding_privy_build_sign_error: PrivyErrorProperties;
	onboarding_account_deleted: NoProperties;
};

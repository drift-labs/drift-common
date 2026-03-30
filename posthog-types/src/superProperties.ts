/** Static super properties — set once at PostHog init via posthog.register() */
export type StaticSuperProperties = {
	platform: 'web' | 'ios' | 'android';
	env: string;
};

/** Dynamic super properties — updated on wallet state changes via posthog.register() */
export type DynamicSuperProperties = {
	connected: boolean;
	account_exists: boolean | null;
	authority: string | null;
	user: string | null;
	wallet_name: string | null;
	is_privy_native: boolean | null;
	is_delegated_to_embedded_wallet: boolean | null;
};

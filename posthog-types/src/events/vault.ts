import type { NoProperties } from '../eventMap';

export type VaultEvents = {
	vault_deposit_submitted: NoProperties;
	vault_withdrawal_submitted: {
		amount: number;
	};
	vault_viewed: NoProperties;
	vault_overview_viewed: NoProperties;
	vault_side_panel_opened: NoProperties;
	vault_detail_opened: NoProperties;
	vault_inspected: NoProperties;
	vault_eco_page_viewed: NoProperties;
};

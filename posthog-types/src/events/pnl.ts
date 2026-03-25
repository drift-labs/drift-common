export type PnlEvents = {
	pnl_action_performed: {
		action: 'download' | 'copy' | 'share_on_x';
	};
	pnl_history_exported: {
		statement_type: string;
		date_from: string;
		date_to: string;
	};
};

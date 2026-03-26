import type { NoProperties } from '../eventMap';

type OrderTimingProperties = {
	tx_signature?: string;
	order_id: number;
	user_account_key?: string;
	order_method: string;
	order_params: unknown;
	auction_version?: 1 | 2;
	hash?: string;
	oracle_price?: string;
};

export type TradeEvents = {
	trade_placed: {
		market_type: 'perps' | 'spot';
		order_type: string;
		direction?: string;
		market_symbol?: string;
		trade_base: number;
		trade_notional: number;
		geolocation_history?: unknown;
		is_new_account?: boolean;
		next_order_id?: number;
		is_devmode?: boolean;
		is_successful?: boolean;
		swift_uuid?: string;
	};
	trade_orderbook_crossed: {
		debugInfo: unknown;
	};
	trade_order_params_requested: {
		user_account_pubkey: unknown;
		url_params: Record<string, string>;
		oracle_price: unknown;
		mm_oracle_price: unknown;
		regular_oracle_price: unknown;
		derived_market_state?: {
			mark_price: string;
			best_bid: string;
			best_ask: string;
			update_slot: number;
		};
		endpointResponse: unknown;
	};
	trade_order_fill_time_recorded: {
		time_to_fill_ms: number;
	} & OrderTimingProperties;
	trade_order_confirmation_time_recorded: {
		time_to_confirm_ms: number;
	} & OrderTimingProperties;
	trade_perp_non_market_order_timed: {
		ix_creation_time_ms: number | null;
		tx_building_time_ms: number | null;
		fee_payer_signing_time_ms: number | null;
		embedded_wallet_signing_time_ms: number | null;
		send_transaction_time_ms: number | null;
		overall_time_ms: number;
		market_index: number;
		order_type: string;
		base_amount: number;
	};
	trade_position_closed: NoProperties;
	trade_favorite_market_added: {
		market_symbol: string;
	};
	trade_favorite_market_removed: {
		market_symbol: string;
	};
	trade_swift_error: {
		error: unknown;
		[key: string]: unknown;
	};
	trade_market_order_error: {
		message: string;
	};
	trade_oracle_mark_divergence: {
		orderType?: unknown;
		market: unknown;
		markPrice: number;
		oraclePrice: number;
		absPriceDiff: number;
		subscriptionState: unknown;
		topBidInMarketStateStore: number;
		topAskInMarketStateStore: number;
		markPriceInMarketStateStore: number;
		oraclePriceInMarketStateStore: number;
		userSettings: unknown;
		swiftEnabled?: boolean;
	};
	trade_close_multiple_positions_batched: {
		total_positions: number;
		batch_count: number;
		batch_sizes: number[];
		is_place_and_take: boolean;
		market_indexes: number[];
	};
	trade_close_multiple_positions_size_error: {
		market_indexes: number[];
		error_message: string;
	};
};

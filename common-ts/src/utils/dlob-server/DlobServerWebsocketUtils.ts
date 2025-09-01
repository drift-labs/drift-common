import { MarketId } from '../../types/MarketId';
import { UIMarket } from '../../types/UIMarket';

export type OrderbookGrouping = 1 | 10 | 100 | 500 | 1000;

export type DlobServerChannel =
	| 'trades'
	| 'orderbook'
	| 'orderbook_indicative'
	| 'heartbeat';

type BaseSubscriptionOutputProps<T extends DlobServerChannel> = {
	type: 'subscribe';
	channel: T;
};

interface OrderbookSubscriptionOutputProps
	extends BaseSubscriptionOutputProps<'orderbook' | 'orderbook_indicative'> {
	marketType: 'perp' | 'spot';
	market: string;
	grouping?: OrderbookGrouping;
}

interface TradeSubscriptionOutputProps
	extends BaseSubscriptionOutputProps<'trades'> {
	marketType: 'perp' | 'spot';
	market: string;
}

type WebsocketSubscriptionOutputProps =
	| TradeSubscriptionOutputProps
	| OrderbookSubscriptionOutputProps;

type BaseUnsubscriptionOutputProps<T extends DlobServerChannel> = {
	type: 'unsubscribe';
	channel: T;
};

interface OrderbookUnsubscriptionOutputProps
	extends BaseUnsubscriptionOutputProps<'orderbook' | 'orderbook_indicative'> {
	marketType: 'perp' | 'spot';
	market: string;
	grouping?: OrderbookGrouping;
}

interface TradeUnsubscriptionOutputProps
	extends BaseUnsubscriptionOutputProps<'trades'> {
	marketType: 'perp' | 'spot';
	market: string;
}

type WebsocketUnsubscriptionOutputProps =
	| OrderbookUnsubscriptionOutputProps
	| TradeUnsubscriptionOutputProps;

type BaseSubscriptionProps<T extends DlobServerChannel> = {
	type: T;
};

type TargetMarketProps = { market: MarketId };

interface OrderbookSubscriptionProps
	extends BaseSubscriptionProps<'orderbook' | 'orderbook_indicative'>,
		TargetMarketProps {
	grouping?: OrderbookGrouping;
}

interface TradesSubscriptionProps
	extends BaseSubscriptionProps<'trades'>,
		TargetMarketProps {}

type WebsocketSubscriptionProps =
	| TradesSubscriptionProps
	| OrderbookSubscriptionProps;

export type WebsocketServerResponse = {
	channel: string;
	data: string;
	error?: any;
};

const getMarketSymbolFromId = (marketId: MarketId) => {
	const isPerp = marketId.isPerp;

	if (isPerp) {
		const perpMarket = UIMarket.perpMarkets.find(
			(m) => marketId.marketIndex === m.marketIndex
		);
		return perpMarket?.symbol ?? '';
	} else {
		const spotMarket = UIMarket.spotMarkets.find(
			(m) => marketId.marketIndex === m.marketIndex
		);
		return spotMarket?.symbol ?? '';
	}
};

const getSubscriptionProps = (
	props: WebsocketSubscriptionProps
): WebsocketSubscriptionOutputProps => {
	const type = props.type;

	switch (type) {
		case 'orderbook': {
			return {
				type: 'subscribe',
				channel: 'orderbook',
				market: getMarketSymbolFromId(props.market),
				marketType: props.market.isPerp ? 'perp' : 'spot',
				...(props.grouping && { grouping: props.grouping }),
			};
		}
		case 'orderbook_indicative': {
			return {
				type: 'subscribe',
				channel: 'orderbook_indicative',
				market: getMarketSymbolFromId(props.market),
				marketType: props.market.isPerp ? 'perp' : 'spot',
				...(props.grouping && { grouping: props.grouping }),
			};
		}
		case 'trades': {
			return {
				type: 'subscribe',
				channel: 'trades',
				market: getMarketSymbolFromId(props.market),
				marketType: props.market.isPerp ? 'perp' : 'spot',
			};
		}
		default: {
			const exhaustiveCheck: never = type;
			throw new Error(`Unhandled case: ${exhaustiveCheck}`);
		}
	}
};

const getUnsubscriptionProps = (
	props: WebsocketSubscriptionProps
): WebsocketUnsubscriptionOutputProps => {
	const type = props.type;

	switch (type) {
		case 'orderbook': {
			return {
				type: 'unsubscribe',
				channel: 'orderbook',
				market: getMarketSymbolFromId(props.market),
				marketType: props.market.isPerp ? 'perp' : 'spot',
				...(props.grouping && { grouping: props.grouping }),
			};
		}
		case 'orderbook_indicative': {
			return {
				type: 'unsubscribe',
				channel: 'orderbook_indicative',
				market: getMarketSymbolFromId(props.market),
				marketType: props.market.isPerp ? 'perp' : 'spot',
				...(props.grouping && { grouping: props.grouping }),
			};
		}
		case 'trades': {
			return {
				type: 'unsubscribe',
				channel: 'trades',
				market: getMarketSymbolFromId(props.market),
				marketType: props.market.isPerp ? 'perp' : 'spot',
			};
		}
		default: {
			const exhaustiveCheck: never = type;
			throw new Error(`Unhandled case: ${exhaustiveCheck}`);
		}
	}
};

/**
 * This function needs to take the subscription probs and map it into matching channel key that is returned by the websocket for the subscription
 * @param props
 * @returns
 */
const getChannelKey = (props: WebsocketSubscriptionProps) => {
	const type = props.type;

	switch (type) {
		case 'orderbook': {
			return `orderbook_${props.market.isPerp ? 'perp' : 'spot'}_${
				props.market.marketIndex
			}${props.grouping ? `_grouped_${props.grouping}` : ''}`;
		}
		case 'orderbook_indicative': {
			return `orderbook_${props.market.isPerp ? 'perp' : 'spot'}_${
				props.market.marketIndex
			}${props.grouping ? `_grouped_${props.grouping}` : ''}_indicative`;
		}
		case 'trades': {
			return `trades_${props.market.isPerp ? 'perp' : 'spot'}_${
				props.market.marketIndex
			}`;
		}
		default: {
			const exhaustiveCheck: never = type;
			throw new Error(`Unhandled case: ${exhaustiveCheck}`);
		}
	}
};

const getMessageFilter = (
	props: WebsocketSubscriptionProps
): ((message: { channel: string; data: any }) => boolean) => {
	const type = props.type;

	switch (type) {
		case 'orderbook':
		case 'orderbook_indicative': {
			return (message: { channel: string; data: any }) => {
				return (
					message.channel === getChannelKey(props) ||
					// This is a special extra message which comes through once, immediately after subscribing, to let the subscriber know the initial state of the orderbook
					message.channel ===
						`last_update_orderbook_${props.market.marketTypeStr}_${props.market.marketIndex}`
				);
			};
		}
		case 'trades': {
			return (message: { channel: string; data: any }) =>
				message.channel === getChannelKey(props) ||
				message.channel === 'heartbeat';
		}
		default: {
			const exhaustiveCheck: never = type;
			throw new Error(`Unhandled case: ${exhaustiveCheck}`);
		}
	}
};

export const DLOB_SERVER_WEBSOCKET_UTILS = {
	getSubscriptionProps,
	getUnsubscriptionProps,
	getMessageFilter,
};

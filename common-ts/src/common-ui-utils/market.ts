import { isVariant } from '@drift-labs/sdk';
import { UIMarket } from '../types';

const marketIsPerp = (market: UIMarket) => {
	return isVariant(market?.marketType, 'perp');
};

const getBaseAssetSymbol = (marketName: string, removePrefix = false) => {
	let baseAssetSymbol = marketName.replace('-PERP', '').replace('/USDC', '');

	if (removePrefix) {
		baseAssetSymbol = baseAssetSymbol.replace('1K', '').replace('1M', '');
	}

	return baseAssetSymbol;
};

const getFullMarketName = (uiMarket: UIMarket) =>
	uiMarket
		? `${getBaseAssetSymbol(uiMarket.market.symbol)}${
				marketIsPerp(uiMarket) ? '-PERP' : '/USDC'
		  }`
		: undefined;

export const MARKET_COMMON_UTILS = {
	marketIsPerp,
	getBaseAssetSymbol,
	getFullMarketName,
};

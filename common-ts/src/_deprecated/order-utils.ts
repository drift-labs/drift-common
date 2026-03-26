import {
	getOrderLabelFromOrderDetails,
	getUIOrderTypeFromSdkOrderType,
} from '../utils/orders/labels';
import {
	getLimitPriceFromOracleOffset,
	isAuctionEmpty,
} from '../utils/orders/oracle';
import {
	getPerpAuctionDuration,
	getPerpOrderParamsBitFlags,
} from '../utils/orders/flags';
import { isOrderTriggered } from '../utils/orders/filters';

/** @deprecated Use direct imports from '@drift-labs/common/utils/orders' */
export const ORDER_COMMON_UTILS = {
	getOrderLabelFromOrderDetails,
	getLimitPriceFromOracleOffset,
	isAuctionEmpty,
	getUIOrderTypeFromSdkOrderType,
	getPerpAuctionDuration,
	getPerpOrderParamsBitFlags,
	isOrderTriggered,
};

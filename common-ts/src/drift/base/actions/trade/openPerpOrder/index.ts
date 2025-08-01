import { DriftClient, OptionalOrderParams, User } from '@drift-labs/sdk';
import { UIOrderType } from 'src/types';
import { openPerpMarketOrder } from './openPerpMarketOrder';
import { OptionalTriggerOrderParams } from './openPerpMarketOrder/openSwiftMarketOrder';

interface BaseOpenPerpOrderParams {
	driftClient: DriftClient;
	user: User;
	orderType: UIOrderType;
	marketOrderParams: {
		main: OptionalOrderParams;
		stopLoss?: OptionalTriggerOrderParams;
		takeProfit?: OptionalTriggerOrderParams;
	};
}

interface OpenPerpOrderSwiftParams extends BaseOpenPerpOrderParams {
	useSwift: true;
	swiftParams: {
		currentSlot: number;
		isDelegate: boolean;
		slotBuffer?: number;
	};
}

interface OpenPerpOrderOnChainParams extends BaseOpenPerpOrderParams {
	useSwift: false;
	swiftParams?: never;
}

type OpenPerpOrderParams =
	| OpenPerpOrderSwiftParams
	| OpenPerpOrderOnChainParams;

export const openPerpOrder = async (params: OpenPerpOrderParams) => {
	const { driftClient, user, useSwift, marketOrderParams, orderType } = params;

	switch (orderType) {
		case 'market':
			return openPerpMarketOrder({
				driftClient,
				user,
				useSwift,
				swiftParams: useSwift ? params.swiftParams : undefined,
				orderParams: marketOrderParams,
			});
	}
};

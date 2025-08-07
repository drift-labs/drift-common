import { DriftClient, OptionalOrderParams, User } from '@drift-labs/sdk';
import { UIOrderType } from 'src/types';
import { openPerpMarketOrder } from './openPerpMarketOrder';
import { OptionalTriggerOrderParams, prepSwiftOrder } from './openSwiftOrder';
import { SwiftClient } from 'src/clients/swiftClient';
import invariant from 'tiny-invariant';
import { openPerpNonMarketOrder } from './openPerpNonMarketOrder';

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

export const openPerpOrderTxn = async (params: OpenPerpOrderParams) => {
	const {
		driftClient,
		user,
		useSwift,
		marketOrderParams,
		orderType,
		swiftParams,
	} = params;

	if (useSwift) {
		invariant(
			SwiftClient.isSupportedOrderType(orderType),
			'Order type not supported for Swift'
		);
		invariant(swiftParams, 'Swift params are required when using Swift');

		const takerAuthority = user.getUserAccount().authority;
		const takerSubAccountId = user.getUserAccount().subAccountId;

		const preppedSwiftOrder = prepSwiftOrder({
			driftClient,
			currentSlot: swiftParams.currentSlot,
			isDelegate: swiftParams.isDelegate,
			orderParams: marketOrderParams,
			takerUserAccount: {
				pubKey: takerAuthority,
				subAccountId: takerSubAccountId,
			},
			slotBuffer: swiftParams.slotBuffer,
		});

		return preppedSwiftOrder;
	}

	switch (orderType) {
		case 'market':
		case 'oracle':
			return openPerpMarketOrder();
		case 'limit':
		case 'stopMarket':
		case 'stopLimit':
		case 'takeProfitMarket':
		case 'takeProfitLimit':
		case 'oracleLimit':
		case 'scaledOrders':
			return openPerpNonMarketOrder();
		default: {
			const _exhaustiveCheck: never = orderType;
			throw new Error(`Order type ${_exhaustiveCheck} not supported`);
		}
	}
};

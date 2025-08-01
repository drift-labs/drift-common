import { DriftClient, OptionalOrderParams, User } from '@drift-labs/sdk';
import {
	OptionalTriggerOrderParams,
	prepSwiftOrder,
} from './openSwiftMarketOrder';

export interface OpenPerpMarketOrderParams {
	driftClient: DriftClient;
	user: User;
	useSwift: boolean;
	swiftParams?: {
		currentSlot: number;
		isDelegate: boolean;
		slotBuffer?: number;
	};
	orderParams: {
		main: OptionalOrderParams;
		stopLoss?: OptionalTriggerOrderParams;
		takeProfit?: OptionalTriggerOrderParams;
	};
}

export const openPerpMarketOrder = async ({
	driftClient,
	user,
	useSwift,
	orderParams,
	swiftParams,
}: OpenPerpMarketOrderParams) => {
	// handleSwitchUser

	const takerAuthority = user.getUserAccount().authority;
	const takerSubAccountId = user.getUserAccount().subAccountId;

	if (useSwift) {
		if (!swiftParams) {
			throw new Error('Swift params are required when using Swift');
		}

		const preppedSwiftOrder = prepSwiftOrder({
			driftClient,
			currentSlot: swiftParams.currentSlot,
			isDelegate: swiftParams.isDelegate,
			orderParams,
			takerUserAccount: {
				pubKey: takerAuthority,
				subAccountId: takerSubAccountId,
			},
			slotBuffer: swiftParams.slotBuffer,
		});

		return preppedSwiftOrder;
	}
};

import {
	AssetTier,
	ContractTier,
	ContractType,
	DepositDirection,
	DepositExplanation,
	LPAction,
	LiquidationType,
	MarketStatus,
	MarketType,
	ModifyOrderPolicy,
	OracleSource,
	OrderAction,
	OrderActionExplanation,
	OrderStatus,
	OrderTriggerCondition,
	OrderType,
	PositionDirection,
	PostOnlyParams,
	SettlePnlExplanation,
	SettlePnlMode,
	SpotBalanceType,
	SpotFulfillmentConfigStatus,
	SpotFulfillmentStatus,
	SpotFulfillmentType,
	StakeAction,
	SwapDirection,
	SwapReduceOnly,
} from '@drift-labs/sdk';
import { expect } from 'chai';
import { ENUM_UTILS } from '../../src/utils';

describe('Enum Utils', () => {
	describe('ENUM_UTILS are consistent', () => {
		const ENUMS_TO_CHECK = [
			MarketStatus,
			ContractType,
			ContractTier,
			AssetTier,
			SwapDirection,
			SpotBalanceType,
			PositionDirection,
			DepositDirection,
			OracleSource,
			OrderType,
			MarketType,
			OrderStatus,
			OrderAction,
			OrderActionExplanation,
			OrderTriggerCondition,
			SpotFulfillmentType,
			SpotFulfillmentStatus,
			DepositExplanation,
			SettlePnlExplanation,
			SpotFulfillmentConfigStatus,
			StakeAction,
			SettlePnlMode,
			LPAction,
			LiquidationType,
			PostOnlyParams,
			ModifyOrderPolicy,
			SwapReduceOnly,
		];

		it('should be consistent when converting between strings and objects', () => {
			for (const ENUM of ENUMS_TO_CHECK) {
				const enumEntries = Object.entries(ENUM);

				for (const [_key, value] of enumEntries) {
					const stringedValue = ENUM_UTILS.toStr(value);
					const backToObjValue = ENUM_UTILS.toObj(stringedValue);

					expect(ENUM_UTILS.toStr(value) === stringedValue).to.be.true;
					expect(ENUM_UTILS.match(value, backToObjValue)).to.be.true;
				}
			}
		});
	});
});

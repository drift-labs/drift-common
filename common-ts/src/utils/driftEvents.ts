import { EventType, WrappedEvent } from '@drift-labs/sdk';
import { ENUM_UTILS } from '.';

// Pick the relevant fields from OrderActionRecord that we care about for getDriftEventKey. This enables us to use UISerializableOrderActionRecord and OrderActionRecord interchangeably.
type UniqableOrderActionRecord = Pick<
	WrappedEvent<'OrderActionRecord'>,
	| 'eventType'
	| 'action'
	| 'marketIndex'
	| 'takerOrderId'
	| 'makerOrderId'
	| 'txSig'
	| 'fillRecordId'
	| 'taker'
	| 'maker'
>;

// Create a generic type using typescript transforms that allows any relevant order types to be used in getDriftEventKey.
type UniqableDriftEvent =
	| WrappedEvent<Exclude<EventType, 'OrderActionRecord'>>
	| UniqableOrderActionRecord;

/**
 * Utility method to get a unique key for any drift event.
 * @param event
 * @returns
 */
export const getDriftEventKey = (event: UniqableDriftEvent) => {
	const _eventType = event.eventType;
	switch (_eventType) {
		case 'SwapRecord': {
			const _typedEvent = event as WrappedEvent<'SwapRecord'>;
			return `${_typedEvent.eventType}_${_typedEvent.user.toString()}_${
				_typedEvent.txSig
			}_${_typedEvent.inMarketIndex}_${_typedEvent.outMarketIndex}`;
		}
		case 'OrderRecord': {
			const _typedEvent = event as WrappedEvent<'OrderRecord'>;
			return `${_typedEvent.eventType}_${_typedEvent.user.toString()}_${
				_typedEvent.order.userOrderId
			}_${_typedEvent.order.orderId}`;
		}
		case 'CurveRecord': {
			const _typedEvent = event as WrappedEvent<'CurveRecord'>;
			return `${_typedEvent.eventType}_${
				_typedEvent.marketIndex
			}_${_typedEvent.recordId.toString()}`;
		}
		case 'DeleteUserRecord': {
			const _typedEvent = event as WrappedEvent<'DeleteUserRecord'>;
			return `${_typedEvent.eventType}_${_typedEvent.user.toString()}`;
		}
		case 'DepositRecord': {
			const _typedEvent = event as WrappedEvent<'DepositRecord'>;
			return `${
				_typedEvent.eventType
			}_${_typedEvent.user.toString()}_${_typedEvent.depositRecordId.toString()}`;
		}
		case 'FundingPaymentRecord': {
			const _typedEvent = event as WrappedEvent<'FundingPaymentRecord'>;
			return `${_typedEvent.eventType}_${_typedEvent.user.toString()}_${
				_typedEvent.txSig
			}_${_typedEvent.marketIndex}`;
		}
		case 'FuelSeasonRecord': {
			const _typedEvent = event as WrappedEvent<'FuelSeasonRecord'>;
			return `${_typedEvent.eventType}_${_typedEvent.authority.toString()}_${
				_typedEvent.txSig
			}`;
		}
		case 'FuelSweepRecord': {
			const _typedEvent = event as WrappedEvent<'FuelSweepRecord'>;
			return `${_typedEvent.eventType}_${_typedEvent.authority.toString()}_${
				_typedEvent.txSig
			}`;
		}
		case 'LiquidationRecord': {
			const _typedEvent = event as WrappedEvent<'LiquidationRecord'>;
			return `${_typedEvent.eventType}_${_typedEvent.user.toString()}_${
				_typedEvent.liquidationId
			}`;
		}
		case 'FundingRateRecord': {
			const _typedEvent = event as WrappedEvent<'FundingRateRecord'>;
			return `${_typedEvent.eventType}_${
				_typedEvent.marketIndex
			}_${_typedEvent.recordId.toString()}`;
		}
		case 'NewUserRecord': {
			const _typedEvent = event as WrappedEvent<'NewUserRecord'>;
			return `${_typedEvent.eventType}_${_typedEvent.user.toString()}_${
				_typedEvent.txSig
			}`;
		}
		case 'InsuranceFundRecord': {
			const _typedEvent = event as WrappedEvent<'InsuranceFundRecord'>;
			return `${_typedEvent.eventType}_${_typedEvent.txSig}`;
		}
		case 'InsuranceFundStakeRecord': {
			const _typedEvent = event as WrappedEvent<'InsuranceFundStakeRecord'>;
			return `${_typedEvent.eventType}_${ENUM_UTILS.toStr(
				_typedEvent.action
			)}_${_typedEvent.txSig}`;
		}
		case 'SpotMarketVaultDepositRecord': {
			const _typedEvent = event as WrappedEvent<'SpotMarketVaultDepositRecord'>;
			return `${_typedEvent.eventType}_${_typedEvent.marketIndex}_${_typedEvent.txSig}`;
		}
		case 'SpotInterestRecord': {
			const _typedEvent = event as WrappedEvent<'SpotInterestRecord'>;
			return `${_typedEvent.eventType}_${_typedEvent.marketIndex}_${_typedEvent.txSig}`;
		}
		case 'LPRecord': {
			const _typedEvent = event as WrappedEvent<'LPRecord'>;
			return `${_typedEvent.eventType}_${
				_typedEvent.marketIndex
			}_${ENUM_UTILS.toStr(_typedEvent.action)}_${_typedEvent.txSig}`;
		}
		case 'SettlePnlRecord': {
			const _typedEvent = event as WrappedEvent<'SettlePnlRecord'>;
			return `${_typedEvent.eventType}_${
				_typedEvent.marketIndex
			}_${_typedEvent.user.toString()}_${_typedEvent.txSig}`;
		}
		case 'SignedMsgOrderRecord': {
			const _typedEvent = event as WrappedEvent<'SignedMsgOrderRecord'>;
			return `${_typedEvent.eventType}_${_typedEvent.hash}`;
		}
		case 'OrderActionRecord': {
			const _typedEvent = event as UniqableOrderActionRecord;
			const _actionStr = ENUM_UTILS.toStr(_typedEvent.action);
			switch (_actionStr) {
				case 'trigger': {
					return `${_typedEvent.eventType}_${_actionStr}_${_typedEvent.marketIndex}_${_typedEvent.takerOrderId}_${_typedEvent.makerOrderId}_${_typedEvent.txSig}`;
				}
				case 'fill': {
					return `${_typedEvent.eventType}_${_actionStr}_${
						_typedEvent.marketIndex
					}_${_typedEvent.takerOrderId}_${
						_typedEvent.makerOrderId
					}_${_typedEvent.fillRecordId.toString()}`;
				}
				case 'expire': {
					return `${_typedEvent.eventType}_${_actionStr}_${
						_typedEvent.marketIndex
					}_${_typedEvent.takerOrderId}_${
						_typedEvent.makerOrderId
					}_${_typedEvent.taker?.toString()}_${_typedEvent.maker?.toString()}_${
						_typedEvent.txSig
					}`;
				}
				case 'place': {
					return `${_typedEvent.eventType}_${_actionStr}_${
						_typedEvent.marketIndex
					}_${_typedEvent.takerOrderId}_${
						_typedEvent.makerOrderId
					}_${_typedEvent.taker?.toString()}_${_typedEvent.maker?.toString()}_${
						_typedEvent.txSig
					}`;
				}
				case 'cancel': {
					return `${_typedEvent.eventType}_${_actionStr}_${
						_typedEvent.marketIndex
					}_${_typedEvent.takerOrderId}_${
						_typedEvent.makerOrderId
					}_${_typedEvent.taker?.toString()}_${_typedEvent.maker?.toString()}_${
						_typedEvent.txSig
					}`;
				}
				default: {
					throw new Error(`Unhandled Order Action: ${_actionStr}`);
				}
			}
		}
		default: {
			const _unhandledEvent: never = _eventType;
			throw new Error(`Unhandled event type: ${_unhandledEvent}`);
		}
	}
};

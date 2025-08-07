import {
	decodeName,
	DriftClient,
	OrderStatus,
	PublicKey,
	User,
} from '@drift-labs/sdk';
import { Observable, Subject } from 'rxjs';
import {
	getSpotBalanceInfo,
	SpotBalanceInfo,
} from '../../base/details/user/balances';
import {
	AccountMarginInfo,
	getAccountMarginInfo,
} from '../../base/details/user/marginInfo';
import {
	getPositionInfo,
	PerpPositionInfo,
} from '../../base/details/user/positions';
import { UISerializableOrder } from '../../../serializableTypes';
import { MarketId } from '../../../types';
import { OraclePriceStore } from './OraclePriceStore';
import { MarkPriceStore } from './MarkPriceStore';
import { getOrderDetails } from '../../base/details/user/orders';
import { ENUM_UTILS } from '../../../utils';

export type AccountData = {
	pubKey: PublicKey;
	subAccountId: number;
	name: string;
	userClient: User;
	marginInfo: AccountMarginInfo;
	openOrders: UISerializableOrder[];
	openPerpPositions: PerpPositionInfo[];
	marginEnabled: boolean;
	delegate?: PublicKey;
	isDelegatedTo?: boolean;
	spotBalances: SpotBalanceInfo[];
	poolId: number;
};

export type UserAccountLookup = Record<number, AccountData>;

export class UserAccountStore {
	private _store: UserAccountLookup = {};
	private updatesSubject$ = new Subject<AccountData>();
	private driftClient: DriftClient;
	private oraclePriceStore: OraclePriceStore;
	private markPriceStore: MarkPriceStore;

	constructor(
		driftClient: DriftClient,
		oraclePriceStore: OraclePriceStore,
		markPriceStore: MarkPriceStore
	) {
		this.driftClient = driftClient;
		this.oraclePriceStore = oraclePriceStore;
		this.markPriceStore = markPriceStore;
	}

	get store() {
		return { ...this._store };
	}

	private processAccountData(user: User): AccountData {
		const userAccount = user.getUserAccount();
		const positionsInfo = userAccount.perpPositions.map((position) => {
			const marketId = MarketId.createPerpMarket(position.marketIndex);
			const oraclePrice = this.oraclePriceStore.getOraclePrice(marketId.key);
			const markPrice = this.markPriceStore.getMarkPrice(marketId.key);
			return getPositionInfo(
				this.driftClient,
				user,
				position,
				oraclePrice,
				markPrice
			);
		});
		const spotBalances = userAccount.spotPositions.map((spotPosition) => {
			const marketId = MarketId.createSpotMarket(spotPosition.marketIndex);
			const oraclePrice = this.oraclePriceStore.getOraclePrice(marketId.key);
			return getSpotBalanceInfo(
				this.driftClient,
				user,
				spotPosition.marketIndex,
				oraclePrice
			);
		});
		const marginInfo = getAccountMarginInfo(
			this.driftClient,
			user,
			this.oraclePriceStore.getOraclePrice
		);
		const openOrders = userAccount.orders
			.filter((order) => !order.baseAssetAmount.isZero())
			.filter(
				(order) =>
					!ENUM_UTILS.match(order.status, OrderStatus.CANCELED) &&
					!ENUM_UTILS.match(order.status, OrderStatus.FILLED)
			)
			.map((order) => getOrderDetails(order));

		return {
			pubKey: user.getUserAccountPublicKey(),
			subAccountId: userAccount.subAccountId,
			name: decodeName(userAccount.name),
			userClient: user,
			marginInfo,
			openOrders,
			openPerpPositions: positionsInfo,
			spotBalances,
			marginEnabled: userAccount.isMarginTradingEnabled,
			poolId: userAccount.poolId,
		};
	}

	public updateUserAccount(user: User) {
		const accountData = this.processAccountData(user);

		this._store[accountData.subAccountId] = accountData;
		this.updatesSubject$.next(accountData);
	}

	public reset(): void {
		this._store = {};
	}

	public getUser(subAccountId: number): AccountData | undefined {
		return this._store[subAccountId];
	}

	public observeStoreUpdates(): Observable<AccountData> {
		return this.updatesSubject$.asObservable();
	}
}

import {
	decodeName,
	DriftClient,
	OrderStatus,
	PublicKey,
	User,
	ZERO,
} from '@drift-labs/sdk';
import { Subject } from 'rxjs';
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
import { OraclePriceCache } from './OraclePriceCache';
import { MarkPriceCache } from './MarkPriceCache';
import { getOrderDetails } from '../../base/details/user/orders';
import { ENUM_UTILS } from '../../../utils';

export type AccountData = {
	authority: PublicKey;
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

/**
 * A key for a user account. Combines the subAccountId and the authority.
 */
export type UserAccountKey = `${number}_${string}`;

export type UserAccountLookup = Record<UserAccountKey, AccountData>; // we use UserAccountKey because this store can store multiple accounts with the same subAccountId, but from different authorities

export class UserAccountCache {
	private _store: UserAccountLookup = {};
	private updatesSubject$ = new Subject<AccountData>();
	private driftClient: DriftClient;
	private oraclePriceStore: OraclePriceCache;
	private markPriceStore: MarkPriceCache;

	constructor(
		driftClient: DriftClient,
		oraclePriceStore: OraclePriceCache,
		markPriceStore: MarkPriceCache
	) {
		this.driftClient = driftClient;
		this.oraclePriceStore = oraclePriceStore;
		this.markPriceStore = markPriceStore;
	}

	get store() {
		return { ...this._store };
	}

	get allUsers() {
		return Object.values(this._store);
	}

	static getUserAccountKey(
		subAccountId: number,
		authority: PublicKey | string
	): UserAccountKey {
		return `${subAccountId}_${authority.toString()}`;
	}

	private processAccountData(user: User): AccountData {
		const userAccount = user.getUserAccount();
		const positionsInfo = userAccount.perpPositions
			.filter(
				(position) =>
					!position.baseAssetAmount.eq(ZERO) ||
					!position.quoteAssetAmount.eq(ZERO)
			)
			.map((position) => {
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
		const spotBalances = userAccount.spotPositions
			.filter((spotPosition) => !spotPosition.scaledBalance.eq(ZERO))
			.map((spotPosition) => {
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
			this.oraclePriceStore.getOraclePrice.bind(this.oraclePriceStore)
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
			authority: user.getUserAccount().authority,
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

		this._store[
			UserAccountCache.getUserAccountKey(
				accountData.subAccountId,
				accountData.authority
			)
		] = accountData;
		this.updatesSubject$.next(accountData);
	}

	public reset(): void {
		this._store = {};
	}

	public getUser(
		subAccountId: number,
		authority: PublicKey | string
	): AccountData | undefined {
		return this._store[
			UserAccountCache.getUserAccountKey(subAccountId, authority)
		];
	}

	public onUpdate(callback: (userAccount: AccountData) => void) {
		const subscription = this.updatesSubject$.subscribe((userAccount) => {
			callback(userAccount);
		});

		return subscription;
	}
}

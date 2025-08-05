import { BN, OraclePriceData, ZERO } from '@drift-labs/sdk';
import { Subject } from 'rxjs';
import { MarketKey } from 'src/types';

export type OraclePriceStore = Record<MarketKey, OraclePriceData>;

export class OraclePriceStoreManager {
	private _store: OraclePriceStore = {};
	private updatesSubject$ = new Subject<OraclePriceStore>();

	constructor() {}

	get store() {
		return { ...this._store };
	}

	get updatesSubject() {
		return this.updatesSubject$;
	}

	public updateOraclePrices(
		...oraclePrices: { marketKey: MarketKey; price: BN; lastUpdateSlot: BN }[]
	) {
		const updatedOraclePrices = {};

		oraclePrices.forEach(({ marketKey, price, lastUpdateSlot }) => {
			const currentOraclePriceState = this._store[marketKey];

			if (
				!currentOraclePriceState ||
				currentOraclePriceState.slot.gt(lastUpdateSlot)
			) {
				updatedOraclePrices[marketKey] = { price, lastUpdateSlot };
			}
		});

		this._store = { ...this._store, ...updatedOraclePrices };

		if (Object.keys(updatedOraclePrices).length > 0) {
			this.updatesSubject$.next(updatedOraclePrices);
		}
	}

	public getOraclePriceData(marketKey: MarketKey): OraclePriceData {
		const storeData = this._store[marketKey];
		if (!storeData) {
			return {
				price: ZERO,
				slot: ZERO,
				confidence: ZERO,
				hasSufficientNumberOfDataPoints: false,
				twap: ZERO,
				twapConfidence: ZERO,
				maxPrice: ZERO,
			};
		}

		return storeData;
	}

	public getOraclePrice(marketKey: MarketKey): BN {
		return this.getOraclePriceData(marketKey).price;
	}
}

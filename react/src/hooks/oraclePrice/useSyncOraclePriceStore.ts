import {
	BigNum,
	BulkAccountLoader,
	OracleSource,
	PRICE_PRECISION_EXP,
	PublicKey,
	getOracleClient,
} from '@drift-labs/sdk';
import {
	OraclePriceStore,
	useCommonDriftStore,
	useOraclePriceStore,
} from '../../stores';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useImmer } from 'use-immer';
import { UIMarket } from '@drift/common';
import { useInterval } from 'react-use';

type OracleClient = ReturnType<typeof getOracleClient>;

export type MarketAndAccount = {
	market: UIMarket;
	accountToUse: PublicKey;
};

export const useSyncOraclePriceStore = (
	marketsAndAccounts: MarketAndAccount[],
	refreshTimeMs = 1000
) => {
	const connection = useCommonDriftStore((s) => s.connection);
	const bulkAccountLoader = useCommonDriftStore((s) => s.bulkAccountLoader);
	const setOraclePriceStore = useOraclePriceStore((s) => s.set);

	const [pythClient, setPythClient] = useState<OracleClient>();
	const [pyth1KClient, setPyth1KClient] = useState<OracleClient>();
	const [pyth1MClient, setPyth1MClient] = useState<OracleClient>();
	const [pythStableCoin, setPythStableCoin] = useState<OracleClient>();

	// Keep a local price store state so that the app isn't re-rendering non-stop for every price change
	const [localPriceStoreState, setLocalPriceStoreState] = useImmer<
		OraclePriceStore['symbolMap']
	>({});

	const bulkLoaderCallbacks = useRef<[string, PublicKey][]>([]);

	const arePythClientsReady =
		!!pythClient && !!pyth1KClient && !!pyth1MClient && !!pythStableCoin;

	const getMatchingOracleClient = useCallback(
		(oracleSource: OracleSource) => {
			if (!arePythClientsReady) throw new Error('Pyth clients are not ready');

			switch (oracleSource) {
				case OracleSource.PYTH:
					return pythClient;
				case OracleSource.PYTH_1K:
					return pyth1KClient;
				case OracleSource.PYTH_1M:
					return pyth1MClient;
				case OracleSource.PYTH_STABLE_COIN:
					return pythStableCoin;
				default:
					throw 'Unaccounted for oracle type in useSyncOraclePriceStore';
			}
		},
		[arePythClientsReady]
	);

	useEffect(() => {
		if (!connection) return;

		setPythClient(getOracleClient(OracleSource.PYTH, connection));
		setPyth1KClient(getOracleClient(OracleSource.PYTH_1K, connection));
		setPyth1MClient(getOracleClient(OracleSource.PYTH_1M, connection));
		setPythStableCoin(
			getOracleClient(OracleSource.PYTH_STABLE_COIN, connection)
		);
	}, [connection]);

	useEffect(() => {
		if (!connection) return;
		if (!bulkAccountLoader) return;
		if (!arePythClientsReady) return;

		fetchAndSetPrices(bulkAccountLoader, marketsAndAccounts);

		const cleanup = () => {
			if (bulkLoaderCallbacks.current.length) {
				bulkLoaderCallbacks.current.forEach(([callbackId, accountKey]) => {
					bulkAccountLoader.removeAccount(accountKey, callbackId);
				});
				bulkLoaderCallbacks.current = [];
			}
		};

		return cleanup;
	}, [
		connection,
		arePythClientsReady,
		bulkAccountLoader,
		getMatchingOracleClient,
	]);

	async function fetchAndSetPrices(
		bulkAccountLoader: BulkAccountLoader,
		marketsAndAccounts: MarketAndAccount[]
	) {
		marketsAndAccounts.forEach(async ({ market, accountToUse }) => {
			const callbackId = await bulkAccountLoader.addAccount(
				accountToUse,
				async (accountDataBuffer) => {
					if (!accountDataBuffer) return;

					const accountClient = getMatchingOracleClient(
						market.market.oracleSource
					);
					const oraclePriceData =
						await accountClient.getOraclePriceDataFromBuffer(accountDataBuffer);

					setLocalPriceStoreState((s) => {
						s[market.key] = {
							market,
							priceData: {
								price: BigNum.from(
									oraclePriceData.price,
									PRICE_PRECISION_EXP
								).toNum(),
								slot: oraclePriceData.slot.toNumber(),
								confidence: BigNum.from(
									oraclePriceData.confidence,
									PRICE_PRECISION_EXP
								).toNum(),
								twap: BigNum.from(
									oraclePriceData.twap,
									PRICE_PRECISION_EXP
								).toNum(),
								twapConfidence: BigNum.from(
									oraclePriceData.twapConfidence,
									PRICE_PRECISION_EXP
								).toNum(),
							},
							rawPriceData: oraclePriceData,
						};
					});
				}
			);

			bulkLoaderCallbacks.current.push([callbackId, accountToUse]);
		});
	}

	// Update the price store every refreshTimeMs
	useInterval(() => {
		setOraclePriceStore((s) => {
			s.symbolMap = localPriceStoreState;
		});
	}, refreshTimeMs);
};

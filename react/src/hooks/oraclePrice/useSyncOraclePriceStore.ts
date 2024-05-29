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
import { ENUM_UTILS, UIMarket } from '@drift/common';
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
	const driftClient = useCommonDriftStore((s) => s.driftClient.client);
	const connection = useCommonDriftStore((s) => s.connection);
	const bulkAccountLoader = useCommonDriftStore((s) => s.bulkAccountLoader);
	const setOraclePriceStore = useOraclePriceStore((s) => s.set);

	const [pythClient, setPythClient] = useState<OracleClient>();
	const [pyth1KClient, setPyth1KClient] = useState<OracleClient>();
	const [pyth1MClient, setPyth1MClient] = useState<OracleClient>();
	const [pythStableCoin, setPythStableCoin] = useState<OracleClient>();
	const [switchboardClient, setSwitchboardClient] = useState<OracleClient>();
	const [preLaunchClient, setPreLaunchClient] = useState<OracleClient>();

	// Keep a local price store state so that the app isn't re-rendering non-stop for every price change
	const [localPriceStoreState, setLocalPriceStoreState] = useImmer<
		OraclePriceStore['symbolMap']
	>({});

	const bulkLoaderCallbacks = useRef<[string, PublicKey][]>([]);

	const areOracleClientsReady =
		!!pythClient &&
		!!pyth1KClient &&
		!!pyth1MClient &&
		!!pythStableCoin &&
		!!switchboardClient &&
		!!preLaunchClient;

	const getMatchingOracleClient = useCallback(
		(oracleSource: OracleSource) => {
			if (!areOracleClientsReady)
				throw new Error('Oracle clients are not ready');

			if (ENUM_UTILS.match(oracleSource, OracleSource.PYTH)) {
				return pythClient;
			} else if (ENUM_UTILS.match(oracleSource, OracleSource.PYTH_1K)) {
				return pyth1KClient;
			} else if (ENUM_UTILS.match(oracleSource, OracleSource.PYTH_1M)) {
				return pyth1MClient;
			} else if (
				ENUM_UTILS.match(oracleSource, OracleSource.PYTH_STABLE_COIN)
			) {
				return pythStableCoin;
			} else if (ENUM_UTILS.match(oracleSource, OracleSource.SWITCHBOARD)) {
				return switchboardClient;
			} else if (ENUM_UTILS.match(oracleSource, OracleSource.Prelaunch)) {
				return preLaunchClient;
			} else {
				console.error(JSON.stringify(oracleSource));
				throw new Error(
					`Unaccounted for oracle type in useSyncOraclePriceStore.`
				);
			}
		},
		[areOracleClientsReady]
	);

	useEffect(() => {
		if (!connection) return;
		if (!driftClient) return;

		setPythClient(
			getOracleClient(OracleSource.PYTH, connection, driftClient.program)
		);
		setPyth1KClient(
			getOracleClient(OracleSource.PYTH_1K, connection, driftClient.program)
		);
		setPyth1MClient(
			getOracleClient(OracleSource.PYTH_1M, connection, driftClient.program)
		);
		setPythStableCoin(
			getOracleClient(
				OracleSource.PYTH_STABLE_COIN,
				connection,
				driftClient.program
			)
		);
		setSwitchboardClient(
			getOracleClient(OracleSource.SWITCHBOARD, connection, driftClient.program)
		);
		setPreLaunchClient(
			getOracleClient(OracleSource.Prelaunch, connection, driftClient.program)
		);
	}, [connection, driftClient]);

	useEffect(() => {
		if (!connection) return;
		if (!bulkAccountLoader) return;
		if (!areOracleClientsReady) return;

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
		areOracleClientsReady,
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
								maxPrice: oraclePriceData.maxPrice
									? BigNum.from(
											oraclePriceData.maxPrice,
											PRICE_PRECISION_EXP
									  ).toNum()
									: undefined,
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

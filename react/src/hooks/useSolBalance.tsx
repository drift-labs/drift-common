import { PublicKey } from '@drift-labs/sdk';
import { BigNum, LAMPORTS_EXP } from '@drift-labs/sdk';
import { Connection } from '@solana/web3.js';
import { useEffect, useRef } from 'react';
import { useCommonDriftStore } from '../stores';

/**
 * Keeps SOL balance updated in app store. Only use once across the app, and retrieve balance from the store in components
 */
export const useSolBalance = (disable = false) => {
	const listenerId = useRef<number | null>(null);
	const authority = useCommonDriftStore(s => s.authority);
	const connected = !!authority;
	const balanceHasLoaded = useCommonDriftStore(
		(s) => s.currentSolBalance.loaded
	);
	const connection = useCommonDriftStore((s) => s.connection) as Connection;
	const set = useCommonDriftStore((s) => s.set);
	const Env = useCommonDriftStore((s) => s.env);

	const handleNewBalance = (newBalance: number) => {
		set((s) => {
			s.currentSolBalance = {
				value: BigNum.from(newBalance, LAMPORTS_EXP),
				loaded: true,
			};
		});
	};

	const getBalance = async (authority: PublicKey) => {
		const accountInfo = await connection.getAccountInfo(authority);
		const newBalance = accountInfo ? accountInfo.lamports : 0;
		handleNewBalance(newBalance);
	};

	const updateBalance = () => {
		if (disable) return;

		if (connected && connection && authority) {
			getBalance(authority);

			const newListenerId = connection.onAccountChange(
				authority,
				(accountInfo) => {
					handleNewBalance(accountInfo.lamports);
				}
			);

			listenerId.current = newListenerId;
		} else if (connection) {
			set((s) => {
				s.currentSolBalance.value = BigNum.zero(LAMPORTS_EXP);
			});

			if (listenerId.current === null) return;

			connection.removeAccountChangeListener(listenerId.current);
			listenerId.current = null;
		}
	};

	useEffect(() => {
		updateBalance();
	}, [connected, connection, disable]);

	useEffect(() => {
		if (Env.basePollingRateMs === 0) return;

		if (connected && !balanceHasLoaded) {
			const interval = setInterval(() => {
				updateBalance();
			}, Env.basePollingRateMs);

			return () => {
				clearInterval(interval);
			};
		}
	}, [Env.basePollingRateMs, connected, balanceHasLoaded, disable]);
};

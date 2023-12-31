import { PublicKey } from '@drift-labs/sdk';
import { BigNum, LAMPORTS_EXP } from '@drift-labs/sdk';
import { Connection } from '@solana/web3.js';
import { useEffect, useRef } from 'react';
import { useInterval } from 'react-use';
import { useCommonDriftStore } from '../stores';
import { useWalletContext } from './useWalletContext';

/**
 * Keeps SOL balance updated in app store. Only use once across the app, and retrieve balance from the store in components
 */
export const useSolBalance = () => {
	const listenerId = useRef<number | null>(null);
	const wallet = useWalletContext();
	const connected = wallet?.connected;
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
		if (connected && connection && wallet?.publicKey) {
			getBalance(wallet.publicKey);

			const newListenerId = connection.onAccountChange(
				wallet.publicKey,
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
	}, [connected, connection]);

	useInterval(() => {
		if (connected && !balanceHasLoaded) {
			updateBalance();
		}
	}, Env.basePollingRateMs);
};

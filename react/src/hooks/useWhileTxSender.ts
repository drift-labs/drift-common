import { useWallet } from '@solana/wallet-adapter-react';
import { useEffect } from 'react';
import { WhileValidTxSender } from '@drift-labs/sdk';
import { useCommonDriftStore } from '../stores';

const DEFAULT_TX_SENDER_CALLBACKS: ((base58EncodedTx: string) => void)[] = [];
const DEFAULT_ADDITIONAL_CONNECTIONS: any[] = [];

export function useWhileTxSender({
	disable,
	retryInterval = 4000,
	additionalTxSenderCallbacks = DEFAULT_TX_SENDER_CALLBACKS,
	additionalConnections = DEFAULT_ADDITIONAL_CONNECTIONS,
}: {
	disable?: boolean;
	retryInterval?: WhileValidTxSender['retrySleep'];
	additionalTxSenderCallbacks?: WhileValidTxSender['additionalTxSenderCallbacks'];
	additionalConnections?: WhileValidTxSender['additionalConnections'];
}) {
	const connection = useCommonDriftStore((s) => s.connection);
	const driftClient = useCommonDriftStore((s) => s.driftClient.client);
	const wallet = useWallet();

	useEffect(() => {
		if (!connection || !driftClient || !wallet.wallet?.adapter || disable)
			return;

		const whileTxSender = new WhileValidTxSender({
			connection,
			// @ts-ignore
			wallet: wallet.wallet.adapter as Wallet,
			additionalConnections,
			additionalTxSenderCallbacks,
			retrySleep: retryInterval,
		});

		driftClient.txSender = whileTxSender;
	}, [
		disable,
		connection,
		wallet.wallet?.adapter?.publicKey,
		additionalConnections,
		driftClient,
	]);
}

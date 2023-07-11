import { useEffect, useState } from 'react';
import useDriftClientIsReady from './useDriftClientIsReady';
// import { singletonHook } from 'react-singleton-hook';
import { useCommonDriftStore } from '../stores';

/**
 * Checks if the current user has a Drift account.
 */
export const useAccountExists = () => {
	const driftClientIsReady = useDriftClientIsReady();
	const driftClient = useCommonDriftStore((s) => s.driftClient.client);
	const walletState = useCommonDriftStore((s) => s.currentlyConnectedWalletContext);
	const [userAccountNotInitialized, accountId] = useCommonDriftStore((s) => [
		s.userAccountNotInitialized,
		s.currentUserAccount?.accountId,
	]);
	const [accountExists, setAccountExists] = useState<boolean>();

	const getAndSetUserExists = async () => {
		if (!driftClient || !walletState?.wallet?.adapter?.publicKey) return;

		const subAccounts = await driftClient.getUserAccountsForAuthority(
			walletState?.wallet?.adapter?.publicKey
		);

		try {
			const user = driftClient.getUser(
				subAccounts[0]?.subAccountId,
				walletState?.wallet?.adapter?.publicKey
			);
			const userAccountExists = await user.exists();
			setAccountExists(userAccountExists);
		} catch (e) {
			setAccountExists(false);
		}
	};

	useEffect(() => {
		if (!walletState?.connected || !driftClientIsReady) return;
		getAndSetUserExists();
	}, [walletState, driftClientIsReady, accountId, userAccountNotInitialized]);

	return accountExists;
};

// TODO: make this a singleton hook?
// export default singletonHook(false, useAccountExists);

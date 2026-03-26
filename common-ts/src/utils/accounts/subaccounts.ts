import { DriftClient, PublicKey, User, UserAccount } from '@drift-labs/sdk';

const fetchCurrentSubaccounts = (driftClient: DriftClient): UserAccount[] => {
	return driftClient.getUsers().map((user) => user.getUserAccount());
};

const fetchUserClientsAndAccounts = (
	driftClient: DriftClient
): { user: User; userAccount: UserAccount }[] => {
	const accounts = fetchCurrentSubaccounts(driftClient);
	const allUsersAndUserAccounts = accounts.map((acct) => {
		return {
			user: driftClient.getUser(acct.subAccountId, acct.authority),
			userAccount: acct,
		};
	});

	return allUsersAndUserAccounts;
};

const userExists = async (
	driftClient: DriftClient,
	userId: number,
	authority: PublicKey
) => {
	let userAccountExists = false;

	try {
		const user = driftClient.getUser(userId, authority);
		userAccountExists = await user.exists();
	} catch (e) {
		// user account does not exist so we leave userAccountExists false
	}

	return userAccountExists;
};

export { fetchCurrentSubaccounts, fetchUserClientsAndAccounts, userExists };

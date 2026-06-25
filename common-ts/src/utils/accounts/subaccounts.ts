import {
	VelocityClient,
	PublicKey,
	User,
	UserAccount,
} from '@velocity-exchange/sdk';

const fetchCurrentSubaccounts = (
	velocityClient: VelocityClient
): UserAccount[] => {
	return velocityClient
		.getUsers()
		.map((user) => user.getUserAccount())
		.filter((acct): acct is UserAccount => acct !== undefined);
};

const fetchUserClientsAndAccounts = (
	velocityClient: VelocityClient
): { user: User; userAccount: UserAccount }[] => {
	const accounts = fetchCurrentSubaccounts(velocityClient);
	const allUsersAndUserAccounts = accounts.map((acct) => {
		return {
			user: velocityClient.getUser(acct.subAccountId, acct.authority),
			userAccount: acct,
		};
	});

	return allUsersAndUserAccounts;
};

const userExists = async (
	velocityClient: VelocityClient,
	userId: number,
	authority: PublicKey
) => {
	let userAccountExists = false;

	try {
		const user = velocityClient.getUser(userId, authority);
		userAccountExists = await user.exists();
	} catch (e) {
		// user account does not exist so we leave userAccountExists false
	}

	return userAccountExists;
};

export { fetchCurrentSubaccounts, fetchUserClientsAndAccounts, userExists };

import { PublicKey } from '@drift-labs/sdk';
import { AccountInfo, Connection } from '@solana/web3.js';
import { chunks } from '../core/arrays';

const getMultipleAccounts = async (
	connection: any,
	keys: string[],
	commitment: string
) => {
	const result = await Promise.all(
		chunks(keys, 99).map((chunk) =>
			getMultipleAccountsCore(connection, chunk, commitment)
		)
	);

	const array = result
		.map(
			(a) =>
				a.array
					.map((acc) => {
						if (!acc) {
							return undefined;
						}

						const { data, ...rest } = acc;
						const obj = {
							...rest,
							data: Buffer.from(data[0], 'base64'),
						} as AccountInfo<Buffer>;
						return obj;
					})
					.filter((_) => _) as AccountInfo<Buffer>[]
		)
		.flat();
	return { keys, array };
};

const getMultipleAccountsCore = async (
	connection: any,
	keys: string[],
	commitment: string
) => {
	const args = connection._buildArgs([keys], commitment, 'base64');

	const unsafeRes = await connection._rpcRequest('getMultipleAccounts', args);
	if (unsafeRes.error) {
		throw new Error(
			'failed to get info about account ' + unsafeRes.error.message
		);
	}

	if (unsafeRes.result.value) {
		const array = unsafeRes.result.value as AccountInfo<string[]>[];
		return { keys, array };
	}

	// TODO: fix
	throw new Error();
};

const getMultipleAccountsInfoChunked = async (
	connection: Connection,
	accounts: PublicKey[]
): Promise<(AccountInfo<Buffer> | null)[]> => {
	const accountChunks = chunks(accounts, 100); // 100 is limit for getMultipleAccountsInfo
	const responses = await Promise.all(
		accountChunks.map((chunk) => connection.getMultipleAccountsInfo(chunk))
	);
	return responses.flat();
};

export {
	getMultipleAccounts,
	getMultipleAccountsCore,
	getMultipleAccountsInfoChunked,
};

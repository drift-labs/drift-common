import { MarketType, PublicKey } from '@drift-labs/sdk';
import { getCachedUiString } from '../core/cache';
import { ENUM_UTILS } from '../enum';

/**
 * Get a unique key for an authority's subaccount
 * @param userId
 * @param authority
 * @returns
 */
const getUserKey = (userId: number, authority: PublicKey) => {
	if (userId == undefined || !authority) return '';
	return getCachedUiString('userKey', userId, authority.toString());
};

/**
 * Get the authority and subAccountId from a user's account key
 * @param key
 * @returns
 */
const getIdAndAuthorityFromKey = (
	key: string
):
	| { userId: number; userAuthority: PublicKey }
	| { userId: undefined; userAuthority: undefined } => {
	const splitKey = key?.split('_');

	if (!splitKey || splitKey.length !== 2)
		return { userId: undefined, userAuthority: undefined };

	return {
		userId: Number(splitKey[0]),
		userAuthority: new PublicKey(splitKey[1]),
	};
};

const getMarketKey = (marketIndex: number, marketType: MarketType) =>
	getCachedUiString('marketKey', ENUM_UTILS.toStr(marketType), marketIndex);

export { getUserKey, getIdAndAuthorityFromKey, getMarketKey };

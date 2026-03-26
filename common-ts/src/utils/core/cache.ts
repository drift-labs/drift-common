// Cache for common UI string patterns to reduce memory allocation
const uiStringCache = new Map<string, string>();
const MAX_UI_STRING_CACHE_SIZE = 2000;

// Helper function to cache common string patterns
export function getCachedUiString(
	pattern: string,
	...values: (string | number)[]
): string {
	const cacheKey = `${pattern}:${values.join(':')}`;

	if (uiStringCache.has(cacheKey)) {
		return uiStringCache.get(cacheKey)!;
	}

	let result: string;
	switch (pattern) {
		case 'abbreviate': {
			const [authString, length] = values as [string, number];
			result = `${authString.slice(0, length)}\u2026${authString.slice(
				-length
			)}`;
			break;
		}
		case 'userKey': {
			const [userId, authority] = values as [number, string];
			result = `${userId}_${authority}`;
			break;
		}
		case 'marketKey': {
			const [marketType, marketIndex] = values as [string, number];
			result = `${marketType}_${marketIndex}`;
			break;
		}
		default:
			result = values.join('_');
	}

	// Cache if not too large
	if (uiStringCache.size < MAX_UI_STRING_CACHE_SIZE) {
		uiStringCache.set(cacheKey, result);
	}

	return result;
}

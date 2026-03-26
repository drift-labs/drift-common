export const encodeQueryParams = (
	params: Record<string, string | undefined>
): string => {
	return Object.entries(params)
		.filter(([_, value]) => value !== undefined)
		.map(
			([key, value]) =>
				`${encodeURIComponent(key)}=${encodeURIComponent(value!)}`
		)
		.join('&');
};

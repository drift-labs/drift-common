/**
 * Error thrown when a method is called while the user is geographically blocked.
 */
export class GeoBlockError extends Error {
	constructor(methodName: string) {
		super(
			`Method '${methodName}' is not available due to geographical restrictions.`
		);
		this.name = 'GeoBlockError';
	}
}

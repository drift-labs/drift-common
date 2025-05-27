/**
 * Utility class which makes sure that all results with a slot are only accepted if the slot is higher than the previous result
 */
export class SlotBasedResultValidator {
	private resultIncrements = new Map<string, number>();
	private allowUndefined: boolean;

	constructor(allowUndefined = true) {
		this.allowUndefined = allowUndefined;
	}

	handleResult(key: string, slot: number | undefined) {
		if (slot === undefined) {
			return this.allowUndefined;
		}

		const previous = this.resultIncrements.get(key);

		if (!previous || slot >= previous) {
			this.resultIncrements.set(key, slot);
			return true;
		} else {
			return false;
		}
	}
}

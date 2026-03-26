export class Ref<T> {
	public val: T;

	constructor(val: T) {
		this.val = val;
	}

	set(val: T) {
		this.val = val;
	}

	get() {
		return this.val;
	}
}

export class Counter {
	private val = 0;

	get() {
		return this.val;
	}

	increment(value = 1) {
		this.val += value;
	}

	reset() {
		this.val = 0;
	}
}

/**
 * A class which allows a group of switches to seperately turn a multiswitch on or off. The base state is the state of the "multiswitch" when all of the constituent switches are off. When any of the switches are "on" then the multiswitch flips to the opposite state
 *
 * If baseState is on  => any switch being "on" will turn the multiswitch off.
 * If baseState is off => any switch being "off" will turn the multiswitch off.
 */
export class MultiSwitch {
	private switches: string[] = [];
	private switchValue = 0;

	constructor(private baseState: 'on' | 'off' = 'off') {}

	private getSwitchKey(key: string) {
		// If first time using switch, add to list of switches
		if (!this.switches.includes(key)) {
			this.switches.push(key);
		}

		const switchIndex = this.switches.indexOf(key);

		return 2 ** switchIndex;
	}

	public switchOn(key: string) {
		if (this.baseState === 'on') {
			this._switchOff(key);
			return;
		}
		this._switchOn(key);
	}

	public switchOff(key: string) {
		if (this.baseState === 'on') {
			this._switchOn(key);
			return;
		}
		this._switchOff(key);
	}

	private _switchOff(key: string) {
		const switchKey = this.getSwitchKey(key);

		this.switchValue &= ~switchKey;
	}

	private _switchOn(key: string) {
		const switchKey = this.getSwitchKey(key);

		this.switchValue |= switchKey;
	}

	public get isOn() {
		// When the base state is on, then if any switch is on the multi-switch is off
		if (this.baseState === 'on') {
			return this.switchValue === 0;
		}

		if (this.baseState === 'off') {
			return this.switchValue > 0;
		}
	}
}

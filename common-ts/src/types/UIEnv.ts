import { DriftEnv } from '@drift-labs/sdk';
import { Opaque } from './utility';

// Define UIEnvKey as an opaque type
export type UIEnvKey = Opaque<'UIEnvKey', string>;

/**
 * Utility class to handle environment configs in the Drift UI. Note that these environments don't exactly align with the SDK environment (SDK can only be mainnet or devnet, but UI can be devnet, staging, mainnet) so there is a `sdkEnv` getter utility to convert the UI env to SDK env (UI staging => SDK mainnet).
 */
export class UIEnv {
	constructor(readonly env: DriftEnv | 'staging') {}

	static createMainnet() {
		return new UIEnv('mainnet-beta');
	}

	static createDevnet() {
		return new UIEnv('devnet');
	}

	static createStaging() {
		return new UIEnv('staging');
	}

	static getUIEnvIdFromKey(key: UIEnvKey) {
		return new UIEnv(key as DriftEnv | 'staging');
	}

	get isMainnet() {
		return this.env === 'mainnet-beta';
	}

	get isDevnet() {
		return this.env === 'devnet';
	}

	get isStaging() {
		return this.env === 'staging';
	}

	/**
	 * Returns the SDK environment type. Note that 'staging' maps to 'mainnet' for SDK purposes.
	 */
	get sdkEnv(): DriftEnv {
		return this.isStaging ? ('mainnet' as DriftEnv) : (this.env as DriftEnv);
	}

	/**
	 * Returns a unique string that can be used as a key in a map.
	 */
	get key() {
		return this.env as UIEnvKey;
	}

	equals(other: UIEnv) {
		return this.env === other.env;
	}
}

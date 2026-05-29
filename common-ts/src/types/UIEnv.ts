import { VelocityEnv } from '@velocity-exchange/sdk';
import { Opaque } from './utility';

// Define UIEnvKey as an opaque type
export type UIEnvKey = Opaque<'UIEnvKey', string>;

/**
 * Utility class to handle environment configs in the Velocity UI. Note that these environments don't exactly align with the SDK environment (SDK can only be mainnet or devnet, but UI can be devnet, staging, mainnet) so there is a `sdkEnv` getter utility to convert the UI env to SDK env (UI staging => SDK mainnet).
 */
export class UIEnv {
	constructor(readonly env: VelocityEnv | 'staging') {}

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
		return new UIEnv(key as VelocityEnv | 'staging');
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
	 * Returns the SDK environment type. Note that 'staging' maps to 'mainnet-beta' for SDK purposes.
	 */
	get sdkEnv(): VelocityEnv {
		return this.isStaging ? 'mainnet-beta' : (this.env as VelocityEnv);
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

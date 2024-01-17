import { Draft, produce } from 'immer';

export declare type TransformerFunction<S> = (draft: Draft<S>) => {
	transformationWasApplied: boolean;
};

type VersionedSettings = Record<string, unknown> & {
	version?: number;
};

export enum SettingHandlerType {
	Additive = 'additive',
	Subtractive = 'subtractive',
	Transformative = 'transformative',
}

export type SettingsVersionRule<T = VersionedSettings> = {
	minVersionDiscriminator: number;
	setting: keyof T;
	handler: TransformerFunction<T>;
	type: SettingHandlerType;
	longChangeDescription: string;
	shortChangeDescription: string;
};

/**
 *
 * @param minVersionDiscriminator
 * @param setting
 * @param handler
 * @param type
 * @param longChangeDescription : This description will be returned if this was the ONLY transformation rule that needed to apply. E.g. : "Priority fee upgrades were recently release, and your priority fee settings were recently reset to defaults."
 * @param shortChangeDescription : This description will be returned if this was one of many transformation rules that needed to apply, they will be presented in a list. E.g. : "Your priority fee settings were recently reset to defaults." => "The following settings were changed to support new features : 'Your priority fee settings were recently reset to defaults.',  '{something else}', etc.""
 * @returns
 */
export const VersionedSettingsRuleFactory = <T = VersionedSettings>(
	minVersionDiscriminator: number,
	setting: keyof T,
	handler: TransformerFunction<T>,
	type: SettingHandlerType,
	longChangeDescription: string,
	shortChangeDescription: string
): SettingsVersionRule<T> => ({
	minVersionDiscriminator,
	setting,
	handler,
	type,
	longChangeDescription,
	shortChangeDescription
});

export type VersionedSettingsRules<T extends VersionedSettings> =
	SettingsVersionRule<T>[];

/**
 * The versioned settings handler ensures that old settings can be upgraded into newer versioned settings. It reports back on any changes if they were applied.
 */
export class VersionedSettingsHandler<T extends VersionedSettings> {
	private rules: VersionedSettingsRules<T>;

	/**
	 * Applies each of the handlers in order, depending on the version of the incoming settings.
	 *
	 * Returns the new settings, with a list of change descriptions and an updated version number.
	 * @param settings
	 */
	apply(settings: T) {
		const sortedRules = this.rules.sort(
			(a, b) => a.minVersionDiscriminator - b.minVersionDiscriminator
		);

		const rulesToApply = sortedRules.filter((rule) => {
			if (!settings[rule.setting] || !settings.version) {
				return true;
			}
			return rule.minVersionDiscriminator > settings?.version;
		});

		const maxVersion = Math.max(
			...sortedRules.map((rule) => rule.minVersionDiscriminator),
			settings.version ?? -1
		);

		const newSettings = { current: settings };

		let transformationWasApplied = false;

		rulesToApply.forEach((rule) => {
			newSettings.current = produce(newSettings.current, (draft) => {
				const { transformationWasApplied: transFormApplied } =
					rule.handler(draft);

				if (transFormApplied) {
					transformationWasApplied = true;
				}
			});
		});

		newSettings.current = produce(newSettings.current, (draft) => {
			draft.version = maxVersion;
		});

		let transformationDescription = '';

		if (rulesToApply.length === 1) {
			transformationDescription = rulesToApply[0].longChangeDescription;
		}

		if (rulesToApply.length > 1) {
			transformationDescription = `The following settings were changed to support new features : ${rulesToApply
				.map((rule) => rule.shortChangeDescription)
				.join(', ')}`;
		}

		return {
			transformationWasApplied,
			transformedSettings: newSettings.current,
			transformationDescription,
		};
	}

	constructor(rules: VersionedSettingsRules<T>) {
		this.rules = rules;
	}
}

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
	changeDescription?: string;
};

export const VersionedSettingsRuleFactory = <T = VersionedSettings>(
	minVersionDiscriminator: number,
	setting: keyof T,
	handler: TransformerFunction<T>,
	type: SettingHandlerType,
	changeDescription?: string
): SettingsVersionRule<T> => ({
	minVersionDiscriminator,
	setting,
	handler,
	type,
	changeDescription,
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

		const transformationDescriptions = rulesToApply
			.map((rule) => rule.changeDescription)
			.filter((desc) => !!desc);

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

		return {
			transformationWasApplied,
			transformedSettings: newSettings.current,
			transformationDescriptions,
		};
	}

	constructor(rules: VersionedSettingsRules<T>) {
		this.rules = rules;
	}
}

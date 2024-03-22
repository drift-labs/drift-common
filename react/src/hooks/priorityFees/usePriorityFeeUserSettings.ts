import { useLocalStorage } from 'react-use';
import { FeeType } from '../../stores';
import { singletonHook } from 'react-singleton-hook';

type UserPriorityFeeSettings = {
	userPriorityFeeType: FeeType;
	userCustomMaxPriorityFeeCap: number;
	userCustomPriorityFee: number | null;
};

const DEFAULT_SETTING: UserPriorityFeeSettings = {
	userPriorityFeeType: 'dynamic',
	userCustomMaxPriorityFeeCap: 0.01,
	userCustomPriorityFee: null,
};

export const usePriorityFeeUserSettings = singletonHook(
	{ priorityFeeSettings: DEFAULT_SETTING, setPriorityFeeSettings: () => {} },
	() => {
		const [priorityFeeSettings, setPriorityFeeSettings] =
			useLocalStorage<UserPriorityFeeSettings>(
				'priorityFeeSettings',
				DEFAULT_SETTING
			);

		return {
			priorityFeeSettings: priorityFeeSettings ?? DEFAULT_SETTING,
			setPriorityFeeSettings,
		};
	}
);

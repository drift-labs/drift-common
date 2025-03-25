import { FeeType } from '../../stores';
import { useSyncLocalStorage } from '../useSyncLocalStorage';

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

export const usePriorityFeeUserSettings = () => {
		const [priorityFeeSettings, setPriorityFeeSettings] =
			useSyncLocalStorage<UserPriorityFeeSettings>(
				'priorityFeeSettings',
				DEFAULT_SETTING
			);

		return {
			priorityFeeSettings: priorityFeeSettings ?? DEFAULT_SETTING,
			setPriorityFeeSettings,
		};
	}
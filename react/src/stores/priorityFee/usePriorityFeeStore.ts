import { create } from 'zustand';
import { produce } from 'immer';
import { devtools } from 'zustand/middleware';

export type FeeType = 'custom' | 'dynamic' | 'boosted' | 'turbo';

export type PriorityFeeStore = {
	set: (x: (s: PriorityFeeStore) => void) => void;
	get: () => PriorityFeeStore;
	ready: boolean;
	getPriorityFeeToUse: (
		computeUnitsLimit?: number,
		feeTypeOverride?: FeeType
	) => {
		priorityFeeInSol: number;
		computeUnitsPrice: number;
	};
};

/**
 * To use this store, you need to first import and call `useSyncPriorityFeeStore` at the top of your components.
 * You may use the hook `usePriorityFeeUserSettings` to fetch and update the user's priority fee settings in local storage.
 * The compute units price to use can be obtained through this store's `getPriorityFeeToUse` function, and should be used 
 * to supplement the transaction params when building and sending a transaction.
 */
export const usePriorityFeeStore = create(
	devtools<PriorityFeeStore>((set, get) => ({
		set: (fn) => set(produce(fn)),
		get: () => get(),
		ready: false,
		getPriorityFeeToUse: () => ({
			priorityFeeInSol: 0,
			computeUnitsPrice: 0,
		}),
	}))
);

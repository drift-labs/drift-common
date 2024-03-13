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

import { create } from 'zustand';
import { produce } from 'immer';
import { devtools } from 'zustand/middleware';

export type PriorityFeeStore = {
	set: (x: (s: PriorityFeeStore) => void) => void;
	get: () => PriorityFeeStore;
	ready: boolean;
	getPriorityFeeToUse: (
		notionalValueOfTx?: number,
		feeTypeOverride?: 'custom' | 'dynamic' | 'boosted' | 'turbo'
	) => number;
};

export const usePriorityFeeStore = create(
	devtools<PriorityFeeStore>((set, get) => ({
		set: (fn) => set(produce(fn)),
		get: () => get(),
		ready: false,
		getPriorityFeeToUse: () => 0,
	}))
);

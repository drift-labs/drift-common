import { useEffect } from 'react';
import { produce } from 'immer';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { useWindowSize } from 'react-use';

type ScreenSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/**
 * Default breakpoints referenced from Tailwind
 */
export const DEFAULT_BREAKPOINTS = {
	xs: 0,
	sm: 640,
	md: 768,
	lg: 1024,
	xl: 1280,
	'2xl': 1536,
};

export interface ScreenSizeStore {
	set: (x: (s: ScreenSizeStore) => void) => void;
	get: (x: any) => ScreenSizeStore;
	screenSize: ScreenSize;
}

export const useScreenSizeStore = create(
	devtools<ScreenSizeStore>((set, get) => ({
		set: (fn) => set(produce(fn)),
		get: () => get(),
		screenSize: 'md',
	}))
);

export type Breakpoints = {
	xs: number;
	sm: number;
	md: number;
	lg: number;
	xl: number;
};

export const useSyncScreenSize = (breakpoints: Breakpoints) => {
	const { width } = useWindowSize();
	const setScreenSizeStore = useScreenSizeStore((state) => state.set);

	const setScreenSize = (screenSize: ScreenSize) => {
		setScreenSizeStore((s) => {
			s.screenSize = screenSize;
		});
	};

	useEffect(() => {
		if (width < breakpoints.sm) {
			setScreenSize('xs');
		} else if (width < breakpoints.md) {
			setScreenSize('sm');
		} else if (width < breakpoints.lg) {
			setScreenSize('md');
		} else if (width < breakpoints.xl) {
			setScreenSize('lg');
		} else {
			setScreenSize('xl');
		}
	}, [width]);
};

export const useIsMobileScreenSize = () => {
	const screenSize = useScreenSizeStore((state) => state.screenSize);
	return screenSize === 'xs' || screenSize === 'sm';
};

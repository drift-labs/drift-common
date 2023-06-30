import React, {
	PropsWithChildren,
	createContext,
	useContext,
	useMemo,
} from 'react';
import { useDriftStore } from '../stores/useDriftStore';
import createDriftActions from '../actions/driftActions';

const ActionsContext = createContext({});

export const ActionsProvider = (props: PropsWithChildren) => {
	const [getAppStore, setAppStore] = useDriftStore((s) => [s.get, s.set]);

	const actions = useMemo(
		() => createDriftActions(getAppStore, setAppStore),
		[getAppStore, setAppStore]
	);

	return (
		<ActionsContext.Provider value={actions}>
			{props.children}
		</ActionsContext.Provider>
	);
};

export const useDriftActions = () => {
	const actions = useContext(ActionsContext);

	return actions as ReturnType<typeof createDriftActions>;
};

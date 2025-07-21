import { useState, useEffect, useCallback } from 'react';

type SetValue<T> = T | ((val: T) => T);

const LOCAL_STORAGE_EVENT_TYPE = 'local-storage';

/**
 * This hook syncs the value of a key in localStorage, across all usage of this hook with the same key.
 */

// If `T` and an initial value is provided, the return value should be `T`.
// This is like `useState<'off' | 'on'>('off')`
// Note, if `T` is not provided, it is inferred from the initial value: e.g. `useState('off')`
export function useSyncLocalStorage<T>(
	key: string,
	initialValue: T
): [T, (value: SetValue<T>) => void];

// When only `T` is provided, return value should be `T | undefined`.
// This is like `useState<'off' | 'on'>()`
export function useSyncLocalStorage<T>(
	key: string
): [T | undefined, (value: SetValue<T | undefined>) => void];

export function useSyncLocalStorage<T>(
	key: string,
	initialValue?: T
): [T | undefined, (value: SetValue<T | undefined>) => void] {
	const storage = typeof window !== 'undefined' ? localStorage : undefined;

	const [storedValue, setStoredValue] = useState<T | undefined>(() => {
		try {
			if (!storage) {
				return initialValue;
			}

			const item = storage.getItem(key);
			if (item != null) {
				return JSON.parse(item) as T;
			}

			if (initialValue != null) {
				storage.setItem(key, JSON.stringify(initialValue));
				return initialValue as T;
			}

			return initialValue;
		} catch (error) {
			console.log(error);
			return initialValue;
		}
	});

	const setValue = useCallback(
		(value: SetValue<T | undefined>) => {
			try {
				if (!storage) {
					return;
				}

				const valueToStore =
					value instanceof Function ? value(storedValue) : value;
				setStoredValue(valueToStore);

				// Store the value in `localStorage` if it's not nullish. Else, remove it.
				if (valueToStore != null) {
					storage.setItem(key, JSON.stringify(valueToStore));
				} else {
					storage.removeItem(key);
				}

				window.dispatchEvent(new Event(LOCAL_STORAGE_EVENT_TYPE));
			} catch (error) {
				console.log(error);
			}
		},
		[storedValue, storage]
	);

	const resetValue = useCallback(() => {
		if (initialValue != null) {
			storage?.setItem(key, JSON.stringify(initialValue));
		}

		setStoredValue(initialValue);
	}, [initialValue, key, storage]);

	useEffect(() => {
		const handleStorageChange = () => {
			try {
				if (!storage) {
					return;
				}

				const newValue = JSON.parse(storage.getItem(key) as string) as T;

				// If the item has been removed, reset to the initial value. Note, if the
				// initial value isn't nullish, the item will be added back to `localStorage`.
				if (newValue == null) {
					resetValue();
					return;
				}

				setStoredValue(newValue);
			} catch (error) {
				console.log(error);
			}
		};

		window.addEventListener(LOCAL_STORAGE_EVENT_TYPE, handleStorageChange);

		return () => {
			window.removeEventListener(LOCAL_STORAGE_EVENT_TYPE, handleStorageChange);
		};
	}, [key, storedValue, storage]);

	return [storedValue, setValue];
}

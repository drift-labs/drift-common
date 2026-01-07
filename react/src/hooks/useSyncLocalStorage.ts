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
				return parseValueFromStorage<T>(item);
			}

			if (initialValue != null) {
				storage.setItem(key, getValueToStore(initialValue));
				return initialValue as T;
			}

			return initialValue;
		} catch (error) {
			console.log('error in useSyncLocalStorage on key ', key, error);
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
					storage.setItem(key, getValueToStore(valueToStore));
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

	useEffect(() => {
		const handleStorageChange = () => {
			try {
				if (!storage) {
					return;
				}

				const newValue = storage.getItem(key);

				if (newValue == null) {
					setStoredValue(newValue as T | undefined);
					return;
				}

				setStoredValue(parseValueFromStorage<T>(newValue));
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

function getValueToStore<T>(value: T) {
	// Don't run `stringify` over strings as it will add extra quotes around them.
	if (typeof value === 'string') {
		return value;
	}

	return JSON.stringify(value);
}

function parseValueFromStorage<T>(value: string) {
	// If the value is already a string, `parse` can throw, so just return the value.
	try {
		return JSON.parse(value) as T;
	} catch (_e) {
		return value as T;
	}
}

import { useState, useEffect, useCallback } from 'react';

type SetValue<T> = T | ((val: T) => T);

const LOCAL_STORAGE_EVENT_TYPE = 'local-storage';

/**
 * This hook syncs the value of a key in localStorage, across all usage of this hook with the same key.
 *
 * @template T - The type of the value stored in localStorage.
 * @param {string} key - The key used to store the value in localStorage.
 * @param {T} initialValue - The initial value to be stored in localStorage if the key does not exist.
 * @returns {[T, (value: SetValue<T>) => void]} - An array containing the stored value and a function to update the value.
 */
export function useSyncLocalStorage<T>(
	key: string,
	initialValue: T
): [T, (value: SetValue<T>) => void] {
	// Function to safely access localStorage
	const safeLocalStorage = () => {
		if (typeof window !== 'undefined') {
			return window.localStorage;
		}
		return undefined; // or a mock localStorage object, if needed
	};

	const [storedValue, setStoredValue] = useState<T>(() => {
		try {
			const storage = safeLocalStorage();
			if (!storage) return initialValue;
			const item = storage.getItem(key);
			return item ? (JSON.parse(item) as T) : initialValue;
		} catch (error) {
			console.log(error);
			return initialValue;
		}
	});

	const setValue = useCallback(
		(value: SetValue<T>) => {
			try {
				const storage = safeLocalStorage();
				if (!storage) return;

				const valueToStore =
					value instanceof Function ? value(storedValue) : value;
				setStoredValue(valueToStore);
				storage.setItem(key, JSON.stringify(valueToStore));
				if (typeof window !== 'undefined') {
					window.dispatchEvent(new Event(LOCAL_STORAGE_EVENT_TYPE));
				}
			} catch (error) {
				console.log(error);
			}
		},
		[storedValue]
	);

	useEffect(() => {
		const handleStorageChange = () => {
			try {
				const storage = safeLocalStorage();
				if (!storage) return;

				const newValue = JSON.parse(storage.getItem(key) as string) as T;
				if (newValue !== storedValue) {
					setStoredValue(newValue);
				}
			} catch (error) {
				console.log(error);
			}
		};

		if (typeof window !== 'undefined') {
			window.addEventListener(LOCAL_STORAGE_EVENT_TYPE, handleStorageChange);
			return () => {
				window.removeEventListener(
					LOCAL_STORAGE_EVENT_TYPE,
					handleStorageChange
				);
			};
		}
	}, [key, storedValue]);

	return [storedValue, setValue];
}

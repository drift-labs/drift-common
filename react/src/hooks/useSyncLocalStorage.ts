import { useState, useEffect } from 'react';

type SetValue<T> = T | ((val: T) => T);

export function useSyncLocalStorage<T>(
	key: string,
	initialValue: T
): [T, (value: SetValue<T>) => void] {
	// Retrieve the initial value from localStorage or use the provided initial value
	const [storedValue, setStoredValue] = useState<T>(() => {
		try {
			const item = window.localStorage.getItem(key);
			return item ? (JSON.parse(item) as T) : initialValue;
		} catch (error) {
			console.log(error);
			return initialValue;
		}
	});

	// A function to set value in localStorage and update local state
	const setValue = (value: SetValue<T>) => {
		try {
			// Allow for value to be a function so we have the same API as useState
			const valueToStore =
				value instanceof Function ? value(storedValue) : value;
			setStoredValue(valueToStore);
			window.localStorage.setItem(key, JSON.stringify(valueToStore));
			window.dispatchEvent(new Event('local-storage'));
		} catch (error) {
			console.log(error);
		}
	};

	// Effect to handle updates from other components or instances
	useEffect(() => {
		const handleStorageChange = () => {
			try {
				const newValue = JSON.parse(
					window.localStorage.getItem(key) as string
				) as T;
				if (newValue !== storedValue) {
					setStoredValue(newValue);
				}
			} catch (error) {
				console.log(error);
			}
		};

		window.addEventListener('local-storage', handleStorageChange);
		return () => {
			window.removeEventListener('local-storage', handleStorageChange);
		};
	}, [key, storedValue]);

	return [storedValue, setValue];
}

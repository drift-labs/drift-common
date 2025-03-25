import { useLocalStorage } from 'react-use';

/**
 * Returns the last timestamp that the user acknowledged the terms, and a function to update the timestamp.
 *
 * Timestamp is stored in local storage.
 */
export const useLastAcknowledgedTerms = () => {
		const [lastAcknowledgedTerms, setLastAcknowledgedTerms] =
			useLocalStorage<number>('lastAcknowledgedTerms', 0, {
				raw: false,
				serializer: JSON.stringify,
				deserializer: JSON.parse,
			});

		const updateLastAcknowledgedTerms = () => {
			setLastAcknowledgedTerms(Date.now());
		};

		return { lastAcknowledgedTerms, updateLastAcknowledgedTerms };
	}

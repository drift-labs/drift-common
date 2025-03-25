import {
	BASE_PRECISION_EXP,
	BigNum,
	calculateInitUserFee,
} from '@drift-labs/sdk';
import { useEffect, useState } from 'react';
import { useCommonDriftStore } from '../stores';
import { useDriftClientIsReady } from './useDriftClientIsReady';
import { NEW_ACCOUNT_BASE_COST } from '@drift/common';

/**
 * Cost of subaccount creation. Includes both base rent, donation (if any), and account creation rent.
 */
export const useAccountCreationCost = () => {
	const driftClient = useCommonDriftStore((s) => s.driftClient.client);
	const driftClientIsReady = useDriftClientIsReady();
	const [loaded, setLoaded] = useState(false);
	const [cost, setCost] = useState(NEW_ACCOUNT_BASE_COST);

	useEffect(() => {
		if (driftClient && driftClientIsReady) {
			const stateAccount = driftClient.getStateAccount();
			const fee = calculateInitUserFee(stateAccount);

			const newCost = NEW_ACCOUNT_BASE_COST.add(
				BigNum.from(fee, BASE_PRECISION_EXP)
			);

			setCost(newCost);
			setLoaded(true);
		}
	}, [driftClient, driftClientIsReady]);

	return {
		accountCreationCost: cost,
		accountCreationCostLoaded: loaded,
	};
};
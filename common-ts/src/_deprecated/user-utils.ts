import { getOpenPositionData } from '../utils/positions/open';
import {
	checkIfUserAccountExists,
	getUserMaxLeverageForMarket,
} from '../utils/positions/user';

/** @deprecated Use direct imports from '@drift-labs/common/utils/positions' */
export const USER_UTILS = {
	getOpenPositionData,
	checkIfUserAccountExists,
	getUserMaxLeverageForMarket,
};

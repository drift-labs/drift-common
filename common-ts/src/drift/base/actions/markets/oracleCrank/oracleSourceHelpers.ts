import { OracleSource } from '@drift-labs/sdk';
import { ENUM_UTILS } from '../../../../../utils';

export const isPythPull = (oracleSource: OracleSource): boolean =>
	ENUM_UTILS.match(OracleSource.PYTH_PULL, oracleSource) ||
	ENUM_UTILS.match(OracleSource.PYTH_1K_PULL, oracleSource) ||
	ENUM_UTILS.match(OracleSource.PYTH_1M_PULL, oracleSource) ||
	ENUM_UTILS.match(OracleSource.PYTH_STABLE_COIN_PULL, oracleSource);

export const isPythLazer = (oracleSource: OracleSource): boolean =>
	ENUM_UTILS.match(OracleSource.PYTH_LAZER, oracleSource) ||
	ENUM_UTILS.match(OracleSource.PYTH_LAZER_1K, oracleSource) ||
	ENUM_UTILS.match(OracleSource.PYTH_LAZER_1M, oracleSource) ||
	ENUM_UTILS.match(OracleSource.PYTH_LAZER_STABLE_COIN, oracleSource);

export const isSwitchboard = (oracleSource: OracleSource): boolean =>
	ENUM_UTILS.match(OracleSource.SWITCHBOARD_ON_DEMAND, oracleSource);

export const isPythOracle = (oracleSource: OracleSource): boolean =>
	ENUM_UTILS.toStr(oracleSource)?.toLowerCase()?.includes('pyth') ?? false;

export const isPullOracle = (oracleSource: OracleSource): boolean =>
	ENUM_UTILS.toStr(oracleSource)?.toLowerCase()?.includes('pull') ||
	ENUM_UTILS.toStr(oracleSource)?.toLowerCase()?.includes('lazer');

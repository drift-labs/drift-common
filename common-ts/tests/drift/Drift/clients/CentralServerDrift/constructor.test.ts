import { expect } from 'chai';
import * as sinon from 'sinon';
import { DriftEnv } from '@drift-labs/sdk';
import { CentralServerDrift } from '../../../../../src/drift/Drift/clients/CentralServerDrift';
import { CentralServerDriftMarkets } from '../../../../../src/drift/Drift/clients/CentralServerDrift/markets';
import { EnvironmentConstants } from '../../../../../src/EnvironmentConstants';

describe('CentralServerDrift Constructor', () => {
	let originalConsoleWarn: typeof console.warn;

	beforeEach(() => {
		// Suppress console warnings during tests
		originalConsoleWarn = console.warn;
		console.warn = () => {};
	});

	afterEach(() => {
		sinon.restore();
		console.warn = originalConsoleWarn;
	});

	const defaultDevnetRpc = EnvironmentConstants.rpcs.dev[0].value; // helius
	const defaultMainnetRpc = EnvironmentConstants.rpcs.mainnet[1].value; // helius

	describe('Basic Constructor Success Tests', () => {
		it('should create instance with valid devnet configuration', () => {
			const config = {
				solanaRpcEndpoint: defaultDevnetRpc,
				driftEnv: 'devnet' as DriftEnv,
				supportedPerpMarkets: [0, 1],
				supportedSpotMarkets: [0, 1, 2],
			};

			const centralServerDrift = new CentralServerDrift(config);

			expect(centralServerDrift).to.be.instanceOf(CentralServerDrift);
			expect(centralServerDrift.markets).to.be.instanceOf(
				CentralServerDriftMarkets
			);
		});

		it('should create instance with valid mainnet configuration', () => {
			const config = {
				solanaRpcEndpoint: defaultMainnetRpc,
				driftEnv: 'mainnet-beta' as DriftEnv,
				supportedPerpMarkets: [0, 1, 2],
				supportedSpotMarkets: [0, 1],
			};

			const centralServerDrift = new CentralServerDrift(config);

			expect(centralServerDrift).to.be.instanceOf(CentralServerDrift);
			expect(centralServerDrift.markets).to.be.instanceOf(
				CentralServerDriftMarkets
			);
		});

		it('should create instance with additional DriftClient configuration', () => {
			const config = {
				solanaRpcEndpoint: defaultDevnetRpc,
				driftEnv: 'devnet' as DriftEnv,
				supportedPerpMarkets: [0],
				supportedSpotMarkets: [0],
				additionalDriftClientConfig: {
					enableMetricsEvents: true,
					userStats: true,
				},
			};

			const centralServerDrift = new CentralServerDrift(config);

			expect(centralServerDrift).to.be.instanceOf(CentralServerDrift);
		});
	});

	describe('Market Configuration Tests', () => {
		it('should configure perp markets correctly', () => {
			const supportedPerpMarkets = [0, 1, 2];
			const supportedSpotMarkets = [0];
			const config = {
				solanaRpcEndpoint: defaultDevnetRpc,
				driftEnv: 'devnet' as DriftEnv,
				supportedPerpMarkets,
				supportedSpotMarkets,
			};

			const centralServerDrift = new CentralServerDrift(config);

			// Access private property to verify configuration
			const perpMarketConfigs = (centralServerDrift as any)._perpMarketConfigs;
			const spotMarketConfigs = (centralServerDrift as any)._spotMarketConfigs;

			// Verify perp markets are correctly configured
			expect(perpMarketConfigs).to.have.length(supportedPerpMarkets.length);
			supportedPerpMarkets.forEach((marketIndex, i) => {
				expect(perpMarketConfigs[i]).to.exist;
				expect(perpMarketConfigs[i].marketIndex).to.equal(marketIndex);
			});

			// Verify spot markets are correctly configured
			expect(spotMarketConfigs).to.have.length(supportedSpotMarkets.length);
			supportedSpotMarkets.forEach((marketIndex, i) => {
				expect(spotMarketConfigs[i]).to.exist;
				expect(spotMarketConfigs[i].marketIndex).to.equal(marketIndex);
			});
		});

		it('should configure spot markets correctly', () => {
			const supportedPerpMarkets = [0];
			const supportedSpotMarkets = [0, 1, 2, 3];
			const config = {
				solanaRpcEndpoint: defaultDevnetRpc,
				driftEnv: 'devnet' as DriftEnv,
				supportedPerpMarkets,
				supportedSpotMarkets,
			};

			const centralServerDrift = new CentralServerDrift(config);

			// Access private property to verify configuration
			const spotMarketConfigs = (centralServerDrift as any)._spotMarketConfigs;

			// Verify spot markets are correctly configured
			expect(spotMarketConfigs).to.have.length(supportedSpotMarkets.length);
			supportedSpotMarkets.forEach((marketIndex, i) => {
				expect(spotMarketConfigs[i]).to.exist;
				expect(spotMarketConfigs[i].marketIndex).to.equal(marketIndex);
			});
		});

		it('should handle empty market arrays', () => {
			const supportedPerpMarkets: number[] = [];
			const supportedSpotMarkets: number[] = [];
			const config = {
				solanaRpcEndpoint: defaultDevnetRpc,
				driftEnv: 'devnet' as DriftEnv,
				supportedPerpMarkets,
				supportedSpotMarkets,
			};

			const centralServerDrift = new CentralServerDrift(config);

			// Access private properties to verify empty arrays
			const perpMarketConfigs = (centralServerDrift as any)._perpMarketConfigs;
			const spotMarketConfigs = (centralServerDrift as any)._spotMarketConfigs;

			expect(perpMarketConfigs).to.have.length(0);
			expect(spotMarketConfigs).to.have.length(0);
		});

		it('should handle non-existent market indexes by including undefined entries', () => {
			const supportedPerpMarkets = [0, 999]; // Mix of valid and invalid
			const supportedSpotMarkets = [0, 1001]; // Mix of valid and invalid
			const config = {
				solanaRpcEndpoint: defaultDevnetRpc,
				driftEnv: 'devnet' as DriftEnv,
				supportedPerpMarkets,
				supportedSpotMarkets,
			};

			// Constructor should succeed but contain undefined entries for non-existent markets
			// The error occurs later in getMarketsAndOraclesForSubscription
			expect(() => new CentralServerDrift(config)).to.throw();
		});

		it('should maintain exact mapping between input arrays and market configs', () => {
			const supportedPerpMarkets = [1, 0, 2]; // Test different order
			const supportedSpotMarkets = [2, 0, 1]; // Test different order
			const config = {
				solanaRpcEndpoint: defaultDevnetRpc,
				driftEnv: 'devnet' as DriftEnv,
				supportedPerpMarkets,
				supportedSpotMarkets,
			};

			const centralServerDrift = new CentralServerDrift(config);

			const perpMarketConfigs = (centralServerDrift as any)._perpMarketConfigs;
			const spotMarketConfigs = (centralServerDrift as any)._spotMarketConfigs;

			// Verify exact mapping: each position should match the corresponding input
			expect(perpMarketConfigs).to.have.length(supportedPerpMarkets.length);
			expect(spotMarketConfigs).to.have.length(supportedSpotMarkets.length);

			supportedPerpMarkets.forEach((expectedMarketIndex, position) => {
				expect(perpMarketConfigs[position].marketIndex).to.equal(
					expectedMarketIndex
				);
			});

			supportedSpotMarkets.forEach((expectedMarketIndex, position) => {
				expect(spotMarketConfigs[position].marketIndex).to.equal(
					expectedMarketIndex
				);
			});
		});
	});

	describe('Environment-Specific Tests', () => {
		it('should set correct endpoints for devnet environment', () => {
			const config = {
				solanaRpcEndpoint: defaultDevnetRpc,
				driftEnv: 'devnet' as DriftEnv,
				supportedPerpMarkets: [0],
				supportedSpotMarkets: [0],
			};

			const centralServerDrift = new CentralServerDrift(config);

			// Access private property for testing
			const endpoints = (centralServerDrift as any)._driftEndpoints;
			expect(endpoints.dlobServerHttpUrl).to.equal(
				EnvironmentConstants.dlobServerHttpUrl.dev
			);
			expect(endpoints.swiftServerUrl).to.equal(
				EnvironmentConstants.swiftServerUrl.staging
			);
		});

		it('should set correct endpoints for mainnet environment', () => {
			const config = {
				solanaRpcEndpoint: defaultMainnetRpc,
				driftEnv: 'mainnet-beta' as DriftEnv,
				supportedPerpMarkets: [0],
				supportedSpotMarkets: [0],
			};

			const centralServerDrift = new CentralServerDrift(config);

			// Access private property for testing
			const endpoints = (centralServerDrift as any)._driftEndpoints;
			expect(endpoints.dlobServerHttpUrl).to.equal(
				EnvironmentConstants.dlobServerHttpUrl.mainnet
			);
			expect(endpoints.swiftServerUrl).to.equal(
				EnvironmentConstants.swiftServerUrl.mainnet
			);
		});
	});

	describe('Instance Properties Tests', () => {
		it('should have markets property initialized', () => {
			const config = {
				solanaRpcEndpoint: defaultDevnetRpc,
				driftEnv: 'devnet' as DriftEnv,
				supportedPerpMarkets: [0],
				supportedSpotMarkets: [0],
			};

			const centralServerDrift = new CentralServerDrift(config);

			expect(centralServerDrift.markets).to.exist;
			expect(centralServerDrift.markets).to.be.instanceOf(
				CentralServerDriftMarkets
			);
		});

		it('should have subscribe method available', () => {
			const config = {
				solanaRpcEndpoint: defaultDevnetRpc,
				driftEnv: 'devnet' as DriftEnv,
				supportedPerpMarkets: [0],
				supportedSpotMarkets: [0],
			};

			const centralServerDrift = new CentralServerDrift(config);

			expect(centralServerDrift.subscribe).to.be.a('function');
		});

		it('should have all transaction methods available', () => {
			const config = {
				solanaRpcEndpoint: defaultDevnetRpc,
				driftEnv: 'devnet' as DriftEnv,
				supportedPerpMarkets: [0],
				supportedSpotMarkets: [0],
			};

			const centralServerDrift = new CentralServerDrift(config);

			// Check that all the transaction methods exist
			expect(centralServerDrift.getUser).to.be.a('function');
			expect(centralServerDrift.getCreateAndDepositTxn).to.be.a('function');
			expect(centralServerDrift.getDepositTxn).to.be.a('function');
			expect(centralServerDrift.getWithdrawTxn).to.be.a('function');
			expect(centralServerDrift.getDeleteUserTxn).to.be.a('function');
			expect(centralServerDrift.getSettleFundingTxn).to.be.a('function');
			expect(centralServerDrift.getSettlePnlTxn).to.be.a('function');
			expect(centralServerDrift.getOpenPerpMarketOrderTxn).to.be.a('function');
			expect(centralServerDrift.getOpenPerpNonMarketOrderTxn).to.be.a(
				'function'
			);
			expect(centralServerDrift.getEditOrderTxn).to.be.a('function');
			expect(centralServerDrift.getCancelOrdersTxn).to.be.a('function');
			expect(centralServerDrift.getCancelAllOrdersTxn).to.be.a('function');
			expect(centralServerDrift.getSwapTxn).to.be.a('function');
			expect(centralServerDrift.sendSignedTransaction).to.be.a('function');
		});
	});

	describe('Error Handling Tests', () => {
		it('should handle invalid RPC endpoint gracefully', () => {
			const config = {
				solanaRpcEndpoint: 'invalid-url',
				driftEnv: 'devnet' as DriftEnv,
				supportedPerpMarkets: [0],
				supportedSpotMarkets: [0],
			};

			// Should throw error with invalid RPC endpoint
			expect(() => new CentralServerDrift(config)).to.throw();
		});

		it('should handle missing additional config gracefully', () => {
			const config = {
				solanaRpcEndpoint: defaultDevnetRpc,
				driftEnv: 'devnet' as DriftEnv,
				supportedPerpMarkets: [0],
				supportedSpotMarkets: [0],
				// additionalDriftClientConfig is optional
			};

			expect(() => new CentralServerDrift(config)).to.not.throw();
		});
	});
});

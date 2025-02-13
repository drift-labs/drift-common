import React, { PropsWithChildren, useEffect, useMemo, useRef } from 'react';
import {
	Adapter,
	SendTransactionOptions,
	WalletAdapter,
	WalletName,
	WalletReadyState,
} from '@solana/wallet-adapter-base';
import {
	WalletContextState,
	WalletProvider,
	useWallet as useDefaultUseWallet,
} from '@solana/wallet-adapter-react';
import { useLocalStorage } from 'react-use';
import { Connection, Transaction, VersionedTransaction } from '@solana/web3.js';
import { useCommonDriftStore } from '../stores';
import { useWallet } from '../hooks/useWalletContext';

const DEFAULT_AUTOCONNECT_DELAY_MS = 4000;
const PREFERRED_WALLET_LOCALSTORAGE_KEY = 'walletName_drift';

const DEFAULT_CONTEXT = {
	autoConnect: false,
	connecting: false,
	connected: false,
	disconnecting: false,
	select(_name: WalletName) {
		console.error('DEFAULT_WALLET_CONTEXT');
	},
	connect() {
		return Promise.reject(console.error('DEFAULT_WALLET_CONTEXT CONNECT()'));
	},
	disconnect() {
		return Promise.reject(console.error('DEFAULT_WALLET_CONTEXT DISCONNECT()'));
	},
	sendTransaction(
		_transaction: VersionedTransaction | Transaction,
		_connection: Connection,
		_options?: SendTransactionOptions
	) {
		return Promise.reject(
			console.error(console.error('DEFAULT_WALLET_CONTEXT SEND_TRANSACTION()'))
		);
	},
	signTransaction(_transaction: Transaction) {
		return Promise.reject(
			console.error(console.error('DEFAULT_WALLET_CONTEXT SIGN_TRANSACTION()'))
		);
	},
	signAllTransactions(_transaction: Transaction[]) {
		return Promise.reject(
			console.error(
				console.error('DEFAULT_WALLET_CONTEXT SIGN_ALL_TRANSACTIONS()')
			)
		);
	},
	signMessage(_message: Uint8Array) {
		return Promise.reject(
			console.error('DEFAULT_WALLET_CONTEXT SIGN_MESSAGE()')
		);
	},
} as WalletContextState;

/*
 * This provider is supposed to handle the custom wallet logic that Drift uses. The primary purpose of this is to get around the weird inconsistencies between wallets and to support the idiosyncrasies in Drift's UIs.
 *
 * The components of the Drift Wallet Provider are:
 * - Pulling in the standard wallet adapter context which makes the wallet adapters available
 * - Custom autoconnect logic
 * - Custom filtering of wallet adapters to make available in the descendant context.
 *  - Main reason for this is because on Saga Chrome Browser it is bug-prone if we make other wallets available outside of the Mobile Wallet Adapter which (should?) always be used in this scenario anyway.
 * @returns
 */

const useHasConnectedWalletBefore = () => {
	const localStorageState = useLocalStorage<boolean>(
		'hasConnectedWalletBefore',
		false,
		{
			raw: false,
			serializer: (value: boolean) => (value ? value.toString() : 'false'),
			deserializer: (value: string) => {
				return value === 'true';
			},
		}
	);

	return localStorageState;
};

const useCustomAutoconnectLogic = (props: {
	enabled: boolean;
	autoconnectionDelay?: number;
}) => {
	const [walletHasConnectedBefore, setWalletHasConnectedBefore] =
		useHasConnectedWalletBefore();
	const walletContext = useWallet();
	const alreadyTriedToAutoconnect = useRef(false);
	const initialTimerHasElapsed = useRef(false);

	useEffect(() => {
		if (!props.enabled) return;

		setTimeout(() => {
			initialTimerHasElapsed.current = true;
		}, props?.autoconnectionDelay ?? DEFAULT_AUTOCONNECT_DELAY_MS);
	}, [props.enabled]);

	useEffect(() => {
		if (initialTimerHasElapsed.current) return;

		// The purpose of this is to prevent trying to connect to a wallet multiple times if the wallet context changes for whatever reason (and it previous only tried when it SHOULD HAVE SUCCEEDED so we don't expect a change).
		if (alreadyTriedToAutoconnect.current) return;

		// NOTE: the localStorage key ('walletName') is defined on the WalletProvider
		const previouslyConnectedWalletName =
			window.localStorage[PREFERRED_WALLET_LOCALSTORAGE_KEY];
		if (!previouslyConnectedWalletName) return;

		if (walletHasConnectedBefore) {
			// Need to clean the wallet name because it gets saved with weird other characters sometimes
			const cleanedPreviousWalletName = previouslyConnectedWalletName.replace(
				/[^a-zA-Z0-9]/g,
				''
			);

			const matchingWallet = walletContext.wallets.find(
				(wallet) => wallet.adapter.name === cleanedPreviousWalletName
			);

			if (
				!matchingWallet ||
				(matchingWallet.readyState !== WalletReadyState.Installed &&
					matchingWallet.readyState !== WalletReadyState.Loadable)
			) {
				return;
			}

			if (matchingWallet) {
				console.log(
					`Attempting Autoconnect : ${matchingWallet?.adapter?.name}`
				);
				alreadyTriedToAutoconnect.current = true;
				walletContext.select(matchingWallet.adapter.name);
				matchingWallet.adapter.connect();
			}
		}
	}, [walletContext, walletHasConnectedBefore]);

	useEffect(() => {
		if (walletContext?.wallet) {
			const connectionHandler = () => {
				console.log(
					`Handling Connection .. wallet name : ${walletContext.wallet?.adapter.name}`
				);
				setWalletHasConnectedBefore(true);
				window.localStorage.setItem(
					PREFERRED_WALLET_LOCALSTORAGE_KEY,
					walletContext.wallet?.adapter.name as string
				);
			};
			walletContext.wallet.adapter.on('connect', connectionHandler);

			const disconnectionHandler = () => {
				console.log(`Handling Disconnection`);
				setWalletHasConnectedBefore(false);
				window.localStorage.removeItem(PREFERRED_WALLET_LOCALSTORAGE_KEY);
			};
			walletContext.wallet.adapter.on('disconnect', disconnectionHandler);

			return () => {
				walletContext.wallet?.adapter.removeListener(
					'connect',
					connectionHandler
				);
				walletContext.wallet?.adapter.removeListener(
					'disconnect',
					disconnectionHandler
				);
			};
		}
	}, [walletContext?.wallet]);
};

const DriftAutoConnectProvider = (
	props: PropsWithChildren<{
		autoConnect: boolean;
		autoconnectionDelay?: number;
		disableAutoconnect?: boolean;
	}>
) => {
	useCustomAutoconnectLogic({
		enabled: props.disableAutoconnect ? false : true,
		autoconnectionDelay: props.autoconnectionDelay,
	});
	return <>{props.children}</>;
};

type WalletProviderProps = {
	wallets?: WalletAdapter[];
	autoConnect?: boolean;
	disableAutoconnect?: boolean;
	autoconnectionDelay?: number;
};

type WalletProviderInnerProps = {
	autoConnect: boolean;
	autoconnectionDelay?: number;
	disableAutoconnect?: boolean;
};

export const DriftWalletContext =
	React.createContext<WalletContextState>(DEFAULT_CONTEXT);

/**
 * We need to make an "inner" provider section because the wallet context gets created in the outer context by the wallet SDK's WalletProvider. This context gets used in the autoconnect logic etc.
 *
 * This inner provider changes the value returned by the default wallet context provider
 * @param props
 * @returns
 */
const WalletProviderInner = (
	props: PropsWithChildren<WalletProviderInnerProps>
) => {
	const walletContextState = useDefaultUseWallet();

	// If the mobile wallet adapter is available then filter out all of the other wallet adapters because it's both bug AND confusion prone when the other wallets get displayed in this situation. This can be updated if the native wallet apps ever get smart enough to deep-link to themselves when the user clicks on them from withing a browser
	const walletsToShow = useMemo(() => {
		const solanaMobileWalletAdapter = walletContextState.wallets.find(
			(wallet) => {
				return wallet.adapter.name === 'Mobile Wallet Adapter';
			}
		);

		if (!solanaMobileWalletAdapter) return walletContextState.wallets;

		if (
			solanaMobileWalletAdapter.readyState === WalletReadyState.Installed ||
			solanaMobileWalletAdapter.readyState === WalletReadyState.Loadable
		) {
			return [solanaMobileWalletAdapter];
		}

		return walletContextState.wallets;
	}, [walletContextState]);

	// Create controlled wallet context
	// const derivedWalletContext = walletContextState;
	const derivedWalletContext = useMemo(() => {
		return {
			...walletContextState,
			wallets: walletsToShow,
		};
	}, [walletsToShow, walletContextState]);

	// Keep the currently connected wallet state in the common store in sync
	const set = useCommonDriftStore((s) => s.set);
	useEffect(() => {
		set((s) => {
			s.currentlyConnectedWalletContext = derivedWalletContext;
		});
	}, [derivedWalletContext]);

	return (
		<DriftWalletContext.Provider value={derivedWalletContext}>
			<DriftAutoConnectProvider
				autoconnectionDelay={props.autoconnectionDelay}
				autoConnect={props.autoConnect}
				disableAutoconnect={props.disableAutoconnect}
			>
				{props.children}
			</DriftAutoConnectProvider>
		</DriftWalletContext.Provider>
	);
};

const DriftWalletProvider = ({
	wallets,
	autoConnect = true,
	disableAutoconnect,
	autoconnectionDelay,
	...props
}: PropsWithChildren<WalletProviderProps>) => {
	const providerWallets = useMemo(() => {
		if (wallets) return wallets;
		return [] as Adapter[];
	}, [wallets]);

	return (
		<>
			<WalletProvider
				wallets={providerWallets}
				autoConnect={false}
				localStorageKey={PREFERRED_WALLET_LOCALSTORAGE_KEY}
			>
				<WalletProviderInner
					disableAutoconnect={disableAutoconnect}
					autoconnectionDelay={autoconnectionDelay}
					autoConnect={autoConnect}
				>
					{props.children}
				</WalletProviderInner>
			</WalletProvider>
		</>
	);
};

export default DriftWalletProvider;

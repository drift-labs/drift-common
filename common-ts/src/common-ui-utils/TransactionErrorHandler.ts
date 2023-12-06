import {
	DriftCompetitionsErrors,
	DriftErrors,
	JupV4Errors,
	JupV6Errors,
	PhantomErrors,
	PrettyError,
	Ref,
} from 'src';

type AnchorError = { code?: number; logs?: string[] } & Error & {
		error: { code: number; message: string };
	};

type NonDriftProgramErrorHandlerConfig = {
	errorsList: {
		[name: string]: {
			code: number;
			name: string;
			msg: string;
		};
	};
	errorToastTitle: string;
};

// todo - build these up as we go
const NON_DRIFT_CODES_INDICATING_TX_VERSION_ISSUE = ['-32603'];
const DRIFT_CODES_INDICATING_TX_VERSION_ISSUE = [];

const NON_DRIFT_PROGRAMS_ERROR_HANDLER_CONFIGS: NonDriftProgramErrorHandlerConfig[] =
	[
		{
			errorsList: JupV4Errors.errorsList,
			errorToastTitle: 'Jupiter Swap Error',
		},
		{
			errorsList: JupV6Errors.errorsList,
			errorToastTitle: 'Jupiter Swap Error',
		},
		{
			errorsList: DriftCompetitionsErrors.errorsList,
			errorToastTitle: 'Drift Competitions Error',
		},
	];

type TransactionHandlerOpts = {
	showErrorLogs?: boolean;
	notifyCallback?: (props: any) => void;
	captureExceptionCallback?: (exception: Error) => void;
	isDev?: boolean;
};

export class TransactionErrorHandler {
	showErrorLogs: boolean;
	notifyCallback?: (prop: any) => void;
	captureExceptionCallback?: (exception: Error) => void;
	isDev?: boolean;

	public constructor(opts: TransactionHandlerOpts) {
		this.showErrorLogs = opts?.showErrorLogs ?? true;
		this.notifyCallback = opts?.notifyCallback;
		this.captureExceptionCallback = opts?.captureExceptionCallback;
		this.isDev = opts?.isDev ?? false;
	}

	handleError({
		error,
		fallbackDescription: fallbackDescription,
		toastId,
	}: {
		error: AnchorError;
		fallbackDescription?: string;
		toastId?: string;
	}) {
		const ERROR_HANDLED = new Ref(false);

		if (this.isDev || this.showErrorLogs) {
			console.error(`TransactionErrorHandler:`);
			console.error(error);
			if (error.logs) {
				console.error(error.logs);
			}
		}

		const indicateTxVersionIssue =
			DRIFT_CODES_INDICATING_TX_VERSION_ISSUE.includes(error.code?.toString());

		const checkNonDriftProgramsErrors = () => {
			if (!error.logs) return;

			const errorLog = error.logs.find((log) =>
				log.includes('AnchorError occurred')
			);

			if (!errorLog) return;

			// example log that we can expect -> Program log: AnchorError occurred. Error Code: SlippageToleranceExceeded. Error Number: 6001. Error Message: Slippage tolerance exceeded.
			const errorCodeMatch = errorLog.match(/Error Code: (\w+)/);
			const errorCode = errorCodeMatch ? errorCodeMatch[1] : undefined;

			if (!errorCode) return;

			const programErrorConfig = NON_DRIFT_PROGRAMS_ERROR_HANDLER_CONFIGS.find(
				(config) => config.errorsList[errorCode]
			);

			const indicateNonDriftTxVersionIssue =
				NON_DRIFT_CODES_INDICATING_TX_VERSION_ISSUE.includes(errorCode);

			if (!programErrorConfig) return;

			this.notifyCallback({
				type: 'error',
				id: toastId,
				updatePrevious: true,
				message: programErrorConfig.errorToastTitle,
				description: `${programErrorConfig.errorsList[errorCode].msg}`,
				indicateTxVersionIssue: indicateNonDriftTxVersionIssue,
			});

			ERROR_HANDLED.set(true);
		};

		try {
			// # Check for Generic Errors
			// -----------------------------------------------------------------------------------------------------------------------------
			(() => {
				// # Blockhash not found case
				if (error?.message?.match(/Blockhash not found/) && true) {
					this.notifyCallback({
						type: 'error',
						description:
							'There was an error sending the transaction. You likely need to refresh or try using another RPC provider available from the settings menu.',
						id: toastId,
						updatePrevious: true,
					});

					ERROR_HANDLED.set(true);

					return;
				}

				// # No SOL found in account
				if (
					error?.message?.match(
						/Attempt to debit an account but found no record of a prior credit/
					) &&
					true
				) {
					this.notifyCallback({
						type: 'error',
						description:
							'You need to have SOL in your wallet to pay for the transaction/account fees.',
						id: toastId,
						updatePrevious: true,
					});

					ERROR_HANDLED.set(true);

					return;
				}

				// # not subscribed case
				if (error.name === 'NotSubscribedError') {
					// check if just on local or not
					if (this.isDev) {
						// this error is known to happen on localhost during hot refreshes etc. .. but shouldn't happen on any other environments
						this.captureExceptionCallback(error);
					}

					this.notifyCallback({
						type: 'error',
						description:
							'Sorry, there was an error performing that transaction, please try again. You may need to try refreshing the page.',
						id: toastId,
						updatePrevious: true,
					});

					ERROR_HANDLED.set(true);

					return;
				}

				// # Insufficient funds case
				if (error?.message?.match(/custom program error: 0x1$/) && true) {
					this.notifyCallback({
						type: 'error',
						description:
							"The wallet didn't have enough balance to complete the transaction",
						id: toastId,
						updatePrevious: true,
					});

					ERROR_HANDLED.set(true);

					return;
				}

				// # User Rejected
				if (error?.message?.match(/User rejected the request/) && true) {
					this.notifyCallback({
						type: 'error',
						description: 'The user rejected the transaction request',
						id: toastId,
						updatePrevious: true,
					});

					ERROR_HANDLED.set(true);

					return;
				}

				// # slow tx case
				if (
					error?.message
						?.toLowerCase()
						?.match(/transaction was not confirmed in .+ seconds/) &&
					true
				) {
					const txSignature = error?.message?.match(
						/Check signature (.+) using/
					)[1];

					this.notifyCallback({
						type: 'warning',
						message: 'Timeout',
						description:
							"Your transaction wasn't confirmed within 30 seconds, but it may still go through. You can use the Solana explorer to check.",
						txid: txSignature,
						id: toastId,
						updatePrevious: true,
						showUntilCancelled: true,
					});

					ERROR_HANDLED.set(true);

					return;
				}
			})();

			if (ERROR_HANDLED.get()) return;
			// # Check for Non-Drift program errors
			// ------------------------------------------------------------------------------------------------------------------------------
			checkNonDriftProgramsErrors();

			if (ERROR_HANDLED.get()) return;
			// # Check for Drift Error
			// -----------------------------------------------------------------------------------------------------------------------------
			(() => {
				let errorCode = error.code;

				if (!errorCode && error?.message) {
					const matches = error.message.match(
						/custom program error: (0x[0-9a-f]+)/
					);
					if (matches && matches[1]) {
						errorCode = parseInt(matches[1], 16);
					}
				}

				const errorName = DriftErrors.errorCodesMap[`${errorCode}`];
				const mappedError: PrettyError = DriftErrors.errorsList[errorName];

				if (mappedError) {
					if (mappedError.toast) {
						this.notifyCallback({
							type: 'error',
							id: toastId,
							updatePrevious: true,
							...mappedError.toast,
							indicateTxVersionIssue,
						});
					} else {
						this.notifyCallback({
							type: 'error',
							id: toastId,
							updatePrevious: true,
							description: `Error Code ${mappedError.code}: ${mappedError.msg}`,
							indicateTxVersionIssue,
						});
					}

					ERROR_HANDLED.set(true);

					return;
				}
			})();

			if (ERROR_HANDLED.get()) return;
			// # Check for Phantom Error
			// -----------------------------------------------------------------------------------------------------------------------------
			(() => {
				const errorCode = error?.error?.code;

				if (errorCode === undefined) return;

				const phantomError = PhantomErrors[errorCode];

				if (!phantomError) return;

				this.notifyCallback({
					type: 'error',
					id: toastId,
					updatePrevious: true,
					message: `Phantom Wallet Error ${errorCode}`,
					description: `${phantomError.name} : ${phantomError.msg}`,
					subDescription: ``,
					url: `https://docs.phantom.app/solana/integrating-phantom/errors`,
					lengthMs: 10 * 1000,
					indicateTxVersionIssue,
				});

				ERROR_HANDLED.set(true);
			})();

			if (ERROR_HANDLED.get()) return;
			// # Unknown Error
			// -----------------------------------------------------------------------------------------------------------------------------
			(() => {
				const errorCode = error.code;

				this.captureExceptionCallback(error);

				const trimmedErrorMessage = error?.message?.replace(
					'failed to send transaction: Transaction simulation failed:',
					''
				);

				this.notifyCallback({
					type: 'error',
					description:
						fallbackDescription ??
						`There was an error processing the transaction : ${trimmedErrorMessage} ${
							errorCode ? `- Error Code ${errorCode}` : ''
						}`,
					lengthMs: 10000,
					id: toastId,
					updatePrevious: true,
					indicateTxVersionIssue,
				});
			})();
		} catch (e) {
			this.captureExceptionCallback(e);

			this.notifyCallback({
				type: 'error',
				description:
					fallbackDescription ??
					`There was an error processing the transaction.`,
				lengthMs: 10000,
				id: toastId,
				updatePrevious: true,
				indicateTxVersionIssue,
			});
		}
	}
}

import { AccountInfo, Connection, PublicKey } from '@solana/web3.js';
import {
	DriftClient,
	MarketType,
	SignedMsgUserOrdersAccount,
	digestSignature,
	isVariant,
} from '@drift-labs/sdk';
import { Observable, Subscriber } from 'rxjs';
import { allEnvDlog } from '../utils/logger';
export type SwiftServerOrderProcessResponse = {
	error?: string;
	message: string;
};

type ClientResponse<T = void> = Promise<{
	success: boolean;
	body?: T;
	message?: string;
	status?: number;
}>;

type SwiftOrderEvent =
	| {
			type: 'sent' | 'expired' | 'errored';
			hash: string;
			message?: string;
	  }
	| {
			type: 'confirmed';
			orderId: string;
			hash: string;
	  };

export class SwiftClient {
	private static baseUrl = '';

	public static init(baseUrl: string) {
		this.baseUrl = baseUrl;
	}

	private static get(url: string) {
		if (!this.baseUrl) {
			throw new Error('SwiftClient not initialized');
		}

		return new Promise<{ success: boolean; body: string; status: number }>(
			(res) => {
				const headers = new Headers();

				fetch(`${this.baseUrl}${url}`, {
					headers,
				})
					.then(async (response) => {
						if (!response.ok) {
							res({
								success: false,
								body: await response.text(),
								status: response.status,
							});
							return;
						}
						res({
							success: true,
							body: await response.text(),
							status: response.status,
						});
					})
					.catch((err) => {
						res({ success: false, body: err, status: 0 });
					});
			}
		);
	}

	private static post(url: string, bodyObject: any) {
		if (!this.baseUrl) {
			throw new Error('SwiftClient not initialized');
		}

		const requestOptions = {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(bodyObject),
		};

		return new Promise<{
			success: boolean;
			body: SwiftServerOrderProcessResponse;
			status: number;
		}>((res) => {
			const postRequest = new Request(`${this.baseUrl}${url}`, requestOptions);

			fetch(postRequest)
				.then(async (response) => {
					let resBody: SwiftServerOrderProcessResponse | null = null;
					try {
						resBody =
							(await response.json()) as SwiftServerOrderProcessResponse;
					} catch (err) {
						allEnvDlog('swiftClient', 'Error reading response body', err);
					}
					res({
						success: response.ok,
						body: resBody,
						status: response.status,
					});
				})
				.catch((err) => {
					res({ success: false, body: err, status: 0 });
				});
		});
	}

	static async sendSwiftOrder(
		marketIndex: number,
		marketType: MarketType,
		message: string,
		signature: Buffer,
		takerPubkey: PublicKey,
		signingAuthority?: PublicKey
	): ClientResponse<{
		hash: string;
	}> {
		const response = await this.post('/orders', {
			market_index: marketIndex,
			market_type: isVariant(marketType, 'perp') ? 'perp' : 'spot',
			message,
			signature: signature.toString('base64'),
			signing_authority: signingAuthority?.toBase58() ?? '',
			taker_pubkey: takerPubkey.toBase58(),
		});

		if (response.status !== 200) {
			console.error(
				`Non-200 status code received for sent Swift order: ${response.status}`
			);
			allEnvDlog('swiftClient', 'full non-200 response body', response.body);
			return {
				message: response.body.message,
				status: response.status,
				success: false,
			};
		}

		return {
			message: `Successfully sent Swift order`,
			body: {
				hash: digestSignature(Uint8Array.from(signature)),
			},
			success: true,
			status: 200,
		};
	}

	static async confirmSwiftOrderWS(
		connection: Connection,
		client: DriftClient,
		signedMsgUserOrdersAccount: PublicKey,
		signedMsgOrderUuid: Uint8Array,
		confirmDuration: number
	): Promise<number | undefined> {
		return new Promise((resolve, reject) => {
			const timeout = setTimeout(() => {
				reject(new Error('Order not found'));
			}, confirmDuration);

			connection
				.getAccountInfo(signedMsgUserOrdersAccount, 'confirmed')
				.then((accountInfo) => {
					const order = this.findOrderInSignedMsgUserOrdersAccount(
						client,
						accountInfo,
						signedMsgOrderUuid
					);

					if (order) {
						allEnvDlog(
							'swiftClient',
							'confirmed in initial fetch orderID\n',
							order.orderId
						);
						clearTimeout(timeout);
						resolve(order.orderId);
					}
				});

			const subId = connection.onAccountChange(
				signedMsgUserOrdersAccount,
				(accountInfo) => {
					const order = this.findOrderInSignedMsgUserOrdersAccount(
						client,
						accountInfo,
						signedMsgOrderUuid
					);
					if (order) {
						allEnvDlog(
							'swiftClient',
							'confirmed in onAccountChange orderID\n',
							order.orderId
						);
						connection.removeAccountChangeListener(subId);
						clearTimeout(timeout);
						resolve(order.orderId);
					}
				},
				'confirmed'
			);
		});
	}

	static findOrderInSignedMsgUserOrdersAccount(
		client: DriftClient,
		ordersAccount: AccountInfo<Buffer>,
		signedMsgOrderUuid: Uint8Array
	) {
		const accountDecoder =
			client.program.account.signedMsgUserOrders.coder.accounts.decodeUnchecked.bind(
				client.program.account.signedMsgUserOrders.coder.accounts
			);
		const decodedAccount = accountDecoder(
			'SignedMsgUserOrders',
			ordersAccount.data
		) as SignedMsgUserOrdersAccount;
		allEnvDlog(
			'swiftClient findOrder',
			'decodedAccount\n',
			decodedAccount,
			signedMsgOrderUuid.toString()
		);
		const order = decodedAccount.signedMsgOrderData.find(
			(order) => order.uuid.toString() === signedMsgOrderUuid.toString()
		);
		allEnvDlog('swiftClient findOrder', 'order\n', order);
		return order;
	}

	static async confirmSwiftOrder(
		hash: string,
		confirmDuration: number
	): Promise<
		ClientResponse<
			| {
					orderId: string;
					status: 'confirmed';
			  }
			| {
					status: 'expired';
			  }
		>
	> {
		const expireTime = Date.now() + confirmDuration;

		while (Date.now() < expireTime) {
			const confirmResponse = await this.get(
				`/confirmation/hash-status?hash=${encodeURIComponent(hash)}`
			);

			if (confirmResponse.status === 200) {
				console.log('Confirmed hash: ', hash);
				return {
					success: true,
					status: 200,
					message: 'Confirmed hash: ' + hash,
					body: {
						orderId: confirmResponse.body,
						status: 'confirmed',
					},
				};
			} else if (
				confirmResponse.status >= 500 ||
				confirmResponse.status < 200
			) {
				break;
			}
			await new Promise((resolve) => setTimeout(resolve, 1000));
		}

		console.error('Failed to confirm hash: ', hash);
		return {
			success: false,
			status: 408,
			message: 'Failed to confirm hash: ' + hash,
			body: {
				status: 'expired',
			},
		};
	}

	static async handleSwiftOrderSubscriber(
		subscriber: Subscriber<SwiftOrderEvent>,
		marketIndex: number,
		marketType: MarketType,
		message: string,
		signature: Buffer,
		takerPubkey: PublicKey,
		confirmDuration: number,
		signingAuthority?: PublicKey
	) {
		// First send the order
		const sendResponse = await this.sendSwiftOrder(
			marketIndex,
			marketType,
			message,
			signature,
			takerPubkey,
			signingAuthority
		);

		if (!sendResponse.success) {
			subscriber.next({
				type: 'errored',
				hash: '',
				message: sendResponse.message,
			});
			return;
		}

		const hash = sendResponse.body.hash;

		// Then confirm it
		const confirmResponse = await this.confirmSwiftOrder(hash, confirmDuration);

		if (!confirmResponse.success) {
			subscriber.next({
				type: confirmResponse.body.status as 'expired',
				hash,
				message: confirmResponse.message,
			});
		}
		if (confirmResponse.body.status === 'confirmed') {
			subscriber.next({
				type: 'confirmed',
				orderId: confirmResponse.body.orderId,
				hash,
			});
		}
	}
	static async handleSwiftOrderSubscriberWS(
		subscriber: Subscriber<SwiftOrderEvent>,
		connection: Connection,
		client: DriftClient,
		marketIndex: number,
		marketType: MarketType,
		message: string,
		signature: Buffer,
		takerPubkey: PublicKey,
		signedMsgUserOrdersAccountPubkey: PublicKey,
		signedMsgOrderUuid: Uint8Array,
		confirmDuration: number,
		signingAuthority?: PublicKey
	) {
		// First send the order
		const sendResponse = await this.sendSwiftOrder(
			marketIndex,
			marketType,
			message,
			signature,
			takerPubkey,
			signingAuthority
		);
		allEnvDlog('swiftClient', 'sendResponse\n', sendResponse);

		if (!sendResponse.success) {
			subscriber.next({
				type: 'errored',
				hash: '',
				message: 'Error from swift node: ' + sendResponse.message,
			});
			return;
		}

		const hash = sendResponse.body.hash;

		// Then confirm it
		const orderID = await this.confirmSwiftOrderWS(
			connection,
			client,
			signedMsgUserOrdersAccountPubkey,
			signedMsgOrderUuid,
			confirmDuration
		).catch((err) => {
			allEnvDlog('swiftClient', 'confirmSwiftOrderWS error', err);
			subscriber.next({
				type: 'expired',
				hash,
				message: 'Order failed to confirm',
			});
		});

		if (!orderID) {
			subscriber.next({
				type: 'expired',
				hash,
				message: 'Order failed to confirm',
			});
		} else {
			subscriber.next({
				type: 'confirmed',
				orderId: orderID.toString(),
				hash,
			});
		}
	}

	public static async sendAndConfirmSwiftOrder(
		marketIndex: number,
		marketType: MarketType,
		message: string,
		signature: Buffer,
		takerPubkey: PublicKey,
		confirmDuration: number,
		signingAuthority: PublicKey
	): Promise<Observable<SwiftOrderEvent>> {
		return new Observable<SwiftOrderEvent>((subscriber) => {
			this.handleSwiftOrderSubscriber(
				subscriber,
				marketIndex,
				marketType,
				message,
				signature,
				takerPubkey,
				confirmDuration,
				signingAuthority
			);
		});
	}

	public static async sendAndConfirmSwiftOrderWS(
		connection: Connection,
		client: DriftClient,
		marketIndex: number,
		marketType: MarketType,
		message: string,
		signature: Buffer,
		takerPubkey: PublicKey,
		signedMsgUserOrdersAccountPubkey: PublicKey,
		signedMsgOrderUuid: Uint8Array,
		confirmDuration: number,
		signingAuthority: PublicKey
	): Promise<Observable<SwiftOrderEvent>> {
		return new Observable<SwiftOrderEvent>((subscriber) => {
			this.handleSwiftOrderSubscriberWS(
				subscriber,
				connection,
				client,
				marketIndex,
				marketType,
				message,
				signature,
				takerPubkey,
				signedMsgUserOrdersAccountPubkey,
				signedMsgOrderUuid,
				confirmDuration,
				signingAuthority
			);
		});
	}

	public static async isSwiftServerHealthy(): Promise<boolean> {
		const response = await this.get('/health');
		return response.status === 200;
	}
}

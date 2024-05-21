import { sleep, COMMON_UTILS } from '..';
import Redis, { Cluster, RedisOptions } from 'ioredis';

const BULK_WRITE_CHUNK_SIZE = 500;
const BULK_READ_CHUNK_SIZE = 1000;
const CHUNK_SLEEP_TIME = 100;

export enum RedisClientPrefix {
	EXCHANGE = '',
	USER_MAP = 'usermap-server:',
}

function isWrite() {
	return function (
		_target: unknown,
		propertyKey: string,
		descriptor: PropertyDescriptor
	) {
		const method = descriptor.value;

		const methodName = propertyKey;

		descriptor.value = function (...args) {
			if (process.env.DISABLE_CACHE_WRITE) {
				console.log(`DISABLE_CACHE_WRITE=true :: Skipping ${methodName}`);
				return;
			}

			// Run the decorated method and return the value
			const returnValue = method.apply(this, args);

			return returnValue;
		};
	};
}

function isRead(
	_target: any,
	_propertyKey: string,
	descriptor: PropertyDescriptor
) {
	return descriptor;
}

const getTlsConfiguration = () => {
	if (
		process.env.RUNNING_LOCAL === 'true' &&
		process.env.LOCAL_CACHE === 'true'
	) {
		console.log('Redis: Running LOCAL with LOCAL cache');
		return undefined;
	}
	if (process.env.RUNNING_LOCAL === 'true') {
		console.log('Redis: Running LOCAL with REMOTE cache');
		return {
			checkServerIdentity: () => {
				return undefined;
			},
		};
	}
	console.log('Redis: Making a tls connection');
	return {};
};

const getNatMap = () => {
	if (
		process.env.RUNNING_LOCAL === 'true' &&
		process.env.LOCAL_CACHE === 'false'
	) {
		console.log('Redis: Getting NATMAP for remote connection');
		const natMap = process.env?.NAT_MAP
			? JSON.parse(process.env.NAT_MAP)
			: false;
		console.log(`NATMAP: ${process.env.NAT_MAP}`);
		if (!natMap) {
			throw new Error(
				'NATMAP not found. When running the openElasticacheTunnel script copy the output into your terminal'
			);
		}

		return natMap;
	}

	return {};
};

export const getRedisClusterClient = (
	host: string,
	port: string,
	prefix: string,
	opts?: RedisOptions
): Cluster => {
	if (host && port) {
		console.log(`Connecting to configured cluster redis:: ${host}:${port}`);

		const redisClient = new Redis.Cluster(
			[
				{
					host,
					port: parseInt(port, 10),
				},
			],
			{
				keyPrefix: prefix,
				natMap: getNatMap(),
				clusterRetryStrategy: (times) => {
					const delay = Math.min(times * 1000, 10000);
					console.log(
						`Reconnecting to Redis in ${delay}ms... (retries: ${times})`
					);
					return delay;
				},
				dnsLookup: (address, callback) => callback(null, address),
				redisOptions: {
					reconnectOnError: (err) => {
						const targetError = 'ECONNREFUSED';
						if (err.message.includes(targetError)) {
							console.log(
								`Redis error: ${targetError}. Attempting to reconnect...`
							);
							return true;
						}
						return false;
					},
					maxRetriesPerRequest: null,
					tls: getTlsConfiguration(),
				},
				...(opts ?? {}),
			}
		);

		redisClient.on('connect', () => {
			console.log('Connected to Redis.');
		});

		redisClient.on('error', (err) => {
			console.error('Redis error:', err);
		});

		redisClient.on('reconnecting', () => {
			console.log('Reconnecting to Redis...');
		});

		return redisClient;
	}

	throw Error('Missing redis client configuration');
};

export const getRedisClient = (
	host: string,
	port: string,
	prefix: string,
	opts?: RedisOptions
): Redis => {
	if (host && port) {
		console.log(`Connecting to configured redis:: ${host}:${port}`);

		const redisClient = new Redis({
			host,
			port: parseInt(port, 10),
			keyPrefix: prefix,
			retryStrategy: (times) => {
				const delay = Math.min(times * 1000, 10000);
				console.log(
					`Reconnecting to Redis in ${delay}ms... (retries: ${times})`
				);
				return delay;
			},
			reconnectOnError: (err) => {
				const targetError = 'ECONNREFUSED';
				if (err.message.includes(targetError)) {
					console.log(
						`Redis error: ${targetError}. Attempting to reconnect...`
					);
					return true;
				}
				return false;
			},
			maxRetriesPerRequest: null,
			tls: getTlsConfiguration(),
			...(opts ?? {}),
		});

		redisClient.on('connect', () => {
			console.log('Connected to Redis.');
		});

		redisClient.on('error', (err) => {
			console.error('Redis error:', err);
		});

		redisClient.on('reconnecting', () => {
			console.log('Reconnecting to Redis...');
		});

		return redisClient;
	}

	throw Error('Missing redis client configuration');
};

/**
 * Wrapper around the redis client.
 *
 * You can hover over the underlying redis client methods for explanations of the methods, but will also include links to DOCS for some important concepts below:
 *
 * zRange, zRangeByScore etc.:
 * - All of the "z" methods are methods that use sorted sets.
 * - Sorted sets are explained here : https://redis.io/docs/data-types/sorted-sets/
 */
export class RedisClient {
	private client: Redis | Cluster;

	connectionPromise: Promise<void>;

	constructor({
		host = process.env.ELASTICACHE_HOST ?? 'localhost',
		port = process.env.ELASTICACHE_PORT ?? '6379',
		prefix = RedisClientPrefix.EXCHANGE,
		opts,
		cluster = process.env.LOCAL_CACHE === 'true' &&
			process.env.RUNNING_LOCAL === 'true',
	}: {
		host?: string;
		port?: string;
		prefix?: RedisClientPrefix;
		opts?: RedisOptions;
		cluster?: boolean;
	}) {
		if (cluster) {
			this.client = getRedisClusterClient(host, port, prefix, opts);
			return;
		}
		this.client = getRedisClient(host, port, prefix, opts);
	}

	/**
	 * Should avoid using this unless necessary.
	 * @returns
	 */
	public forceGetClient() {
		return this.client;
	}

	public get connected() {
		return this?.client?.status === 'ready';
	}

	async connect() {
		if (process.env.CI_TEST) return;
		if (this.connected) return;

		await sleep(100);

		if (this.client.status === 'connecting') {
			return this.connectionPromise;
		}
		if (this.client.status === 'connect') {
			return this.connectionPromise;
		}
		if (this.client.status === 'ready') {
			return true;
		}

		this.client.on('error', (error) =>
			console.log(`'Redis Client Error :: ', ${error?.message}`)
		);

		try {
			await this.client.connect();
		} catch (e) {
			console.error(e);
		}

		return true;
	}

	disconnect() {
		if (process.env.CI_TEST) return;
		this.client.disconnect();
	}

	private assertConnected() {
		if (!this.connected) {
			throw 'Redis client not connected';
		}
	}

	/**
	 * IMPORTANT NOTE: non-expiring keys will not be cleared up by the eviction policy, so they must be cleared manually
	 * @param key
	 * @param value
	 */
	@isWrite()
	async set(key: string, value) {
		this.assertConnected();
		this.client.set(key, JSON.stringify(value));
	}

	@isWrite()
	async setRaw(key: string, value) {
		this.assertConnected();
		this.client.set(key, value);
	}

	/**
	 * IMPORTANT NOTE: non-expiring keys will not be cleared up by the eviction policy, so they must be cleared manually
	 * @param key
	 * @param value
	 */
	@isWrite()
	async mset(values: [string, any][]) {
		this.assertConnected();

		if (values.length === 0) return;

		const chunkedValues = COMMON_UTILS.chunks(values, BULK_WRITE_CHUNK_SIZE);

		for (const valuesChunk of chunkedValues) {
			for (const [key, val] of valuesChunk) {
				await this.client.set(key, JSON.stringify(val));
			}

			if (chunkedValues.length > 0) {
				await sleep(CHUNK_SLEEP_TIME);
			}
		}
	}

	@isWrite()
	async setExpiring(key: string, value, expirySeconds: number) {
		this.assertConnected();
		const resp = await this.client.setex(
			key,
			expirySeconds,
			JSON.stringify(value)
		);
		return resp;
	}

	@isRead
	async msetExpiring(values: [string, any][], expirySeconds: number) {
		if (!values) return;
		if (values.length === 0) return;

		this.assertConnected();

		const chunkedValues = COMMON_UTILS.chunks(values, BULK_WRITE_CHUNK_SIZE);

		for (const valuesChunk of chunkedValues) {
			for (const [key, val] of valuesChunk) {
				this.client.setex(key, expirySeconds, JSON.stringify(val));
			}

			if (chunkedValues.length > 0) {
				await sleep(CHUNK_SLEEP_TIME);
			}
		}
	}

	@isWrite()
	async expireKey(key: string, expirySeconds: number) {
		this.assertConnected();

		const resp = await this.client.expire(key, expirySeconds);
		return resp;
	}

	@isRead
	async get<T = string | number | Record<string, unknown> | undefined>(
		key: string
	): Promise<T> {
		this.assertConnected();

		const value = await this.client.get(key);

		if (value) {
			return JSON.parse(value);
		}

		return undefined;
	}

	@isRead
	async getRaw(key: string) {
		this.assertConnected();

		const resp = await this.client.get(key);

		return resp;
	}

	@isRead
	async mget(keys: string[]) {
		this.assertConnected();

		if (keys.length === 0) return [];

		const chunkedValues = COMMON_UTILS.chunks(keys, BULK_READ_CHUNK_SIZE);
		const rawValues = [];

		for (const valuesChunk of chunkedValues) {
			for (const key of valuesChunk) {
				rawValues.push(await this.client.get(key));
			}

			if (chunkedValues.length > 0) {
				await sleep(20);
			}
		}

		const parsedValues = rawValues.map((value) => {
			if (value) {
				const parsedValue = JSON.parse(value);
				return parsedValue;
			}
			return undefined;
		});

		return parsedValues;
	}
	@isRead
	async zRange(key: string, min: number, max: number) {
		const resp = await this.client.zrange(key, min, max);

		return resp;
	}
	@isRead
	async zRevRange(
		key: string,
		start: number,
		stop: number,
		withScores?: 'WITHSCORES'
	) {
		const resp = withScores
			? this.client.zrevrange(key, start, stop, withScores)
			: this.client.zrevrange(key, start, stop);

		return resp;
	}
	@isRead
	async zRangeByScore(key: string, min: number | string, max: number | string) {
		const resp = await this.client.zrangebyscore(key, min, max);
		return resp;
	}
	@isRead
	async zRevRangeByScore(
		key: string,
		max: number | string,
		min: number | string
	) {
		const resp = await this.client.zrevrangebyscore(key, max, min);
		return resp;
	}
	@isRead
	async zRank(key: string, member: string) {
		const resp = await this.client.zrank(key, member);
		return resp;
	}
	@isRead
	async zRevRank(key: string, member: string) {
		const resp = await this.client.zrevrank(key, member);
		return resp;
	}
	@isWrite()
	async zRem(key: string, member: string | number | Buffer) {
		const resp = await this.client.zrem(key, member);
		return resp;
	}
	@isWrite()
	async zRemRange(key: string, start: number, stop: number) {
		const resp = await this.client.zremrangebyrank(key, start, stop);
		return resp;
	}
	@isWrite()
	async zRemRangeByScore(key: string, start: number, stop: number) {
		const resp = await this.client.zremrangebyscore(key, start, stop);
		return resp;
	}
	@isRead
	async zCount(key: string, start: number, stop: number) {
		const resp = await this.client.zcount(key, start, stop);
		return resp;
	}
	@isRead
	async zCard(key: string) {
		const resp = await this.client.zcard(key);
		return resp;
	}
	@isWrite()
	async zAdd(key: string, ...scoreMembers: (string | number | Buffer)[]) {
		const resp = await this.client.zadd(key, ...scoreMembers);
		return resp;
	}
	@isWrite()
	async lPush(key: string, ...elements: (string | number | Buffer)[]) {
		const resp = await this.client.lpush(key, ...elements);
		return resp;
	}
	@isWrite()
	async rPush(key: string, ...elements: (string | number | Buffer)[]) {
		const resp = await this.client.rpush(key, ...elements);
		return resp;
	}
	@isWrite()
	async lTrim(key: string, start: number, stop: number) {
		const resp = await this.client.ltrim(key, start, stop);
		return resp;
	}
	@isWrite()
	async lRem(key: string, count: number, element: string | number | Buffer) {
		const resp = await this.client.lrem(key, count, element);
		return resp;
	}
	@isRead
	async lRange(key: string, start: number, stop: number) {
		const resp = await this.client.lrange(key, start, stop);
		return resp;
	}
	@isRead
	async lLen(key: string) {
		const resp = await this.client.llen(key);
		return resp;
	}
	@isRead
	async lIndex(key: string, index: number) {
		const resp = await this.client.lindex(key, index);
		return resp;
	}

	/**
	 * Clears the entire cache of the current DB (not the other DBs in the redis instance)
	 */
	@isRead
	async flush() {
		this.assertConnected();
		return this.client.flushdb();
	}

	@isRead
	async delete(...keys: string[]) {
		this.assertConnected();

		const chunkedValues = COMMON_UTILS.chunks(keys, BULK_WRITE_CHUNK_SIZE);

		let count = 0;
		for (const valuesChunk of chunkedValues) {
			for (const key of valuesChunk) {
				await this.client.del(key);
				count++;
			}

			if (chunkedValues.length > 0) {
				await sleep(20);
			}
		}

		return count;
	}
}

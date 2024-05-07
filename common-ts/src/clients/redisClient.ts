import { sleep, COMMON_UTILS } from '..';
import Redis, { RedisOptions } from 'ioredis';

const BULK_WRITE_CHUNK_SIZE = 500;
const BULK_READ_CHUNK_SIZE = 1000;
const CHUNK_SLEEP_TIME = 100;

export enum RedisClientType {
	EXCHANGE = 0,
	USER_MAP = 1,
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

export const getRedisClient = (
	host: string,
	port: string,
	db: number,
	opts?: RedisOptions
): Redis => {
	if (host && port) {
		console.log(`Connecting to configured redis:: ${host}:${port}`);

		const getTlsConfiguration = () => {
			if (
				process.env.RUNNING_LOCAL === 'true' &&
				process.env.LOCAL_CACHE === 'true'
			) {
				return undefined;
			}
			if (process.env.RUNNING_LOCAL === 'true') {
				return {
					checkServerIdentity: () => {
						return undefined;
					},
				};
			}
			return {};
		};

		const redisClient = new Redis({
			host,
			port: parseInt(port, 10),
			db,
			...(opts ?? {}),
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

	console.log(`Using default redis`);
	return new Redis({ db });
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
	private client: Redis;

	connectionPromise: Promise<void>;

	constructor({
		host = process.env.ELASTICACHE_HOST ?? 'localhost',
		port = process.env.ELASTICACHE_PORT ?? '6379',
		db = RedisClientType.EXCHANGE,
		opts,
	}: {
		host?: string;
		port?: string;
		db?: RedisClientType;
		opts?: RedisOptions;
	}) {
		this.client = getRedisClient(host, port, db, opts);
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
			const pipeline = this.client.pipeline();

			for (const [key, val] of valuesChunk) {
				pipeline.set(key, JSON.stringify(val));
			}

			await pipeline.exec();

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

		const pipeline = this.client.pipeline();

		const chunkedValues = COMMON_UTILS.chunks(values, BULK_WRITE_CHUNK_SIZE);

		for (const valuesChunk of chunkedValues) {
			for (const [key, val] of valuesChunk) {
				pipeline.setex(key, expirySeconds, JSON.stringify(val));
			}

			await pipeline.exec();
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
			const pipeline = this.client.pipeline();

			for (const key of valuesChunk) {
				pipeline.get(key);
			}

			const response = await pipeline.exec();
			response.forEach(([, rawValue]) => rawValues.push(rawValue));

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
			const pipeline = this.client.pipeline();

			for (const key of valuesChunk) {
				pipeline.del(key);
			}

			const response = await pipeline.exec();
			const sum = response.reduce(
				(acc, [_, value]: [any, number]) => acc + value,
				0
			);
			count = +sum;

			if (chunkedValues.length > 0) {
				await sleep(20);
			}
		}

		return count;
	}
}

import { createClient } from "redis";
import { env } from "@/common/utils/envConfig";

let redis: ReturnType<typeof createClient>;

if (!(global as any)._redisClient) {
	redis = createClient({
		socket: {
			host: env.REDIS_HOST,
			port: env.REDIS_PORT,
		},
	});
	redis.connect().catch(console.error);
	(global as any)._redisClient = redis;
} else {
	redis = (global as any)._redisClient;
}

export const setKeyValue = async (key: string, value: string) => {
	try {
		await redis.set(key, value, { EX: 300 });
	} catch (_err) {
		return false;
	}
	return true;
};

export const getKeyValue = async (key: string) => {
	let value = null;
	try {
		value = await redis.get(key);
	} catch (_err) {
		return null;
	}
	return value;
};

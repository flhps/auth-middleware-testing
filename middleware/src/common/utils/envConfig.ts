import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
	NODE_ENV: z.enum(["development", "production", "test"]).default("production"),

	HOST: z.string().min(1).default("localhost"),

	PORT: z.coerce.number().int().positive().default(8080),

	CORS_ORIGIN: z.string().url().default("http://localhost:8080"),

	COMMON_RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive().default(1000),

	COMMON_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(1000),

	GLOBAL_URL: z.string().url().default("http://localhost:8080"),

	DID_KEY_JWK: z
		.string()
		.regex(/^\{.*\}/g)
		.default(
			'{"kty":"OKP","crv":"Ed25519","x":"cwa3dufHNLg8aQb2eEUqTyoM1cKQW3XnOkMkj_AAl5M","d":"me03qhLByT-NKrfXDeji-lpADSpVOKWoaMUzv5EyzKY"}',
		),

	SIGN_IN_POLICY: z.string().min(1),

	REDIS_PORT: z.coerce.number().int().positive().default(6379),

	REDIS_HOST: z.string().min(1).default("redis"),

	HYDRA_ADMIN_URL: z.string().min(1),

	UNSAFE_IGNORE_VP_CHALLENGE: z
		.enum(["true", "false"])
		.default("false")
		.transform((v) => v === "true"),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
	console.error("❌ Invalid environment variables:", parsedEnv.error.format());
	throw new Error("Invalid environment variables");
}

export const env = {
	...parsedEnv.data,
	isDevelopment: parsedEnv.data.NODE_ENV === "development",
	isProduction: parsedEnv.data.NODE_ENV === "production",
	isTest: parsedEnv.data.NODE_ENV === "test",
};

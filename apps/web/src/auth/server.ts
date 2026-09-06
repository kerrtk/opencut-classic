import { betterAuth, type RateLimit } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { Redis } from "@upstash/redis";
import { db, isDatabaseConfigured } from "@/db";
import { webEnv } from "@/env/web";

/**
 * Accounts need somewhere to store users and a secret to sign sessions with.
 * Without both, this instance runs as a local-only editor.
 */
export function isAuthConfigured(): boolean {
	return isDatabaseConfigured() && Boolean(webEnv.BETTER_AUTH_SECRET);
}

function createAuth() {
	const secret = webEnv.BETTER_AUTH_SECRET;

	if (!secret) {
		throw new Error(
			"BETTER_AUTH_SECRET is not set, so authentication is disabled. " +
				"Set DATABASE_URL and BETTER_AUTH_SECRET to enable accounts.",
		);
	}

	const redisUrl = webEnv.UPSTASH_REDIS_REST_URL;
	const redisToken = webEnv.UPSTASH_REDIS_REST_TOKEN;

	// Rate limiting needs storage shared across instances. Without Redis,
	// better-auth falls back to its own built-in limiter.
	const redis =
		redisUrl && redisToken
			? new Redis({ url: redisUrl, token: redisToken })
			: null;

	return betterAuth({
		database: drizzleAdapter(db, {
			provider: "pg",
			usePlural: true,
		}),
		secret,
		user: {
			deleteUser: {
				enabled: true,
			},
		},
		emailAndPassword: {
			enabled: true,
		},
		...(redis
			? {
					rateLimit: {
						storage: "secondary-storage" as const,
						customStorage: {
							get: async (key: string) => {
								const value = await redis.get(key);
								return value as RateLimit | undefined;
							},
							set: async (key: string, value: RateLimit) => {
								await redis.set(key, value);
							},
						},
					},
				}
			: {}),
		baseURL: webEnv.NEXT_PUBLIC_SITE_URL,
		appName: "OpenCut",
		trustedOrigins: [webEnv.NEXT_PUBLIC_SITE_URL],
	});
}

let _auth: ReturnType<typeof createAuth> | null = null;

/**
 * Built lazily so that importing this module never requires auth to be
 * configured. Check `isAuthConfigured()` before calling it.
 */
export function getAuth() {
	if (!_auth) {
		_auth = createAuth();
	}

	return _auth;
}

export type Auth = ReturnType<typeof createAuth>;

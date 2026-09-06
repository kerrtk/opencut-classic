import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { webEnv } from "@/env/web";

let _baseRateLimit: Ratelimit | null = null;

/**
 * Whether request rate limiting is available.
 *
 * Limits are counted in Redis so they hold across serverless instances; with
 * no Redis configured there is nothing to count in.
 */
export function isRateLimitConfigured(): boolean {
	return Boolean(
		webEnv.UPSTASH_REDIS_REST_URL && webEnv.UPSTASH_REDIS_REST_TOKEN,
	);
}

function getBaseRateLimit(): Ratelimit | null {
	const url = webEnv.UPSTASH_REDIS_REST_URL;
	const token = webEnv.UPSTASH_REDIS_REST_TOKEN;

	if (!url || !token) {
		return null;
	}

	if (!_baseRateLimit) {
		_baseRateLimit = new Ratelimit({
			redis: new Redis({ url, token }),
			limiter: Ratelimit.slidingWindow(100, "1 m"), // 100 requests per minute
			analytics: true,
			prefix: "rate-limit",
		});
	}

	return _baseRateLimit;
}

export async function checkRateLimit({ request }: { request: Request }) {
	const baseRateLimit = getBaseRateLimit();

	// Nothing to enforce against on an instance without Redis, so requests
	// pass through rather than failing closed.
	if (!baseRateLimit) {
		return { success: true, limited: false };
	}

	const ip = request.headers.get("x-forwarded-for") ?? "anonymous";
	const { success } = await baseRateLimit.limit(ip);
	return { success, limited: !success };
}

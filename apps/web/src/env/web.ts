import { z } from "zod";

/**
 * Treat an empty or whitespace-only value as "not set".
 *
 * Hosting dashboards frequently leave a variable defined but blank, which
 * should behave the same as omitting it rather than failing validation.
 */
function optional<T extends z.ZodTypeAny>(schema: T) {
	return z.preprocess(
		(value) =>
			typeof value === "string" && value.trim() === "" ? undefined : value,
		schema.optional(),
	);
}

const webEnvSchema = z.object({
	// Node
	NODE_ENV: z
		.enum(["development", "production", "test"])
		.default("development"),
	ANALYZE: z.string().optional(),
	NEXT_RUNTIME: z.enum(["nodejs", "edge"]).optional(),

	// Public
	NEXT_PUBLIC_SITE_URL: z.url().default("http://localhost:3000"),
	NEXT_PUBLIC_MARBLE_API_URL: z.url().default("https://api.marblecms.com"),

	// Server
	//
	// These are optional so OpenCut can be self-hosted as a standalone editor
	// with no backing services. The editor itself is entirely client-side —
	// projects, timelines, and media live in the browser's IndexedDB — so the
	// app builds and runs without any of these set. Each one unlocks an
	// optional feature; when it is missing, that feature reports itself as
	// unconfigured instead of breaking the app.
	//
	//   DATABASE_URL + BETTER_AUTH_SECRET -> accounts, feedback
	//   UPSTASH_REDIS_*                   -> API rate limiting
	//   MARBLE_WORKSPACE_KEY              -> blog
	//   FREESOUND_*                       -> sound effects search
	DATABASE_URL: optional(
		z
			.string()
			.refine(
				(url) =>
					url.startsWith("postgres://") || url.startsWith("postgresql://"),
				"DATABASE_URL must be a postgres:// or postgresql:// URL",
			),
	),

	BETTER_AUTH_SECRET: optional(z.string()),
	UPSTASH_REDIS_REST_URL: optional(z.url()),
	UPSTASH_REDIS_REST_TOKEN: optional(z.string()),
	MARBLE_WORKSPACE_KEY: optional(z.string()),
	FREESOUND_CLIENT_ID: optional(z.string()),
	FREESOUND_API_KEY: optional(z.string()),
});

export type WebEnv = z.infer<typeof webEnvSchema>;

export const webEnv = webEnvSchema.parse(process.env);

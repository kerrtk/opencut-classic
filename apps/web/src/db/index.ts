import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import { webEnv } from "@/env/web";

type Database = ReturnType<typeof drizzle>;

let _db: Database | null = null;

/**
 * Whether a database is available for this instance.
 *
 * OpenCut runs as a standalone editor without one — only account and feedback
 * features need persistence beyond the browser.
 */
export function isDatabaseConfigured(): boolean {
	return Boolean(webEnv.DATABASE_URL);
}

function getDb(): Database {
	if (!_db) {
		const url = webEnv.DATABASE_URL;

		if (!url) {
			throw new Error(
				"DATABASE_URL is not set, so database-backed features are disabled. " +
					"Set DATABASE_URL to a postgres connection string to enable them.",
			);
		}

		const client = postgres(url);
		_db = drizzle(client, { schema });
	}

	return _db;
}

/**
 * The connection is resolved lazily on first use, so importing this module is
 * safe even when no database is configured. Only actually running a query
 * requires DATABASE_URL to be set.
 */
export const db = new Proxy({} as Database, {
	get(_target, property) {
		const instance = getDb() as unknown as Record<string | symbol, unknown>;
		const value = instance[property];

		return typeof value === "function" ? value.bind(instance) : value;
	},
});

export * from "./schema";

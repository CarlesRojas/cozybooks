// Custom better-auth database adapter backed by Convex (phase 4 of the migration).
// Talks to the secret-gated CRUD functions in `convex/betterAuth.ts` through
// ConvexHttpClient. better-auth ids are preserved verbatim (stored as `authId`), so
// all domain rows keep referencing users by the same id strings as before.

import { api } from "@convex/_generated/api";
import { createAdapter } from "better-auth/adapters";
import type { ConvexHttpClient } from "convex/browser";

// Date-typed fields per better-auth model; stored as ms since epoch in Convex.
const DATE_FIELDS: Record<string, Array<string>> = {
    user: ["createdAt", "updatedAt"],
    session: ["createdAt", "updatedAt", "expiresAt"],
    account: ["createdAt", "updatedAt", "accessTokenExpiresAt", "refreshTokenExpiresAt"],
    verification: ["createdAt", "updatedAt", "expiresAt"],
    // The `jwt` plugin picks the newest key with `b.createdAt.getTime()`, so this one is
    // not cosmetic: a plain number there throws rather than sorting.
    jwks: ["createdAt", "expiresAt"],
};

const serializeValue = (value: unknown) => (value instanceof Date ? value.getTime() : value);

const serializeRecord = (record: Record<string, unknown>) =>
    Object.fromEntries(Object.entries(record).map(([field, value]) => [field, serializeValue(value)]));

interface WhereClause {
    field: string;
    value: unknown;
    operator?: string;
    connector?: string;
    mode?: string;
}

// Only the clause fields `convex/betterAuth.ts` validates are forwarded: Convex
// rejects objects carrying fields the validator doesn't declare, so passing the
// clause through verbatim would break whenever better-auth adds one (1.6 added
// `mode`). Undefined keys are dropped — Convex has no `undefined` value.
const serializeWhere = (where: Array<WhereClause>) =>
    where.map(({ field, value, operator, connector, mode }) => ({
        field,
        value: Array.isArray(value) ? value.map(serializeValue) : serializeValue(value),
        ...(operator !== undefined && { operator }),
        ...(connector !== undefined && { connector }),
        ...(mode !== undefined && { mode }),
    }));

const deserializeRow = (model: string, row: Record<string, any> | null) => {
    if (!row) return null;
    const result = { ...row };
    for (const field of DATE_FIELDS[model] ?? []) if (typeof result[field] === "number") result[field] = new Date(result[field]);
    return result;
};

// The signing keys, held in this process rather than re-read on every token.
//
// `jwks` is the busiest read in this adapter by a wide margin, and none of it is about
// the visitor: better-auth's `jwt` plugin loads the whole key set to sign, so every
// token minted — SSR of a document, the browser's `/api/auth/token`, the hourly refresh
// of an open socket — is a `betterAuth.findMany` against a table that holds one row.
// Signing keys are the one thing in these tables that does not change per request: no
// `rotationInterval` is configured, so the key created on first sign-in is the key still
// in use.
//
// The promise rather than the rows, so concurrent mints share one read instead of racing
// to make their own. It is per adapter instance, and the adapter is built once in
// `src/lib/auth/index.ts`, so its lifetime is the server process.
//
// One slot, keyed by the query it answers, because better-auth only ever asks this model
// one way — the whole table, which is how both `getAllKeys` and `getLatestKey` read it.
//
// A write to the model drops the cache, so the key minted on a cold database is visible
// at once. The TTL is for the writes this process cannot see: another instance rotating
// a key, or the table being cleared underneath a running server, which would otherwise
// leave it signing with a key Convex no longer publishes.
const JWKS_MODEL = "jwks";
const JWKS_CACHE_MS = 10 * 60 * 1000;

interface Props {
    client: ConvexHttpClient;
    secret: string;
}

export const convexAdapter = ({ client, secret }: Props) => {
    let jwks: { query: string; rows: Promise<Array<Record<string, any>>>; readAt: number } | undefined;

    const forgetJwks = (model: string) => {
        if (model === JWKS_MODEL) jwks = undefined;
    };

    return createAdapter({
        config: {
            adapterId: "convex",
            adapterName: "Convex Adapter",
            supportsNumericIds: false,
            supportsJSON: false,
            supportsDates: true,
            supportsBooleans: true,
        },

        adapter: () => ({
            create: async ({ model, data }) => {
                const row = await client.mutation(api.betterAuth.create, { secret, model, data: serializeRecord(data) });
                forgetJwks(model);
                return deserializeRow(model, row) as any;
            },

            findOne: async ({ model, where }) => {
                const rows = await client.query(api.betterAuth.findMany, { secret, model, where: serializeWhere(where), limit: 1 });
                return deserializeRow(model, rows[0] ?? null) as any;
            },

            findMany: async ({ model, where, limit, sortBy, offset }) => {
                const args = {
                    secret,
                    model,
                    where: where ? serializeWhere(where) : undefined,
                    limit,
                    offset,
                    sortBy,
                };
                const read = () => client.query(api.betterAuth.findMany, args) as Promise<Array<Record<string, any>>>;

                if (model === JWKS_MODEL) {
                    // The secret is left out: it is the same on every call, and this
                    // string lives in memory for as long as the cached rows do.
                    const query = JSON.stringify([args.where, limit, offset, sortBy]);
                    if (!jwks || jwks.query !== query || Date.now() - jwks.readAt > JWKS_CACHE_MS)
                        jwks = { query, rows: read(), readAt: Date.now() };

                    // A failed read must not be remembered, or the next mint replays the
                    // same rejection out of the cache instead of asking again.
                    const rows = await jwks.rows.catch((error: unknown) => {
                        jwks = undefined;
                        throw error;
                    });

                    // Deserialized per call rather than once: `deserializeRow` hands back
                    // `Date` objects, and a caller that mutated a shared one would be
                    // mutating every later mint's copy of the key.
                    return rows.map((row) => deserializeRow(model, row)) as any;
                }

                const rows = await read();
                return rows.map((row: Record<string, any>) => deserializeRow(model, row)) as any;
            },

            update: async ({ model, where, update }) => {
                const row = await client.mutation(api.betterAuth.update, {
                    secret,
                    model,
                    where: serializeWhere(where),
                    update: serializeRecord(update as Record<string, unknown>),
                });
                forgetJwks(model);
                return deserializeRow(model, row) as any;
            },

            updateMany: async ({ model, where, update }) => {
                const count = await client.mutation(api.betterAuth.updateMany, {
                    secret,
                    model,
                    where: serializeWhere(where),
                    update: serializeRecord(update),
                });
                forgetJwks(model);
                return count;
            },

            delete: async ({ model, where }) => {
                await client.mutation(api.betterAuth.deleteOne, { secret, model, where: serializeWhere(where) });
                forgetJwks(model);
            },

            deleteMany: async ({ model, where }) => {
                const count = await client.mutation(api.betterAuth.deleteMany, { secret, model, where: serializeWhere(where) });
                forgetJwks(model);
                return count;
            },

            count: async ({ model, where }) => {
                return await client.query(api.betterAuth.count, { secret, model, where: where ? serializeWhere(where) : undefined });
            },
        }),
    });
};

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
};

const serializeValue = (value: unknown) => (value instanceof Date ? value.getTime() : value);

const serializeRecord = (record: Record<string, unknown>) =>
    Object.fromEntries(Object.entries(record).map(([field, value]) => [field, serializeValue(value)]));

const serializeWhere = (where: Array<{ field: string; value: unknown; operator: string; connector: string }>) =>
    where.map((clause) => ({
        ...clause,
        value: Array.isArray(clause.value) ? clause.value.map(serializeValue) : serializeValue(clause.value),
    }));

const deserializeRow = (model: string, row: Record<string, any> | null) => {
    if (!row) return null;
    const result = { ...row };
    for (const field of DATE_FIELDS[model] ?? []) if (typeof result[field] === "number") result[field] = new Date(result[field]);
    return result;
};

interface Props {
    client: ConvexHttpClient;
    secret: string;
}

export const convexAdapter = ({ client, secret }: Props) =>
    createAdapter({
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
                return deserializeRow(model, row) as any;
            },

            findOne: async ({ model, where }) => {
                const rows = await client.query(api.betterAuth.findMany, { secret, model, where: serializeWhere(where), limit: 1 });
                return deserializeRow(model, rows[0] ?? null) as any;
            },

            findMany: async ({ model, where, limit, sortBy, offset }) => {
                const rows = await client.query(api.betterAuth.findMany, {
                    secret,
                    model,
                    where: where ? serializeWhere(where) : undefined,
                    limit,
                    offset,
                    sortBy,
                });
                return rows.map((row: Record<string, any>) => deserializeRow(model, row)) as any;
            },

            update: async ({ model, where, update }) => {
                const row = await client.mutation(api.betterAuth.update, {
                    secret,
                    model,
                    where: serializeWhere(where),
                    update: serializeRecord(update as Record<string, unknown>),
                });
                return deserializeRow(model, row) as any;
            },

            updateMany: async ({ model, where, update }) => {
                return await client.mutation(api.betterAuth.updateMany, {
                    secret,
                    model,
                    where: serializeWhere(where),
                    update: serializeRecord(update),
                });
            },

            delete: async ({ model, where }) => {
                await client.mutation(api.betterAuth.deleteOne, { secret, model, where: serializeWhere(where) });
            },

            deleteMany: async ({ model, where }) => {
                return await client.mutation(api.betterAuth.deleteMany, { secret, model, where: serializeWhere(where) });
            },

            count: async ({ model, where }) => {
                return await client.query(api.betterAuth.count, { secret, model, where: where ? serializeWhere(where) : undefined });
            },
        }),
    });

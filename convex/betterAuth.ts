// Convex storage for better-auth (phase 4 of the migration): generic CRUD over the
// auth tables, called by the custom better-auth adapter in
// `src/lib/auth/convexAdapter.ts` through ConvexHttpClient.
//
// These functions are public (the app server is not a Convex client with its own
// identity) but every call must present the BETTER_AUTH_SECRET environment variable
// of this deployment. Set it to the same value the app server uses.
//
// Wire format: rows keyed by better-auth field names, `id` being the better-auth id
// (stored as `authId` — Convex document ids stay internal), dates as ms since epoch.

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";

const TABLES = {
    user: "users",
    session: "sessions",
    account: "accounts",
    verification: "verifications",
} as const;

type AuthModel = keyof typeof TABLES;
type AuthTable = (typeof TABLES)[AuthModel];

// Fields that can be resolved through an index instead of a scan, per table.
const INDEXED_FIELDS: Record<AuthTable, Record<string, string>> = {
    users: { id: "by_auth_id", email: "by_email" },
    sessions: { id: "by_auth_id", token: "by_token", userId: "by_user" },
    accounts: { id: "by_auth_id", userId: "by_user" },
    verifications: { id: "by_auth_id", identifier: "by_identifier" },
};

const whereValidator = v.optional(
    v.array(
        v.object({
            field: v.string(),
            value: v.any(),
            operator: v.string(),
            connector: v.string(),
        }),
    ),
);

type WhereClause = { field: string; value: any; operator: string; connector: string };

const assertAccess = (secret: string) => {
    const expected = process.env.BETTER_AUTH_SECRET;
    if (!expected) throw new Error("BETTER_AUTH_SECRET is not set on this Convex deployment");
    if (secret !== expected) throw new Error("Invalid better-auth adapter secret");
};

const tableFor = (model: string): AuthTable => {
    const table = (TABLES as Record<string, AuthTable | undefined>)[model];
    if (!table) throw new Error(`Unknown better-auth model: ${model}`);
    return table;
};

const columnFor = (field: string) => (field === "id" ? "authId" : field);

// null and undefined fields are dropped: optional Convex fields are absent, not null.
const sanitizeInsert = (data: Record<string, any>) =>
    Object.fromEntries(Object.entries(data).filter(([, value]) => value !== null && value !== undefined));

// In a patch, `undefined` removes the field — that's how a better-auth `null` lands.
const sanitizePatch = (update: Record<string, any>) =>
    Object.fromEntries(Object.entries(update).map(([field, value]) => [columnFor(field), value ?? undefined]));

const toRow = (doc: Record<string, any>) => {
    const { _id, _creationTime, authId, ...fields } = doc;
    return { id: authId, ...fields };
};

const matchesClause = (doc: Record<string, any>, clause: WhereClause) => {
    const value = doc[columnFor(clause.field)];
    const target = clause.value;

    switch (clause.operator) {
        case "eq":
            return (value ?? null) === (target ?? null);
        case "ne":
            return (value ?? null) !== (target ?? null);
        case "lt":
            return value !== undefined && target !== null && value < target;
        case "lte":
            return value !== undefined && target !== null && value <= target;
        case "gt":
            return value !== undefined && target !== null && value > target;
        case "gte":
            return value !== undefined && target !== null && value >= target;
        case "in":
            return Array.isArray(target) && target.includes(value);
        case "contains":
            return typeof value === "string" && typeof target === "string" && value.includes(target);
        case "starts_with":
            return typeof value === "string" && typeof target === "string" && value.startsWith(target);
        case "ends_with":
            return typeof value === "string" && typeof target === "string" && value.endsWith(target);
        default:
            throw new Error(`Unsupported where operator: ${clause.operator}`);
    }
};

// AND clauses must all match; OR clauses (if any) need at least one match.
const matches = (doc: Record<string, any>, where: Array<WhereClause>) => {
    const andClauses = where.filter((clause) => clause.connector !== "OR");
    const orClauses = where.filter((clause) => clause.connector === "OR");
    return (
        andClauses.every((clause) => matchesClause(doc, clause)) &&
        (orClauses.length === 0 || orClauses.some((clause) => matchesClause(doc, clause)))
    );
};

// Narrows the scan through an index when an AND-connected eq clause hits an indexed
// field; auth tables are small, so the fallback full read is still cheap.
const findMatches = async (ctx: QueryCtx | MutationCtx, table: AuthTable, where: Array<WhereClause>) => {
    let candidates: Array<Record<string, any>> | null = null;

    if (where.every((clause) => clause.connector !== "OR")) {
        for (const clause of where) {
            if (clause.operator !== "eq" || clause.value === null) continue;
            const index = INDEXED_FIELDS[table][clause.field];
            if (!index) continue;

            candidates = await (ctx.db.query(table) as any)
                .withIndex(index, (q: any) => q.eq(columnFor(clause.field), clause.value))
                .collect();
            break;
        }
    }

    candidates ??= await ctx.db.query(table).collect();
    return candidates.filter((doc) => matches(doc, where));
};

export const create = mutation({
    args: { secret: v.string(), model: v.string(), data: v.any() },
    handler: async (ctx, { secret, model, data }) => {
        assertAccess(secret);
        const table = tableFor(model);

        const { id, ...fields } = data as Record<string, any>;
        if (typeof id !== "string") throw new Error(`create ${model}: missing id`);

        const docId = await ctx.db.insert(table, sanitizeInsert({ authId: id, ...fields }) as any);
        const doc = await ctx.db.get(docId);
        return toRow(doc as Record<string, any>);
    },
});

export const findMany = query({
    args: {
        secret: v.string(),
        model: v.string(),
        where: whereValidator,
        limit: v.optional(v.number()),
        offset: v.optional(v.number()),
        sortBy: v.optional(v.object({ field: v.string(), direction: v.union(v.literal("asc"), v.literal("desc")) })),
    },
    handler: async (ctx, { secret, model, where, limit, offset, sortBy }) => {
        assertAccess(secret);
        const results = await findMatches(ctx, tableFor(model), where ?? []);

        if (sortBy) {
            const column = columnFor(sortBy.field);
            const factor = sortBy.direction === "desc" ? -1 : 1;
            results.sort((a, b) => (a[column] < b[column] ? -factor : a[column] > b[column] ? factor : 0));
        }

        const start = offset ?? 0;
        return results.slice(start, limit !== undefined ? start + limit : undefined).map(toRow);
    },
});

export const update = mutation({
    args: { secret: v.string(), model: v.string(), where: whereValidator, update: v.any() },
    handler: async (ctx, { secret, model, where, update: updateData }) => {
        assertAccess(secret);
        const match = (await findMatches(ctx, tableFor(model), where ?? [])).at(0);
        if (!match) return null;

        await ctx.db.patch(match._id, sanitizePatch(updateData as Record<string, any>));
        const doc = await ctx.db.get(match._id);
        return toRow(doc as Record<string, any>);
    },
});

export const updateMany = mutation({
    args: { secret: v.string(), model: v.string(), where: whereValidator, update: v.any() },
    handler: async (ctx, { secret, model, where, update: updateData }) => {
        assertAccess(secret);
        const results = await findMatches(ctx, tableFor(model), where ?? []);
        const patch = sanitizePatch(updateData as Record<string, any>);
        await Promise.all(results.map((doc) => ctx.db.patch(doc._id, patch)));
        return results.length;
    },
});

export const deleteOne = mutation({
    args: { secret: v.string(), model: v.string(), where: whereValidator },
    handler: async (ctx, { secret, model, where }) => {
        assertAccess(secret);
        const match = (await findMatches(ctx, tableFor(model), where ?? [])).at(0);
        if (match) await ctx.db.delete(match._id);
        return null;
    },
});

export const deleteMany = mutation({
    args: { secret: v.string(), model: v.string(), where: whereValidator },
    handler: async (ctx, { secret, model, where }) => {
        assertAccess(secret);
        const results = await findMatches(ctx, tableFor(model), where ?? []);
        await Promise.all(results.map((doc) => ctx.db.delete(doc._id)));
        return results.length;
    },
});

export const count = query({
    args: { secret: v.string(), model: v.string(), where: whereValidator },
    handler: async (ctx, { secret, model, where }) => {
        assertAccess(secret);
        const results = await findMatches(ctx, tableFor(model), where ?? []);
        return results.length;
    },
});

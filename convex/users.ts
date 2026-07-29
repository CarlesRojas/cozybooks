// Counterpart of the user side of `src/server/db/schema/auth.ts`.
//
// Authentication itself (session resolution + Google access token, see
// `src/server/repo/auth.ts` and `src/lib/auth`) stays on better-auth for now; the
// auth tables are mirrored in the Convex schema so phase 2 (data migration) can copy
// them 1:1. `upsertFromAuth` is the entry point the migration will use.

import { v } from "convex/values";
import { internalMutation, query } from "./_generated/server";

const userFields = {
    authId: v.string(),
    name: v.string(),
    email: v.string(),
    emailVerified: v.boolean(),
    image: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
};

export const getByAuthId = query({
    args: { authId: v.string() },
    handler: async (ctx, { authId }) => {
        const user = await ctx.db
            .query("users")
            .withIndex("by_auth_id", (q) => q.eq("authId", authId))
            .unique();

        if (!user) return null;

        const { _id, _creationTime, ...fields } = user;
        return fields;
    },
});

export const upsertFromAuth = internalMutation({
    args: userFields,
    handler: async (ctx, user) => {
        const existing = await ctx.db
            .query("users")
            .withIndex("by_auth_id", (q) => q.eq("authId", user.authId))
            .unique();

        if (existing) await ctx.db.patch(existing._id, user);
        else await ctx.db.insert("users", user);
    },
});

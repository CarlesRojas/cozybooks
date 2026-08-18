// The user side of better-auth's storage. The `users` table *is* better-auth's user
// table — the adapter in `src/lib/auth/convexAdapter.ts` writes it — so there is no
// second row to create on first sign-in and nothing to keep in step.

import { v } from "convex/values";
import { internalMutation, query } from "./_generated/server";
import { getCurrentUser } from "./lib/auth";

const userFields = {
    authId: v.string(),
    name: v.string(),
    email: v.string(),
    emailVerified: v.boolean(),
    image: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
};

// The signed-in user, or null when logged out. Who that is comes from the verified
// token — the caller no longer names an id, so this cannot be asked about anyone else.
export const current = query({
    args: {},
    handler: async (ctx) => {
        const user = await getCurrentUser(ctx);
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

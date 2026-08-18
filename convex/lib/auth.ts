// Who is asking, according to the JWT Convex verified — see `convex/auth.config.ts`.
//
// Every domain row keys off the better-auth user id (`userId` on library, finished,
// ratings, unreleasedBooks; `ownerId` on a custom book), and that id is exactly what
// better-auth puts in the token's `sub` claim, which Convex hands back as
// `identity.subject`. So the id these return is the same string those rows already
// hold — nothing had to be re-keyed.
//
// This replaces passing `userId` in as an argument. That was a public function taking
// the caller's word for whose library to read or write.

import type { DataModel, Doc } from "../_generated/dataModel";
import type { GenericActionCtx, GenericQueryCtx } from "convex/server";

type AnyCtx = GenericQueryCtx<DataModel> | GenericActionCtx<DataModel>;

// Null rather than throwing, for the reads that are allowed to answer "nothing yet"
// while signed out — the book page renders for a visitor, it just has no shelves.
export const getUserId = async (ctx: AnyCtx): Promise<string | null> => {
    const identity = await ctx.auth.getUserIdentity();
    return identity?.subject ?? null;
};

// Anything that writes, or that only makes sense for a signed-in reader.
export const requireUserId = async (ctx: AnyCtx): Promise<string> => {
    const userId = await getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    return userId;
};

export const getCurrentUser = async (ctx: GenericQueryCtx<DataModel>): Promise<Doc<"users"> | null> => {
    const userId = await getUserId(ctx);
    if (!userId) return null;

    return await ctx.db
        .query("users")
        .withIndex("by_auth_id", (q) => q.eq("authId", userId))
        .unique();
};

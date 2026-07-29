# Convex backend

Convex backend of the app, created by migrating `src/server` in phases. The app now
runs entirely on Convex: book/library data through the domain functions, and
better-auth persists to Convex through the adapter in `convex/betterAuth.ts`.

## Migration plan

1. **Done — counterparts.** Every table and server function from `src/server` has a
   Convex counterpart (this folder), and every hook in `src/server/use` has a Convex
   counterpart in `src/convex/use`.
2. **Done — data migration.** Run `pnpm convex:export` (see
   `scripts/exportForConvex.ts`) to dump Postgres as Convex-ready JSONL files in
   `convex-export/`, then load them with the `npx convex import --replace` commands
   the script prints (add `--prod` for production). Re-running export + import is
   always safe. Sessions/accounts/verifications are only exported with
   `--include-auth` — they stay live in Postgres until phase 4.
3. **Done — switch calls.** All components and routes use `@/convex/use/...` hooks;
   the book route loads through `ConvexHttpClient` + `api.books.getWithGoogleFallback`;
   ids of finished dates and unreleased books are Convex ids (strings) in `src/type`.
   The now-dead `src/server/use` hooks were removed; `VITE_CONVEX_URL` is required at
   runtime from this phase on.
4. **Done — auth on Convex.** better-auth remains the auth engine (Google sign-in,
   cookies and sessions unchanged) but persists to the Convex auth tables through a
   custom adapter (`src/lib/auth/convexAdapter.ts` → `convex/betterAuth.ts`,
   secret-gated with `BETTER_AUTH_SECRET`). better-auth user ids are preserved as
   `authId`, so domain rows keep their references — and imported sessions keep users
   logged in. Cutover steps:
    - `npx convex env set BETTER_AUTH_SECRET <same value as the app>` (and `--prod`)
    - `pnpm convex:export --include-auth`, then import `users`, `sessions`,
      `accounts` and `verifications` (add `--prod` for production)
    - deploy; `src/server`, `drizzle.config.ts`, the `db:*` scripts and the
      drizzle/pg dependencies are now fully dead and safe to delete (`DATABASE_URL`
      and `GOOGLE_BOOKS_API_KEY` are optional in `src/env.ts` already)

## Getting started

```sh
npx convex dev        # creates the deployment, writes .env.local, regenerates _generated/
```

- Set `VITE_CONVEX_URL` (printed by `convex dev`) in `.env` so the app can connect.
- Set `GOOGLE_BOOKS_API_KEY` on the Convex deployment (`npx convex env set ...`) —
  used by `books.getWithGoogleFallback`.
- Set `BETTER_AUTH_SECRET` on the Convex deployment to the same value the app server
  uses — it gates the better-auth storage functions in `betterAuth.ts`.
- The Google OAuth token is per-user and still comes from better-auth (`getUser`);
  hooks pass it into the functions that talk to the Google Books API.

## What maps to what

| Old (`src/server`)                                                 | New                                                        |
| ------------------------------------------------------------------ | ---------------------------------------------------------- |
| `db/schema/book.ts`                                                | `books` table (`schema.ts`)                                |
| `db/schema/library.ts`                                             | `library` table                                            |
| `db/schema/finished.ts`                                            | `finished` table                                           |
| `db/schema/rating.ts`                                              | `ratings` table                                            |
| `db/schema/unreleasedBook.ts`                                      | `unreleasedBooks` table                                    |
| `db/schema/auth.ts`                                                | `users` / `sessions` / `accounts` / `verifications` tables |
| `repo/book.ts`                                                     | `books.ts`                                                 |
| `repo/library.ts`                                                  | `library.ts`                                               |
| `repo/finished.ts`                                                 | `finished.ts`                                              |
| `repo/rating.ts`                                                   | `ratings.ts`                                               |
| `repo/unreleasedBook.ts`                                           | `unreleasedBooks.ts`                                       |
| `repo/google.ts`, `use/useSearchedBooks.ts`, `use/useBookShelf.ts` | `googleBooks.ts` (actions)                                 |
| `use/status/*`, `use/useBookStatus.ts`                             | `status.ts` + `src/convex/use/status/*`                    |
| `use/*` (React hooks)                                              | `src/convex/use/*`                                         |
| `repo/auth.ts` (`getUser`)                                         | `src/lib/auth/getUser.ts` (storage: `betterAuth.ts`)       |

## Why this is faster than the old server

- **Indexed point reads everywhere** — every query goes through an index
  (`by_user_type_book`, `by_user_book_time`, …); no table scans, no `COUNT(*)` query
  per library page.
- **One round trip per user action** — flows like _finish book_ were 4-5 sequential
  HTTP calls orchestrated by the browser; each is now a single transactional mutation
  (`status.ts`), so they're also atomic — no half-applied states.
- **Google Bookshelf sync off the critical path** — scheduled server-side
  (`ctx.scheduler`) instead of blocking the user-facing write; it was already
  best-effort/fire-and-forget semantically.
- **Reactive queries instead of cache bookkeeping** — the old hooks hand-maintained
  TanStack Query caches (optimistic updates, rollbacks, refetches, cross-seeding).
  Convex subscriptions keep every view live automatically; the remaining optimistic
  updates are one-liners on the mutation itself.
- **Books cached server-side** — `books.getWithGoogleFallback` hits the Google API
  once per volume ever, then serves from the `books` table.

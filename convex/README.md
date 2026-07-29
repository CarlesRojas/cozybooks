# Convex backend

Convex counterpart of `src/server`, created as **phase 1** of the backend migration.
Nothing in the app calls it yet — the old server folder keeps running untouched until
the switch-over.

## Migration plan

1. **Done — counterparts.** Every table and server function from `src/server` has a
   Convex counterpart (this folder), and every hook in `src/server/use` has a Convex
   counterpart in `src/convex/use`.
2. **Next — data migration.** Run `pnpm convex:export` (see
   `scripts/exportForConvex.ts`) to dump Postgres as Convex-ready JSONL files in
   `convex-export/`, then load them with the `npx convex import --replace` commands
   the script prints (add `--prod` for production). Re-running export + import is
   always safe. Sessions/accounts/verifications are only exported with
   `--include-auth` — they stay live in Postgres until phase 4.
3. **Then — switch calls.** Replace `@/server/use/...` imports with `@/convex/use/...`
   and route/loader calls with `ConvexHttpClient` calls (e.g.
   `api.books.getWithGoogleFallback` for the book route loader). The hooks keep the
   familiar `{ data, isLoading }` / `{ mutate, isPending, isError }` shape, but ids of
   finished dates and unreleased books are now Convex ids (strings) instead of serial
   numbers — update `src/type` accordingly during this phase.
4. **Finally — delete `src/server`.** Auth is the one dependency to resolve first:
   better-auth currently persists through Drizzle/Postgres (`src/lib/auth` imports
   `@/server/db`). Move it to the Convex adapter (`@convex-dev/better-auth`) — or keep
   Postgres for auth only — before deleting the folder.

## Getting started

```sh
npx convex dev        # creates the deployment, writes .env.local, regenerates _generated/
```

- Set `VITE_CONVEX_URL` (printed by `convex dev`) in `.env` so the app can connect.
- Set `GOOGLE_BOOKS_API_KEY` on the Convex deployment (`npx convex env set ...`) —
  used by `books.getWithGoogleFallback`.
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
| `repo/auth.ts` (`getUser`)                                         | stays on better-auth until phase 4                         |

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

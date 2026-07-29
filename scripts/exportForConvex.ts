// Phase 2 of the Convex migration: exports the Postgres data as JSONL files that
// `npx convex import` can load, one file per Convex table (see convex/schema.ts).
//
// Usage:
//   pnpm convex:export                # domain tables + users
//   pnpm convex:export --include-auth # also sessions / accounts / verifications
//
// Reads DATABASE_URL from the environment (falls back to parsing ./.env) and writes
// to ./convex-export/. Then load the files with the printed `npx convex import`
// commands (add --prod for the production deployment). Imports use --replace, so
// re-running export + import is always safe.
//
// Transforms applied (Convex functions/validators expect these shapes):
// - timestamps become ms since epoch
// - null fields are dropped entirely (v.optional means absent, not null)
// - book."index" (the Google Books volume id) becomes books.googleId
// - serial ids of finished / unreleasedBook are dropped (Convex assigns _id)
// - auth row ids are kept as authId, so domain rows keep referencing users by the
//   same better-auth id strings and no id remapping is needed anywhere

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { Pool } from "pg";

const OUT_DIR = "convex-export";
const LIBRARY_TYPES = new Set(["READING", "TO_READ", "FINISHED"]);

const loadDatabaseUrl = () => {
    if (process.env.DATABASE_URL) return process.env.DATABASE_URL;

    const envPath = join(process.cwd(), ".env");
    if (existsSync(envPath)) {
        for (const line of readFileSync(envPath, "utf8").split("\n")) {
            const match = /^\s*DATABASE_URL\s*=\s*"?([^"\n]+)"?\s*$/.exec(line);
            if (match) return match[1];
        }
    }

    console.error("DATABASE_URL is not set (and no .env with it was found). Aborting.");
    process.exit(1);
};

const ms = (value: Date | null | undefined) => (value ? value.getTime() : undefined);

// Convex `v.optional` fields must be absent, not null — drop null/undefined values.
const stripEmpty = (row: Record<string, unknown>) =>
    Object.fromEntries(Object.entries(row).filter(([, value]) => value !== null && value !== undefined));

const writeJsonl = (table: string, rows: Array<Record<string, unknown>>) => {
    const path = join(OUT_DIR, `${table}.jsonl`);
    writeFileSync(path, rows.map((row) => JSON.stringify(stripEmpty(row))).join("\n") + (rows.length > 0 ? "\n" : ""));
    console.log(`  ${table.padEnd(15)} ${String(rows.length).padStart(6)} rows -> ${path}`);
    return table;
};

const main = async () => {
    const includeAuth = process.argv.includes("--include-auth");
    const pool = new Pool({ connectionString: loadDatabaseUrl() });
    mkdirSync(OUT_DIR, { recursive: true });

    console.log("Exporting Postgres -> Convex JSONL\n");
    const tables: Array<string> = [];

    // book -> books
    const books = await pool.query(`SELECT * FROM "book"`);
    tables.push(
        writeJsonl(
            "books",
            books.rows.map((row) => ({
                googleId: row.index,
                title: row.title,
                authors: row.authors,
                publisher: row.publisher,
                publishedDate: ms(row.publishedDate),
                description: row.description,
                pageCount: row.pageCount,
                categories: row.categories,
                mainCategory: row.mainCategory,
                averageRating: row.averageRating,
                ratingsCount: row.ratingsCount,
                language: row.language,
                previewLink: row.previewLink,
                smallThumbnail: row.smallThumbnail,
                thumbnail: row.thumbnail,
                small: row.small,
                medium: row.medium,
                large: row.large,
                extraLarge: row.extraLarge,
            })),
        ),
    );

    // library -> library
    const library = await pool.query(`SELECT * FROM "library"`);
    const validLibraryRows = library.rows.filter((row) => {
        if (LIBRARY_TYPES.has(row.type)) return true;
        console.warn(`  WARNING: skipping library row with unknown type "${row.type}" (user ${row.userId}, book ${row.bookId})`);
        return false;
    });
    tables.push(
        writeJsonl(
            "library",
            validLibraryRows.map((row) => ({
                userId: row.userId,
                bookId: row.bookId,
                type: row.type,
                createdAt: ms(row.createdAt) ?? Date.now(),
            })),
        ),
    );

    // finished -> finished (serial id dropped, Convex assigns _id)
    const finished = await pool.query(`SELECT * FROM "finished"`);
    tables.push(
        writeJsonl(
            "finished",
            finished.rows.map((row) => ({ userId: row.userId, bookId: row.bookId, timestamp: ms(row.timestamp) })),
        ),
    );

    // rating -> ratings
    const ratings = await pool.query(`SELECT * FROM "rating"`);
    tables.push(
        writeJsonl(
            "ratings",
            ratings.rows.map((row) => ({ userId: row.userId, bookId: row.bookId, rating: row.rating })),
        ),
    );

    // unreleasedBook -> unreleasedBooks (serial id dropped)
    const unreleasedBooks = await pool.query(`SELECT * FROM "unreleasedBook"`);
    tables.push(
        writeJsonl(
            "unreleasedBooks",
            unreleasedBooks.rows.map((row) => ({ userId: row.userId, name: row.name })),
        ),
    );

    // user -> users (better-auth id preserved as authId)
    const users = await pool.query(`SELECT * FROM "user"`);
    tables.push(
        writeJsonl(
            "users",
            users.rows.map((row) => ({
                authId: row.id,
                name: row.name,
                email: row.email,
                emailVerified: row.email_verified,
                image: row.image,
                createdAt: ms(row.created_at),
                updatedAt: ms(row.updated_at),
            })),
        ),
    );

    // Auth session state is only worth copying at the final cutover (phase 4);
    // better-auth keeps writing to Postgres until then.
    if (includeAuth) {
        const sessions = await pool.query(`SELECT * FROM "session"`);
        tables.push(
            writeJsonl(
                "sessions",
                sessions.rows.map((row) => ({
                    authId: row.id,
                    expiresAt: ms(row.expires_at),
                    token: row.token,
                    createdAt: ms(row.created_at),
                    updatedAt: ms(row.updated_at),
                    ipAddress: row.ip_address,
                    userAgent: row.user_agent,
                    userId: row.user_id,
                })),
            ),
        );

        const accounts = await pool.query(`SELECT * FROM "account"`);
        tables.push(
            writeJsonl(
                "accounts",
                accounts.rows.map((row) => ({
                    authId: row.id,
                    accountId: row.account_id,
                    providerId: row.provider_id,
                    userId: row.user_id,
                    accessToken: row.access_token,
                    refreshToken: row.refresh_token,
                    idToken: row.id_token,
                    accessTokenExpiresAt: ms(row.access_token_expires_at),
                    refreshTokenExpiresAt: ms(row.refresh_token_expires_at),
                    scope: row.scope,
                    password: row.password,
                    createdAt: ms(row.created_at),
                    updatedAt: ms(row.updated_at),
                })),
            ),
        );

        const verifications = await pool.query(`SELECT * FROM "verification"`);
        tables.push(
            writeJsonl(
                "verifications",
                verifications.rows.map((row) => ({
                    authId: row.id,
                    identifier: row.identifier,
                    value: row.value,
                    expiresAt: ms(row.expires_at),
                    createdAt: ms(row.created_at),
                    updatedAt: ms(row.updated_at),
                })),
            ),
        );
    }

    await pool.end();

    console.log("\nDone. Import into the dev deployment with:\n");
    for (const table of tables) console.log(`  npx convex import --table ${table} ${OUT_DIR}/${table}.jsonl --replace -y`);
    console.log("\nFor production, re-run this export first, then add --prod to each command.");
};

main().catch((error) => {
    console.error(error);
    process.exit(1);
});

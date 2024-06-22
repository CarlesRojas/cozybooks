import { library } from "@/server/schema/library";
import { SQL, relations, sql } from "drizzle-orm";
import { AnyPgColumn, pgTable, serial, text, uniqueIndex } from "drizzle-orm/pg-core";

export const lower = (email: AnyPgColumn): SQL => {
    return sql`lower(${email})`;
};

export const user = pgTable(
    "user",
    {
        id: serial("id").primaryKey(),
        email: text("email").notNull(),
        name: text("name").notNull(),
    },
    (table) => ({
        emailUniqueIndex: uniqueIndex("emailUniqueIndex").on(lower(table.email)),
    }),
);

export const userRelations = relations(user, ({ many }) => ({
    booksInLibrary: many(library),
}));

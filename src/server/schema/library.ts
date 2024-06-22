import { book } from "@/server/schema/book";
import { user } from "@/server/schema/user";
import { relations } from "drizzle-orm";
import { integer, pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core";

export const library = pgTable(
    "library",
    {
        userId: integer("userId")
            .references(() => user.id, { onDelete: "cascade" })
            .notNull(),
        bookId: text("bookId")
            .references(() => book.id, { onDelete: "cascade" })
            .notNull(),
        type: text("type").notNull(),
        createdAt: timestamp("createdAt").defaultNow(),
    },
    (table) => ({
        pk: primaryKey({ columns: [table.userId, table.type, table.bookId] }),
    }),
);

export const libraryRelations = relations(library, ({ one }) => ({
    user: one(user, {
        fields: [library.userId],
        references: [user.id],
    }),

    book: one(book, {
        fields: [library.bookId],
        references: [book.id],
    }),
}));

import { book, user } from "@/server/db/schema";
import { relations } from "drizzle-orm";
import { integer, pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

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
    (table) => [primaryKey({ columns: [table.userId, table.type, table.bookId] })],
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

export const libraryInsertSchema = createInsertSchema(library);
export const librarySelectSchema = createSelectSchema(library);

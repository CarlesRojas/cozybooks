import { book, user } from "@/server/schema";
import { relations } from "drizzle-orm";
import { integer, pgTable, primaryKey, text } from "drizzle-orm/pg-core";

export const rating = pgTable(
    "rating",
    {
        userId: integer("userId")
            .references(() => user.id, { onDelete: "cascade" })
            .notNull(),
        bookId: text("bookId")
            .references(() => book.id, { onDelete: "cascade" })
            .notNull(),
        rating: integer("rating").notNull(),
    },
    (table) => ({
        pk: primaryKey({ columns: [table.userId, table.bookId] }),
    }),
);

export const ratingRelations = relations(rating, ({ one }) => ({
    user: one(user, {
        fields: [rating.userId],
        references: [user.id],
    }),

    book: one(book, {
        fields: [rating.bookId],
        references: [book.id],
    }),
}));

import { book, user } from "@/server/db/schema";
import { relations } from "drizzle-orm";
import { integer, pgTable, primaryKey, text } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const rating = pgTable(
    "rating",
    {
        userId: text("userId")
            .references(() => user.id, { onDelete: "cascade" })
            .notNull(),
        bookId: text("bookId")
            .references(() => book.id, { onDelete: "cascade" })
            .notNull(),
        rating: integer("rating").notNull(),
    },
    (table) => [primaryKey({ columns: [table.userId, table.bookId] })],
);

export const ratingRelations = relations(rating, ({ one }) => ({
    user: one(user, { fields: [rating.userId], references: [user.id] }),
    book: one(book, { fields: [rating.bookId], references: [book.id] }),
}));

export const ratingInsertSchema = createInsertSchema(rating);
export const ratingSelectSchema = createSelectSchema(rating);

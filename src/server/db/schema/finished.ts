import { book, user } from "@/server/db/schema";
import { relations } from "drizzle-orm";
import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "drizzle-zod";

export const finished = pgTable("finished", {
    id: serial("id").primaryKey(),
    userId: integer("userId")
        .references(() => user.id, { onDelete: "cascade" })
        .notNull(),
    bookId: text("bookId")
        .references(() => book.id, { onDelete: "cascade" })
        .notNull(),
    timestamp: timestamp("timestamp").notNull(),
});

export const finishedRelations = relations(finished, ({ one }) => ({
    book: one(book, {
        fields: [finished.bookId],
        references: [book.id],
    }),
}));

export const finishedInsertSchema = createInsertSchema(finished);
const rawFinishedUpdateSchema = createUpdateSchema(finished);
export const finishedUpdateSchema = rawFinishedUpdateSchema.extend({
    id: rawFinishedUpdateSchema.shape.id.nonoptional(),
});
export const finishedSelectSchema = createSelectSchema(finished);

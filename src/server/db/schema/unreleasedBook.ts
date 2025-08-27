import { user } from "@/server/db/schema";
import { relations } from "drizzle-orm";
import { pgTable, serial, text } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const unreleasedBook = pgTable("unreleasedBook", {
    id: serial("id").primaryKey(),
    userId: text("userId")
        .references(() => user.id, { onDelete: "cascade" })
        .notNull(),

    name: text("name").notNull(),
});

export const unreleasedBookRelations = relations(unreleasedBook, ({ one }) => ({
    user: one(user, { fields: [unreleasedBook.userId], references: [user.id] }),
}));

export const unreleasedBookInsertSchema = createInsertSchema(unreleasedBook);
export const unreleasedBookSelectSchema = createSelectSchema(unreleasedBook);

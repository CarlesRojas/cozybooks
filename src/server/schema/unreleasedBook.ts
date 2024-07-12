import { user } from "@/server/schema";
import { relations } from "drizzle-orm";
import { integer, pgTable, serial, text } from "drizzle-orm/pg-core";

export const unreleasedBook = pgTable("unreleasedBook", {
    id: serial("id").primaryKey(),
    userId: integer("userId")
        .references(() => user.id, { onDelete: "cascade" })
        .notNull(),

    name: text("name").notNull(),
});

export const unreleasedBookRelations = relations(unreleasedBook, ({ one }) => ({
    user: one(user, {
        fields: [unreleasedBook.userId],
        references: [user.id],
    }),
}));

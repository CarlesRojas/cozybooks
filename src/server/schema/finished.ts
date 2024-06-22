import { book } from "@/server/schema/book";
import { user } from "@/server/schema/user";
import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

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

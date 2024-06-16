import { lower } from "@/server/database";
import { pgTable, serial, text, uniqueIndex } from "drizzle-orm/pg-core";

export const user = pgTable(
    "user",
    {
        id: serial("id").primaryKey(),
        email: text("email").notNull(),
        name: text("name").notNull(),
        image: text("image"),
    },
    (table) => ({
        emailUniqueIndex: uniqueIndex("emailUniqueIndex").on(lower(table.email)),
    }),
);

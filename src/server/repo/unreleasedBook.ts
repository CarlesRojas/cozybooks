import { db } from "@/server/db";
import { unreleasedBook, unreleasedBookInsertSchema } from "@/server/db/schema";
import { UnreleasedBook, UnreleasedBookSchema } from "@/type/UnreleasedBook";
import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { z } from "zod";

type InsertUnreleasedBook = typeof unreleasedBook.$inferInsert;

export const addUnreleasedBook = createServerFn({ method: "POST" })
    .validator((unreleasedBook: InsertUnreleasedBook) => {
        return unreleasedBookInsertSchema.parse(unreleasedBook);
    })
    .handler(async ({ data: insertUnreleasedBook }) => {
        await db.insert(unreleasedBook).values(insertUnreleasedBook);
    });

export const removeUnreleasedBook = createServerFn({ method: "POST" })
    .validator((id: number) => {
        return z.number().parse(id);
    })
    .handler(async ({ data: id }) => {
        await db.delete(unreleasedBook).where(eq(unreleasedBook.id, id));
    });

export const getUnreleasedBooks = createServerFn({ method: "POST" })
    .validator((userId: string) => {
        return z.string().parse(userId);
    })
    .handler(async ({ data: userId }) => {
        const results = await db.query.unreleasedBook.findMany({
            where: (unreleasedBook, { eq }) => eq(unreleasedBook.userId, userId),
            orderBy: (unreleasedBook, { asc }) => asc(unreleasedBook.name),
        });

        return z.array(UnreleasedBookSchema).parse(results) as UnreleasedBook[];
    });

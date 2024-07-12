"use server";

import { db } from "@/server/database";
import { unreleasedBook } from "@/server/schema";
import { UnreleasedBook, UnreleasedBookSchema } from "@/type/UnreleasedBook";
import { eq } from "drizzle-orm";
import { z } from "zod";

type InsertUnreleasedBook = typeof unreleasedBook.$inferInsert;

export const addUnreleasedBook = async (unreleasedBookBook: InsertUnreleasedBook) => {
    await db.insert(unreleasedBook).values(unreleasedBookBook);
};

export const removeUnreleasedBook = async (id: number) => {
    await db.delete(unreleasedBook).where(eq(unreleasedBook.id, id));
};

export const getUnreleasedBooks = async (userId: number) => {
    const results = await db.query.unreleasedBook.findMany({
        where: (unreleasedBook, { eq }) => eq(unreleasedBook.userId, userId),
        orderBy: (unreleasedBook, { asc }) => asc(unreleasedBook.name),
    });

    return z.array(UnreleasedBookSchema).parse(results) as UnreleasedBook[];
};

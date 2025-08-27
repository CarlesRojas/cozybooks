import type { Book } from "@/type/Book";
import { BookSchema } from "@/type/Book";
import { z } from "zod";

export interface TokenProps {
    token: string;
}

export const filteredArray = (s: z.ZodTypeAny) => z.array(z.any()).transform((as) => as.filter((a) => s.safeParse(a).success));

export const getBiggestBookImage = (book: Book) => {
    if (book.extraLarge) return book.extraLarge;
    if (book.large) return book.large;
    if (book.medium) return book.medium;
    if (book.small) return book.small;
    if (book.thumbnail) return book.thumbnail;
    if (book.smallThumbnail) return book.smallThumbnail;

    return undefined;
};

export const getSmallestBookImage = (book: Book) => {
    if (book.smallThumbnail) return book.smallThumbnail;
    if (book.thumbnail) return book.thumbnail;
    if (book.small) return book.small;
    if (book.medium) return book.medium;
    if (book.large) return book.large;
    if (book.extraLarge) return book.extraLarge;

    return undefined;
};

export const renderObject = (obj: Record<string, any>, level = 0) => {
    return (
        <ul style={{ marginLeft: `${level * 32}px` }} className="max-w-100vw overflow-x-hidden">
            {Object.entries(obj).map(([key, value], index) => (
                <li key={index}>
                    <strong className="text-sky-500">{key}:</strong> {typeof value === "object" ? renderObject(value, level + 1) : value}
                </li>
            ))}
        </ul>
    );
};

export const parseGoogleBook = (googleBook: any) => {
    const rawBook = { id: googleBook.id };
    if (googleBook.volumeInfo) Object.assign(rawBook, googleBook.volumeInfo);
    if (googleBook.volumeInfo?.imageLinks) Object.assign(rawBook, googleBook.volumeInfo.imageLinks);
    return BookSchema.parse(rawBook);
};

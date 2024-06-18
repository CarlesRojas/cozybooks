import { REFRESH_TOKEN_ERROR } from "@/const";
import { getServerUser } from "@/server/use/useServerUser";
import { BookImageLinks } from "@/type/Book";
import { BookShelf, BookShelfType } from "@/type/BookShelf";
import { Route } from "@/type/Route";
import { clsx, type ClassValue } from "clsx";
import { signOut } from "next-auth/react";
import { twMerge } from "tailwind-merge";
import { z } from "zod";

export interface TokenProps {
    token: string;
}

export const withToken = <T extends TokenProps, R>(fn: (props: T) => Promise<R>) => {
    return async (props?: Omit<T, "token">) => {
        const user = await getServerUser();
        const token = user?.accessToken;
        if (!user || user.error === REFRESH_TOKEN_ERROR || !token) await signOut({ callbackUrl: Route.AUTH_SIGN_IN });

        return await fn({ ...(props ?? {}), token } as T);
    };
};

export const cn = (...inputs: ClassValue[]) => {
    return twMerge(clsx(inputs));
};

export const filteredArray = (s: z.ZodTypeAny) => z.array(z.any()).transform((as) => as.filter((a) => s.safeParse(a).success));

export const getBiggestBookImage = (imageLinks: BookImageLinks) => {
    if (imageLinks.extraLarge) return imageLinks.extraLarge;
    if (imageLinks.large) return imageLinks.large;
    if (imageLinks.medium) return imageLinks.medium;
    if (imageLinks.small) return imageLinks.small;
    if (imageLinks.thumbnail) return imageLinks.thumbnail;
    if (imageLinks.smallThumbnail) return imageLinks.smallThumbnail;

    return undefined;
};

export const getSmallestBookImage = (imageLinks: BookImageLinks) => {
    if (imageLinks.smallThumbnail) return imageLinks.smallThumbnail;
    if (imageLinks.thumbnail) return imageLinks.thumbnail;
    if (imageLinks.small) return imageLinks.small;
    if (imageLinks.medium) return imageLinks.medium;
    if (imageLinks.large) return imageLinks.large;
    if (imageLinks.extraLarge) return imageLinks.extraLarge;

    return undefined;
};

export const getBookShelfOfType = (type: BookShelfType, bookShelves: BookShelf[]) => {
    return bookShelves.find((bookShelf) => bookShelf.id === type);
};

export const coercedArray = <T extends z.ZodTypeAny>(arg: T) => {
    return z
        .array(arg)
        .optional()
        .transform((val) => val ?? []);
};

export const renderObject = (obj: Record<string, any>, level = 0) => {
    if (!obj) return null;

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

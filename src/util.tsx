import { REFRESH_TOKEN_ERROR } from "@/const";
import { getServerUser } from "@/server/use/useServerUser";
import { Book } from "@/type/Book";
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

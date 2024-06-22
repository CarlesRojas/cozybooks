"use client";

import { Book } from "@/type/Book";
import { cn, getBiggestBookImage } from "@/util";
import { Link } from "next-view-transitions";
import Image from "next/image";
import { AnchorHTMLAttributes, ReactNode, forwardRef, useMemo, useRef, useState } from "react";
import { LuBook } from "react-icons/lu";

export interface Props extends AnchorHTMLAttributes<HTMLAnchorElement> {
    book: Book;
    maxWidth?: number;
}

const BookCover = forwardRef<HTMLAnchorElement, Props>(({ book, href, maxWidth, className, ...props }, ref) => {
    const biggestImage = useRef(book && getBiggestBookImage(book));

    const scaledImage = useMemo(() => {
        if (!biggestImage.current) return null;

        const imageParams = new URLSearchParams(biggestImage.current.split("?")[1]);
        const id = imageParams.get("id");
        if (!id) return null;

        return `https://books.google.com/books/publisher/content/images/frontcover/${id}?fife=w400-h600&source=gbs_api`;
    }, [biggestImage]);

    const [src, setSrc] = useState(scaledImage ?? biggestImage.current);

    const container = (children: ReactNode) =>
        href ? (
            <Link
                className={cn("group relative aspect-book w-full focus-visible:outline-none mouse:cursor-pointer", className)}
                ref={ref}
                href={href}
                scroll={true}
                {...props}
            >
                {children}
            </Link>
        ) : (
            <div className={cn("group relative aspect-book w-full focus-visible:outline-none", className)}>{children}</div>
        );

    return container(
        <>
            <div
                className="skeleton absolute inset-0 -z-20 h-full w-full rounded-xl"
                style={{ viewTransitionName: `bookCover-bg-${book.id}` }}
            />

            {src && (
                <Image
                    className={cn(
                        "absolute inset-0 -z-10 h-full w-full select-none object-cover object-center blur-md transition-opacity",
                        !href && "opacity-100 dark:opacity-40",
                        href &&
                            "opacity-0 mouse:group-hover:opacity-100 mouse:group-focus:opacity-100 mouse:dark:group-hover:opacity-60 mouse:dark:group-focus:opacity-60",
                    )}
                    style={{ viewTransitionName: `bookCover-blur-${book.id}` }}
                    width={200}
                    height={200 * 1.5}
                    src={src}
                    alt={book.title}
                    onError={() => setSrc(biggestImage.current)}
                />
            )}

            {src && (
                <Image
                    className={cn(
                        "h-full w-full select-none rounded-xl border border-neutral-500/10 object-cover object-center transition-transform",
                        href && "mouse:group-hover:scale-[1.02] mouse:group-focus:scale-[1.02]",
                    )}
                    style={{ viewTransitionName: `bookCover-${book.id}` }}
                    width={maxWidth ?? 400}
                    height={(maxWidth ?? 400) * 1.5}
                    src={src}
                    alt={book.title}
                    onError={() => setSrc(biggestImage.current)}
                />
            )}

            {!src && (
                <div
                    className={cn(
                        "absolute inset-0 -z-10 h-full w-full select-none bg-neutral-200 object-cover object-center blur-md transition-opacity dark:bg-neutral-800",
                        !href && "opacity-100 dark:opacity-100",
                        href &&
                            "opacity-0 mouse:group-hover:opacity-100 mouse:group-focus:opacity-100 mouse:dark:group-hover:opacity-100 mouse:dark:group-focus:opacity-100",
                    )}
                    style={{ viewTransitionName: `bookCover-blur-${book.id}` }}
                />
            )}

            {!src && (
                <div
                    className={cn(
                        "flex h-full w-full select-none flex-col items-center justify-center gap-1 rounded-xl border border-neutral-500/10 bg-neutral-150 object-cover object-center p-3 transition-transform dark:bg-neutral-850",
                        href && "mouse:group-hover:scale-[1.02] mouse:group-focus:scale-[1.02]",
                    )}
                    style={{ viewTransitionName: `bookCover-${book.id}` }}
                >
                    <LuBook className={cn("mb-2 size-8 min-h-8 min-w-8 stroke-2", !href && "size-16 min-h-16 min-w-16 stroke-2")} />

                    {href && <h3 className="text-center font-bold leading-snug tracking-wide">{book.title}</h3>}

                    {href && book.authors && book.authors.length > 0 && (
                        <p className="text-center text-sm font-semibold leading-snug tracking-wide opacity-50">{book.authors[0]}</p>
                    )}
                </div>
            )}
        </>,
    );
});
BookCover.displayName = "BookCover";

export default BookCover;

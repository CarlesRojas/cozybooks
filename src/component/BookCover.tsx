"use client";

import { Book } from "@/type/Book";
import { cn, getBiggestBookImage, getSmallestBookImage } from "@/util";
import Image from "next/image";
import Link from "next/link";
import { AnchorHTMLAttributes, ReactNode, forwardRef, useMemo, useRef, useState } from "react";

export interface Props extends AnchorHTMLAttributes<HTMLAnchorElement> {
    book: Book;
}

const BookCover = forwardRef<HTMLAnchorElement, Props>(({ book, href, className, ...props }, ref) => {
    const smallestImage = useRef(book.volumeInfo.imageLinks && getSmallestBookImage(book.volumeInfo.imageLinks));
    const biggestImage = useRef(book.volumeInfo.imageLinks && getBiggestBookImage(book.volumeInfo.imageLinks));

    const scaledImage = useMemo(() => {
        // TODO Get missing image
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
                {...props}
            >
                {children}
            </Link>
        ) : (
            <div className={cn("group relative aspect-book w-full focus-visible:outline-none", className)}>{children}</div>
        );

    return container(
        <>
            <div className="skeleton absolute inset-0 -z-20 h-full w-full rounded-xl"></div>

            {src && (
                <Image
                    className={cn(
                        "absolute inset-0 -z-10 h-full w-full select-none object-cover object-center blur-md transition-opacity",
                        !href && "opacity-100 dark:opacity-40",
                        href &&
                            "opacity-0 group-hover:opacity-100 group-focus:opacity-100 dark:group-hover:opacity-60 dark:group-focus:opacity-60",
                    )}
                    width={200}
                    height={300}
                    src={src}
                    alt={book.volumeInfo.title}
                    onError={() => setSrc(biggestImage.current)}
                />
            )}

            {src && (
                <Image
                    className={cn(
                        "h-full w-full select-none rounded-xl border border-neutral-500/10 object-cover object-center transition-transform",
                        href && "mouse:group-hover:scale-[1.02] mouse:group-focus:scale-[1.02]",
                    )}
                    width={400}
                    height={600}
                    src={src}
                    alt={book.volumeInfo.title}
                    onError={() => setSrc(biggestImage.current)}
                />
            )}
        </>,
    );
});
BookCover.displayName = "BookCover";

export default BookCover;

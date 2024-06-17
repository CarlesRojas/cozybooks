"use client";

import { Book } from "@/type/Book";
import { cn, getBiggestBookImage, getSmallestBookImage } from "@/util";
import { Slot } from "@radix-ui/react-slot";
import Image from "next/image";
import { ButtonHTMLAttributes, forwardRef, useMemo, useRef, useState } from "react";

export interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
    asChild?: boolean;
    book: Book;
    isInteractive?: boolean;
}

const BookCover = forwardRef<HTMLButtonElement, Props>(({ book, className, asChild = false, ...props }, ref) => {
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

    const Comp = asChild ? Slot : "button";
    return (
        <Comp
            className={cn("aspect-book group relative w-full focus-visible:outline-none mouse:cursor-pointer", className)}
            ref={ref}
            {...props}
        >
            <div className="skeleton absolute inset-0 -z-20 h-full w-full rounded-xl"></div>

            {!asChild && src && (
                <Image
                    className="absolute inset-0 -z-10 hidden h-full w-full select-none object-cover object-center opacity-0 blur-md transition-opacity group-hover:opacity-80 group-focus:opacity-80 dark:group-hover:opacity-60 dark:group-focus:opacity-60 mouse:block"
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
                        "h-full w-full select-none rounded-xl border border-neutral-200 object-cover object-center transition-transform dark:border-neutral-800",
                        !asChild && "mouse:group-hover:scale-[1.02] mouse:group-focus:scale-[1.02]",
                    )}
                    width={400}
                    height={600}
                    src={src}
                    alt={book.volumeInfo.title}
                    onError={() => setSrc(biggestImage.current)}
                />
            )}
        </Comp>
    );
});
BookCover.displayName = "BookCover";

export default BookCover;

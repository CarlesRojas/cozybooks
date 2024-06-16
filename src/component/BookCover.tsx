"use client";

import { Book } from "@/type/Book";
import { cn, getBiggestBookImage, getSmallestBookImage } from "@/util";
import Image from "next/image";
import { useMemo, useRef, useState } from "react";

interface Props {
    book: Book;
    isInteractive?: boolean;
}

const BookCover = ({ book, isInteractive = false }: Props) => {
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

    return (
        <div className="aspect-book group relative w-full rounded-xl border border-neutral-200 dark:border-neutral-800 mouse:cursor-pointer">
            <div className="skeleton absolute inset-0 -z-20 h-full w-full rounded-xl"></div>

            {src && (
                <Image
                    className="absolute inset-0 -z-10 hidden h-full w-full object-cover object-center opacity-0 blur-md transition-opacity group-focus-within:opacity-70 group-hover:opacity-90 dark:group-focus-within:opacity-70 dark:group-hover:opacity-50 mouse:block"
                    width={200}
                    height={300}
                    src={src}
                    alt={book.volumeInfo.title}
                    onError={() => setSrc(biggestImage.current)}
                />
            )}

            {src && (
                <Image
                    className={cn("h-full w-full rounded-xl object-cover object-center", isInteractive && "mouse:group-hover:scale-[1.02]")}
                    width={400}
                    height={600}
                    src={src}
                    alt={book.volumeInfo.title}
                    onError={() => setSrc(biggestImage.current)}
                />
            )}
        </div>
    );
};

export default BookCover;

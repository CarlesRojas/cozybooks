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
        if (!biggestImage.current) return null;

        const imageParams = new URLSearchParams(biggestImage.current.split("?")[1]);
        const id = imageParams.get("id");
        if (!id) return null;

        return `https://books.google.com/books/publisher/content/images/frontcover/${id}?fife=w400-h600&source=gbs_api`;
    }, [biggestImage]);

    const [src, setSrc] = useState(scaledImage ?? biggestImage.current);

    if (!src) return null;

    return (
        <div className="group relative aspect-book w-full mouse:cursor-pointer">
            {smallestImage.current && (
                <Image
                    className="absolute inset-0 -z-10 h-full w-full rounded-xl object-cover opacity-0 blur-md transition-opacity group-focus-within:opacity-70 group-hover:opacity-70 dark:group-focus-within:opacity-50 dark:group-hover:opacity-50"
                    width={200}
                    height={300}
                    src={src}
                    alt={book.volumeInfo.title}
                    onError={() => setSrc(biggestImage.current)}
                />
            )}

            <Image
                className={cn("h-full w-full rounded-xl object-cover", isInteractive && "mouse:group-hover:scale-[1.02]")}
                width={400}
                height={600}
                src={src}
                alt={book.volumeInfo.title}
                onError={() => setSrc(biggestImage.current)}
            />
        </div>
    );
};

export default BookCover;

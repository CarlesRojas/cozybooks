"use client";

import { Book } from "@/type/Book";
import { getBiggestBookImage } from "@/util";
import Image from "next/image";
import { useMemo, useRef, useState } from "react";

interface Props {
    book: Book;
}

const BookCover = ({ book }: Props) => {
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
        <Image
            key={book.id}
            className="aspect-book w-full rounded-xl object-cover"
            width={400}
            height={600}
            src={src}
            alt={book.volumeInfo.title}
            onError={() => setSrc(biggestImage.current)}
        />
    );
};

export default BookCover;

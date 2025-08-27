import { cn } from "@/lib/cn";
import { getBiggestBookImage } from "@/lib/util";
import { Book } from "@/type/Book";
import { Link } from "@tanstack/react-router";
import { Book as BookIcon } from "lucide-react";
import { ReactNode, useMemo, useRef, useState } from "react";

export interface Props {
    book: Book;
    maxWidth?: number;
    linkToBook?: boolean;
}

const BookCover = ({ book, maxWidth, linkToBook, ...props }: Props) => {
    const biggestImage = useRef(getBiggestBookImage(book));

    const scaledImage = useMemo(() => {
        if (!biggestImage.current) return null;

        const imageParams = new URLSearchParams(biggestImage.current.split("?")[1]);
        const id = imageParams.get("id");
        if (!id) return null;

        return `https://books.google.com/books/publisher/content/images/frontcover/${id}?fife=w400-h600&source=gbs_api`;
    }, [biggestImage]);

    const [src, setSrc] = useState(scaledImage ?? biggestImage.current);

    const container = (children: ReactNode) =>
        linkToBook ? (
            <Link
                to={"/book/$bookId"}
                params={{ bookId: book.id }}
                className="aspect-book group relative w-full cursor-pointer focus-visible:outline-none"
                resetScroll
                {...props}
            >
                {children}
            </Link>
        ) : (
            <div className="aspect-book group relative w-full focus-visible:outline-none">{children}</div>
        );

    return container(
        <>
            <div
                className="skeleton absolute inset-0 -z-20 h-full w-full rounded-xl"
                style={{ viewTransitionName: `bookCover-bg-${book.id}` }}
            />

            {src && (
                <img
                    className={cn(
                        "absolute inset-0 -z-10 h-full w-full object-cover object-center blur-[8px] transition-opacity select-none",
                        !linkToBook && "opacity-100 dark:opacity-40",
                        linkToBook &&
                            "opacity-0 group-hover:opacity-100 group-focus:opacity-100 dark:group-hover:opacity-60 dark:group-focus:opacity-60",
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
                <img
                    className={cn(
                        "h-full w-full rounded-xl border border-neutral-500/10 object-cover object-center transition-transform select-none",
                        linkToBook && "group-hover:scale-[1.02] group-focus:scale-[1.02]",
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
                        "absolute inset-0 -z-10 h-full w-full bg-neutral-200 object-cover object-center blur-[8px] transition-opacity select-none dark:bg-neutral-800",
                        !linkToBook && "opacity-100 dark:opacity-100",
                        linkToBook &&
                            "opacity-0 group-hover:opacity-100 group-focus:opacity-100 dark:group-hover:opacity-100 dark:group-focus:opacity-100",
                    )}
                    style={{ viewTransitionName: `bookCover-blur-${book.id}` }}
                />
            )}

            {!src && (
                <div
                    className={cn(
                        "bg-neutral-150 dark:bg-neutral-850 flex h-full w-full flex-col items-center justify-center gap-1 rounded-xl border border-neutral-500/10 object-cover object-center p-3 transition-transform select-none",
                        linkToBook && "group-hover:scale-[1.02] group-focus:scale-[1.02]",
                    )}
                    style={{ viewTransitionName: `bookCover-${book.id}` }}
                >
                    <BookIcon className={cn("mb-2 size-8 min-h-8 min-w-8 stroke-2", !linkToBook && "size-16 min-h-16 min-w-16 stroke-2")} />

                    {linkToBook && <h3 className="text-center leading-snug font-bold tracking-wide">{book.title}</h3>}

                    {linkToBook && book.authors && book.authors.length > 0 && (
                        <p className="text-center text-sm leading-snug font-semibold tracking-wide opacity-50">{book.authors[0]}</p>
                    )}
                </div>
            )}
        </>,
    );
};

export default BookCover;

import WantToReadButton from "@/component/WantToReadButton";
import { cn } from "@/lib/cn";
import { getBiggestBookImage } from "@/lib/util";
import type { Book } from "@/type/Book";
import { Link } from "@tanstack/react-router";
import { faBook } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { ReactNode } from "react";
import { useMemo, useRef, useState } from "react";

export interface Props {
    book: Book;
    maxWidth?: number;
    linkToBook?: boolean;
    wantToRead?: { userId: string };
}

const BookCover = ({ book, maxWidth, linkToBook, wantToRead, ...props }: Props) => {
    const biggestImage = useRef(getBiggestBookImage(book));

    const scaledImage = useMemo(() => {
        if (!biggestImage.current) return null;

        const imageParams = new URLSearchParams(biggestImage.current.split("?")[1]);
        const id = imageParams.get("id");
        if (!id) return null;

        return `https://books.google.com/books/publisher/content/images/frontcover/${id}?fife=w400-h616&source=gbs_api`;
    }, [biggestImage]);

    const [src, setSrc] = useState(scaledImage ?? biggestImage.current);

    const container = (children: ReactNode) =>
        linkToBook ? (
            <Link
                to={"/book/$bookId"}
                params={{ bookId: book.id }}
                className="aspect-book group relative block w-full cursor-pointer focus-visible:outline-none"
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
                className="skeleton absolute inset-0 -z-20 h-full w-full rounded-[22px]"
                style={{ viewTransitionName: `bookCover-bg-${book.id}` }}
            />

            {/* The cover's light, and only on the cover's own page — in a list it would
                fire on hover and light up whichever book the pointer crossed. Blurred
                far enough to spill past the edges and scaled so the spill is even. It
                carries less on the light theme, where colour bleeding onto a pale
                background shows much more readily than it does against a dark one. */}
            {src && !linkToBook && (
                <img
                    className="absolute inset-0 -z-10 h-full w-full scale-105 object-cover object-center opacity-60 blur-[32px] select-none dark:opacity-100"
                    style={{ viewTransitionName: `bookCover-blur-${book.id}` }}
                    width={200}
                    height={200 * 1.54}
                    src={src}
                    alt={book.title}
                    onError={() => setSrc(biggestImage.current)}
                />
            )}

            {src && (
                <img
                    className={cn(
                        "absolute inset-0 h-full w-full rounded-[22px] border border-neutral-500/25 object-cover object-center transition-transform select-none dark:border-neutral-500/40",
                        linkToBook && "group-hover:scale-[1.02] group-focus:scale-[1.02]",
                    )}
                    style={{ viewTransitionName: `bookCover-${book.id}` }}
                    width={maxWidth ?? 400}
                    height={(maxWidth ?? 400) * 1.54}
                    src={src}
                    alt={book.title}
                    onError={() => setSrc(biggestImage.current)}
                />
            )}

            {!src && !linkToBook && (
                <div
                    className="absolute inset-0 -z-10 h-full w-full scale-105 bg-neutral-200 object-cover object-center opacity-60 blur-[32px] select-none dark:bg-neutral-800 dark:opacity-100"
                    style={{ viewTransitionName: `bookCover-blur-${book.id}` }}
                />
            )}

            {!src && (
                <div
                    className={cn(
                        "bg-neutral-150 dark:bg-neutral-850 absolute inset-0 flex h-full w-full flex-col items-center justify-center gap-1 overflow-hidden rounded-[22px] border border-neutral-500/25 p-3 transition-transform select-none dark:border-neutral-500/40",
                        linkToBook && "group-hover:scale-[1.02] group-focus:scale-[1.02]",
                    )}
                    style={{ viewTransitionName: `bookCover-${book.id}` }}
                >
                    <FontAwesomeIcon
                        icon={faBook}
                        className={cn("mb-2 size-8 min-h-8 min-w-8 stroke-2", !linkToBook && "size-16 min-h-16 min-w-16 stroke-2")}
                    />

                    {linkToBook && <h3 className="line-clamp-4 text-center leading-snug font-bold tracking-wide">{book.title}</h3>}

                    {linkToBook && book.authors && book.authors.length > 0 && (
                        <p className="line-clamp-2 text-center text-sm leading-snug font-semibold tracking-wide opacity-50">
                            {book.authors[0]}
                        </p>
                    )}
                </div>
            )}

            {wantToRead && <WantToReadButton book={book} userId={wantToRead.userId} />}
        </>,
    );
};

export default BookCover;

import BackButton from "@/component/BackButton";
import BookCover from "@/component/BookCover";
import NotFound, { NotFoundType } from "@/component/NotFound";
import ShowMore from "@/component/ShowMore";
import { Button } from "@/component/ui/button";
import { getBook } from "@/server/use/useBook";
import { cn, renderObject } from "@/util";
import { convertHtmlToReact } from "@hedgedoc/html-to-react";
import Link from "next/link";
import { isIOS } from "react-device-detect";
import { FaGoogle } from "react-icons/fa6";

interface Props {
    params: { bookId: string };
}

const BookPage = async ({ params: { bookId } }: Props) => {
    const book = await getBook({ bookId });
    if (!book) return <NotFound type={NotFoundType.BOOK} />;

    const {
        volumeInfo: { title, authors, description, pageCount, previewLink },
    } = book;

    return (
        <main
            suppressHydrationWarning
            className={cn("relative mx-auto mb-20 flex h-fit w-full max-w-screen-lg flex-col gap-6 p-6", isIOS && "mb-24")}
        >
            <BackButton className="sticky top-6" />

            <div className="relative flex w-full flex-col items-center gap-6">
                <div className="relative aspect-book w-full max-w-[80vw] sm:max-w-[20rem]">
                    <BookCover key={book.id} book={book} />
                </div>

                <div className="relative flex w-full flex-col items-center gap-2">
                    <h1 className="mx-auto w-full text-balance text-center text-3xl font-bold leading-tight tracking-wide sm:max-w-[20rem]">
                        {title}
                    </h1>

                    <div className="flex w-full flex-wrap justify-center gap-x-2">
                        {authors &&
                            authors.length > 0 &&
                            authors.map((author) => (
                                <p key={author} className="text-sm font-medium leading-snug tracking-wide opacity-80">
                                    {author}
                                </p>
                            ))}
                    </div>

                    {pageCount && <p className="text-sm font-medium leading-snug tracking-wide opacity-50">{pageCount} pages</p>}
                </div>

                {/* TODO show user actions */}
                {/* TODO show rating */}

                {description && (
                    <div className="prose prose-neutral dark:prose-invert">
                        <ShowMore className="opacity-90" truncate={256} expandText="Expand description" collapseText="Collapse description">
                            {convertHtmlToReact(description)}
                        </ShowMore>
                    </div>
                )}

                {previewLink && (
                    <Button asChild variant="glass">
                        <Link href={previewLink} target="_blank" rel="noopener noreferrer">
                            <FaGoogle className="icon mr-3" />
                            <p>View on Google Books</p>
                        </Link>
                    </Button>
                )}
            </div>

            {renderObject(book)}
        </main>
    );
};

export default BookPage;

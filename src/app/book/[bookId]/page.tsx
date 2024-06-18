import BackButton from "@/component/BackButton";
import BookCover from "@/component/BookCover";
import NotFound, { NotFoundType } from "@/component/NotFound";
import ShowMore from "@/component/ShowMore";
import { Button } from "@/component/ui/button";
import { getBook } from "@/server/use/useBook";
import { cn } from "@/util";
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
        volumeInfo: { title, authors, description, pageCount, previewLink, categories },
    } = book;

    const categorySet = new Set(categories?.flatMap((category) => category.split("/").map((category) => category.trim())) ?? []);

    return (
        <main
            suppressHydrationWarning
            className={cn("relative mx-auto mb-24 flex h-fit w-full max-w-screen-lg flex-col gap-6 p-6", isIOS && "mb-28")}
        >
            <BackButton className="sticky top-6" />

            <div className="relative flex w-full flex-col items-center gap-6">
                <div className="relative aspect-book w-full max-w-[80vw] sm:max-w-[20rem]">
                    <BookCover key={book.id} book={book} />
                </div>

                <div className="relative flex w-full flex-col items-center gap-2">
                    <h1 className="mx-auto w-full text-pretty text-center text-3xl font-bold leading-tight tracking-wide sm:max-w-screen-sm">
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
                    <div className="prose prose-neutral flex w-fit flex-col items-center rounded-3xl border border-neutral-200 bg-gradient-to-tl from-neutral-150 to-neutral-200 px-4 pb-5 pt-1 dark:prose-invert dark:border-neutral-800 dark:from-neutral-850 dark:to-neutral-800 sm:px-6 sm:pb-6 sm:pt-2">
                        <ShowMore truncate={256} expandText="Expand description" collapseText="Collapse description">
                            {convertHtmlToReact(description)}
                        </ShowMore>
                    </div>
                )}

                <div className="mb-8 mt-12 flex w-full flex-wrap justify-center gap-x-4 gap-y-2">
                    {Array.from(categorySet).map((category) => (
                        <p key={category} className="text-sm font-medium leading-snug tracking-wide opacity-50">
                            {category}
                        </p>
                    ))}
                </div>

                {previewLink && (
                    <Button asChild variant="ghost">
                        <Link href={previewLink} target="_blank" rel="noopener noreferrer">
                            <FaGoogle className="icon mr-3" />
                            <p>View on Google Books</p>
                        </Link>
                    </Button>
                )}
            </div>

            {/* {renderObject(book)} */}
        </main>
    );
};

export default BookPage;

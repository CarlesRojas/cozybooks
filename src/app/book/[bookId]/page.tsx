import BackButton from "@/component/BackButton";
import BookCover from "@/component/BookCover";
import FinishedOn from "@/component/FinishedOn";
import LibraryButton from "@/component/LibraryButton";
import NotFound, { NotFoundType } from "@/component/NotFound";
import Rating from "@/component/Rating";
import ShowMore from "@/component/ShowMore";
import { Button } from "@/component/ui/button";
import { getBookWithGoogleFallback } from "@/server/action/book";
import { cn } from "@/util";
import { convertHtmlToReact } from "@hedgedoc/html-to-react";
import Link from "next/link";
import { isIOS } from "react-device-detect";
import { FaGoogle } from "react-icons/fa6";

interface Props {
    params: { bookId: string };
}

export const dynamic = "force-static";
export const revalidate = 60 * 60 * 24 * 30; // 30 days

const BookPage = async ({ params: { bookId } }: Props) => {
    const book = await getBookWithGoogleFallback(bookId);
    if (!book) return <NotFound type={NotFoundType.BOOK} />;

    const { title, authors, description, pageCount, previewLink, categories } = book;

    const categorySet = new Set(categories?.flatMap((category) => category.split("/").map((category) => category.trim())) ?? []);

    return (
        <main
            suppressHydrationWarning
            className={cn("relative mx-auto mb-24 flex h-fit w-full max-w-screen-lg flex-col gap-6 p-6", isIOS && "mb-28")}
        >
            <BackButton className="sticky top-6" />

            <div className="relative flex w-full flex-col items-center gap-6 sm:gap-8">
                <div className="relative aspect-book w-full max-w-[75vw] sm:max-w-[20rem]">
                    <BookCover key={book.id} book={book} />
                </div>

                <div className="relative flex w-full flex-col items-center gap-2">
                    <h1 className="mx-auto w-full text-pretty text-center text-3xl font-bold leading-tight tracking-wide sm:max-w-screen-sm">
                        {title}
                    </h1>

                    <div className="flex w-full flex-wrap justify-center gap-x-4 gap-y-2">
                        {authors &&
                            authors.length > 0 &&
                            authors.map((author) => (
                                <p key={author} className="text-sm font-medium leading-snug tracking-wide opacity-60">
                                    {author}
                                </p>
                            ))}
                    </div>

                    {pageCount && <p className="text-sm font-medium leading-snug tracking-wide opacity-60">{pageCount} pages</p>}
                </div>

                <Rating book={book} tooltipSide="top" />

                <LibraryButton book={book} />

                <FinishedOn book={book} />

                {description && (
                    <div className="prose prose-neutral flex w-fit flex-col items-center rounded-3xl bg-neutral-150 px-4 pb-5 pt-1 dark:prose-invert dark:bg-neutral-850 sm:px-6 sm:pb-6 sm:pt-2">
                        <ShowMore truncate={256} expandText="Expand description" collapseText="Collapse description">
                            {convertHtmlToReact(description)}
                        </ShowMore>
                    </div>
                )}

                <div className="mb-8 mt-12 flex w-full flex-wrap justify-center gap-x-4 gap-y-2">
                    {Array.from(categorySet).map((category) => (
                        <p key={category} className="text-sm font-medium leading-snug tracking-wide opacity-60">
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

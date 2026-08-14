import BackButton from "@/component/BackButton";
import BookCover from "@/component/BookCover";
import FinishedOn from "@/component/FinishedOn";
import LibraryButton from "@/component/LibraryButton";
import NotFound, { NotFoundType } from "@/component/NotFound";
import Rating from "@/component/Rating";
import RelatedBooks from "@/component/RelatedBooks";
import ShowMore from "@/component/ShowMore";
import { Button } from "@/component/ui/button";
import { cn } from "@/lib/cn";
import { convexHttpClient } from "@/convex/http";
import { fromWireBook } from "@/convex/map";
import { api } from "@convex/_generated/api";
import { convertHtmlToReact } from "@hedgedoc/html-to-react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { faPenToSquare } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { isIOS } from "react-device-detect";

export const Route = createFileRoute("/_protected/book/$bookId/")({
    component: RouteComponent,
    beforeLoad: async ({ params, context }) => {
        if (!convexHttpClient) return { book: null };

        // The reader is part of the lookup: a book somebody wrote themselves is only
        // ever returned to them, so anyone else asking for that id gets nothing —
        // the same answer as an id that was never a book.
        const book = await convexHttpClient.action(api.books.getWithGoogleFallback, {
            bookId: params.bookId,
            userId: context.user?.id,
        });

        return { book: book ? fromWireBook(book) : null };
    },
});

function RouteComponent() {
    const { book, user } = Route.useRouteContext();
    if (!book) return <NotFound type={NotFoundType.BOOK} />;

    const { title, authors, description, pageCount, previewLink, categories } = book;

    // A book this user wrote. It has no Google page to link to and no catalogue
    // neighbours to relate it to — what it has instead is an owner, who can edit it.
    const isOwnBook = !!book.ownerId && book.ownerId === user?.id;

    const categorySet = new Set(categories?.flatMap((c) => c.split("/").map((category) => category.trim())) ?? []);

    return (
        <main suppressHydrationWarning className={cn("relative mb-24 flex h-fit w-full flex-col gap-6 p-6 lg:pt-25", isIOS && "mb-28")}>
            {/* Sticky rather than fixed so it keeps its place in the column: it stays
                exactly where it renders, and stays there while the page scrolls. Desktop
                has the browser's own back control, so it only ships on small screens. */}
            <BackButton className="sticky top-6 lg:hidden" />

            <div className="relative flex w-full flex-col items-center gap-6 sm:gap-8">
                <div className="aspect-book relative w-full max-w-[75vw] sm:max-w-[20rem]">
                    <BookCover key={book.id} book={book} />
                </div>

                <div className="relative flex w-full flex-col items-center gap-2">
                    <h1 className="mx-auto w-full text-center text-3xl leading-tight font-bold tracking-wide text-pretty sm:max-w-screen-sm">
                        {title}
                    </h1>

                    <div className="flex w-full flex-wrap justify-center gap-x-4 gap-y-2">
                        {authors &&
                            authors.length > 0 &&
                            authors.map((author) => (
                                <p key={author} className="text-sm leading-snug font-medium tracking-wide opacity-60">
                                    {author}
                                </p>
                            ))}
                    </div>

                    {pageCount && <p className="text-sm leading-snug font-medium tracking-wide opacity-60">{pageCount} pages</p>}
                </div>

                <Rating book={book} tooltipSide="top" userId={user!.id} />

                <LibraryButton book={book} userId={user!.id} />

                <FinishedOn book={book} userId={user!.id} />

                {description && (
                    <div className="prose prose-neutral bg-neutral-150 dark:prose-invert dark:bg-neutral-850 flex w-fit flex-col items-center rounded-3xl px-4 pt-1 pb-5 sm:px-6 sm:pt-2 sm:pb-6">
                        <ShowMore truncate={256} expandText="Expand description" collapseText="Collapse description">
                            {convertHtmlToReact(description)}
                        </ShowMore>
                    </div>
                )}

                <div className="mt-12 flex w-full flex-wrap justify-center gap-x-4 gap-y-2">
                    {Array.from(categorySet).map((category) => (
                        <p key={category} className="text-sm leading-snug font-medium tracking-wide opacity-60">
                            {category}
                        </p>
                    ))}
                </div>

                {!isOwnBook && <RelatedBooks book={book} />}

                {isOwnBook && (
                    <Button asChild variant="glass" className="mt-8">
                        <Link to="/custom/$bookId" params={{ bookId: book.id }}>
                            <FontAwesomeIcon icon={faPenToSquare} className="icon mr-3" />
                            <p>Edit book</p>
                        </Link>
                    </Button>
                )}

                {/* The gap the tags used to carry below them, now setting the link
                    apart from the related books instead. */}
                {previewLink && !isOwnBook && (
                    <Button asChild variant="ghost" className="group mt-8">
                        <Link to={previewLink} target="_blank" rel="noopener noreferrer">
                            <div
                                className="mr-3 mb-[2px] size-6 min-h-6 min-w-6 bg-neutral-500 transition-colors group-hover:bg-neutral-950 dark:bg-neutral-300 dark:group-hover:bg-neutral-50"
                                style={{
                                    maskImage: 'url("/google.png")',
                                    maskSize: "contain",
                                    maskRepeat: "no-repeat",
                                    maskPosition: "center",
                                    WebkitMaskImage: 'url("/google.png")',
                                    WebkitMaskSize: "contain",
                                    WebkitMaskRepeat: "no-repeat",
                                    WebkitMaskPosition: "center",
                                }}
                            />
                            <p>View on Google Books</p>
                        </Link>
                    </Button>
                )}
            </div>

            {/* {renderObject(book)} */}
        </main>
    );
}

import BackButton from "@/component/BackButton";
import BookCover from "@/component/BookCover";
import FinishedOn from "@/component/FinishedOn";
import LibraryButton from "@/component/LibraryButton";
import NotFound, { NotFoundType } from "@/component/NotFound";
import Rating from "@/component/Rating";
import ShowMore from "@/component/ShowMore";
import { Button } from "@/component/ui/button";
import { cn } from "@/lib/cn";
import { getBookWithGoogleFallback } from "@/server/repo/book";
import { convertHtmlToReact } from "@hedgedoc/html-to-react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { isIOS } from "react-device-detect";

export const Route = createFileRoute("/_protected/book/$bookId/")({
    component: RouteComponent,
    beforeLoad: async ({ params }) => {
        const book = await getBookWithGoogleFallback({ data: params.bookId });
        if (!book) return { book: null };
        return { book };
    },
});

function RouteComponent() {
    const { book, user, queryClient } = Route.useRouteContext();
    if (!book) return <NotFound type={NotFoundType.BOOK} />;

    const { title, authors, description, pageCount, previewLink, categories } = book;

    const categorySet = new Set(categories?.flatMap((category) => category.split("/").map((category) => category.trim())) ?? []);

    return (
        <main
            suppressHydrationWarning
            className={cn("relative mx-auto mb-24 flex h-fit w-full max-w-screen-lg flex-col gap-6 p-6", isIOS && "mb-28")}
        >
            <BackButton className="top-6" />

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

                <Rating book={book} tooltipSide="top" userId={user!.id} queryClient={queryClient} />

                <LibraryButton book={book} userId={user!.id} queryClient={queryClient} />

                <FinishedOn book={book} userId={user!.id} queryClient={queryClient} />

                {description && (
                    <div className="prose prose-neutral bg-neutral-150 dark:prose-invert dark:bg-neutral-850 flex w-fit flex-col items-center rounded-3xl px-4 pt-1 pb-5 sm:px-6 sm:pt-2 sm:pb-6">
                        <ShowMore truncate={256} expandText="Expand description" collapseText="Collapse description">
                            {convertHtmlToReact(description)}
                        </ShowMore>
                    </div>
                )}

                <div className="mt-12 mb-8 flex w-full flex-wrap justify-center gap-x-4 gap-y-2">
                    {Array.from(categorySet).map((category) => (
                        <p key={category} className="text-sm leading-snug font-medium tracking-wide opacity-60">
                            {category}
                        </p>
                    ))}
                </div>

                {previewLink && (
                    <Button asChild variant="ghost" className="group">
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

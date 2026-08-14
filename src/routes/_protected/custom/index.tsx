import BookCover from "@/component/BookCover";
import { Button } from "@/component/ui/button";
import { cn } from "@/lib/cn";
import { useCustomBooks } from "@/convex/use/customBook/useCustomBooks";
import { Link, createFileRoute } from "@tanstack/react-router";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { isIOS } from "react-device-detect";

export const Route = createFileRoute("/_protected/custom/")({ component: RouteComponent });

function RouteComponent() {
    const context = Route.useRouteContext();
    const customBooks = useCustomBooks(context.user!.id);

    const books = customBooks.data ?? [];

    return (
        <main
            suppressHydrationWarning
            className={cn(
                "relative mb-20 flex h-fit min-h-[calc(100vh_-_5rem)] w-full flex-col gap-6 pt-8 pb-12 lg:pt-25",
                isIOS && "mb-24",
            )}
        >
            <div className="sticky top-0 z-30 bg-neutral-50 px-6 pt-3 pb-2 lg:top-25 dark:bg-neutral-950">
                <h1 className="text-2xl leading-5 font-bold text-neutral-950/90 dark:text-neutral-50/90">Custom books</h1>
            </div>

            <div className="flex w-full flex-col items-center gap-8 px-6">
                <Button asChild>
                    <Link to="/custom/new">
                        <FontAwesomeIcon icon={faPlus} className="icon mr-3" />
                        <p>New book</p>
                    </Link>
                </Button>

                {/* A grid rather than the carousel the shelves use: this is the page
                    for finding one book among all of them, not for browsing past a
                    few. */}
                {books.length > 0 && (
                    <div className="grid w-full grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
                        {books.map((book) => (
                            <BookCover key={book.id} book={book} linkToBook />
                        ))}
                    </div>
                )}

                {!customBooks.isLoading && books.length === 0 && (
                    <p className="font-medium tracking-wide opacity-80">{"You haven't created any custom books yet."}</p>
                )}
            </div>
        </main>
    );
}

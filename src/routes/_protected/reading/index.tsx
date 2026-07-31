import BookCarousel from "@/component/BookCarousel";
import { Button } from "@/component/ui/button";
import UnreleasedBookList from "@/component/UnreleasedBookList";
import { cn } from "@/lib/cn";
import { useUnreleasedBooks } from "@/convex/use/unreleasedBook/useUnreleasedBooks";
import { useLibraryBooks } from "@/convex/use/useLibraryBooks";
import { LibraryType } from "@/type/Library";
import { Link, createFileRoute } from "@tanstack/react-router";
import { faBook } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { isIOS } from "react-device-detect";

export const Route = createFileRoute("/_protected/reading/")({ component: Reading });

function Reading() {
    const context = Route.useRouteContext();
    const readingBooks = useLibraryBooks({ userId: context.user!.id, type: LibraryType.READING });
    const toReadBooks = useLibraryBooks({ userId: context.user!.id, type: LibraryType.TO_READ });
    const unreleasedBooks = useUnreleasedBooks(context.user!.id);

    return (
        <main
            suppressHydrationWarning
            className={cn("relative mb-20 flex h-fit min-h-[calc(100vh_-_5rem)] w-full flex-col gap-5 pb-12 lg:pt-25", isIOS && "mb-24")}
        >
            <div className="flex h-fit w-full grow flex-col gap-6 pt-8 pb-4">
                {readingBooks.data && (
                    <BookCarousel
                        title="Reading"
                        books={readingBooks.data.items}
                        noBooksChildren={
                            <div className="flex flex-col gap-4">
                                <p className="font-medium tracking-wide opacity-80">
                                    {toReadBooks.data && toReadBooks.data.items.length
                                        ? "This is a little empty. Select on any of the books below and click 'Start Reading'."
                                        : "This is a little empty. You can start by searching for books."}
                                </p>

                                <Button variant="glass" asChild>
                                    <Link to="/search">
                                        <FontAwesomeIcon icon={faBook} className="icon mr-3" />
                                        <p>Search for books</p>
                                    </Link>
                                </Button>
                            </div>
                        }
                    />
                )}

                {toReadBooks.data && toReadBooks.data.items.length > 0 && (
                    <BookCarousel title="Want to read" books={toReadBooks.data.items} />
                )}

                {unreleasedBooks.data && (
                    <UnreleasedBookList
                        unreleasedBooks={unreleasedBooks.data}
                        stickyClassName="top-0 pt-3 lg:top-25"
                        userId={context.user!.id}
                    />
                )}
            </div>
        </main>
    );
}

import BookList from "@/component/BookList";
import { Button } from "@/component/ui/button";
import { cn } from "@/lib/cn";
import { useLibraryBooks } from "@/server/use/useLibraryBooks";
import { LibraryType } from "@/type/Library";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Book, Loader } from "lucide-react";
import { isIOS } from "react-device-detect";

export const Route = createFileRoute("/_protected/reading/")({ component: Reading });

function Reading() {
    const context = Route.useRouteContext();
    const readingBooks = useLibraryBooks({ userId: context.user!.id, type: LibraryType.READING, queryClient: context.queryClient });
    const toReadBooks = useLibraryBooks({ userId: context.user!.id, type: LibraryType.TO_READ, queryClient: context.queryClient });
    console.log(toReadBooks.data);
    // const unreleasedBooks = useUnreleasedBooks();

    const isPending = readingBooks.isPending || toReadBooks.isPending; //|| unreleasedBooks.isPending;

    return (
        <main
            suppressHydrationWarning
            className={cn("relative mb-20 flex h-fit min-h-[calc(100vh_-_5rem)] w-full flex-col gap-5 pb-6", isIOS && "mb-24")}
        >
            {isPending ? (
                <div className="flex w-full grow items-center justify-center px-6 transition-all">
                    <Loader className="size-8 min-h-8 min-w-8 animate-spin stroke-[3] opacity-50 duration-2000" />
                </div>
            ) : (
                <div className="flex h-fit w-full grow flex-col gap-6 py-4">
                    {readingBooks.data && (
                        <BookList
                            title="Reading"
                            books={readingBooks.data.items}
                            showPagination={false}
                            stickyClassName="top-0 pt-3"
                            noBooksChildren={
                                <div className="flex flex-col gap-4">
                                    <p className="font-medium tracking-wide opacity-80">
                                        {toReadBooks.data && toReadBooks.data.items.length
                                            ? "This is a little empty. Select on any of the books below and click 'Start Reading'."
                                            : "This is a little empty. You can start by searching for books."}
                                    </p>

                                    <Button variant="glass" asChild>
                                        <Link to="/search">
                                            <Book className="icon mr-3" />
                                            <p>Search for books</p>
                                        </Link>
                                    </Button>
                                </div>
                            }
                        />
                    )}

                    {toReadBooks.data && toReadBooks.data.items.length > 0 && (
                        <BookList title="Want to read" books={toReadBooks.data.items} showPagination={false} stickyClassName="top-0 pt-3" />
                    )}

                    {/* {unreleasedBooks.data && <UnreleasedBookList unreleasedBooks={unreleasedBooks.data} stickyClassName="top-0 pt-3" />} */}
                </div>
            )}
        </main>
    );
}

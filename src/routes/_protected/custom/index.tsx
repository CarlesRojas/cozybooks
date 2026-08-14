import BookCarousel from "@/component/BookCarousel";
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

            {/* The same horizontal row the shelves use, so a custom book is browsed
                exactly like any other. Its heading slot takes the button rather than a
                title — the page already has one above, and sitting there is what lines
                the button up with the first cover's gutter and keeps it on screen when
                there are no books yet. */}
            <BookCarousel
                title={
                    // Full width only where the screen is narrow enough for it to be the
                    // whole row anyway — `sm` is the same break the covers widen at. Past
                    // it the button takes its content's width and stays at the left
                    // gutter, above the first cover.
                    <Button asChild className="w-full sm:w-fit">
                        <Link to="/custom/new">
                            <FontAwesomeIcon icon={faPlus} className="icon mr-3" />
                            <p>New book</p>
                        </Link>
                    </Button>
                }
                books={books}
                isLoading={customBooks.isLoading}
                noBooksChildren={<p className="font-medium tracking-wide opacity-80">{"You haven't created any custom books yet."}</p>}
            />
        </main>
    );
}

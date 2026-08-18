import BackButton from "@/component/BackButton";
import CustomBookForm from "@/component/CustomBookForm";
import NotFound, { NotFoundType } from "@/component/NotFound";
import { useBook } from "@/convex/use/book/useBook";
import { cn } from "@/lib/cn";
import { createFileRoute } from "@tanstack/react-router";
import { isIOS } from "react-device-detect";

export const Route = createFileRoute("/_protected/custom/$bookId/")({ component: RouteComponent });

function RouteComponent() {
    const { bookId } = Route.useParams();

    // Reactive, and it answers null for anything that isn't this user's — a
    // catalogue volume can't be edited, and another user's custom book is not visible to
    // this query at all, so a book that comes back with an owner is this reader's own.
    const book = useBook({ bookId });

    if (book.isLoading) return null;
    if (!book.data || !book.data.ownerId) return <NotFound type={NotFoundType.BOOK} />;

    return (
        <main suppressHydrationWarning className={cn("relative mb-24 flex h-fit w-full flex-col gap-6 py-6 lg:pt-25", isIOS && "mb-28")}>
            <BackButton className="sticky top-6 mx-6 lg:hidden" />

            <h1 className="px-6 text-center text-2xl leading-tight font-bold tracking-wide">Edit book</h1>

            {/* Keyed by the book so switching between two custom books remounts the
                form: its fields take their starting values on mount only. */}
            <CustomBookForm key={book.data.id} book={book.data} />
        </main>
    );
}

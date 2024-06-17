import BookCover from "@/component/BookCover";
import Pagination from "@/component/Pagination";
import { useUrlState } from "@/hook/useUrlState";
import { Book } from "@/type/Book";
import { cn } from "@/util";

interface Props {
    books: Book[];
    totalItems: number;
    pageState: ReturnType<typeof useUrlState<number>>;
    stickyClassName?: string;
    pageSize: number;
}

const BookList = ({ books, totalItems, stickyClassName, pageState, pageSize }: Props) => {
    const [page, setPage] = pageState;
    const numberOfPages = Math.ceil((totalItems || 1) / pageSize);
    const currentPage = Math.max(Math.min(page, numberOfPages), 1);

    return (
        <section className="flex h-fit w-full flex-col gap-4 mouse:gap-6">
            <div className={cn("sticky top-0 z-30 bg-neutral-50 pb-2 dark:bg-neutral-950", stickyClassName)}>
                <h2 className="h2 mx-auto max-w-screen-lg px-6">Results</h2>
            </div>

            <div className="mx-auto grid w-full max-w-screen-lg grid-cols-2 gap-6 px-6 sm:grid-cols-3 md:grid-cols-4">
                {books.map((book) => (
                    <BookCover key={book.id} book={book} />
                ))}
            </div>

            <div className="mx-auto w-full max-w-screen-lg px-6">
                <Pagination
                    numberOfPages={Math.min(numberOfPages, 5)}
                    currentPage={currentPage - 1}
                    onPageChange={(page) => setPage(page + 1, true)}
                />
            </div>
        </section>
    );
};

export default BookList;

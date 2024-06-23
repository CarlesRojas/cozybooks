import BookCover from "@/component/BookCover";
import Pagination from "@/component/Pagination";
import { useUrlState } from "@/hook/useUrlState";
import { Book } from "@/type/Book";
import { Route } from "@/type/Route";
import { cn } from "@/util";
import { ReactElement, ReactNode } from "react";

interface BaseProps {
    title: string | ReactElement;
    books: Book[];
    stickyClassName?: string;
    isLoading?: boolean;
    noBooksChildren?: ReactNode;
}

interface PaginationProps {
    showPagination: true;
    totalItems: number;
    pageState: ReturnType<typeof useUrlState<number>>;
    pageSize: number;
}

interface NoPaginationProps {
    showPagination: false;
}

type Props = BaseProps & (PaginationProps | NoPaginationProps);

const BookList = (props: Props) => {
    const { title, books, showPagination, stickyClassName, isLoading, noBooksChildren } = props;

    const numberOfPages = showPagination ? Math.ceil((props.totalItems || 1) / props.pageSize) : 1;
    const currentPage = showPagination ? Math.max(Math.min(props.pageState[0], numberOfPages), 1) : 1;

    return (
        <section className="flex h-fit w-full flex-col gap-4">
            {(books.length > 0 || !isLoading) && (
                <div className={cn("sticky top-0 z-30 bg-neutral-50 pb-2 dark:bg-neutral-950", stickyClassName)}>
                    {typeof title === "string" ? (
                        <h2 className="mx-auto max-w-screen-lg px-6 text-2xl font-bold leading-5 text-neutral-950/90 dark:text-neutral-50/90">
                            {title}
                        </h2>
                    ) : (
                        <div className="mx-auto max-w-screen-lg px-6">{title}</div>
                    )}
                </div>
            )}

            {!isLoading && books.length === 0 && (
                <div className="mx-auto w-full max-w-screen-lg px-6">{!!noBooksChildren && noBooksChildren}</div>
            )}

            {books.length > 0 && (
                <div className="mx-auto grid w-full max-w-screen-lg grid-cols-2 grid-rows-1 gap-6 px-6 sm:grid-cols-3 md:grid-cols-4">
                    {books.map((book) => (
                        <BookCover key={book.id} book={book} href={`${Route.BOOK}/${book.id}`} maxWidth={300} />
                    ))}
                </div>
            )}

            {showPagination && numberOfPages > 1 && (
                <div className="mx-auto w-full max-w-screen-lg px-6">
                    <Pagination
                        numberOfPages={Math.min(numberOfPages, 5)}
                        currentPage={currentPage - 1}
                        onPageChange={(page) => props.pageState[1](page + 1, true)}
                    />
                </div>
            )}
        </section>
    );
};

export default BookList;

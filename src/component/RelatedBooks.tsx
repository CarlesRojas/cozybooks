import BookCarousel from "@/component/BookCarousel";
import { PAGE_SIZE } from "@/const";
import { useRelatedBooks } from "@/convex/use/useRelatedBooks";
import type { Book } from "@/type/Book";

interface Props {
    book: Book;
}

const RelatedBooks = ({ book }: Props) => {
    const relatedBooks = useRelatedBooks({
        bookId: book.id,
        title: book.title,
        author: book.authors?.[0] ?? undefined,
        maxResults: PAGE_SIZE,
    });

    // Nothing to say when an author has written only this book, so the section stays
    // out of the page rather than sitting there empty.
    if (!relatedBooks.data || relatedBooks.data.items.length === 0) return null;

    return (
        <div className="-mx-6 w-[calc(100%+3rem)]">
            <BookCarousel title="Related books" books={relatedBooks.data.items} />
        </div>
    );
};

export default RelatedBooks;

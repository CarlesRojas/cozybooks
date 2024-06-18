import BackButton from "@/component/BackButton";
import BookCover from "@/component/BookCover";
import NotFound, { NotFoundType } from "@/component/NotFound";
import { getBook } from "@/server/use/useBook";
import { cn, renderObject } from "@/util";
import { isIOS } from "react-device-detect";

interface Props {
    params: { bookId: string };
}

const BookPage = async ({ params: { bookId } }: Props) => {
    const book = await getBook({ bookId });
    if (!book) return <NotFound type={NotFoundType.BOOK} />;

    return (
        <main
            suppressHydrationWarning
            className={cn("relative mx-auto mb-20 flex h-fit w-full max-w-screen-lg flex-col gap-6 p-6", isIOS && "mb-24")}
        >
            <BackButton />

            <div className="mx-auto sm:max-w-[20rem]">
                <BookCover key={book.id} book={book} />
            </div>

            {renderObject(book)}
        </main>
    );
};

export default BookPage;

import { PaginationContent, PaginationLink, PaginationNext, PaginationPrevious, PaginationWrapper } from "@/component/ui/pagination";
import { cn } from "@/lib/cn";

interface Props {
    numberOfPages: number;
    currentPage: number;
    onPageChange: (page: number) => void;
}

const NUM_PAGES_TO_SHOW = 5;
const getPagesToShow = (currentPage: number, numberOfPages: number) => {
    if (numberOfPages <= NUM_PAGES_TO_SHOW) return Array.from({ length: numberOfPages }, (_, i) => i);

    const pages = [currentPage];
    for (let i = 0; i < NUM_PAGES_TO_SHOW - 1; i++) {
        const next = pages[pages.length - 1] + 1;
        const prev = pages[0] - 1;

        if (i % 2 === 0) {
            if (next < numberOfPages) pages.push(next);
            else if (prev >= 0) pages.unshift(prev);
        } else {
            if (prev >= 0) pages.unshift(prev);
            else if (next < numberOfPages) pages.push(next);
        }
    }

    return pages;
};

const Pagination = ({ numberOfPages, currentPage, onPageChange }: Props) => {
    if (numberOfPages <= 1) return null;
    const clampedCurrentPage = Math.min(Math.max(currentPage, 0), numberOfPages - 1);
    const pagesToShow = getPagesToShow(clampedCurrentPage, numberOfPages);

    return (
        <PaginationWrapper>
            <PaginationContent>
                <PaginationPrevious disabled={currentPage <= 0} onClick={() => onPageChange(currentPage - 1)} />

                {pagesToShow.map((page) => (
                    <PaginationLink key={page} onClick={() => onPageChange(page)} isActive={page === currentPage}>
                        <div
                            className={cn(
                                "mouse:group-hover:bg-neutral-500/70 mouse:group-focus-visible:bg-neutral-500/70 size-[10px] min-h-[10px] min-w-[10px] rounded-full bg-neutral-500/30",
                                page === currentPage && "bg-neutral-600 dark:bg-neutral-400",
                            )}
                        />
                    </PaginationLink>
                ))}

                <PaginationNext disabled={currentPage >= numberOfPages - 1} onClick={() => onPageChange(currentPage + 1)} />
            </PaginationContent>
        </PaginationWrapper>
    );
};

export default Pagination;

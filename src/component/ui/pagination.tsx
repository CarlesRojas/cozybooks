import { ButtonProps, buttonVariants } from "@/component/ui/button";
import { cn } from "@/lib/cn";
import { LuChevronLeft, LuChevronRight } from "lucide-react";
import { ComponentProps, forwardRef } from "react";

const PaginationWrapper = ({ className, ...props }: ComponentProps<"nav">) => (
    <nav role="navigation" aria-label="pagination" className={cn("flex w-fit", className)} {...props} />
);
PaginationWrapper.displayName = "PaginationWrapper";

const PaginationContent = forwardRef<HTMLUListElement, ComponentProps<"ul">>(({ className, ...props }, ref) => (
    <ul ref={ref} className={cn("flex flex-row items-center", className)} {...props} />
));
PaginationContent.displayName = "PaginationContent";

const PaginationItem = forwardRef<HTMLLIElement, ComponentProps<"li">>(({ className, ...props }, ref) => (
    <li ref={ref} className={cn("", className)} {...props} />
));
PaginationItem.displayName = "PaginationItem";

type PaginationLinkProps = {
    isActive?: boolean;
    isSide?: boolean;
} & Pick<ButtonProps, "size"> &
    ComponentProps<"button">;

const PaginationLink = ({ className, isActive, isSide, size = "icon", ...props }: PaginationLinkProps) => (
    <PaginationItem>
        <button
            type="button"
            aria-current={isActive ? "page" : undefined}
            className={cn(
                buttonVariants({
                    variant: isSide ? "ghost" : isActive ? "paginationActive" : "pagination",
                    size: isSide ? size : "pagination",
                }),
                className,
            )}
            {...props}
        />
    </PaginationItem>
);
PaginationLink.displayName = "PaginationLink";

const PaginationPrevious = ({ className, ...props }: ComponentProps<typeof PaginationLink>) => (
    <PaginationLink aria-label="Previous" size="icon" isSide className={className} {...props}>
        <LuChevronLeft className="icon size-6 min-h-6 min-w-6" />
    </PaginationLink>
);
PaginationPrevious.displayName = "PaginationPrevious";

const PaginationNext = ({ className, ...props }: ComponentProps<typeof PaginationLink>) => (
    <PaginationLink aria-label="Next" size="icon" isSide className={className} {...props}>
        <LuChevronRight className="icon size-6 min-h-6 min-w-6" />
    </PaginationLink>
);
PaginationNext.displayName = "PaginationNext";

export { PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationWrapper };

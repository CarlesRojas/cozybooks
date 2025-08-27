import { ButtonProps, buttonVariants } from "@/component/ui/button";
import { cn } from "@/lib/cn";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ComponentProps } from "react";

export const PaginationWrapper = ({ className, ...props }: ComponentProps<"nav">) => (
    <nav role="navigation" aria-label="pagination" className={cn("flex w-fit", className)} {...props} />
);

export const PaginationContent = ({ className, ref, ...props }: ComponentProps<"ul">) => (
    <ul ref={ref} className={cn("flex flex-row items-center", className)} {...props} />
);

export const PaginationItem = ({ className, ref, ...props }: ComponentProps<"li">) => (
    <li ref={ref} className={cn("", className)} {...props} />
);

type PaginationLinkProps = { isActive?: boolean; isSide?: boolean } & Pick<ButtonProps, "size"> & ComponentProps<"button">;

export const PaginationLink = ({ className, isActive, isSide, size = "icon", ...props }: PaginationLinkProps) => (
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

export const PaginationPrevious = ({ className, ...props }: ComponentProps<typeof PaginationLink>) => (
    <PaginationLink aria-label="Previous" size="icon" isSide className={className} {...props}>
        <ChevronLeft className="icon size-6 min-h-6 min-w-6" />
    </PaginationLink>
);

export const PaginationNext = ({ className, ...props }: ComponentProps<typeof PaginationLink>) => (
    <PaginationLink aria-label="Next" size="icon" isSide className={className} {...props}>
        <ChevronRight className="icon size-6 min-h-6 min-w-6" />
    </PaginationLink>
);

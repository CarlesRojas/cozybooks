import { Button } from "@/component/ui/button";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/component/ui/dropdown-menu";
import { cn } from "@/lib/cn";
import { useNavigate } from "@tanstack/react-router";
import { faRepeat, faSliders } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface Props {
    className?: string;
    sort?: Sort;
    repeats?: boolean;
}

export enum Sort {
    BOOK = "BOOK",
    DATE = "DATE",
    RATING = "RATING",
}

// Used wherever the url says nothing and storage has nothing to say either. The
// options are absent from the url until they are chosen, so both are optional
// everywhere they travel.
export const DEFAULT_SORT = Sort.DATE;
export const DEFAULT_REPEATS = false;

const SortMenu = ({ className, sort = DEFAULT_SORT, repeats = DEFAULT_REPEATS }: Props) => {
    const navigate = useNavigate();

    return (
        <DropdownMenu modal={false}>
            <Button size="icon" variant="glass" className={cn("size-14 min-h-14 min-w-14", className)} asChild>
                <DropdownMenuTrigger>
                    <FontAwesomeIcon icon={faSliders} className="icon" />
                </DropdownMenuTrigger>
            </Button>

            <DropdownMenuContent className="mx-2 my-3">
                <DropdownMenuRadioGroup
                    value={sort}
                    onValueChange={(value) => navigate({ to: `/finished`, search: { sort: value as Sort, repeats } })}
                >
                    <DropdownMenuRadioItem value={Sort.BOOK}>Sort by book name</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value={Sort.DATE}>Sort by year finished</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value={Sort.RATING}>Sort by your rating</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>

                <DropdownMenuSeparator />

                <DropdownMenuCheckboxItem
                    className="py-3 pr-4"
                    checked={repeats}
                    onCheckedChange={(checked) => navigate({ to: `/finished`, search: { sort, repeats: checked } })}
                >
                    <FontAwesomeIcon icon={faRepeat} className="mr-3 h-4 w-4" />
                    <p className="font-medium">Show repeat reads</p>
                </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default SortMenu;

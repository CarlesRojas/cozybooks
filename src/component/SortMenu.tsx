import { Avatar, AvatarFallback, AvatarImage } from "@/component/ui/avatar";
import { Button } from "@/component/ui/button";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/component/ui/dropdown-menu";
import { cn } from "@/lib/cn";
import { useNavigate } from "@tanstack/react-router";
import type { User } from "better-auth";
import { Repeat, SlidersHorizontal } from "lucide-react";

interface Props {
    className?: string;
    user: User;
    sort: Sort;
    repeats: boolean;
}

export enum Sort {
    BOOK = "BOOK",
    DATE = "DATE",
    RATING = "RATING",
}

const SortMenu = ({ className, user, sort, repeats }: Props) => {
    const navigate = useNavigate();

    return (
        <DropdownMenu modal={true}>
            <Button size="icon" variant="glass" className={cn(className)} asChild>
                <DropdownMenuTrigger>
                    <SlidersHorizontal className="icon" />
                </DropdownMenuTrigger>
            </Button>

            <DropdownMenuContent className="mx-2 my-3">
                <DropdownMenuLabel className="flex items-center gap-2">
                    <Avatar>
                        <AvatarImage src={user.image ?? undefined} />
                        <AvatarFallback className="uppercase">{user.name[0]}</AvatarFallback>
                    </Avatar>

                    {`Hi ${user.name.split(" ").slice(0, 2).join(" ")}!`}
                </DropdownMenuLabel>

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
                    <Repeat className="mr-3 h-4 w-4" />
                    <p className="font-medium">Show repeat reads</p>
                </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default SortMenu;

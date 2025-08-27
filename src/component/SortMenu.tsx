import { Avatar, AvatarFallback, AvatarImage } from "@/component/ui/avatar";
import { Button } from "@/component/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from "@/component/ui/dropdown-menu";
import { cn } from "@/lib/cn";
import { useNavigate } from "@tanstack/react-router";
import { User } from "better-auth";
import { ArrowDownUp } from "lucide-react";

interface Props {
    className?: string;
    user: User;
    sort: Sort;
}

export enum Sort {
    BOOK = "BOOK",
    DATE = "DATE",
    RATING = "RATING",
}

const SortMenu = ({ className, user, sort }: Props) => {
    const navigate = useNavigate();

    return (
        <DropdownMenu modal={true}>
            <Button size="icon" variant="glass" className={cn(className)} asChild>
                <DropdownMenuTrigger>
                    <ArrowDownUp className="icon" />
                </DropdownMenuTrigger>
            </Button>

            <DropdownMenuContent className="mx-2 my-3">
                {!!user && (
                    <DropdownMenuLabel className="flex items-center gap-2">
                        <Avatar>
                            <AvatarImage src={user.image ?? undefined} />
                            <AvatarFallback className="uppercase">{user.name[0]}</AvatarFallback>
                        </Avatar>

                        {`Hi ${user.name.split(" ").slice(0, 2).join(" ")}!`}
                    </DropdownMenuLabel>
                )}

                <DropdownMenuRadioGroup
                    value={sort}
                    onValueChange={(value) => navigate({ to: `/finished`, search: { sort: value as Sort } })}
                >
                    <DropdownMenuRadioItem value={Sort.BOOK}>Sort by book name</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value={Sort.DATE}>Sort by year finished</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value={Sort.RATING}>Sort by your rating</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default SortMenu;

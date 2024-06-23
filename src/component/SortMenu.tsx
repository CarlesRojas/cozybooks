"use client";

import { Button } from "@/component/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from "@/component/ui/dropdown-menu";
import { useUrlState } from "@/hook/useUrlState";
import { cn } from "@/util";
import { LuArrowDownUp } from "react-icons/lu";
import { z } from "zod";

interface Props {
    className?: string;
}

export enum Sort {
    BOOK = "BOOK",
    DATE = "DATE",
    RATING = "RATING",
}

const SortMenu = ({ className }: Props) => {
    const [sort, setSort] = useUrlState("sort", Sort.BOOK, z.nativeEnum(Sort));

    return (
        <DropdownMenu modal={true}>
            <Button size="icon" variant="glass" className={cn(className)} asChild>
                <DropdownMenuTrigger>
                    <LuArrowDownUp className="icon" />
                </DropdownMenuTrigger>
            </Button>

            <DropdownMenuContent className="mx-2 my-3">
                {/* <DropdownMenuLabel className="flex items-center gap-2">
                    <Avatar>
                        <AvatarImage src={user.image} />
                        <AvatarFallback className="uppercase">{user.name[0]}</AvatarFallback>
                    </Avatar>

                    {`Hi ${user.name.split(" ").slice(0, 2).join(" ")}!`}
                </DropdownMenuLabel> */}

                <DropdownMenuRadioGroup value={sort} onValueChange={(value) => setSort(value as Sort)}>
                    <DropdownMenuRadioItem value={Sort.BOOK}>Sort by book name</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value={Sort.DATE}>Sort by year finished</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value={Sort.RATING}>Sort by your rating</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default SortMenu;

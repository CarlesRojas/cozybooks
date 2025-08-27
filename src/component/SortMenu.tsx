import { Button } from "@/component/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/component/ui/dropdown-menu";
import { cn } from "@/lib/cn";
import { ArrowDownUp } from "lucide-react";

interface Props {
    className?: string;
}

export enum Sort {
    BOOK = "BOOK",
    DATE = "DATE",
    RATING = "RATING",
}

const SortMenu = ({ className }: Props) => {
    // const [sort, setSort] = useUrlState("sort", Sort.DATE, z.nativeEnum(Sort));

    return (
        <DropdownMenu modal={true}>
            <Button size="icon" variant="glass" className={cn(className)} asChild>
                <DropdownMenuTrigger>
                    <ArrowDownUp className="icon" />
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

                {/* <DropdownMenuRadioGroup value={sort} onValueChange={(value) => setSort(value as Sort)}>
                    <DropdownMenuRadioItem value={Sort.BOOK}>Sort by book name</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value={Sort.DATE}>Sort by year finished</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value={Sort.RATING}>Sort by your rating</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup> */}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default SortMenu;

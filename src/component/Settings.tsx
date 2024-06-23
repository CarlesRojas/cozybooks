"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/component/ui/avatar";
import { Button } from "@/component/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/component/ui/dropdown-menu";
import { signOutWithGoogle } from "@/server/action/user";
import { User } from "@/type/User";
import { useTheme } from "next-themes";
import { LuLogOut, LuUser2 } from "react-icons/lu";

interface Props {
    user: User;
}

const Settings = ({ user }: Props) => {
    const { setTheme, theme } = useTheme();

    return (
        <DropdownMenu modal={true}>
            <Button size="icon" variant="glass" asChild>
                <DropdownMenuTrigger>
                    <LuUser2 className="icon" />
                </DropdownMenuTrigger>
            </Button>

            <DropdownMenuContent className="mx-2 my-3">
                <DropdownMenuLabel className="flex items-center gap-2">
                    <Avatar>
                        <AvatarImage src={user.image} />
                        <AvatarFallback className="uppercase">{user.name[0]}</AvatarFallback>
                    </Avatar>

                    {`Hi ${user.name.split(" ").slice(0, 2).join(" ")}!`}
                </DropdownMenuLabel>

                <DropdownMenuSeparator />

                <DropdownMenuItem onClick={() => signOutWithGoogle()}>
                    <LuLogOut className="mr-3 h-4 w-4" />
                    <p className="font-medium">Sign out</p>
                </DropdownMenuItem>
                <DropdownMenuSeparator />

                <DropdownMenuRadioGroup value={theme} onValueChange={(value) => setTheme(value)}>
                    <DropdownMenuRadioItem value="dark">Dark theme</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="light">Light theme</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="system">System theme</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default Settings;

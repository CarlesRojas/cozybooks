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
import { authClient } from "@/lib/auth/client";
import type { Theme } from "@/lib/theme";
import { useTheme } from "@/lib/theme";
import { QueryKey } from "@/type/QueryKey";
import type { QueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import type { User } from "better-auth";
import { LogOut, User2 } from "lucide-react";

interface Props {
    user: User;
    queryClient: QueryClient;
}

const Settings = ({ user, queryClient }: Props) => {
    const { theme, setTheme } = useTheme();
    const router = useRouter();

    const logout = async () => {
        await authClient.signOut();
        await queryClient.invalidateQueries({ queryKey: [QueryKey.USER] });
        await router.invalidate();
    };

    return (
        <DropdownMenu modal={true}>
            <Button size="icon" variant="glass" className="size-15 min-h-15 min-w-15" asChild>
                <DropdownMenuTrigger>
                    <User2 className="icon" />
                </DropdownMenuTrigger>
            </Button>

            <DropdownMenuContent className="mx-2 my-3">
                <DropdownMenuLabel className="flex items-center gap-4">
                    <Avatar>
                        <AvatarImage src={user.image ?? undefined} />
                        <AvatarFallback className="uppercase">{user.name[0]}</AvatarFallback>
                    </Avatar>

                    {`Hi ${user.name.split(" ").slice(0, 2).join(" ")}!`}
                </DropdownMenuLabel>

                <DropdownMenuSeparator />

                <DropdownMenuRadioGroup value={theme} onValueChange={(value) => setTheme(value as Theme)}>
                    <DropdownMenuRadioItem value="dark">Dark theme</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="light">Light theme</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="system">System theme</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                    className="text-red-600/80 focus:text-red-600 dark:text-red-400/80 dark:focus:text-red-400"
                    onClick={logout}
                >
                    <LogOut className="mr-3 h-4 w-4" />
                    <p className="font-medium">Sign out</p>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default Settings;

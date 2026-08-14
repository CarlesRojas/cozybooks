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
import { Link, useRouter } from "@tanstack/react-router";
import type { User } from "better-auth";
import { faFeather, faRightFromBracket, faUser } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";

interface Props {
    user: User;
    queryClient: QueryClient;
}

const Settings = ({ user, queryClient }: Props) => {
    const { theme, setTheme } = useTheme();
    const router = useRouter();

    const [signOutFailed, setSignOutFailed] = useState(false);

    const logout = async () => {
        // better-auth resolves with an `error` instead of throwing, so ignoring the
        // result turns any failed request into a button that silently does nothing.
        const { error } = await authClient.signOut();

        if (error) {
            console.error("Sign out failed", error);
            setSignOutFailed(true);
            return;
        }

        await queryClient.invalidateQueries({ queryKey: [QueryKey.USER] });
        await router.invalidate();
    };

    return (
        <DropdownMenu modal={false}>
            <Button size="icon" variant="glass" className="size-14 min-h-14 min-w-14" asChild>
                <DropdownMenuTrigger>
                    <FontAwesomeIcon icon={faUser} className="icon" />
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

                <DropdownMenuItem asChild>
                    <Link to="/custom">
                        <FontAwesomeIcon icon={faFeather} className="mr-3 h-4 w-4" />
                        <p className="font-medium">Custom books</p>
                    </Link>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuRadioGroup value={theme} onValueChange={(value) => setTheme(value as Theme)}>
                    <DropdownMenuRadioItem value="dark">Dark theme</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="light">Light theme</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="system">System theme</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                    className="text-red-600/80 focus:text-red-600 dark:text-red-400/80 dark:focus:text-red-400"
                    // Keep the menu open while the request is in flight: Radix closes on
                    // select, and a menu that vanishes before the call resolves is how a
                    // failed sign out ends up invisible. A successful one unmounts this
                    // whole tree via the redirect anyway.
                    onSelect={(event) => {
                        event.preventDefault();
                        void logout();
                    }}
                >
                    <FontAwesomeIcon icon={faRightFromBracket} className="mr-3 h-4 w-4" />
                    <p className="font-medium">{signOutFailed ? "Sign out failed — try again" : "Sign out"}</p>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default Settings;

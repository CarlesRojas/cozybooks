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
import { useUser } from "@/lib/auth/useUser";
import type { Theme } from "@/lib/theme";
import { useTheme } from "@/lib/theme";
import { Link } from "@tanstack/react-router";
import { faFeather, faRightFromBracket, faUser } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";

const Settings = () => {
    // The avatar and name come off the better-auth session, which the client keeps live
    // — signing out empties it without a reload.
    const { user } = useUser();
    const { theme, setTheme } = useTheme();

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

        // A full document load rather than a router invalidation: the token the root
        // route resolved is remembered for the life of the document (see
        // `src/routes/__root.tsx`), and leaving the document is what forgets it.
        window.location.href = "/";
    };

    return (
        <DropdownMenu modal={false}>
            <Button size="icon" variant="glass" className="size-14 min-h-14 min-w-14" asChild>
                <DropdownMenuTrigger>
                    <FontAwesomeIcon icon={faUser} className="icon" />
                </DropdownMenuTrigger>
            </Button>

            <DropdownMenuContent className="mx-2 my-3">
                {/* The session may not have arrived yet on the first paint after a
                    cold load, so the greeting waits rather than rendering half of one. */}
                {user && (
                    <DropdownMenuLabel className="flex items-center gap-4">
                        <Avatar>
                            <AvatarImage src={user.image ?? undefined} />
                            <AvatarFallback className="uppercase">{user.name[0]}</AvatarFallback>
                        </Avatar>

                        {`Hi ${user.name.split(" ").slice(0, 2).join(" ")}!`}
                    </DropdownMenuLabel>
                )}

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

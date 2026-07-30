import Settings from "@/component/Settings";
import type { Sort } from "@/component/SortMenu";
import SortMenu from "@/component/SortMenu";
import { Button } from "@/component/ui/button";
import { cn } from "@/lib/cn";
import { NO_NAVBAR_ROUTES, Route } from "@/type/Route";
import type { QueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "@tanstack/react-router";
import type { User } from "better-auth";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import type { ReactElement } from "react";
import { isIOS } from "react-device-detect";

interface Props {
    user: User | null;
    queryClient: QueryClient;
    sort: Sort;
    repeats: boolean;
}

const Navigation = ({ user, queryClient, sort, repeats }: Props) => {
    const location = useLocation();

    const routes: Array<string> = [Route.READING, Route.FINISHED, Route.SEARCH];
    const routeTitle: Partial<Record<string, ReactElement>> = {
        [Route.READING]: <p className="z-40 transition-colors">Reading</p>,
        [Route.FINISHED]: <p className="z-40 transition-colors">Finished</p>,
        [Route.SEARCH]: <Search className="icon z-40 min-w-10 transition-colors" />,
    };

    const showSortButton = location.pathname === Route.FINISHED;

    if (NO_NAVBAR_ROUTES.includes(location.pathname as Route) || !user) return null;

    return (
        <motion.nav
            layoutRoot
            className={cn(
                "fixed inset-x-0 bottom-0 z-40 flex h-20 w-full items-center justify-center gap-2 px-4",
                "lg:top-6 lg:bottom-auto lg:h-fit lg:justify-normal lg:gap-3 lg:px-6",
                isIOS && "bottom-4 lg:bottom-auto",
            )}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
        >
            <div className="flex h-fit items-center rounded-full bg-neutral-300/70 p-1 backdrop-blur-md dark:bg-neutral-700/60">
                <div className="hidden items-center gap-2 pr-2 pl-5 text-neutral-600 lg:flex dark:text-neutral-200">
                    <div
                        className="size-5 min-h-5 min-w-5 bg-neutral-600 dark:bg-neutral-200"
                        style={{
                            maskImage: 'url("/icon/logoTransparent.png")',
                            maskSize: "240%",
                            maskRepeat: "no-repeat",
                            maskPosition: "center",
                            WebkitMaskImage: 'url("/icon/logoTransparent.png")',
                            WebkitMaskSize: "240%",
                            WebkitMaskRepeat: "no-repeat",
                            WebkitMaskPosition: "center",
                        }}
                    />

                    <p className="text-base font-semibold whitespace-nowrap">CozyBooks</p>
                </div>

                {routes.map((route) => (
                    <Button
                        asChild
                        key={route}
                        variant="navigation"
                        className={cn(
                            "group relative px-3 hover:text-black lg:px-5 hover:dark:text-white",
                            route === location.pathname && "!text-neutral-50",
                        )}
                    >
                        <Link to={route} search={{ sort }}>
                            {route === location.pathname && (
                                <motion.div
                                    className="pointer-events-none absolute inset-0 z-30 rounded-full bg-neutral-600/60 dark:bg-neutral-400/50"
                                    layoutId="activeSection"
                                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                                />
                            )}

                            {routeTitle[route]}
                        </Link>
                    </Button>
                ))}
            </div>

            <SortMenu className={cn("lg:ml-auto", !showSortButton && "pointer-events-none opacity-0")} sort={sort} repeats={repeats} />

            <Settings user={user} queryClient={queryClient} />
        </motion.nav>
    );
};

export default Navigation;

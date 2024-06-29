"use client";

import Settings from "@/component/Settings";
import SortMenu from "@/component/SortMenu";
import { Button } from "@/component/ui/button";
import { useRoute } from "@/hook/useRoute";
import { useUser } from "@/server/use/useUser";
import { NO_NAVBAR_ROUTES, Route } from "@/type/Route";
import { cn } from "@/util";
import { motion } from "framer-motion";
import Link from "next/link";
import { ReactElement } from "react";
import { isIOS } from "react-device-detect";
import { LuSearch } from "react-icons/lu";

const Navigation = () => {
    const currentRoute = useRoute();
    const user = useUser();

    const routes = [Route.READING, Route.FINISHED, Route.SEARCH];
    const routeTitle: Partial<Record<Route, ReactElement>> = {
        [Route.READING]: <p className="z-40 transition-colors">Reading</p>,
        [Route.FINISHED]: <p className="z-40 transition-colors">Finished</p>,
        [Route.SEARCH]: <LuSearch className="icon z-40 min-w-10 transition-colors" />,
    };

    const showSortButton = currentRoute === Route.FINISHED;

    if (NO_NAVBAR_ROUTES.includes(currentRoute) || user.isLoading || user.isError || !user.data) return null;

    return (
        <>
            <motion.nav
                className={cn(
                    "fixed inset-x-0 bottom-0 z-40 mx-auto flex h-20 max-w-screen-lg items-center justify-evenly",
                    isIOS && "bottom-4",
                )}
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
            >
                {/* <div className="pointer-events-none absolute inset-0 -bottom-10 -top-10 bg-gradient-to-t from-black/20 to-black/0 dark:from-black/50" /> */}

                <SortMenu className={cn(!showSortButton && "pointer-events-none opacity-0")} />

                <div className="flex h-fit items-center rounded-full bg-neutral-300/70 backdrop-blur-md dark:bg-neutral-700/60">
                    {routes.map((route) => (
                        <Button
                            asChild
                            key={route}
                            variant="navigation"
                            className={cn(
                                "group relative mouse:hover:text-black mouse:hover:dark:text-white",
                                route === currentRoute && "!text-neutral-50",
                            )}
                        >
                            <Link href={route}>
                                {route === currentRoute && (
                                    <motion.div
                                        className="pointer-events-none absolute inset-1 z-30 rounded-full bg-neutral-600/60 dark:bg-neutral-400/50"
                                        layoutId="activeSection"
                                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                                    />
                                )}

                                {routeTitle[route]}
                            </Link>
                        </Button>
                    ))}
                </div>

                <Settings user={user.data} />
            </motion.nav>
        </>
    );
};

export default Navigation;

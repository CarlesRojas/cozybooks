"use client";

import { Button } from "@/components/ui/button";
import { useRoute } from "@/hook/useRoute";
import { cn } from "@/lib/utils";
import { Route } from "@/type/Route";
import { motion } from "framer-motion";
import Link from "next/link";
import { ReactElement } from "react";
import { LuArrowDownUp, LuSearch, LuUser2 } from "react-icons/lu";

const Navigation = () => {
    const currentRoute = useRoute();

    const routes = [Route.READING, Route.FINISHED, Route.SEARCH];
    const routeTitle: Record<Route, ReactElement | string> = {
        [Route.READING]: <p className="z-50">Reading</p>,
        [Route.FINISHED]: <p className="z-50">Finished</p>,
        [Route.SEARCH]: <LuSearch className="icon" />,
    };

    return (
        <>
            <motion.nav
                className="fixed inset-x-0 bottom-0 z-50 mt-8 flex h-20 items-center justify-between px-4 mouse:bottom-[unset] mouse:top-0 mouse:mt-0"
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
            >
                <Button size="icon" variant="glass">
                    <LuArrowDownUp className="icon" />
                </Button>

                <div className="flex h-fit items-center rounded-full bg-neutral-300/70 backdrop-blur-md dark:bg-neutral-700/60">
                    {routes.map((route) => (
                        <Button
                            asChild
                            key={route}
                            variant="navigation"
                            className={cn(
                                "group relative mouse:hover:text-neutral-400 mouse:hover:dark:text-neutral-400",
                                route === currentRoute && "!text-neutral-50",
                            )}
                        >
                            <Link href={route}>
                                {route === currentRoute && (
                                    <motion.div
                                        className="pointer-events-none absolute inset-1 z-40 rounded-full bg-neutral-600/60 dark:bg-neutral-400/50"
                                        layoutId="activeSection"
                                        transition={{ type: "keyframes", stiffness: 380, damping: 30 }}
                                    />
                                )}

                                {routeTitle[route]}
                            </Link>
                        </Button>
                    ))}
                </div>

                <Button size="icon" variant="glass">
                    <LuUser2 className="icon" />
                </Button>
            </motion.nav>
        </>
    );
};

export default Navigation;

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
        [Route.READING]: "Reading",
        [Route.FINISHED]: "Finished",
        [Route.SEARCH]: <LuSearch className="icon" />,
    };

    return (
        <>
            <motion.nav
                className="fixed inset-x-0 bottom-0 z-50 mt-8 flex h-20 items-center justify-between px-4 mouse:bottom-[unset] mouse:top-0 mouse:mt-0"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <Button size="icon" variant="glass">
                    <LuArrowDownUp className="icon" />
                </Button>

                <div className="flex h-fit items-center rounded-full bg-neutral-300/70 backdrop-blur-md dark:bg-neutral-700/60">
                    {routes.map((route) => (
                        <Link key={route} href={route}>
                            <Button variant="navigation" className={cn("relative", route === currentRoute && "text-neutral-50")}>
                                {route === currentRoute && (
                                    <motion.div
                                        className="absolute inset-1 z-40"
                                        layoutId="activeSection"
                                        transition={{
                                            type: "keyframes",
                                            stiffness: 380,
                                            damping: 30,
                                        }}
                                    >
                                        <div className="z-40 h-full w-full rounded-full bg-neutral-600/60 transition-all dark:bg-neutral-400/60" />
                                    </motion.div>
                                )}

                                <p className="z-50">{routeTitle[route]}</p>
                            </Button>
                        </Link>
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

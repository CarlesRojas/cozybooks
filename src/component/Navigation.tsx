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
import { useLayoutEffect, useRef, useState } from "react";
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

    // The indicator is positioned from DOM measurements local to the pill instead
    // of a framer-motion shared layout animation: shared layouts measure in page
    // coordinates, and the scroll reset on navigation made the indicator animate
    // vertically. Local offsets are immune to page scroll.
    const linkRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
    const pillRef = useRef<HTMLDivElement | null>(null);
    const [indicator, setIndicator] = useState<{ left: number; top: number; width: number; height: number } | null>(null);

    useLayoutEffect(() => {
        const active = linkRefs.current[location.pathname];
        if (!active || !pillRef.current) {
            setIndicator(null);
            return;
        }

        const update = () =>
            setIndicator({ left: active.offsetLeft, top: active.offsetTop, width: active.offsetWidth, height: active.offsetHeight });
        update();

        const observer = new ResizeObserver(update);
        observer.observe(pillRef.current);
        observer.observe(active);
        return () => observer.disconnect();
    }, [location.pathname]);

    if (NO_NAVBAR_ROUTES.includes(location.pathname as Route) || !user) return null;

    return (
        <motion.nav
            className={cn(
                "fixed inset-x-0 bottom-0 z-40 flex h-20 w-full items-center justify-center gap-2 px-4",
                "lg:top-6 lg:bottom-auto lg:h-fit lg:justify-normal lg:gap-3 lg:px-6",
                isIOS && "bottom-4 lg:bottom-auto",
            )}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
        >
            <div
                ref={pillRef}
                className="relative flex h-fit grow items-center gap-1 rounded-full bg-neutral-300/70 p-1 backdrop-blur-md sm:grow-0 dark:bg-neutral-700/60"
            >
                <div className="hidden items-center gap-3 pr-5 pl-10 text-neutral-600 lg:flex dark:text-neutral-200">
                    <div
                        className="size-5 min-h-5 min-w-5 bg-neutral-600 dark:bg-neutral-200"
                        style={{
                            maskImage: 'url("/icon/logoTransparent.png")',
                            maskSize: "200%",
                            maskRepeat: "no-repeat",
                            maskPosition: "center",
                            WebkitMaskImage: 'url("/icon/logoTransparent.png")',
                            WebkitMaskSize: "200%",
                            WebkitMaskRepeat: "no-repeat",
                            WebkitMaskPosition: "center",
                        }}
                    />

                    <p className="text-base font-semibold whitespace-nowrap">CozyBooks</p>
                </div>

                {indicator && (
                    <motion.div
                        className="pointer-events-none absolute z-30 rounded-full bg-neutral-600/60 dark:bg-neutral-400/50"
                        initial={false}
                        animate={{ left: indicator.left, top: indicator.top, width: indicator.width, height: indicator.height }}
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                )}

                {routes.map((route) => (
                    <Button
                        asChild
                        key={route}
                        variant="navigation"
                        className={cn(
                            "group relative grow px-3 hover:text-black sm:grow-0 lg:px-5 hover:dark:text-white",
                            route === location.pathname && "!text-neutral-50",
                        )}
                    >
                        <Link
                            to={route}
                            search={{ sort }}
                            ref={(element) => {
                                linkRefs.current[route] = element;
                            }}
                        >
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

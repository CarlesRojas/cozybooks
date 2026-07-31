import Settings from "@/component/Settings";
import type { Sort } from "@/component/SortMenu";
import SortMenu from "@/component/SortMenu";
import { Button } from "@/component/ui/button";
import { cn } from "@/lib/cn";
import { NAVIGATION_BLOCK_MS } from "@/const";
import { NO_NAVBAR_ROUTES, Route } from "@/type/Route";
import type { QueryClient } from "@tanstack/react-query";
import { Link, useLocation, useRouterState } from "@tanstack/react-router";
import type { User } from "better-auth";
import { motion } from "framer-motion";
import { faBook, faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { ReactElement } from "react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { isIOS } from "react-device-detect";

interface Props {
    user: User | null;
    queryClient: QueryClient;
    sort?: Sort;
    repeats?: boolean;
}

const Navigation = ({ user, queryClient, sort, repeats }: Props) => {
    const location = useLocation();

    const homeRoute: string = Route.READING;
    const routes: Array<string> = [Route.READING, Route.FINISHED, Route.SEARCH];
    const routeTitle: Partial<Record<string, ReactElement>> = {
        [Route.READING]: <p className="z-40 transition-colors">Reading</p>,
        [Route.FINISHED]: <p className="z-40 transition-colors">Finished</p>,
        [Route.SEARCH]: <FontAwesomeIcon icon={faMagnifyingGlass} className="icon z-40 min-w-10 transition-colors" />,
    };

    const showSortButton = location.pathname === Route.FINISHED;

    // A tab is unclickable just after another one is picked: routes resolve their data
    // before rendering, so switching again mid-load leaves two navigations racing for
    // the same view and the loser can win. Only for a moment though — the window that
    // matters is a second tap arriving on top of the first, and holding the block for
    // a whole slow load would make the navigation feel broken instead.
    const isNavigating = useRouterState({ select: (state) => state.status === "pending" });
    const [isBlocked, setIsBlocked] = useState(false);

    useEffect(() => {
        if (!isNavigating) {
            setIsBlocked(false);
            return;
        }

        setIsBlocked(true);
        const timeout = setTimeout(() => setIsBlocked(false), NAVIGATION_BLOCK_MS);

        return () => clearTimeout(timeout);
    }, [isNavigating]);

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
                <Link
                    to={homeRoute}
                    className="mr-5 hidden h-12 items-center gap-3 px-5 text-neutral-600 select-none hover:text-black lg:flex dark:text-neutral-200 hover:dark:text-white"
                >
                    <FontAwesomeIcon icon={faBook} className="size-5 min-h-5 min-w-5" />

                    <p className="text-base font-semibold whitespace-nowrap">CozyBooks</p>
                </Link>

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
                            "group relative grow px-3 hover:text-black sm:grow-0 sm:px-4 lg:px-5 hover:dark:text-white",
                            route === location.pathname && "!text-neutral-50",
                            isBlocked && route !== location.pathname && "pointer-events-none",
                        )}
                    >
                        <Link
                            to={route}
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

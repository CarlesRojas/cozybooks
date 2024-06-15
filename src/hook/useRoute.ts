import { DYNAMIC_ROUTES, Route } from "@/type/Route";
import { usePathname } from "next/navigation";

const pathnameToRoute = (pathname: string): Route => {
    const exactMatch = Object.values(Route).find((route) => route === pathname) as Route;
    if (exactMatch) return exactMatch;

    return DYNAMIC_ROUTES.find((route) => pathname.startsWith(route)) as Route;
};

export const useRoute = () => {
    return pathnameToRoute(usePathname());
};

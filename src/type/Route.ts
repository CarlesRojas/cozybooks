export enum Route {
    READING = "/",
    FINISHED = "/finished",
    SEARCH = "/search",
}

export const DYNAMIC_ROUTES: Route[] = [];

export const routeTitle: Record<Route, string> = {
    [Route.READING]: "Reading",
    [Route.FINISHED]: "Finished",
    [Route.SEARCH]: "Search",
};

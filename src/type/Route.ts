export enum Route {
    READING = "/",
    FINISHED = "/finished",
    SEARCH = "/search",

    AUTH_SIGN_IN = "/auth/signin",
    AUTH_ERROR = "/auth/error",
}

export const PRIVATE_ROUTES: Route[] = [Route.READING, Route.FINISHED, Route.SEARCH];
export const DYNAMIC_ROUTES: Route[] = [];

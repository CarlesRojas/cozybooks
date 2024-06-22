export enum Route {
    READING = "/reading",
    FINISHED = "/finished",
    SEARCH = "/search",

    BOOK = "/book",

    AUTH_SIGN_IN = "/",
    AUTH_ERROR = "/auth/error",

    PRIVACY_POLICY = "/legal/privacy-policy",
    TERMS_OF_USE = "/legal/terms-and-conditions",
}

export const PRIVATE_ROUTES: Route[] = [Route.READING, Route.FINISHED, Route.SEARCH, Route.BOOK];
export const LEGAL_ROUTES: Route[] = [Route.PRIVACY_POLICY, Route.TERMS_OF_USE];
export const DYNAMIC_ROUTES: Route[] = [Route.BOOK];

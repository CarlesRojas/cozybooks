/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type { ApiFromModules, FilterApi, FunctionReference } from "convex/server";
import type * as books from "../books.js";
import type * as finished from "../finished.js";
import type * as googleBooks from "../googleBooks.js";
import type * as lib_googleBooks from "../lib/googleBooks.js";
import type * as lib_model from "../lib/model.js";
import type * as lib_publish from "../lib/publish.js";
import type * as lib_validators from "../lib/validators.js";
import type * as library from "../library.js";
import type * as ratings from "../ratings.js";
import type * as status from "../status.js";
import type * as unreleasedBooks from "../unreleasedBooks.js";
import type * as users from "../users.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
    books: typeof books;
    finished: typeof finished;
    googleBooks: typeof googleBooks;
    "lib/googleBooks": typeof lib_googleBooks;
    "lib/model": typeof lib_model;
    "lib/publish": typeof lib_publish;
    "lib/validators": typeof lib_validators;
    library: typeof library;
    ratings: typeof ratings;
    status: typeof status;
    unreleasedBooks: typeof unreleasedBooks;
    users: typeof users;
}>;
export declare const api: FilterApi<typeof fullApi, FunctionReference<any, "public">>;
export declare const internal: FilterApi<typeof fullApi, FunctionReference<any, "internal">>;

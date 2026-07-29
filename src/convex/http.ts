import { ConvexHttpClient } from "convex/browser";

const convexUrl = import.meta.env.VITE_CONVEX_URL as string | undefined;

// Stateless client for one-shot Convex calls outside React (route loaders /
// beforeLoad, which run on the server during SSR and on the client afterwards).
export const convexHttpClient = convexUrl ? new ConvexHttpClient(convexUrl) : undefined;

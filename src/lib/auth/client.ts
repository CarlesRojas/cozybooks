import { createAuthClient } from "better-auth/react";

// No `baseURL`: the auth routes are served by this same app under /api/auth, so the
// client should always talk to the origin the page was loaded from. Pinning a host here
// would make every auth call cross-origin from one of the two prod hosts (apex vs www)
// and get it rejected as an untrusted origin. (The previous value read
// `import.meta.env.BETTER_AUTH_URL`, which is always undefined in the browser anyway —
// Vite only exposes VITE_-prefixed variables to client code.)
export const authClient = createAuthClient();

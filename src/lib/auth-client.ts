import { createAuthClient } from "better-auth/react";

// Don't specify baseURL - better-auth will use relative URLs which resolve
// to the current origin automatically. This works in both development and production.
export const authClient = createAuthClient();

export const { signIn, signUp, signOut, useSession } = authClient;

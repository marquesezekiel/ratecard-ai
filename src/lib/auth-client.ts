import { createAuthClient } from "better-auth/react";

// Don't set baseURL - let it use relative URLs which work correctly in any environment
export const authClient = createAuthClient();

export const { signIn, signUp, signOut, useSession } = authClient;

import { createAuthClient } from "better-auth/react";

// REQUIRED: Set NEXT_PUBLIC_APP_URL in Vercel environment variables
// Production: https://ratecard-ai.vercel.app
// This is needed because the auth client is initialized at build time
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
});

export const { signIn, signUp, signOut, useSession } = authClient;

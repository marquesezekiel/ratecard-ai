import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL:
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  fetchOptions: {
    onRequest: (ctx) => {
      // Override the URL to use current origin in browser
      if (typeof window !== "undefined") {
        const urlObj = typeof ctx.url === "string" ? new URL(ctx.url) : ctx.url;
        if (urlObj.hostname === "localhost") {
          const newUrl = new URL(urlObj.pathname + urlObj.search, window.location.origin);
          return {
            ...ctx,
            url: newUrl,
          };
        }
      }
    },
  },
});

export const { signIn, signUp, signOut, useSession } = authClient;

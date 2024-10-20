import { createBrowserClient } from "@supabase/ssr";

export const createClient = () => {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          if (typeof document === 'undefined') {
            return null;
          }
          return document.cookie.split("; ").reduce((r, v) => {
            const parts = v.split("=");
            return parts[0] === name ? decodeURIComponent(parts[1]) : r;
          }, "");
        },
        set(name: string, value: string, options: { expires?: number; sameSite?: string; path?: string }) {
          if (typeof document !== 'undefined') {
            document.cookie = `${name}=${encodeURIComponent(value)}; ${Object.entries(options).map(([k, v]) => `${k}=${v}`).join("; ")}`;
          }
        },
        remove(name: string, options: { path?: string }) {
          if (typeof document !== 'undefined') {
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; ${Object.entries(options).map(([k, v]) => `${k}=${v}`).join("; ")}`;
          }
        },
      },
    }
  );
};

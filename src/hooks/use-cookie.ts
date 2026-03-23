"use client";

import { useCallback } from "react";

type CookieOptions = {
  days?: number;
  path?: string;
  secure?: boolean;
  sameSite?: "strict" | "lax" | "none";
};

export function useCookie() {
  // GET COOKIE
  const get = useCallback((key: string): string | null => {
    if (typeof document === "undefined") return null;

    const match = document.cookie.match(new RegExp("(^| )" + key + "=([^;]+)"));

    return match && typeof match[2] === "string" ? decodeURIComponent(match[2]) : null;
  }, []);

  // SET COOKIE
  const set = useCallback(
    (key: string, value: string, options?: CookieOptions) => {
      if (typeof document === "undefined") return;

      const {
        days = 7,
        path = "/",
        secure = true,
        sameSite = "lax",
      } = options || {};

      const expires = new Date();
      expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);

      document.cookie = [
        `${key}=${encodeURIComponent(value)}`,
        `expires=${expires.toUTCString()}`,
        `path=${path}`,
        `SameSite=${sameSite}`,
        secure ? "Secure" : "",
      ]
        .filter(Boolean)
        .join("; ");
    },
    [],
  );

  // REMOVE COOKIE
  const remove = useCallback((key: string) => {
    if (typeof document === "undefined") return;

    document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  }, []);

  return { get, set, remove };
}

import { useCallback, useEffect, useState } from "react";

export function useCookie(name: string) {
  const [value, setValue] = useState<string | null>(null);

  const getCookie = useCallback(() => {
    if (typeof document === "undefined") return null;
    
    const cookies = document.cookie.split(";");
    for (let cookie of cookies) {
      const [cookieName, cookieValue] = cookie.trim().split("=");
      if (cookieName === name) {
        return decodeURIComponent(cookieValue);
      }
    }
    return null;
  }, [name]);

  const setCookie = useCallback((newValue: string, options: { expires?: Date; path?: string; domain?: string; secure?: boolean; sameSite?: 'Strict' | 'Lax' | 'None' } = {}) => {
    if (typeof document === "undefined") return;

    let cookieString = `${name}=${encodeURIComponent(newValue)}`;
    
    if (options.expires) {
      cookieString += `; expires=${options.expires.toUTCString()}`;
    }
    if (options.path) {
      cookieString += `; path=${options.path}`;
    }
    if (options.domain) {
      cookieString += `; domain=${options.domain}`;
    }
    if (options.secure) {
      cookieString += `; secure`;
    }
    if (options.sameSite) {
      cookieString += `; samesite=${options.sameSite}`;
    }

    document.cookie = cookieString;
    setValue(newValue);
  }, [name]);

  const deleteCookie = useCallback(() => {
    if (typeof document === "undefined") return;

    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    setValue(null);
  }, [name]);

  useEffect(() => {
    setValue(getCookie());
  }, [getCookie]);

  return { value, setCookie, deleteCookie };
}
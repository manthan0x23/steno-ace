"use client";

import { useEffect } from "react";
import { createAuthClient } from "better-auth/react";

const DEVICE_ID_KEY = "sd_device_id";
const DEVICE_ID_HEADER = "x-device-id";

export function getOrCreateDeviceId(): string {
  if (typeof window === "undefined") return "";

  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

export const deviceFetchPlugin = {
  id: "device-id-injector",
  name: "Device ID Injector",
  hooks: {
    async beforeRequest(request: Request) {
      const deviceId = getOrCreateDeviceId();
      if (deviceId) {
        request.headers.set(DEVICE_ID_HEADER, deviceId);
      }
      return request;
    },
  },
};

export const authClient = createAuthClient({
  fetchOptions: {
    onRequest: (ctx) => {
      const deviceId = getOrCreateDeviceId();
      if (deviceId) {
        ctx.headers.set(DEVICE_ID_HEADER, deviceId);
      }
    },
  },
});

export function useDeviceId(): string {
  useEffect(() => {
    getOrCreateDeviceId();
  }, []);

  return typeof window !== "undefined"
    ? (localStorage.getItem(DEVICE_ID_KEY) ?? "")
    : "";
}

export function DeviceIdInit() {
  useDeviceId();
  return null;
}

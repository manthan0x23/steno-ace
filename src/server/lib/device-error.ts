// ---------------------------------------------------------------------------
// Device error codes — thrown by better-auth databaseHook, caught client-side
// ---------------------------------------------------------------------------

export const DEVICE_ERRORS = {
  DEVICE_MISSING: "DEVICE_MISSING",
  DEVICE_MISMATCH: "DEVICE_MISMATCH",
} as const;

export type DeviceErrorCode = keyof typeof DEVICE_ERRORS;

/**
 * Returns true if the better-auth error message is a device error.
 * Use this in your sign-in / sign-up error handlers.
 *
 * @example
 * const { error } = await authClient.signIn.email({ ... });
 * if (isDeviceError(error?.message)) {
 *   router.push("/auth/device-error");
 * }
 */
export function isDeviceError(message: string | undefined | null): boolean {
  if (!message) return false;
  return (
    message.includes(DEVICE_ERRORS.DEVICE_MISSING) ||
    message.includes(DEVICE_ERRORS.DEVICE_MISMATCH)
  );
}

/**
 * Returns a human-readable message for device errors.
 */
export function deviceErrorMessage(
  message: string | undefined | null,
): string | null {
  if (!message) return null;

  if (message.includes(DEVICE_ERRORS.DEVICE_MISMATCH)) {
    return "This account is registered to a different device. Please use your original device or contact support to reset your device.";
  }

  if (message.includes(DEVICE_ERRORS.DEVICE_MISSING)) {
    return "Device verification failed. Please refresh and try again.";
  }

  return null;
}

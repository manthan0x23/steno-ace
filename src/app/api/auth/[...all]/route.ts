import { toNextJsHandler } from "better-auth/next-js";

import { auth } from "~/server/better-auth";
import {
  handleForgetPassword,
  handleResetPassword,
} from "~/server/better-auth/auth/custom-route";

const { GET, POST: originalPOST } = toNextJsHandler(auth.handler);

export { GET };

export async function POST(request: Request) {
  const url = new URL(request.url);

  if (url.pathname === "/api/auth/forget-password") {
    return handleForgetPassword(request);
  }

  if (url.pathname === "/api/auth/reset-password") {
    return handleResetPassword(request);
  }

  return originalPOST(request);
}

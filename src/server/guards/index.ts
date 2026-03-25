import { redirect } from "next/navigation";
import { api } from "~/trpc/server";

async function guard<T>(fn: () => Promise<T>, redirectTo: string): Promise<T> {
  try {
    return await fn();
  } catch {
    redirect(redirectTo);
  }
}

export async function requireAdmin() {
  return guard(() => api.admin.auth.me(), "/admin/login");
}

export async function requireUser() {
  const user = await guard(() => api.user.me(), "/user/login");

  if (!user.emailVerified) {
    redirect("/user/verify-email?from=gate");
  }

  return user;
}

export async function requireSuperAdmin() {
  const admin = await requireAdmin();

  if (!admin.isSuper) {
    redirect("/admin");
  }

  return admin;
}

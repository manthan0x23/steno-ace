// src/server/better-auth/custom-routes.ts
import { db } from "~/server/db";
import { user, account } from "~/server/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "../config";
import { hashPassword } from "~/server/lib/hash";

export async function handleForgetPassword(
  request: Request,
): Promise<Response> {
  const body = (await request.json()) as {
    email?: string;
    redirectTo?: string;
  };
  const { email, redirectTo } = body;

  if (!email) {
    return Response.json(
      { status: false, message: "Email is required." },
      { status: 400 },
    );
  }

  const existingUser = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, email.toLowerCase().trim()))
    .limit(1);

  if (!existingUser.length) {
    return Response.json(
      { status: false, message: "No credential account found with this email address." },
      { status: 404 },
    );
  }

  // Forward to better-auth normally
  return auth.handler(
    new Request(request.url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, redirectTo }),
    }),
  );
}

export async function handleResetPassword(request: Request): Promise<Response> {
  const body = (await request.json()) as {
    newPassword?: string;
    token?: string;
  };

  const { newPassword, token } = body;

  if (!newPassword || !token) {
    return Response.json(
      { status: false, message: "Invalid request." },
      { status: 400 },
    );
  }

  // Verify the token by asking better-auth to decode it
  // Better-auth stores verification tokens — find the user via token
  const verificationResult = await db.query.verification?.findFirst?.({
    where: (v, { eq }) => eq(v.identifier, token),
  });

  // Forward to better-auth's reset handler first to validate token
  const clonedRequest = new Request(request.url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ newPassword, token }),
  });

  const betterAuthResponse = await auth.handler(clonedRequest);

  // If better-auth succeeded, check if we need to create a credential account
  if (betterAuthResponse.ok) {
    try {
      // Get the response body to find the user
      const responseData = (await betterAuthResponse.json()) as {
        user?: { id?: string; email?: string };
      };
      const userId = responseData?.user?.id;

      if (userId) {
        // Check if credential account exists
        const credAccount = await db
          .select({ id: account.id })
          .from(account)
          .where(
            and(
              eq(account.userId, userId),
              eq(account.providerId, "credential"),
            ),
          )
          .limit(1);

        if (!credAccount.length) {
          // Create credential account for Google-only users
          const hashedPassword = await hashPassword(newPassword);
          await db.insert(account).values({
            id: crypto.randomUUID(),
            userId,
            providerId: "credential",
            accountId: userId,
            password: hashedPassword,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
      }

      return Response.json(responseData);
    } catch {
      // If we can't parse response, just return it as-is
      return betterAuthResponse;
    }
  }

  return betterAuthResponse;
}

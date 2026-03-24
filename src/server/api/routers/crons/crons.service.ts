import { and, eq, gt, isNull, lt, lte, or } from "drizzle-orm";
import { db } from "~/server/db";
import { subscription, user } from "~/server/db/schema";
import { emailService } from "~/server/services/mail.service";

export const cronService = {
  async expireSubscriptions() {
    const now = new Date();

    const result = await db
      .update(subscription)
      .set({
        status: "expired",
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(subscription.status, "active"),
          lt(subscription.currentPeriodEnd, now),
        ),
      );

    console.log("Expired subscriptions cron ran");
  },

  async sendExpiryReminders() {
    const now = new Date();

    const threeDaysLater = new Date();
    threeDaysLater.setDate(now.getDate() + 3);

    const subs = await db
      .select({
        subId: subscription.id,
        userId: subscription.userId,
        email: user.email,
        name: user.name,
        currentPeriodEnd: subscription.currentPeriodEnd,
        lastReminderSentAt: subscription.lastReminderSentAt,
      })
      .from(subscription)
      .innerJoin(user, eq(subscription.userId, user.id))
      .where(
        and(
          eq(subscription.status, "active"),
          lte(subscription.currentPeriodEnd, threeDaysLater),
          gt(subscription.currentPeriodEnd, now),

          or(
            isNull(subscription.lastReminderSentAt),
            lte(
              subscription.lastReminderSentAt,
              new Date(now.getTime() - 24 * 60 * 60 * 1000),
            ),
          ),
        ),
      );

    console.log(`Found ${subs.length} users nearing expiry`);

    for (const sub of subs) {
      try {
        await emailService.sendEmail({
          to: sub.email,
          subject: "⚠️ Subscription Expiring Soon",
          html: `
              <h2>Hello ${sub.name || "User"},</h2>
    
              <p>Your subscription is about to expire in less than <b>3 days</b>.</p>
    
              <p>
                ⚠️ If your subscription expires:
                <ul>
                  <li>Your account may be removed</li>
                  <li>You may lose all your progress</li>
                </ul>
              </p>
    
              <p>
                To continue uninterrupted, kindly renew your subscription by paying 
                <b>₹1500</b>.
              </p>
    
              <p>
                ✅ Don’t worry — your remaining subscription days will still be valid.
              </p>
    
              <p>Thank you 🙏</p>
            `,
        });

        await db
          .update(subscription)
          .set({ lastReminderSentAt: new Date() })
          .where(eq(subscription.id, sub.subId));
      } catch (err) {
        console.error("Failed to send reminder:", sub.email, err);
      }
    }
  },
};

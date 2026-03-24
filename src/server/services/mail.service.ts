import { Resend } from "resend";
import { env } from "~/env";

type SendEmailInput = {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
};

type BroadcastInput = {
  emails: string[];
  subject: string;
  html: string;
  batchSize?: number;
};

export class EmailService {
  private resend: Resend;
  private defaultFrom: string;

  constructor(key: string) {
    this.resend = new Resend(key);
    this.defaultFrom = "onboarding@resend.dev";
  }

  async sendEmail(input: SendEmailInput) {
    const { to, subject, html, from } = input;

    try {
      return await this.resend.emails.send({
        from: from || this.defaultFrom,
        to,
        subject,
        html,
      });
    } catch (err) {
      console.error("Email send failed:", err);
      throw new Error("Failed to send email");
    }
  }

  async sendBulk(input: BroadcastInput) {
    const { emails, subject, html } = input;

    try {
      const res = await this.resend.batch.send(
        emails.map((email) => ({
          from: this.defaultFrom,
          to: email,
          subject,
          html,
        })),
      );

      return {
        total: emails.length,
        success: res.data?.length ?? 0,
        errors: res.error ?? null,
      };
    } catch (err) {
      console.error("Bulk email failed:", err);
      throw new Error("Bulk email failed");
    }
  }

  async broadcast(input: BroadcastInput) {
    return this.sendBulk(input);
  }

  async sendPaymentSubmitted(to: string) {
    return this.sendEmail({
      to,
      subject: "Payment Submitted",
      html: `
        <h2>Payment Received</h2>
        <p>Your payment proof has been submitted successfully.</p>
        <p>We will verify it shortly.</p>
      `,
    });
  }

  async sendPaymentApproved(to: string) {
    return this.sendEmail({
      to,
      subject: "Payment Approved 🎉",
      html: `
        <h2>Payment Approved</h2>
        <p>Your payment has been verified.</p>
        <p>Your subscription is now active.</p>
      `,
    });
  }

  async sendPaymentRejected(to: string, reason?: string) {
    return this.sendEmail({
      to,
      subject: "Payment Rejected",
      html: `
        <h2>Payment Rejected</h2>
        <p>Your payment could not be verified.</p>
        ${reason ? `<p>Reason: ${reason}</p>` : ""}
        <p>Please try again.</p>
      `,
    });
  }
}

export const emailService = new EmailService(env.RESEND_API_KEY);

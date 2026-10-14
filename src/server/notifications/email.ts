import "server-only";
import { getEnv } from "@/config/env";

export type EmailMessage = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

export interface EmailProvider {
  send(message: EmailMessage): Promise<void>;
}

class ConsoleEmailProvider implements EmailProvider {
  async send(message: EmailMessage) {
    console.info(`[scholar-email] To: ${message.to}\nSubject: ${message.subject}\n${message.text}`);
  }
}

class ResendEmailProvider implements EmailProvider {
  constructor(
    private apiKey: string,
    private from: string,
  ) {}

  async send(message: EmailMessage) {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: this.from,
        to: [message.to],
        subject: message.subject,
        html: message.html,
        text: message.text,
      }),
    });
    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Email provider rejected the message (${response.status}). ${body.slice(0, 200)}`);
    }
  }
}

export function getEmailProvider(): EmailProvider {
  const env = getEnv();
  if (env.RESEND_API_KEY && env.EMAIL_FROM) return new ResendEmailProvider(env.RESEND_API_KEY, env.EMAIL_FROM);
  return new ConsoleEmailProvider();
}

export async function sendEmail(message: EmailMessage) {
  await getEmailProvider().send(message);
}

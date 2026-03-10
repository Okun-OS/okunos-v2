import { Resend } from "resend";
import nodemailer from "nodemailer";

export interface WorkspaceEmailConfig {
  fromName?: string | null;
  fromEmail?: string | null;
  emailProvider?: string | null;
  smtpHost?: string | null;
  smtpPort?: number | null;
  smtpUser?: string | null;
  smtpPassword?: string | null;
}

export interface EmailAttachment {
  filename: string;
  path?: string;
  content?: Buffer | string;
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  text: string;
  attachments?: EmailAttachment[];
}

const DEFAULT_FROM_NAME = "OkunOS";
const DEFAULT_FROM_EMAIL = "noreply@okun-group.de";

export async function sendEmail(
  opts: SendEmailOptions,
  config?: WorkspaceEmailConfig
): Promise<{ ok: boolean; error?: string }> {
  const fromName = config?.fromName || DEFAULT_FROM_NAME;
  const fromEmail = config?.fromEmail || DEFAULT_FROM_EMAIL;
  const from = `${fromName} <${fromEmail}>`;

  if (config?.emailProvider === "SMTP" && config?.smtpHost) {
    return sendViaSMTP(opts, from, config);
  }

  return sendViaResend(opts, from);
}

async function sendViaResend(
  opts: SendEmailOptions,
  from: string
): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log("[MOCK EMAIL]", opts.to, opts.subject);
    return { ok: true };
  }

  try {
    const resend = new Resend(apiKey);
    const attachments = opts.attachments?.map((a) => {
      let content: string;
      if (a.content) {
        content = Buffer.isBuffer(a.content)
          ? a.content.toString("base64")
          : Buffer.from(a.content).toString("base64");
      } else if (a.path) {
        const fs = require("fs");
        content = fs.readFileSync(a.path).toString("base64");
      } else {
        content = "";
      }
      return { filename: a.filename, content };
    });

    await resend.emails.send({
      from,
      to: opts.to,
      subject: opts.subject,
      text: opts.text,
      attachments: attachments?.length ? attachments : undefined,
    });
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}

async function sendViaSMTP(
  opts: SendEmailOptions,
  from: string,
  config: WorkspaceEmailConfig
): Promise<{ ok: boolean; error?: string }> {
  try {
    const transport = nodemailer.createTransport({
      host: config.smtpHost!,
      port: config.smtpPort || 587,
      secure: (config.smtpPort || 587) === 465,
      auth: { user: config.smtpUser!, pass: config.smtpPassword! },
    });

    await transport.sendMail({
      from,
      to: opts.to,
      subject: opts.subject,
      text: opts.text,
      attachments: opts.attachments?.map((a) => ({
        filename: a.filename,
        path: a.path,
        content: a.content,
      })),
    });
    return { ok: true };
  } catch (smtpError: any) {
    console.warn("[SMTP] Send failed, attempting Resend fallback:", smtpError.message);

    // Fall back to Resend if API key is available
    if (process.env.RESEND_API_KEY) {
      return sendViaResend(opts, from);
    }

    return { ok: false, error: smtpError.message };
  }
}

export async function testSmtpConnection(
  config: WorkspaceEmailConfig
): Promise<{ ok: boolean; error?: string }> {
  try {
    const transport = nodemailer.createTransport({
      host: config.smtpHost!,
      port: config.smtpPort || 587,
      secure: (config.smtpPort || 587) === 465,
      auth: { user: config.smtpUser!, pass: config.smtpPassword! },
    });
    await transport.verify();
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}

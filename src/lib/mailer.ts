// ============================
// Nodemailer SMTP transport (server-side only)
// ============================
import nodemailer from "nodemailer";
import type { SendResult, Recipient, SmtpOptions } from "@/types";

/**
 * Create SMTP transporter from environment variables
 */
function createTransporter(smtpOptions?: SmtpOptions) {
  const host = smtpOptions?.host || process.env.SMTP_HOST;
  const port = Number(smtpOptions?.port ?? process.env.SMTP_PORT) || 587;
  const secure = typeof smtpOptions?.secure === "boolean" ? smtpOptions!.secure : process.env.SMTP_SECURE === "true";
  const user = smtpOptions?.user || process.env.SMTP_USER;
  const pass = smtpOptions?.pass || process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error(
      "SMTP credentials are not configured. Provide SMTP host/user/pass or set environment variables."
    );
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    tls: { rejectUnauthorized: false },
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
  });
}

/**
 * Send a single email
 */
async function sendSingleEmail(
  transporter: nodemailer.Transporter,
  to: string,
  subject: string,
  htmlBody: string,
  attachment?: { filename: string; content: Buffer; contentType: string },
  senderEmail?: string
): Promise<SendResult> {
  try {
    const senderName = process.env.SENDER_NAME || "Cold Mail";
    const resolvedSender = senderEmail || process.env.SMTP_USER;

    const mailOptions: nodemailer.SendMailOptions = {
      from: `"${senderName}" <${resolvedSender}>`,
      to,
      subject,
      html: htmlBody,
      attachments: attachment
        ? [
            {
              filename: attachment.filename,
              content: attachment.content,
              contentType: attachment.contentType,
            },
          ]
        : [],
    };

    await transporter.sendMail(mailOptions);
    return { email: to, status: "success", message: "Email sent successfully" };
  } catch (error: any) {
    return {
      email: to,
      status: "failed",
      message: error.message || "Unknown error",
    };
  }
}

/**
 * Send emails in bulk with batching and delay
 */
export async function sendBulkEmails(
  recipients: Recipient[],
  subject: string,
  // attachment applies to all recipients
  attachment?: { filename: string; content: Buffer; contentType: string },
  onProgress?: (sent: number, total: number) => void,
  onResult?: (result: SendResult, sent: number, total: number) => void,
  smtpOptions?: SmtpOptions
): Promise<SendResult[]> {
  const transporter = createTransporter(smtpOptions);

  // Verify SMTP connection
  try {
    await transporter.verify();
  } catch (error: any) {
    throw new Error(`SMTP connection failed: ${error.message}`);
  }

  const batchSize = Number(process.env.BATCH_SIZE) || 10;
  const batchDelay = Number(process.env.BATCH_DELAY) || 2000;
  const results: SendResult[] = [];

  const senderEmail = smtpOptions?.user || process.env.SMTP_USER;

  for (let i = 0; i < recipients.length; i += batchSize) {
    const batch = recipients.slice(i, i + batchSize);

    // send emails in the batch sequentially to provide accurate per-email status
    for (const r of batch) {
      try {
        const res = await sendSingleEmail(transporter, r.email, subject, r.body, attachment, senderEmail);
        results.push(res);
        if (onResult) {
          try { onResult(res, results.length, recipients.length); } catch (e) {}
        }
      } catch (err: any) {
        const res: SendResult = { email: r.email || 'unknown', status: 'failed', message: err?.message || 'Unknown error' };
        results.push(res);
        if (onResult) {
          try { onResult(res, results.length, recipients.length); } catch (e) {}
        }
      }
    }

    if (onProgress) {
      onProgress(results.length, recipients.length);
    }

    // Delay between batches to avoid rate limiting
    if (i + batchSize < recipients.length) {
      await new Promise((resolve) => setTimeout(resolve, batchDelay));
    }
  }

  transporter.close();
  return results;
}

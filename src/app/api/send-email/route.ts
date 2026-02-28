// ============================
// API Route: POST /api/send-email
// ============================
import { NextRequest, NextResponse } from "next/server";
import { sendBulkEmails } from "@/lib/mailer";
import { isValidEmail } from "@/lib/email-validator";
import type { ApiResponse, ValidationError, Recipient } from "@/types";

export const runtime = "nodejs";
export const maxDuration = 300; // 5 minutes for large email lists

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // ---- Extract fields ----
    const subject = formData.get("subject") as string;
    const body = formData.get("body") as string;
    const recipientsJson = formData.get("recipients") as string;
    const emailsJson = formData.get("emails") as string; // legacy
    const attachmentFile = formData.get("attachment") as File | null;

    // ---- Parse recipients list ----
    let recipients: Recipient[] = [];

    if (recipientsJson) {
      try {
        recipients = JSON.parse(recipientsJson || "[]");
      } catch {
        return NextResponse.json(
          { success: false, message: "Invalid recipients format." },
          { status: 400 }
        );
      }
    } else {
      // legacy: emails is an array of strings, use same body for all
      try {
        const emails = JSON.parse(emailsJson || "[]");
        if (Array.isArray(emails)) {
          recipients = emails.map((e: string) => ({ email: e, body }));
        }
      } catch {
        return NextResponse.json(
          { success: false, message: "Invalid email list format." },
          { status: 400 }
        );
      }
    }

    // ---- Validation ----
    const errors: ValidationError[] = [];

    if (!subject || !subject.trim()) {
      errors.push({ field: "subject", message: "Subject is required." });
    }

    if (!body || !body.trim() || body.trim() === "<p><br></p>") {
      errors.push({ field: "body", message: "Email body is required." });
    }

    if (!recipients || recipients.length === 0) {
      errors.push({
        field: "emails",
        message: "At least one email address is required.",
      });
    }

    // Validate each email
    const invalidEmails = recipients.map((r) => r.email).filter((e) => !isValidEmail(e));
    if (invalidEmails.length > 0) {
      errors.push({
        field: "emails",
        message: `Invalid emails: ${invalidEmails.slice(0, 5).join(", ")}${invalidEmails.length > 5 ? ` and ${invalidEmails.length - 5} more` : ""}`,
      });
    }

    if (errors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Validation failed.",
          errors,
          total: 0,
          sent: 0,
          failed: 0,
          results: [],
        },
        { status: 400 }
      );
    }

    // ---- Process attachment ----
    let attachment:
      | { filename: string; content: Buffer; contentType: string }
      | undefined;

    if (attachmentFile && attachmentFile.size > 0) {
      // 25MB limit
      if (attachmentFile.size > 25 * 1024 * 1024) {
        return NextResponse.json(
          {
            success: false,
            message: "Attachment size exceeds 25MB limit.",
            total: 0,
            sent: 0,
            failed: 0,
            results: [],
          },
          { status: 400 }
        );
      }

      const arrayBuffer = await attachmentFile.arrayBuffer();
      attachment = {
        filename: attachmentFile.name,
        content: Buffer.from(arrayBuffer),
        contentType: attachmentFile.type || "application/octet-stream",
      };
    }

    // ---- Send emails as a streaming response (NDJSON) ----
    const validRecipients = recipients.filter((r) => isValidEmail(r.email));
    const total = validRecipients.length;

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          // per-result callback will push JSON lines
          await sendBulkEmails(
            validRecipients,
            subject,
            attachment,
            undefined,
            (result, sent, tot) => {
              const payload = { type: "result", result, sent, total: tot };
              controller.enqueue(encoder.encode(JSON.stringify(payload) + "\n"));
            }
          );

          // finalize
          const summary = {
            total,
          };
          controller.enqueue(encoder.encode(JSON.stringify({ type: "done", summary }) + "\n"));
          controller.close();
        } catch (err: any) {
          controller.enqueue(encoder.encode(JSON.stringify({ type: "error", message: err?.message || String(err) }) + "\n"));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error: any) {
    console.error("Send email error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Internal server error.",
        total: 0,
        sent: 0,
        failed: 0,
        results: [],
      },
      { status: 500 }
    );
  }
}

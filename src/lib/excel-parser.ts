// ============================
// Excel parsing logic (client-side)
// ============================
import * as XLSX from "xlsx";
import { isValidEmail } from "./email-validator";
import type { ParsedExcelData } from "@/types";

/**
 * Parse an Excel or CSV file and extract emails from the 'email' column.
 * Also looks for common variations: 'Email', 'EMAIL', 'e-mail', 'email_address', etc.
 */
export async function parseExcelFile(file: File): Promise<ParsedExcelData> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });

  const firstSheet = workbook.SheetNames[0];
  if (!firstSheet) {
    throw new Error("No sheets found in the uploaded file.");
  }

  const worksheet = workbook.Sheets[firstSheet];
  const jsonData: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, {
    defval: "",
  });

  if (jsonData.length === 0) {
    throw new Error("The uploaded file is empty.");
  }

  const headers = Object.keys(jsonData[0]);

  // Normalize headers to consistent keys (lowercase, underscores)
  const normalize = (h: string) =>
    h
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "_")
      .replace(/-+/g, "_")
      .replace(/[^a-z0-9_]/g, "");

  const normalizedHeaders = headers.map((h) => normalize(h));

  // Find the email column (case-insensitive, supports common variations)
  const emailColumnPatterns = [
    "email",
    "e-mail",
    "email_address",
    "emailaddress",
    "mail",
    "email id",
    "emailid",
  ];

  // Find email column by normalized header name
  const emailColumnIndex = normalizedHeaders.findIndex((h) =>
    emailColumnPatterns.includes(h.toLowerCase().trim())
  );

  const emailColumn = emailColumnIndex >= 0 ? headers[emailColumnIndex] : undefined;

  if (!emailColumn) {
    throw new Error(
      `No "email" column found. Available columns: ${headers.join(", ")}. ` +
        `Please ensure your file has a column named "email".`
    );
  }

  // Build rows as normalized maps
  const rows: Record<string, string>[] = jsonData.map((row) => {
    const map: Record<string, string> = {};
    headers.forEach((h, idx) => {
      const key = normalizedHeaders[idx];
      map[key] = String(row[h] ?? "").trim();
    });
    return map;
  });

  const allEmails = rows
    .map((r) => String(r[normalizedHeaders[emailColumnIndex]] || "").trim().toLowerCase())
    .filter((e) => e.length > 0);

  return {
    emails: allEmails,
    totalRows: rows.length,
    headers: normalizedHeaders,
    rows,
  };
}

/**
 * Apply row range filter (1-indexed, inclusive)
 */
export function filterByRowRange<T>(
  rows: T[],
  startRow: number,
  endRow: number
): T[] {
  const start = Math.max(1, startRow) - 1; // convert to 0-indexed
  const end = Math.min(rows.length, endRow); // endRow is inclusive
  return rows.slice(start, end);
}

/**
 * Validate and filter emails from the parsed list
 */
export function validateEmails(emails: string[]): {
  valid: string[];
  invalid: string[];
} {
  const valid: string[] = [];
  const invalid: string[] = [];

  emails.forEach((email) => {
    if (isValidEmail(email)) {
      valid.push(email);
    } else {
      invalid.push(email);
    }
  });

  return { valid: Array.from(new Set(valid)), invalid };
}

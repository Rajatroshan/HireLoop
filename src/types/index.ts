// ============================
// Type definitions
// ============================

export interface EmailPayload {
  subject: string;
  body: string;
  emails: string[];
  startRow: number;
  endRow: number;
}

export interface SendResult {
  email: string;
  status: "success" | "failed";
  message: string;
}

export interface ApiResponse {
  success: boolean;
  message: string;
  total: number;
  sent: number;
  failed: number;
  results: SendResult[];
}

export interface ParsedExcelData {
  emails: string[];
  totalRows: number;
  headers: string[];
  rows: Record<string, string>[]; // each row as header->value map
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ComposeFormState {
  subject: string;
  body: string;
  manualEmails: string;
  startRow: number;
  endRow: number;
  excelFile: File | null;
  attachment: File | null;
  excelEmails: string[];
  previewRecipients: Recipient[];
  parsedRows: Record<string, string>[];
  totalExcelRows: number;
  smtpUser?: string;
  smtpPass?: string;
}

export interface Recipient {
  email: string;
  body: string; // rendered HTML body for this recipient
  rowIndex?: number; // 1-based row index when from excel
}

export interface SmtpOptions {
  host?: string;
  port?: number;
  secure?: boolean;
  user?: string;
  pass?: string;
}

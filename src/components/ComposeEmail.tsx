// ============================
// Main Compose Email Component
// ============================
"use client";

import { useState, useCallback, useEffect } from "react";
import {
  Send,
  RotateCcw,
  Minimize2,
  Maximize2,
  AlertCircle,
} from "lucide-react";
import RichTextEditor from "./RichTextEditor";
import FileUpload from "./FileUpload";
import EmailPreviewTable from "./EmailPreviewTable";
import StatusModal from "./StatusModal";
import { parseExcelFile, filterByRowRange, validateEmails } from "@/lib/excel-parser";
import {
  parseManualEmails,
  mergeEmails,
  getInvalidEmails,
} from "@/lib/email-validator";
import type { ApiResponse, ComposeFormState, Recipient } from "@/types";
import { renderTemplate } from "@/lib/template";

const INITIAL_STATE: ComposeFormState = {
  subject: "",
  body: "",
  manualEmails: "",
  startRow: 1,
  endRow: 0,
  excelFile: null,
  attachment: null,
  excelEmails: [],
  previewRecipients: [],
  parsedRows: [],
  totalExcelRows: 0,
  smtpUser: "",
  smtpPass: "",
};

export default function ComposeEmail() {
  const [form, setForm] = useState<ComposeFormState>(INITIAL_STATE);
  const [sendProgress, setSendProgress] = useState<{ sent: number; total: number; results: any[] }>({ sent: 0, total: 0, results: [] });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isMinimized, setIsMinimized] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState<ApiResponse | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [excelParsing, setExcelParsing] = useState(false);

  // ---- Update form field ----
  const updateField = useCallback(
    <K extends keyof ComposeFormState>(key: K, value: ComposeFormState[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    },
    []
  );

  // ---- Handle Excel upload ----
  const handleExcelUpload = useCallback(
    async (file: File | null) => {
      updateField("excelFile", file);

      if (!file) {
        updateField("excelEmails", []);
        updateField("parsedRows", []);
        updateField("totalExcelRows", 0);
        updateField("endRow", 0);
        return;
      }

      setExcelParsing(true);
      try {
        const parsed = await parseExcelFile(file);
        updateField("excelEmails", parsed.emails);
        updateField("parsedRows", parsed.rows || []);
        updateField("totalExcelRows", parsed.totalRows);
        if (form.endRow === 0) {
          updateField("endRow", parsed.totalRows);
        }
        setErrors((prev) => {
          const next = { ...prev };
          delete next["excelFile"];
          return next;
        });
      } catch (err: any) {
        setErrors((prev) => ({ ...prev, excelFile: err.message }));
        updateField("excelEmails", []);
        updateField("parsedRows", []);
        updateField("totalExcelRows", 0);
      } finally {
        setExcelParsing(false);
      }
    },
    [updateField, form.endRow]
  );

  // ---- Compute preview emails whenever inputs change ----
  useEffect(() => {
    const recipients: Recipient[] = [];

    // Excel rows with row filter
    if (form.parsedRows && form.parsedRows.length > 0) {
      const start = form.startRow || 1;
      const end = form.endRow || form.parsedRows.length;
      const filteredRows = filterByRowRange(form.parsedRows, start, end);

      filteredRows.forEach((row, idx) => {
        const email = String(row["email"] || row["e-mail"] || "").trim().toLowerCase();
        if (!email) return;
        const rendered = renderTemplate(form.body, row, "");
        recipients.push({ email, body: rendered, rowIndex: start + idx });
      });
    }

    // Manual emails
    const manualEmails = parseManualEmails(form.manualEmails);
    manualEmails.forEach((e) => {
      // avoid duplicates: if already present from excel skip
      if (!recipients.find((r) => r.email === e)) {
        const rendered = renderTemplate(form.body, {}, "");
        recipients.push({ email: e, body: rendered });
      }
    });

    setForm((prev) => ({ ...prev, previewRecipients: recipients }));
  }, [form.parsedRows, form.manualEmails, form.startRow, form.endRow, form.body]);

  // ---- Validate form ----
  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!form.subject.trim()) {
      errs.subject = "Subject is required.";
    }

    const cleanBody = form.body
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, " ")
      .trim();
    if (!cleanBody) {
      errs.body = "Email body is required.";
    }

    if (form.previewRecipients.length === 0) {
      errs.emails =
        "No valid emails found. Upload an Excel file or enter emails manually.";
    }

    if (
      form.excelEmails.length > 0 &&
      form.startRow > 0 &&
      form.endRow > 0 &&
      form.startRow > form.endRow
    ) {
      errs.rowRange = "Start row cannot be greater than end row.";
    }

    const invalids = getInvalidEmails(form.manualEmails);
    if (invalids.length > 0) {
      errs.manualEmails = `Invalid emails found: ${invalids.slice(0, 3).join(", ")}${invalids.length > 3 ? "..." : ""}`;
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ---- Send emails ----
  const handleSend = async () => {
    if (!validate()) return;

    setIsSending(true);
    setShowModal(true);
    setSendResult(null);

    try {
      const formData = new FormData();
      formData.append("subject", form.subject);
      formData.append("body", form.body);
      // send recipients with pre-rendered bodies
      formData.append("recipients", JSON.stringify(form.previewRecipients));

      if (form.attachment) {
        formData.append("attachment", form.attachment);
      }

      // include optional SMTP username/password only (client-provided)
      if (form.smtpUser) formData.append("smtpUser", form.smtpUser);
      if (form.smtpPass) formData.append("smtpPass", form.smtpPass);

      const response = await fetch("/api/send-email", {
        method: "POST",
        body: formData,
      });

      if (!response.body) {
        throw new Error("No response body from server.");
      }

      // stream NDJSON lines
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";

      // initialize progress
      setSendProgress({ sent: 0, total: form.previewRecipients.length, results: [] });
      const localResults: any[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() || "";

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const obj = JSON.parse(line);
            if (obj.type === "result") {
              const { result, sent, total } = obj;
              localResults.push(result);
              setSendProgress({ sent: sent, total: total, results: [...localResults] });
            } else if (obj.type === "done") {
              // finalize later
            } else if (obj.type === "error") {
              setSendResult({ success: false, message: obj.message || "Server error", total: form.previewRecipients.length, sent: 0, failed: form.previewRecipients.length, results: [] });
            }
          } catch (e) {
            // ignore parse errors
          }
        }
      }

      // after stream completes, compute final summary
      const results = localResults;
      const sentCount = results.filter((r) => r.status === "success").length;
      const failedCount = results.filter((r) => r.status === "failed").length;
      const apiResp: ApiResponse = {
        success: failedCount === 0,
        message: failedCount === 0 ? `All ${sentCount} emails sent successfully!` : `${sentCount} sent, ${failedCount} failed out of ${results.length} emails.`,
        total: results.length,
        sent: sentCount,
        failed: failedCount,
        results,
      };

      setSendResult(apiResp);
    } catch (error: any) {
      setSendResult({
        success: false,
        message: error.message || "Network error. Please try again.",
        total: form.previewRecipients.length,
        sent: 0,
        failed: form.previewRecipients.length,
        results: [],
      });
    } finally {
      setIsSending(false);
    }
  };

  // ---- Reset form ----
  const handleReset = () => {
    setForm(INITIAL_STATE);
    setErrors({});
    setSendResult(null);
  };

  // ---- Compose window sizing ----
  const containerClass = isFullscreen
    ? "fixed inset-0 z-40 m-0 rounded-none"
    : "w-full max-w-3xl mx-auto";

  return (
    <>
      <div
        className={`bg-white rounded-t-xl shadow-compose flex flex-col transition-all duration-300 ${containerClass}`}
      >
        {/* Title Bar (Gmail-style) */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-gmail-text rounded-t-xl">
          <h2 className="text-sm font-medium text-white">New Message</h2>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1.5 hover:bg-white/20 rounded transition-colors"
              title={isMinimized ? "Expand" : "Minimize"}
            >
              <Minimize2 size={14} className="text-white" />
            </button>
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 hover:bg-white/20 rounded transition-colors"
              title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
            >
              <Maximize2 size={14} className="text-white" />
            </button>
          </div>
        </div>

        {/* Body - expandable */}
        {!isMinimized && (
          <div
            className={`flex-1 overflow-y-auto ${isFullscreen ? "px-8 py-6" : "px-5 py-4"}`}
          >
            <div className="space-y-5">
              {/* Subject */}
              <div>
                <label className="block text-sm font-medium text-gmail-text mb-1.5">
                  Subject
                </label>
                <input
                  type="text"
                  value={form.subject}
                  onChange={(e) => updateField("subject", e.target.value)}
                  placeholder="Enter email subject"
                  className={`w-full px-3 py-2.5 text-sm border rounded-lg outline-none transition-colors
                    ${errors.subject ? "border-red-400 bg-red-50" : "border-gmail-border focus:border-gmail-blue"}`}
                />
                {errors.subject && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle size={12} /> {errors.subject}
                  </p>
                )}
              </div>

              {/* Rich Text Body */}
              <div>
                <label className="block text-sm font-medium text-gmail-text mb-1.5">
                  Email Body
                </label>
                <RichTextEditor
                  value={form.body}
                  onChange={(val) => updateField("body", val)}
                  placeholder="Compose your email..."
                />
                {errors.body && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle size={12} /> {errors.body}
                  </p>
                )}
              </div>

              {/* Attachment */}
              <FileUpload
                label="Attachment"
                accept="*/*"
                file={form.attachment}
                onFileSelect={(f) => updateField("attachment", f)}
                icon="attachment"
                maxSizeMB={25}
                hint="Max 25MB. Supported: PDF, DOC, images, etc."
              />

              {/* Divider */}
              <div className="border-t border-gmail-border" />

              {/* Email Sources Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gmail-text uppercase tracking-wide">
                  Recipients
                </h3>

                {/* Excel Upload */}
                <FileUpload
                  label="Upload Excel / CSV (with 'email' column)"
                  accept=".xlsx,.xls,.csv"
                  file={form.excelFile}
                  onFileSelect={handleExcelUpload}
                  icon="spreadsheet"
                  maxSizeMB={10}
                  hint="Columns should include 'email'. Max 10MB."
                />
                {errors.excelFile && (
                  <p className="text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle size={12} /> {errors.excelFile}
                  </p>
                )}
                {excelParsing && (
                  <p className="text-xs text-gmail-blue flex items-center gap-1">
                    <span className="w-3 h-3 border-2 border-gmail-blue border-t-transparent rounded-full animate-spin" />
                    Parsing file...
                  </p>
                )}

                {/* Row Range (only if excel is loaded) */}
                {form.excelEmails.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                    <p className="text-sm text-gmail-text">
                      <strong>{form.totalExcelRows}</strong> emails found in
                      Excel file. Select row range:
                    </p>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-gmail-text-secondary mb-1">
                          Start Row
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={form.totalExcelRows}
                          value={form.startRow}
                          onChange={(e) =>
                            updateField(
                              "startRow",
                              Math.max(1, parseInt(e.target.value) || 1)
                            )
                          }
                          className="w-full px-3 py-2 text-sm border border-blue-300 rounded-lg outline-none focus:border-gmail-blue bg-white"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-gmail-text-secondary mb-1">
                          End Row
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={form.totalExcelRows}
                          value={form.endRow}
                          onChange={(e) =>
                            updateField(
                              "endRow",
                              Math.max(
                                1,
                                parseInt(e.target.value) ||
                                  form.totalExcelRows
                              )
                            )
                          }
                          className="w-full px-3 py-2 text-sm border border-blue-300 rounded-lg outline-none focus:border-gmail-blue bg-white"
                        />
                      </div>
                    </div>
                    {errors.rowRange && (
                      <p className="text-xs text-red-600 flex items-center gap-1">
                        <AlertCircle size={12} /> {errors.rowRange}
                      </p>
                    )}
                  </div>
                )}

                {/* Manual Emails */}
                <div>
                  <label className="block text-sm font-medium text-gmail-text mb-1.5">
                    Manual Email Input
                  </label>
                  <textarea
                    value={form.manualEmails}
                    onChange={(e) =>
                      updateField("manualEmails", e.target.value)
                    }
                    placeholder={`Enter email addresses separated by comma, semicolon, or new line:\njohn@example.com, jane@example.com\nalice@example.com`}
                    rows={4}
                    className={`w-full px-3 py-2.5 text-sm border rounded-lg outline-none transition-colors resize-y font-mono
                      ${errors.manualEmails ? "border-red-400 bg-red-50" : "border-gmail-border focus:border-gmail-blue"}`}
                  />
                  {errors.manualEmails && (
                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                      <AlertCircle size={12} /> {errors.manualEmails}
                    </p>
                  )}
                  <p className="text-xs text-gmail-text-secondary mt-1">
                    Separate emails with commas, semicolons, or new lines.
                    {form.excelEmails.length > 0 &&
                      " These will be merged with Excel emails (duplicates removed)."}
                  </p>
                </div>

                {errors.emails && (
                  <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                    <p className="text-sm text-red-600 flex items-center gap-2">
                      <AlertCircle size={16} /> {errors.emails}
                    </p>
                  </div>
                )}

                {/* SMTP Credentials (optional) */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 space-y-3">
                  <h4 className="text-sm font-semibold text-gmail-text">SMTP Credentials (optional)</h4>
                  <p className="text-xs text-gmail-text-secondary">Provide SMTP username and password to send using your SMTP account. Host/port/secure will use server configuration.</p>

                  <div className="grid grid-cols-2 gap-3">
                    <input
                      placeholder="SMTP Username"
                      value={form.smtpUser || ""}
                      onChange={(e) => updateField("smtpUser", e.target.value)}
                      className="px-3 py-2 text-sm border rounded-lg outline-none"
                    />

                    <input
                      placeholder="SMTP Password"
                      type="password"
                      value={form.smtpPass || ""}
                      onChange={(e) => updateField("smtpPass", e.target.value)}
                      className="px-3 py-2 text-sm border rounded-lg outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Preview Table */}
              {form.previewRecipients.length > 0 && (
                <EmailPreviewTable
                  recipients={form.previewRecipients}
                  title={`Recipients (${form.previewRecipients.length})`}
                />
              )}
            </div>
          </div>
        )}

        {/* Footer / Action Buttons */}
        {!isMinimized && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gmail-border bg-gray-50 rounded-b-xl">
            <div className="flex items-center gap-2">
                <button
                onClick={handleSend}
                disabled={isSending || form.previewRecipients.length === 0}
                className="flex items-center gap-2 px-6 py-2.5 bg-gmail-blue text-white rounded-full text-sm font-medium
                  hover:bg-gmail-hover hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed
                  transition-all duration-200 active:scale-95"
              >
                <Send size={16} />
                Send Mail
                {form.previewRecipients.length > 0 && (
                  <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
                    {form.previewRecipients.length}
                  </span>
                )}
              </button>
            </div>
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-4 py-2 text-sm text-gmail-text-secondary hover:bg-gray-200 rounded-full transition-colors"
              title="Reset form"
            >
              <RotateCcw size={14} />
              Reset
            </button>
          </div>
        )}
      </div>

      {/* Status Modal */}
      <StatusModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        result={sendResult}
        isLoading={isSending}
        progress={{
          sent: isSending ? sendProgress.sent : sendResult?.sent || 0,
          total: isSending ? sendProgress.total : form.previewRecipients.length,
        }}
        liveResults={isSending ? sendProgress.results : sendResult?.results || []}
      />
    </>
  );
}

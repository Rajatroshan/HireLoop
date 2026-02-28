// ============================
// Email Preview Table
// ============================
"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Users, AlertTriangle, CheckCircle2, Eye } from "lucide-react";
import { isValidEmail } from "@/lib/email-validator";
import type { Recipient } from "@/types";
import TemplatePreviewModal from "./TemplatePreviewModal";

interface EmailPreviewTableProps {
  recipients: Recipient[];
  title?: string;
}

const PAGE_SIZE = 20;

export default function EmailPreviewTable({
  recipients,
  title = "Email Preview",
}: EmailPreviewTableProps) {
  const [page, setPage] = useState(0);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewRecipient, setPreviewRecipient] = useState<Recipient | null>(null);

  if (recipients.length === 0) return null;

  const totalPages = Math.ceil(recipients.length / PAGE_SIZE);
  const pageItems = recipients.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const validCount = recipients.filter((r) => isValidEmail(r.email)).length;
  const invalidCount = recipients.length - validCount;

  return (
    <div className="border border-gmail-border rounded-lg overflow-hidden bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gmail-border">
        <div className="flex items-center gap-2">
          <Users size={16} className="text-gmail-blue" />
          <h3 className="text-sm font-semibold text-gmail-text">{title}</h3>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1 text-green-600">
            <CheckCircle2 size={13} />
            {validCount} valid
          </span>
          {invalidCount > 0 && (
            <span className="flex items-center gap-1 text-red-500">
              <AlertTriangle size={13} />
              {invalidCount} invalid
            </span>
          )}
          <span className="text-gmail-text-secondary font-medium">
            {recipients.length} total
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="max-h-[320px] overflow-y-auto">
        <table className="w-full">
          <thead className="sticky top-0 bg-white">
            <tr className="border-b border-gmail-border">
              <th className="text-left text-xs font-medium text-gmail-text-secondary px-4 py-2 w-16">#</th>
              <th className="text-left text-xs font-medium text-gmail-text-secondary px-4 py-2">Email Address</th>
              <th className="text-left text-xs font-medium text-gmail-text-secondary px-4 py-2">Preview</th>
              <th className="text-center text-xs font-medium text-gmail-text-secondary px-4 py-2 w-20">Status</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map((r, idx) => {
              const globalIdx = page * PAGE_SIZE + idx + 1;
              const valid = isValidEmail(r.email);
              return (
                <tr key={`${r.email}-${globalIdx}`} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-2 text-xs text-gmail-text-secondary">{globalIdx}</td>
                  <td className="px-4 py-2">
                    <span className={`text-sm font-mono ${valid ? "text-gmail-text" : "text-red-500 line-through"}`}>{r.email}</span>
                  </td>
                  <td className="px-4 py-2">
                    <button
                      onClick={() => {
                        setPreviewRecipient(r);
                        setPreviewOpen(true);
                      }}
                      className="inline-flex items-center gap-2 px-3 py-1 text-xs bg-gray-100 rounded-full hover:bg-gray-200"
                    >
                      <Eye size={14} /> Preview
                    </button>
                  </td>
                  <td className="px-4 py-2 text-center">
                    {valid ? (
                      <span className="inline-flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                        <CheckCircle2 size={11} /> Valid
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-red-500 bg-red-50 px-2 py-0.5 rounded-full">
                        <AlertTriangle size={11} /> Invalid
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-t border-gmail-border">
          <span className="text-xs text-gmail-text-secondary">Page {page + 1} of {totalPages}</span>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"><ChevronLeft size={16} /></button>
            <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"><ChevronRight size={16} /></button>
          </div>
        </div>
      )}

      <TemplatePreviewModal isOpen={previewOpen} onClose={() => setPreviewOpen(false)} email={previewRecipient?.email} html={previewRecipient?.body} />
    </div>
  );
}

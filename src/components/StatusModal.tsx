// ============================
// Send Results Modal
// ============================
"use client";

import { X, CheckCircle2, XCircle, AlertTriangle, Mail } from "lucide-react";
import type { ApiResponse, SendResult } from "@/types";

interface StatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: ApiResponse | null;
  isLoading: boolean;
  progress?: { sent: number; total: number };
  liveResults?: SendResult[];
}

export default function StatusModal({
  isOpen,
  onClose,
  result,
  isLoading,
  progress,
  liveResults,
}: StatusModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={!isLoading ? onClose : undefined}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div
          className={`px-6 py-4 flex items-center justify-between ${
            isLoading
              ? "bg-blue-50"
              : result?.success
                ? "bg-green-50"
                : "bg-red-50"
          }`}
        >
          <div className="flex items-center gap-3">
            {isLoading ? (
              <div className="w-6 h-6 border-2 border-gmail-blue border-t-transparent rounded-full animate-spin" />
            ) : result?.success ? (
              <CheckCircle2 size={24} className="text-green-600" />
            ) : (
              <AlertTriangle size={24} className="text-red-500" />
            )}
            <h2 className="text-lg font-semibold text-gmail-text">
              {isLoading
                ? "Sending Emails..."
                : result?.success
                  ? "All Emails Sent!"
                  : "Sending Complete"}
            </h2>
          </div>
          {!isLoading && (
            <button
              onClick={onClose}
              className="p-1 hover:bg-black/10 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {isLoading && progress && (
            <div className="space-y-3">
              <div className="flex justify-between text-sm text-gmail-text-secondary">
                <span>Progress</span>
                <span>
                  {progress.sent} / {progress.total}
                </span>
              </div>
              <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gmail-blue rounded-full transition-all duration-500"
                  style={{
                    width: `${(progress.sent / progress.total) * 100}%`,
                  }}
                />
              </div>
              <p className="text-xs text-gmail-text-secondary text-center">
                Please don&apos;t close this window while emails are being
                sent...
              </p>
              {/* Live per-email results */}
              {liveResults && liveResults.length > 0 && (
                <div className="max-h-[160px] overflow-y-auto border rounded-md p-2 bg-white mt-3">
                  {liveResults.slice(-8).map((r, i) => (
                    <div key={i} className="flex items-center justify-between text-xs py-1">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${r.status === 'success' ? 'bg-green-500' : 'bg-red-500'}`} />
                        <span className="font-mono truncate max-w-[260px]">{r.email}</span>
                      </div>
                      <div className="text-rose-500 text-xs">{r.status === 'success' ? 'OK' : 'Failed'}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {!isLoading && result && (
            <div className="space-y-4">
              <p className="text-sm text-gmail-text">{result.message}</p>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <Mail size={18} className="mx-auto mb-1 text-gmail-blue" />
                  <p className="text-lg font-bold text-gmail-text">
                    {result.total}
                  </p>
                  <p className="text-xs text-gmail-text-secondary">Total</p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <CheckCircle2
                    size={18}
                    className="mx-auto mb-1 text-green-600"
                  />
                  <p className="text-lg font-bold text-green-600">
                    {result.sent}
                  </p>
                  <p className="text-xs text-gmail-text-secondary">Sent</p>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <XCircle size={18} className="mx-auto mb-1 text-red-500" />
                  <p className="text-lg font-bold text-red-500">
                    {result.failed}
                  </p>
                  <p className="text-xs text-gmail-text-secondary">Failed</p>
                </div>
              </div>

              {/* Failed emails detail */}
              {result.failed > 0 && (
                <div className="border border-red-200 rounded-lg overflow-hidden">
                  <div className="px-3 py-2 bg-red-50 border-b border-red-200">
                    <p className="text-xs font-medium text-red-600">
                      Failed Emails
                    </p>
                  </div>
                  <div className="max-h-[150px] overflow-y-auto">
                    {result.results
                      .filter((r) => r.status === "failed")
                      .map((r, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between px-3 py-2 border-b border-red-100 last:border-0"
                        >
                          <span className="text-xs font-mono text-gmail-text truncate">
                            {r.email}
                          </span>
                          <span className="text-xs text-red-500 ml-2 flex-shrink-0">
                            {r.message}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {!isLoading && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gmail-border flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2 bg-gmail-blue text-white rounded-full text-sm font-medium hover:bg-gmail-hover transition-colors"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

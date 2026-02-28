"use client";

import { X } from "lucide-react";

interface TemplatePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  email?: string;
  html?: string;
}

export default function TemplatePreviewModal({ isOpen, onClose, email, html }: TemplatePreviewModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-3xl mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div>
            <h3 className="text-sm font-semibold text-gmail-text">Preview: {email}</h3>
            <p className="text-xs text-gmail-text-secondary">Rendered email body</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <X />
          </button>
        </div>
        <div className="px-4 py-4 max-h-[60vh] overflow-y-auto prose">
          <div dangerouslySetInnerHTML={{ __html: html || "" }} />
        </div>
        <div className="px-4 py-3 bg-gray-50 text-right">
          <button onClick={onClose} className="px-4 py-2 bg-gmail-blue text-white rounded-full">Close</button>
        </div>
      </div>
    </div>
  );
}

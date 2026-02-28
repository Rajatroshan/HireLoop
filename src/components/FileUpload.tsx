// ============================
// File Upload Component
// ============================
"use client";

import { useRef, useState, useCallback } from "react";
import { Upload, X, FileSpreadsheet, Paperclip, FileText } from "lucide-react";

interface FileUploadProps {
  label: string;
  accept: string;
  file: File | null;
  onFileSelect: (file: File | null) => void;
  icon?: "spreadsheet" | "attachment";
  maxSizeMB?: number;
  hint?: string;
}

export default function FileUpload({
  label,
  accept,
  file,
  onFileSelect,
  icon = "attachment",
  maxSizeMB = 25,
  hint,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState("");

  const handleFile = useCallback(
    (f: File | null) => {
      setError("");
      if (!f) {
        onFileSelect(null);
        return;
      }

      if (f.size > maxSizeMB * 1024 * 1024) {
        setError(`File size exceeds ${maxSizeMB}MB limit.`);
        return;
      }

      // Validate file type for spreadsheets
      if (icon === "spreadsheet") {
        const validTypes = [
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "application/vnd.ms-excel",
          "text/csv",
        ];
        const validExts = [".xlsx", ".xls", ".csv"];
        const ext = f.name.toLowerCase().slice(f.name.lastIndexOf("."));
        if (!validTypes.includes(f.type) && !validExts.includes(ext)) {
          setError("Please upload a valid Excel (.xlsx, .xls) or CSV file.");
          return;
        }
      }

      onFileSelect(f);
    },
    [maxSizeMB, onFileSelect, icon]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const f = e.dataTransfer.files?.[0];
      if (f) handleFile(f);
    },
    [handleFile]
  );

  const IconComponent = icon === "spreadsheet" ? FileSpreadsheet : Paperclip;

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-gmail-text flex items-center gap-1.5">
        <IconComponent size={15} className="text-gmail-text-secondary" />
        {label}
      </label>

      {!file ? (
        <div
          className={`relative border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all duration-200
            ${dragOver ? "border-gmail-blue bg-blue-50" : "border-gmail-border hover:border-gmail-blue hover:bg-gray-50"}`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0] || null)}
          />
          <Upload
            size={24}
            className={`mx-auto mb-2 ${dragOver ? "text-gmail-blue" : "text-gmail-text-secondary"}`}
          />
          <p className="text-sm text-gmail-text-secondary">
            <span className="text-gmail-blue font-medium">Click to upload</span>{" "}
            or drag and drop
          </p>
          {hint && (
            <p className="text-xs text-gmail-text-secondary mt-1">{hint}</p>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2.5">
          <FileText size={20} className="text-gmail-blue flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gmail-text truncate">
              {file.name}
            </p>
            <p className="text-xs text-gmail-text-secondary">
              {formatSize(file.size)}
            </p>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onFileSelect(null);
              if (inputRef.current) inputRef.current.value = "";
            }}
            className="p-1 hover:bg-blue-100 rounded-full transition-colors"
            title="Remove file"
          >
            <X size={16} className="text-gmail-text-secondary" />
          </button>
        </div>
      )}

      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}

// ============================
// Main Page
// ============================
import { Mail, Github, Shield } from "lucide-react";
import ComposeEmail from "@/components/ComposeEmail";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gmail-bg">
      {/* Header */}
      <header className="bg-white border-b border-gmail-border sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gmail-blue rounded-lg flex items-center justify-center">
              <Mail size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gmail-text leading-tight">
                Cold Mail
              </h1>
              <p className="text-xs text-gmail-text-secondary">
                Bulk Email Sender
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs text-gmail-text-secondary">
            <span className="flex items-center gap-1.5">
              <Shield size={13} />
              SMTP Secured
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Info Banner */}
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl px-5 py-4">
          <h2 className="text-sm font-semibold text-gmail-blue mb-1">
            How to use
          </h2>
          <ol className="text-xs text-gmail-text-secondary space-y-1 list-decimal list-inside">
            <li>
              Fill in the <strong>Subject</strong> and <strong>Body</strong> of
              your email.
            </li>
            <li>
              Optionally attach a file (PDF, images, docs — max 25MB).
            </li>
            <li>
              Upload an <strong>Excel/CSV</strong> file with an
              &ldquo;email&rdquo; column, or enter emails manually below.
            </li>
            <li>
              Use <strong>Start Row</strong> / <strong>End Row</strong> to select
              a range from Excel.
            </li>
            <li>
              Review the preview table, then click{" "}
              <strong>Send Mail</strong>.
            </li>
          </ol>
        </div>

        {/* Compose Window */}
        <ComposeEmail />
      </main>

      {/* Footer */}
      <footer className="border-t border-gmail-border bg-white mt-16">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between text-xs text-gmail-text-secondary">
          <p>&copy; {new Date().getFullYear()} Cold Mail. For authorized use only.</p>
          <p>
            Built with Next.js, TypeScript & Tailwind CSS
          </p>
        </div>
      </footer>
    </div>
  );
}

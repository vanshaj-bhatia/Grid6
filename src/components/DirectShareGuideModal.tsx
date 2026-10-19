import React, { useState } from 'react';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  FileText,
  Mail,
  MessageSquare,
  Play,
  Send,
  Share2,
  Smartphone,
  Sparkles,
  UploadCloud,
  X,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface DirectShareGuideModalProps {
  onClose: () => void;
  onSimulateIncomingShare: () => void;
}

export const DirectShareGuideModal: React.FC<DirectShareGuideModalProps> = ({
  onClose,
  onSimulateIncomingShare,
}) => {
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.origin);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 text-white shadow-md">
              <Share2 className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Direct Export & Share from other Apps</h3>
                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 ring-1 ring-emerald-500/30">
                  Android Web Share Target
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Send PDFs straight into Grid6 without opening or manual file uploading
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-slate-300">
          {/* Quick Answer Banner */}
          <div className="rounded-xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/60 to-slate-900 p-4">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-white">
                  Yes! You can share PDFs directly from other apps.
                </h4>
                <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                  Grid6 PDF implements the <strong>Android Web Share Target API</strong> and the <strong>File Handling API</strong>. Once installed to your device, Grid6 PDF appears directly in the native Android <strong>"Share with..."</strong> menu and the <strong>"Open With"</strong> file menu of every app.
                </p>
              </div>
            </div>
          </div>

          {/* 3 Simple Steps */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              How It Works on Android (3 Steps)
            </h4>

            {/* Step 1 */}
            <div className="flex items-start gap-3.5 rounded-xl border border-slate-800 bg-slate-950/80 p-3.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-600/20 text-xs font-bold text-indigo-400">
                1
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-semibold text-white">
                    Install Grid6 PDF to your device
                  </h5>
                  {isInstalled ? (
                    <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-400">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Already Installed
                    </span>
                  ) : isInstallable ? (
                    <button
                      type="button"
                      onClick={install}
                      className="rounded-lg bg-indigo-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-indigo-500"
                    >
                      Install App Now
                    </button>
                  ) : (
                    <span className="text-[11px] text-slate-400">
                      Via Chrome: Menu ⋮ → Install app
                    </span>
                  )}
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  Installing registers Grid6 PDF with Android’s system intent manager for PDF files.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-start gap-3.5 rounded-xl border border-slate-800 bg-slate-950/80 p-3.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-cyan-600/20 text-xs font-bold text-cyan-400">
                2
              </div>
              <div className="flex-1">
                <h5 className="text-xs font-semibold text-white">
                  Tap "Share" or "Export" in any app
                </h5>
                <p className="mt-1 text-[11px] text-slate-400">
                  Works with any app that handles PDFs on your phone:
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5 text-[10px]">
                  <span className="inline-flex items-center gap-1 rounded-md bg-slate-800 px-2 py-1 text-slate-300">
                    <Mail className="h-3 w-3 text-red-400" /> Gmail
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-md bg-slate-800 px-2 py-1 text-slate-300">
                    <MessageSquare className="h-3 w-3 text-emerald-400" /> WhatsApp
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-md bg-slate-800 px-2 py-1 text-slate-300">
                    <FileText className="h-3 w-3 text-blue-400" /> Files by Google / My Files
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-md bg-slate-800 px-2 py-1 text-slate-300">
                    <ExternalLink className="h-3 w-3 text-amber-400" /> Google Drive / Chrome
                  </span>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex items-start gap-3.5 rounded-xl border border-slate-800 bg-slate-950/80 p-3.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-600/20 text-xs font-bold text-emerald-400">
                3
              </div>
              <div className="flex-1">
                <h5 className="text-xs font-semibold text-white">
                  Select "Grid6 PDF" from the Android Share Sheet
                </h5>
                <p className="mt-1 text-[11px] text-slate-400">
                  Android immediately launches Grid6 PDF with your document ready in the 3×2 queue. No manual browsing or uploading needed!
                </p>
              </div>
            </div>
          </div>

          {/* Interactive Simulation / Test */}
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h5 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Play className="h-3.5 w-3.5 text-indigo-400" />
                  Try Direct Share Simulation
                </h5>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Simulate receiving an external PDF right now without leaving your current browser.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  onSimulateIncomingShare();
                  onClose();
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 active:scale-95 shrink-0"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Simulate External Share</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-slate-800 bg-slate-950 px-5 py-3 text-xs">
          <button
            type="button"
            onClick={handleCopyLink}
            className="flex items-center gap-1 text-slate-400 hover:text-white"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copied ? 'Link Copied!' : 'Copy App Link'}</span>
          </button>

          <button
            onClick={onClose}
            type="button"
            className="rounded-lg bg-slate-800 px-4 py-1.5 font-medium text-slate-200 hover:bg-slate-700"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};

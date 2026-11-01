import React, { useState } from 'react';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  FileText,
  FolderOpen,
  HelpCircle,
  Info,
  Mail,
  MessageSquare,
  Play,
  Send,
  Share2,
  Smartphone,
  Sparkles,
  X,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { isFileHandlingSupported } from '../services/shareTargetReceiver';

interface DirectShareGuideModalProps {
  onClose: () => void;
  onSimulateIncomingShare: () => void;
  onSimulateOpenWith: () => void;
}

export const DirectShareGuideModal: React.FC<DirectShareGuideModalProps> = ({
  onClose,
  onSimulateIncomingShare,
  onSimulateOpenWith,
}) => {
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const [copied, setCopied] = useState(false);
  const fileHandlingSupported = isFileHandlingSupported();

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.origin);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative flex max-h-[92vh] w-full max-w-2xl flex-col rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 text-white shadow-md">
              <FolderOpen className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Android "Open with" & "Share with"</h3>
                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 ring-1 ring-emerald-500/30">
                  Native WebAPK
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Open PDFs directly from Android Files, WhatsApp, Gmail, or any other app
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
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-slate-300 text-xs">
          {/* Top Banner: Quick Explanation */}
          <div className="rounded-xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/60 to-slate-900 p-4">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-white">
                  How Android suggests Grid6 PDF when opening files
                </h4>
                <p className="mt-1 leading-relaxed text-slate-300">
                  Grid6 PDF registers the <strong>Android File Handling API</strong> (for <em>"Open with"</em>) and the <strong>Web Share Target API</strong> (for <em>"Share with"</em>).
                  Once you install Grid6 PDF to your Android device via Chrome, Android builds a native <strong>WebAPK</strong> with intent filters so Grid6 appears whenever you tap or open any PDF!
                </p>
              </div>
            </div>
          </div>

          {/* System Capabilities & Status Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/80 px-3.5 py-2.5">
              <div className="flex items-center gap-2">
                <FolderOpen className="h-4 w-4 text-cyan-400" />
                <span className="font-semibold text-white">"Open with" (File Handling)</span>
              </div>
              <span className="rounded bg-cyan-500/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-cyan-400 ring-1 ring-cyan-500/30">
                {fileHandlingSupported ? 'API Active' : 'Supported on Install'}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/80 px-3.5 py-2.5">
              <div className="flex items-center gap-2">
                <Share2 className="h-4 w-4 text-indigo-400" />
                <span className="font-semibold text-white">"Share with" (Web Share Target)</span>
              </div>
              <span className="rounded bg-indigo-500/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-indigo-400 ring-1 ring-indigo-500/30">
                Service Worker Ready
              </span>
            </div>
          </div>

          {/* 3 Step Setup Guide */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              How to enable "Open with" on your Android device (3 simple steps)
            </h4>

            {/* Step 1: Install App */}
            <div className="flex items-start gap-3.5 rounded-xl border border-slate-800 bg-slate-950/80 p-3.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-600/20 text-xs font-bold text-indigo-400">
                1
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h5 className="font-semibold text-white">
                    Step 1: Install the WebAPK to your Android phone
                  </h5>
                  {isInstalled ? (
                    <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-400">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Installed as WebAPK
                    </span>
                  ) : isInstallable ? (
                    <button
                      type="button"
                      onClick={install}
                      className="rounded-lg bg-indigo-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-indigo-500 transition shadow"
                    >
                      Install App Now
                    </button>
                  ) : (
                    <span className="text-[11px] text-slate-400">
                      Chrome: Tap ⋮ → "Install app"
                    </span>
                  )}
                </div>
                <p className="mt-1 text-slate-400 leading-relaxed">
                  <strong>Crucial step:</strong> In Android, browsers only register native file associations (the <code className="text-cyan-300">android.intent.action.VIEW</code> intent for PDFs) after you tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong> in Chrome, Brave, or Samsung Internet.
                </p>
              </div>
            </div>

            {/* Step 2: Open from Files or Any App */}
            <div className="flex items-start gap-3.5 rounded-xl border border-slate-800 bg-slate-950/80 p-3.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-cyan-600/20 text-xs font-bold text-cyan-400">
                2
              </div>
              <div className="flex-1">
                <h5 className="font-semibold text-white">
                  Step 2: Tap any PDF or choose "Open with..."
                </h5>
                <p className="mt-1 text-slate-400 leading-relaxed">
                  Navigate to any PDF on your phone in any app:
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5 text-[10px]">
                  <span className="inline-flex items-center gap-1 rounded-md bg-slate-800 px-2 py-1 text-slate-300">
                    <FileText className="h-3 w-3 text-cyan-400" /> Files by Google
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-md bg-slate-800 px-2 py-1 text-slate-300">
                    <FolderOpen className="h-3 w-3 text-indigo-400" /> Samsung My Files
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-md bg-slate-800 px-2 py-1 text-slate-300">
                    <Mail className="h-3 w-3 text-rose-400" /> Gmail / Outlook
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-md bg-slate-800 px-2 py-1 text-slate-300">
                    <MessageSquare className="h-3 w-3 text-emerald-400" /> WhatsApp / Telegram
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-md bg-slate-800 px-2 py-1 text-slate-300">
                    <ExternalLink className="h-3 w-3 text-amber-400" /> Downloads Folder
                  </span>
                </div>
              </div>
            </div>

            {/* Step 3: Choose Grid6 PDF */}
            <div className="flex items-start gap-3.5 rounded-xl border border-slate-800 bg-slate-950/80 p-3.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-600/20 text-xs font-bold text-emerald-400">
                3
              </div>
              <div className="flex-1">
                <h5 className="font-semibold text-white">
                  Step 3: Select "Grid6 PDF" in the Android App Chooser
                </h5>
                <p className="mt-1 text-slate-400 leading-relaxed">
                  Android immediately passes the PDF document directly into Grid6 PDF. It loads into the queue with your landscape 3×2 imposition layout ready to process!
                </p>
              </div>
            </div>
          </div>

          {/* Interactive Simulation / Live Test */}
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3">
            <h5 className="text-xs font-bold text-white flex items-center gap-1.5">
              <Play className="h-3.5 w-3.5 text-indigo-400" />
              Try the Features Right Now (Browser Simulation)
            </h5>
            <p className="text-slate-400 leading-relaxed">
              Test how Grid6 PDF receives files without leaving your current screen:
            </p>

            <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  onSimulateOpenWith();
                  onClose();
                }}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-600 px-3.5 py-2 font-semibold text-white shadow-sm hover:bg-cyan-500 active:scale-95 transition"
              >
                <FolderOpen className="h-4 w-4" />
                <span>Simulate "Open with" File</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onSimulateIncomingShare();
                  onClose();
                }}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-3.5 py-2 font-semibold text-white shadow-sm hover:bg-indigo-500 active:scale-95 transition"
              >
                <Share2 className="h-4 w-4" />
                <span>Simulate "Share with" App</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-slate-800 bg-slate-950 px-5 py-3 text-xs">
          <button
            type="button"
            onClick={handleCopyLink}
            className="flex items-center gap-1 text-slate-400 hover:text-white transition"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copied ? 'Link Copied!' : 'Copy App Link'}</span>
          </button>

          <button
            onClick={onClose}
            type="button"
            className="rounded-lg bg-slate-800 px-4 py-1.5 font-medium text-slate-200 hover:bg-slate-700 transition"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};

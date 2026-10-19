import React from 'react';
import {
  CheckCircle2,
  Download,
  FolderCheck,
  FolderHeart,
  Info,
  LayoutGrid,
  Share2,
  Smartphone,
  Sparkles,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface HeaderProps {
  appName: string;
  isFolderLinked: boolean;
  onOpenStorageSettings: () => void;
  onOpenHelp: () => void;
  onOpenDirectShareGuide: () => void;
  onLoadSample: () => void;
  isLoadingSample: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  appName,
  isFolderLinked,
  onOpenStorageSettings,
  onOpenHelp,
  onOpenDirectShareGuide,
  onLoadSample,
  isLoadingSample,
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();

  return (
    <header className="sticky top-0 z-40 border-b border-indigo-900/40 bg-slate-950/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 shadow-md shadow-indigo-500/20 ring-1 ring-white/20">
            <LayoutGrid className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-white sm:text-xl">
                Grid6 <span className="text-indigo-400">PDF</span>
              </h1>
              <span className="rounded-full bg-indigo-500/10 px-2 py-0.5 text-[11px] font-semibold text-indigo-300 ring-1 ring-indigo-500/30">
                3×2 Grid
              </span>
            </div>
            <p className="hidden text-xs text-slate-400 sm:block">
              Multi-page PDF imposition & batch processing
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Direct Share / Receive Pill Button */}
          <button
            onClick={onOpenDirectShareGuide}
            type="button"
            className="flex items-center gap-1.5 rounded-lg border border-cyan-500/30 bg-cyan-950/30 px-2.5 py-1.5 text-xs font-medium text-cyan-200 transition hover:border-cyan-400/60 hover:bg-cyan-900/40 hover:text-white"
            title="Export/Share from other apps directly into Grid6 PDF"
          >
            <Share2 className="h-3.5 w-3.5 text-cyan-400 animate-pulse" />
            <span className="hidden md:inline">Direct App Share</span>
          </button>

          {/* Target Folder Pill */}
          <button
            onClick={onOpenStorageSettings}
            type="button"
            className={`group flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs transition ${
              isFolderLinked
                ? 'border-emerald-500/50 bg-emerald-950/30 text-emerald-300 hover:bg-emerald-900/40'
                : 'border-slate-800 bg-slate-900/80 text-slate-300 hover:border-indigo-500/50 hover:bg-slate-800 hover:text-white'
            }`}
            title="Configure target download folder"
          >
            {isFolderLinked ? (
              <FolderCheck className="h-3.5 w-3.5 text-emerald-400" />
            ) : (
              <FolderHeart className="h-3.5 w-3.5 text-indigo-400 transition group-hover:scale-110" />
            )}
            <span className="hidden font-mono text-[11px] font-medium text-slate-400 group-hover:text-slate-200 sm:inline">
              Downloads/
            </span>
            <span className={`font-mono text-[11px] font-semibold ${isFolderLinked ? 'text-emerald-300' : 'text-indigo-300'}`}>
              {appName}/
            </span>
            {isFolderLinked && (
              <span className="text-[10px] font-bold text-emerald-400">✓</span>
            )}
          </button>

          {/* Sample PDF Button */}
          <button
            onClick={onLoadSample}
            disabled={isLoadingSample}
            type="button"
            className="flex items-center gap-1.5 rounded-lg border border-indigo-500/30 bg-indigo-950/40 px-2.5 py-1.5 text-xs font-medium text-indigo-200 transition hover:bg-indigo-900/50 hover:text-white disabled:opacity-50"
            title="Load sample shipping labels"
          >
            <Sparkles className={`h-3.5 w-3.5 text-cyan-400 ${isLoadingSample ? 'animate-spin' : ''}`} />
            <span className="hidden xs:inline">Sample PDF</span>
          </button>

          {/* PWA Install Button (Android / Chromium) */}
          {isInstallable && !isInstalled && (
            <button
              onClick={install}
              type="button"
              className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm shadow-indigo-600/30 transition hover:from-indigo-500 hover:to-indigo-400 active:scale-95"
            >
              <Smartphone className="h-3.5 w-3.5" />
              <span>Install App</span>
            </button>
          )}

          {/* iOS Safari Install Button */}
          {isIOS && !isInstalled && (
            <button
              onClick={onOpenHelp}
              type="button"
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-slate-800"
            >
              <Smartphone className="h-3.5 w-3.5 text-slate-400" />
              <span className="hidden sm:inline">Add to Home</span>
            </button>
          )}

          {/* Storage / Android Help Modal */}
          <button
            onClick={onOpenHelp}
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/80 text-slate-400 transition hover:border-slate-700 hover:text-slate-200"
            title="Android & Storage Guide"
          >
            <Info className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

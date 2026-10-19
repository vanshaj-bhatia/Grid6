import React from 'react';
import { Archive, Download, ExternalLink, RotateCw, Share2, X } from 'lucide-react';
import { BatchItem, GridConfig } from '../types';
import { isAndroidDevice, saveSinglePdfAsZip } from '../services/fileStorage';
import { hapticSave, hapticTap } from '../services/haptics';

interface PDFPreviewModalProps {
  item: BatchItem | null;
  config: GridConfig;
  onClose: () => void;
  onSave: (item: BatchItem) => void;
  onShare: (item: BatchItem) => void;
  onReprocess?: (item: BatchItem) => void;
}

export const PDFPreviewModal: React.FC<PDFPreviewModalProps> = ({
  item,
  config,
  onClose,
  onSave,
  onShare,
  onReprocess,
}) => {
  if (!item || !item.outputBlob) return null;

  const previewUrl = item.outputUrl || URL.createObjectURL(item.outputBlob);
  const outFileName = `${item.name.replace(/\.pdf$/i, '')}_3x2_grid.pdf`;
  const isAndroid = isAndroidDevice();

  const handleSaveAsZip = async () => {
    await saveSinglePdfAsZip(item, config.appName);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-2 sm:p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative flex h-[92vh] w-full max-w-5xl flex-col rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 bg-slate-950 px-4 py-3">
          <div className="min-w-0 pr-4 flex-1">
            <h3 className="truncate text-sm font-bold text-white sm:text-base">
              {outFileName}
            </h3>
            <p className="text-xs text-slate-400">
              6-in-1 Layout • {item.outputSheetCount} Sheet{item.outputSheetCount !== 1 ? 's' : ''} • Storage: <span className="font-mono text-indigo-300">Downloads/{config.appName}/</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {onReprocess && (
              <button
                onClick={() => {
                  hapticTap();
                  onReprocess(item);
                  onClose();
                }}
                type="button"
                className="flex items-center gap-1.5 rounded-lg border border-indigo-500/40 bg-indigo-950/60 px-3 py-1.5 text-xs font-semibold text-indigo-300 shadow-sm hover:bg-indigo-900 hover:text-white active:scale-95"
                title="Reprocess with current margins & settings"
              >
                <RotateCw className="h-3.5 w-3.5" />
                <span>Reprocess</span>
              </button>
            )}

            <button
              onClick={() => {
                hapticSave();
                onSave(item);
              }}
              type="button"
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-500 active:scale-95"
              title={`Save into Downloads/${config.appName}/`}
            >
              <Download className="h-3.5 w-3.5" />
              <span>Save</span>
            </button>

            {/* Android / Share Button */}
            {typeof navigator !== 'undefined' && 'canShare' in navigator && (
              <button
                onClick={() => {
                  hapticSave();
                  onShare(item);
                }}
                type="button"
                className="flex items-center gap-1.5 rounded-lg border border-cyan-500/40 bg-cyan-950/40 px-2.5 py-1.5 text-xs font-medium text-cyan-200 hover:bg-cyan-900/60 hover:text-white"
                title="Save to Downloads/Grid6_PDF via Android Share Sheet (Save to Device)"
              >
                <Share2 className="h-3.5 w-3.5 text-cyan-400" />
                <span>Android Share</span>
              </button>
            )}

            {/* ZIP single button */}
            <button
              onClick={() => {
                hapticSave();
                handleSaveAsZip();
              }}
              type="button"
              className="hidden sm:flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white"
              title="Save as ZIP containing Downloads/Grid6_PDF/ folder"
            >
              <Archive className="h-3.5 w-3.5 text-indigo-400" />
              <span>ZIP</span>
            </button>

            <a
              href={previewUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              title="Open full in new tab"
            >
              <ExternalLink className="h-4 w-4" />
            </a>

            <button
              onClick={onClose}
              type="button"
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              title="Close modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal PDF Viewer Body */}
        <div className="relative flex-1 bg-slate-950">
          <iframe
            src={`${previewUrl}#toolbar=1&navpanes=0`}
            className="h-full w-full border-0"
            title="PDF Preview"
          />
        </div>
      </div>
    </div>
  );
};

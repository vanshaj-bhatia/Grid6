import React, { useRef } from 'react';
import {
  AlertCircle,
  Archive,
  ArrowRight,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  FileCheck,
  FilePlus,
  Files,
  FolderCheck,
  FolderDown,
  FolderOpen,
  Loader2,
  Play,
  RotateCcw,
  RotateCw,
  Share2,
  Smartphone,
  Sparkles,
  Trash2,
  UploadCloud,
} from 'lucide-react';
import { BatchItem, GridConfig } from '../types';
import { isAndroidDevice, isDirectoryPickerSupported } from '../services/fileStorage';
import { hapticSave, hapticTap } from '../services/haptics';

interface BatchQueueProps {
  items: BatchItem[];
  isProcessingBatch: boolean;
  config: GridConfig;
  isFolderLinked: boolean;
  onConnectFolder: () => void;
  onOpenStorageSettings: () => void;
  onAddFiles: (files: FileList | File[]) => void;
  onRemoveItem: (id: string) => void;
  onProcessItem: (id: string) => void;
  onReprocessItem: (id: string) => void;
  onProcessAll: () => void;
  onReprocessAll: () => void;
  onSaveItem: (item: BatchItem) => void;
  onSaveAll: (preferZip?: boolean) => void;
  onShareItem: (item: BatchItem) => void;
  onPreviewItem: (item: BatchItem) => void;
  onClearAll: () => void;
  onLoadSample: () => void;
  isLoadingSample: boolean;
  onOpenDirectShareGuide?: () => void;
}

export const BatchQueue: React.FC<BatchQueueProps> = ({
  items,
  isProcessingBatch,
  config,
  isFolderLinked,
  onConnectFolder,
  onOpenStorageSettings,
  onAddFiles,
  onRemoveItem,
  onProcessItem,
  onReprocessItem,
  onProcessAll,
  onReprocessAll,
  onSaveItem,
  onSaveAll,
  onShareItem,
  onPreviewItem,
  onClearAll,
  onLoadSample,
  isLoadingSample,
  onOpenDirectShareGuide,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isDirectorySupported = isDirectoryPickerSupported();
  const isAndroid = isAndroidDevice();

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onAddFiles(e.dataTransfer.files);
    }
  };

  const completedCount = items.filter((i) => i.status === 'done').length;
  const pendingCount = items.filter((i) => i.status === 'idle' || i.status === 'error').length;
  const totalPages = items.reduce((acc, curr) => acc + (curr.pageCount || 0), 0);
  const totalSheets = items.reduce(
    (acc, curr) => acc + (curr.pageCount ? Math.ceil(curr.pageCount / 6) : 0),
    0
  );

  return (
    <div className="flex flex-col space-y-4">
      {/* Prominent Storage Directory Notification Bar */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 shadow-lg backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                isFolderLinked
                  ? 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/30'
                  : 'bg-indigo-500/10 text-indigo-400 ring-1 ring-indigo-500/30'
              }`}
            >
              {isFolderLinked ? (
                <FolderCheck className="h-5 w-5 text-emerald-400" />
              ) : isAndroid ? (
                <Smartphone className="h-5 w-5 text-cyan-400" />
              ) : (
                <FolderOpen className="h-5 w-5 text-indigo-400" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Storage Directory:
                </span>
                <span className="font-mono text-xs font-bold text-white bg-slate-800 px-2 py-0.5 rounded">
                  Downloads/{config.appName}/
                </span>
                {isFolderLinked && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 ring-1 ring-emerald-500/30">
                    <CheckCircle2 className="h-3 w-3" />
                    Direct Folder Connected
                  </span>
                )}
              </div>

              <p className="mt-1 text-xs text-slate-300">
                {isFolderLinked ? (
                  <span>
                    ✓ Converted 6-in-1 PDFs save directly inside{' '}
                    <strong className="text-emerald-300 font-mono">Downloads/{config.appName}/</strong>.
                  </span>
                ) : isDirectorySupported ? (
                  <span>
                    Click <strong>Connect Downloads Folder</strong> to grant one-time permission. Grid6 will automatically create and store all files inside{' '}
                    <strong className="text-indigo-300 font-mono">Downloads/{config.appName}/</strong>.
                  </span>
                ) : (
                  <span>
                    On Android, use <strong className="text-cyan-300">Share</strong> (Save to device) or download the <strong className="text-indigo-300">ZIP</strong> to place files directly into{' '}
                    <strong className="text-cyan-300 font-mono">Downloads/{config.appName}/</strong>.
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            {isDirectorySupported && !isFolderLinked && (
              <button
                type="button"
                onClick={onConnectFolder}
                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 px-3.5 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-600/30 transition hover:from-indigo-500 hover:to-indigo-400 active:scale-95"
              >
                <FolderOpen className="h-4 w-4" />
                <span>Connect Downloads Folder</span>
              </button>
            )}

            <button
              type="button"
              onClick={onOpenStorageSettings}
              className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-medium text-slate-200 transition hover:bg-slate-700"
            >
              <span>Storage Details</span>
            </button>
          </div>
        </div>
      </div>

      {/* Upload Dropzone */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className="group relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-indigo-500/30 bg-slate-900/40 p-6 text-center transition hover:border-indigo-500 hover:bg-slate-900/70 cursor-pointer"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) onAddFiles(e.target.files);
            e.target.value = '';
          }}
        />

        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400 ring-1 ring-indigo-500/20 group-hover:scale-110 group-hover:bg-indigo-500/20 transition-all duration-300">
          <UploadCloud className="h-7 w-7" />
        </div>

        <h3 className="mt-3 text-sm font-semibold text-white">
          Drop PDF files here or <span className="text-indigo-400 underline decoration-indigo-400/50">browse</span>
        </h3>
        <p className="mt-1 text-xs text-slate-400">
          Supports multiple PDFs for batch 3×2 imposition • Auto-saves to <span className="font-mono text-indigo-300">Downloads/{config.appName}/</span>
        </p>

        {items.length === 0 && (
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onLoadSample();
              }}
              disabled={isLoadingSample}
              className="flex items-center gap-1.5 rounded-lg border border-indigo-500/40 bg-indigo-950/60 px-3 py-1.5 text-xs font-medium text-indigo-200 transition hover:bg-indigo-900/80 active:scale-95 disabled:opacity-50"
            >
              <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
              <span>Load Sample Shipping Labels</span>
            </button>

            {onOpenDirectShareGuide && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenDirectShareGuide();
                }}
                className="flex items-center gap-1.5 rounded-lg border border-cyan-500/40 bg-cyan-950/40 px-3 py-1.5 text-xs font-medium text-cyan-200 transition hover:bg-cyan-900/60 active:scale-95"
              >
                <Share2 className="h-3.5 w-3.5 text-cyan-400" />
                <span>Share Direct from WhatsApp / Gmail</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Batch Summary & Controls */}
      {items.length > 0 && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-xl backdrop-blur-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              <Files className="h-4 w-4 text-indigo-400" />
              <span className="text-sm font-bold text-white">
                Batch Queue ({items.length} file{items.length !== 1 ? 's' : ''})
              </span>
              {totalPages > 0 && (
                <span className="rounded-full bg-slate-800 px-2 py-0.5 font-mono text-[11px] text-slate-300">
                  {totalPages} pages → {totalSheets} sheets
                </span>
              )}
            </div>

            {/* Batch Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Process Pending button */}
              {pendingCount > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    hapticTap();
                    onProcessAll();
                  }}
                  disabled={isProcessingBatch}
                  className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-500 px-3 py-1.5 text-xs font-semibold text-white shadow-md shadow-indigo-600/30 transition hover:from-indigo-500 hover:to-indigo-400 active:scale-95 disabled:opacity-50"
                >
                  {isProcessingBatch ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Processing Batch...</span>
                    </>
                  ) : (
                    <>
                      <Play className="h-3.5 w-3.5 fill-current" />
                      <span>Process All ({pendingCount})</span>
                    </>
                  )}
                </button>
              )}

              {/* Reprocess All button */}
              {completedCount > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    hapticTap();
                    onReprocessAll();
                  }}
                  disabled={isProcessingBatch}
                  className="flex items-center gap-1.5 rounded-lg border border-indigo-500/40 bg-indigo-950/60 px-2.5 py-1.5 text-xs font-semibold text-indigo-200 transition hover:bg-indigo-900/80 hover:text-white active:scale-95 disabled:opacity-50"
                  title="Reprocess all documents with updated margin and layout settings"
                >
                  <RotateCw className={`h-3.5 w-3.5 text-indigo-400 ${isProcessingBatch ? 'animate-spin' : ''}`} />
                  <span>Reprocess All ({items.length})</span>
                </button>
              )}

              {/* Save All button */}
              {completedCount > 0 && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      hapticSave();
                      onSaveAll(false);
                    }}
                    className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm shadow-emerald-600/30 transition hover:bg-emerald-500 active:scale-95"
                    title={`Save all ${completedCount} PDFs into Downloads/${config.appName}/`}
                  >
                    <FolderDown className="h-3.5 w-3.5" />
                    <span>Save All ({completedCount})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      hapticSave();
                      onSaveAll(true);
                    }}
                    className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-slate-700 hover:text-white"
                    title={`Bundle all into Downloads/${config.appName}_Batch.zip`}
                  >
                    <Archive className="h-3.5 w-3.5 text-indigo-400" />
                    <span className="hidden sm:inline">ZIP Folder</span>
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={onClearAll}
                disabled={isProcessingBatch}
                className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-950 p-1.5 text-xs text-slate-400 transition hover:bg-rose-950/40 hover:text-rose-300 disabled:opacity-50"
                title="Clear queue"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* List of Files */}
          <div className="mt-3 divide-y divide-slate-800/60 max-h-96 overflow-y-auto pr-1">
            {items.map((item) => {
              const sheets = item.pageCount ? Math.ceil(item.pageCount / 6) : null;

              return (
                <div
                  key={item.id}
                  className="group flex flex-col py-3 first:pt-0 last:pb-0 transition hover:bg-slate-900/30 rounded-lg px-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    {/* File Info */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                          item.status === 'done'
                            ? 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/30'
                            : item.status === 'processing'
                            ? 'bg-indigo-500/10 text-indigo-400 ring-1 ring-indigo-500/30 animate-pulse'
                            : item.status === 'error'
                            ? 'bg-rose-500/10 text-rose-400 ring-1 ring-rose-500/30'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {item.status === 'done' ? (
                          <FileCheck className="h-4 w-4" />
                        ) : item.status === 'processing' ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : item.status === 'error' ? (
                          <AlertCircle className="h-4 w-4" />
                        ) : (
                          <Clock className="h-4 w-4" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="truncate text-xs font-semibold text-white">
                          {item.name}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                          <span>{formatBytes(item.size)}</span>
                          {item.pageCount !== null && (
                            <>
                              <span>•</span>
                              <span className="font-mono text-indigo-300 font-medium">
                                {item.pageCount} pages → {sheets} sheet{sheets !== 1 ? 's' : ''} (3×2)
                              </span>
                            </>
                          )}
                          {item.outputSize && (
                            <>
                              <span>•</span>
                              <span className="text-emerald-400 font-mono">
                                Out: {formatBytes(item.outputSize)}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {item.status === 'done' && (
                        <>
                          {/* Reprocess individual */}
                          <button
                            type="button"
                            onClick={() => {
                              hapticTap();
                              onReprocessItem(item.id);
                            }}
                            disabled={isProcessingBatch}
                            className="flex items-center gap-1 rounded-lg border border-indigo-500/30 bg-indigo-950/50 px-2 py-1 text-[11px] font-medium text-indigo-300 transition hover:bg-indigo-900/80 hover:text-white disabled:opacity-40"
                            title="Reprocess with current margins & print options"
                          >
                            <RotateCw className="h-3 w-3" />
                            <span>Reprocess</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => onPreviewItem(item)}
                            className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-2 py-1 text-[11px] font-medium text-slate-200 transition hover:bg-indigo-900/40 hover:text-white"
                            title="Preview 3x2 PDF"
                          >
                            <Eye className="h-3 w-3" />
                            <span className="hidden xs:inline">Preview</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              hapticSave();
                              onSaveItem(item);
                            }}
                            className="flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm transition hover:bg-emerald-500 active:scale-95"
                            title={`Save to Downloads/${config.appName}/${item.name.replace(/\.pdf$/i, '')}_3x2_grid.pdf`}
                          >
                            <Download className="h-3 w-3" />
                            <span>Save</span>
                          </button>

                          {typeof navigator !== 'undefined' && 'canShare' in navigator && (
                            <button
                              type="button"
                              onClick={() => {
                                hapticSave();
                                onShareItem(item);
                              }}
                              className="flex items-center gap-1 rounded-lg border border-cyan-500/40 bg-cyan-950/40 px-2 py-1 text-[11px] font-medium text-cyan-300 transition hover:bg-cyan-900/60 hover:text-white"
                              title="Save to Downloads/Grid6_PDF via Android Share Sheet"
                            >
                              <Share2 className="h-3 w-3 text-cyan-400" />
                              <span className="hidden sm:inline">Android Share</span>
                            </button>
                          )}
                        </>
                      )}

                      {item.status === 'idle' && (
                        <button
                          type="button"
                          onClick={() => {
                            hapticTap();
                            onProcessItem(item.id);
                          }}
                          disabled={isProcessingBatch}
                          className="flex items-center gap-1 rounded-lg border border-indigo-500/30 bg-indigo-950/40 px-2.5 py-1 text-[11px] font-medium text-indigo-300 transition hover:bg-indigo-900/60 hover:text-white"
                        >
                          <Play className="h-3 w-3 fill-current" />
                          <span>Process</span>
                        </button>
                      )}

                      {item.status === 'error' && (
                        <button
                          type="button"
                          onClick={() => {
                            hapticTap();
                            onReprocessItem(item.id);
                          }}
                          className="flex items-center gap-1 rounded-lg border border-rose-500/40 bg-rose-950/40 px-2.5 py-1 text-[11px] font-medium text-rose-300 transition hover:bg-rose-900/60"
                        >
                          <RotateCcw className="h-3 w-3" />
                          <span>Retry</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => onRemoveItem(item.id)}
                        disabled={item.status === 'processing'}
                        className="rounded-lg p-1 text-slate-500 transition hover:bg-slate-800 hover:text-slate-300 disabled:opacity-30"
                        title="Remove from queue"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Progress bar during processing */}
                  {item.status === 'processing' && (
                    <div className="mt-2">
                      <div className="flex justify-between text-[10px] text-slate-400 font-mono mb-1">
                        <span>Merging pages into 3×2 grid...</span>
                        <span>{item.progress}%</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-300"
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Error banner */}
                  {item.status === 'error' && item.errorMsg && (
                    <div className="mt-1.5 rounded-md bg-rose-950/50 px-2 py-1 text-[11px] text-rose-300">
                      Error: {item.errorMsg}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

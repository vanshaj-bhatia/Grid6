/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  FolderCheck,
  FolderOpen,
  Grid3X3,
  Layers,
  Share2,
  Sparkles,
  WifiOff,
} from 'lucide-react';
import { BatchItem, GridConfig } from './types';
import {
  generateSampleMultiPagePdf,
  getPdfPageCount,
  processPdfToGrid,
} from './services/pdfEngine';
import {
  getActiveDirectoryHandle,
  initializeStorageHandle,
  isAndroidDevice,
  isDirectoryPickerSupported,
  pickAppDirectory,
  saveAllBatchItems,
  saveSinglePdf,
  saveSinglePdfAsZip,
  sharePdfNative,
  verifyHandlePermission,
} from './services/fileStorage';
import {
  retrieveSharedFilesFromCache,
  setupLaunchQueueConsumer,
} from './services/shareTargetReceiver';
import { Header } from './components/Header';
import { GridVisualizer } from './components/GridVisualizer';
import { MarginControls } from './components/MarginControls';
import { BatchQueue } from './components/BatchQueue';
import { PDFPreviewModal } from './components/PDFPreviewModal';
import { StorageHelpModal } from './components/StorageHelpModal';
import { DirectShareGuideModal } from './components/DirectShareGuideModal';

const DEFAULT_CONFIG: GridConfig = {
  cols: 3,
  rows: 2,
  pageSize: 'A4',
  orientation: 'landscape', // Landscape default
  marginTopMm: 0,
  marginBottomMm: 0,
  marginLeftMm: 0,
  marginRightMm: 0,
  gapXMm: 1,
  gapYMm: 1,
  pictureScaling: 'fitWidth', // Match input page width to cell width & stretch to cell
  pictureAlign: 'top-middle', // Anchor top-middle so nothing from top (barcodes/addresses) is cropped
  clipToCell: true,
  drawBorders: true,
  borderWidthPt: 0.5,
  borderColorHex: '#0f172a',
  drawCutGuides: true,
  drawPageNumbers: true,
  pageOrder: 'horizontal',
  appName: 'Grid6_PDF',
  autoProcessAndSave: true, // 1-click / zero-click auto conversion and save
  autoOpenSavedPdf: true,   // Open immediately once saved
};

export default function App() {
  const [config, setConfig] = useState<GridConfig>(() => {
    try {
      const saved = localStorage.getItem('grid6_config_v4');
      if (saved) {
        return { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
      }
    } catch {
      // ignore
    }
    return DEFAULT_CONFIG;
  });

  const [items, setItems] = useState<BatchItem[]>([]);
  const [isProcessingBatch, setIsProcessingBatch] = useState(false);
  const [previewItem, setPreviewItem] = useState<BatchItem | null>(null);
  const [showStorageModal, setShowStorageModal] = useState(false);
  const [showDirectShareGuide, setShowDirectShareGuide] = useState(false);
  const [isLoadingSample, setIsLoadingSample] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [isFolderLinked, setIsFolderLinked] = useState(false);
  const isDirectorySupported = isDirectoryPickerSupported();
  const isAndroid = isAndroidDevice();

  // Initialize directory handle on mount from IndexedDB
  useEffect(() => {
    initializeStorageHandle().then(async (handle) => {
      if (handle) {
        const hasPerm = await verifyHandlePermission(handle, false);
        if (hasPerm) {
          setIsFolderLinked(true);
        } else {
          // Handle is saved but needs user re-activation on click
          setIsFolderLinked(true);
        }
      }
    });
  }, []);

  // Sync config with localStorage
  useEffect(() => {
    try {
      localStorage.setItem('grid6_config_v4', JSON.stringify(config));
    } catch {
      // ignore
    }
  }, [config]);

  // Online / Offline listener
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((curr) => (curr?.message === message ? null : curr));
    }, 4500);
  };

  const handleConnectFolder = async () => {
    const handle = await pickAppDirectory(config.appName);
    if (handle) {
      setIsFolderLinked(true);
      showToast(`Downloads/${config.appName}/ connected! Files will save directly inside this folder.`, 'success');
    }
  };

  const handleUpdateConfig = (partial: Partial<GridConfig>) => {
    setConfig((prev) => ({ ...prev, ...partial }));
  };

  // Full 1-Click Pipeline: Convert PDF with defaults, save to Downloads/APP_NAME, and open immediately
  const executeProcessAndAutoSave = async (
    targetItem: BatchItem,
    activeConfig: GridConfig,
    shouldAutoOpen: boolean = true
  ) => {
    setItems((prev) =>
      prev.map((i) =>
        i.id === targetItem.id ? { ...i, status: 'processing', progress: 15, errorMsg: undefined } : i
      )
    );

    try {
      const result = await processPdfToGrid(targetItem.file, activeConfig, (progress) => {
        setItems((prev) =>
          prev.map((i) => (i.id === targetItem.id ? { ...i, progress } : i))
        );
      });

      const outputUrl = URL.createObjectURL(result.blob);
      const completedItem: BatchItem = {
        ...targetItem,
        status: 'done',
        progress: 100,
        outputBlob: result.blob,
        outputUrl,
        outputSheetCount: result.sheetCount,
        outputSize: result.blob.size,
      };

      setItems((prev) =>
        prev.map((i) => (i.id === targetItem.id ? completedItem : i))
      );

      // Auto-save to Downloads/APP_NAME
      let saveNote = '';
      if (activeConfig.autoProcessAndSave) {
        try {
          const res = await saveSinglePdf(completedItem, activeConfig.appName, false);
          saveNote = res.pathDescription;
        } catch (saveErr) {
          console.warn('Auto save error:', saveErr);
        }
      }

      // Auto-open once saved
      if (activeConfig.autoOpenSavedPdf && shouldAutoOpen) {
        setPreviewItem(completedItem);
      }

      showToast(
        saveNote
          ? `⚡ Auto-converted, saved to ${saveNote} & opened!`
          : `Converted "${targetItem.name}" into ${result.sheetCount} 3×2 sheets!`,
        'success'
      );

      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#10b981', '#6366f1', '#06b6d4'],
        });
      } catch {
        // ignore
      }

      return completedItem;
    } catch (err: unknown) {
      const msg = (err as Error)?.message || 'Failed to process document.';
      setItems((prev) =>
        prev.map((i) =>
          i.id === targetItem.id ? { ...i, status: 'error', progress: 0, errorMsg: msg } : i
        )
      );
      showToast(msg, 'error');
      return null;
    }
  };

  // Add files to queue and inspect page counts + trigger 1-click auto pipeline if enabled
  const handleAddFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter(
      (f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')
    );

    if (fileArray.length === 0) {
      showToast('Please select valid PDF files.', 'error');
      return;
    }

    const newItems: BatchItem[] = fileArray.map((file) => ({
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      file,
      name: file.name,
      size: file.size,
      pageCount: null,
      status: 'idle',
      progress: 0,
      createdAt: Date.now(),
    }));

    setItems((prev) => [...prev, ...newItems]);

    // Inspect page counts
    for (const item of newItems) {
      try {
        const pages = await getPdfPageCount(item.file);
        setItems((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, pageCount: pages } : i))
        );
      } catch (err) {
        console.warn(`Failed reading page count for ${item.name}:`, err);
      }
    }

    // 1-Click Auto Pipeline: If enabled, immediately convert, save, and open!
    if (config.autoProcessAndSave) {
      for (const item of newItems) {
        await executeProcessAndAutoSave(item, config, true);
      }
    }
  };

  // Check incoming shared files from Android Web Share Target or LaunchQueue
  useEffect(() => {
    let isMounted = true;

    async function checkIncomingShares() {
      const incoming = await retrieveSharedFilesFromCache();
      if (isMounted && incoming.length > 0) {
        await handleAddFiles(incoming);
        showToast(
          `Received ${incoming.length} shared PDF${incoming.length > 1 ? 's' : ''} from external app!`,
          'success'
        );
      }
    }

    checkIncomingShares();

    // Listen to Android File Handling API (LaunchQueue)
    setupLaunchQueueConsumer((files) => {
      if (isMounted && files.length > 0) {
        handleAddFiles(files);
        showToast(`Opened ${files.length} PDF(s) directly via Android File Manager!`, 'success');
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  // Simulate an external app sharing a document directly into Grid6
  const handleSimulateIncomingShare = async () => {
    try {
      setIsLoadingSample(true);
      const sample = await generateSampleMultiPagePdf();
      const sharedSimulatedFile = new File(
        [sample],
        'shared_from_external_app_report.pdf',
        { type: 'application/pdf' }
      );
      await handleAddFiles([sharedSimulatedFile]);
      showToast('Simulated incoming share: PDF imported directly into queue!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Simulation failed.', 'error');
    } finally {
      setIsLoadingSample(false);
    }
  };

  // Load a built-in 12-page sample document
  const handleLoadSample = async () => {
    try {
      setIsLoadingSample(true);
      const sampleFile = await generateSampleMultiPagePdf();
      await handleAddFiles([sampleFile]);
      showToast('Sample 12-page document loaded into queue.', 'info');
    } catch (err) {
      console.error(err);
      showToast('Failed to generate sample PDF.', 'error');
    } finally {
      setIsLoadingSample(false);
    }
  };

  // Remove single item
  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  // Clear all items
  const handleClearAll = () => {
    setItems([]);
  };

  // Process a single item
  const handleProcessItem = async (id: string) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    await executeProcessAndAutoSave(item, config, true);
  };

  // Process all pending items in batch
  const handleProcessAll = async () => {
    const pending = items.filter((i) => i.status === 'idle' || i.status === 'error');
    if (pending.length === 0) return;

    setIsProcessingBatch(true);
    let successCount = 0;
    let lastProcessed: BatchItem | null = null;

    for (const item of pending) {
      const res = await executeProcessAndAutoSave(item, config, false);
      if (res) {
        successCount++;
        lastProcessed = res;
      }
    }

    setIsProcessingBatch(false);

    if (successCount > 0) {
      if (config.autoOpenSavedPdf && lastProcessed) {
        setPreviewItem(lastProcessed);
      }
      showToast(`Batch completed: ${successCount} PDF files merged into 3×2 grids!`, 'success');
    }
  };

  // Reprocess all items in queue with updated margins and settings
  const handleReprocessAll = async () => {
    if (items.length === 0) return;

    setIsProcessingBatch(true);
    let successCount = 0;
    let lastProcessed: BatchItem | null = null;

    for (const item of items) {
      const res = await executeProcessAndAutoSave(item, config, false);
      if (res) {
        successCount++;
        lastProcessed = res;
      }
    }

    setIsProcessingBatch(false);

    if (successCount > 0) {
      if (config.autoOpenSavedPdf && lastProcessed) {
        setPreviewItem(lastProcessed);
      }
      showToast(`Reprocessed ${successCount} document${successCount !== 1 ? 's' : ''} with current settings!`, 'success');
    }
  };

  // Save single item to Downloads/APP_NAME
  const handleSaveItem = async (item: BatchItem) => {
    try {
      // If folder is not linked yet on supported browser, prompt to link Downloads/Grid6_PDF/
      if (!isFolderLinked && isDirectorySupported) {
        const handle = await pickAppDirectory(config.appName);
        if (handle) {
          setIsFolderLinked(true);
        }
      }

      const res = await saveSinglePdf(item, config.appName, true);
      showToast(`Saved to ${res.pathDescription}`, 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to save PDF file.', 'error');
    }
  };

  // Save all items (Direct directory or ZIP archive)
  const handleSaveAll = async (preferZip: boolean = false) => {
    try {
      if (!preferZip && !isFolderLinked && isDirectorySupported) {
        const handle = await pickAppDirectory(config.appName);
        if (handle) {
          setIsFolderLinked(true);
        }
      }

      const res = await saveAllBatchItems(items, config.appName, preferZip);
      showToast(`Batch output saved to ${res.pathDescription}`, 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to save batch items.', 'error');
    }
  };

  // Native Android Share sheet
  const handleShareItem = async (item: BatchItem) => {
    const shared = await sharePdfNative(item);
    if (shared) {
      showToast('Opening Android Share Sheet... Tap "Save to device" to pick Downloads/Grid6_PDF/', 'info');
    }
  };

  const previewPagesCount =
    items.find((i) => i.pageCount && i.pageCount > 0)?.pageCount || 12;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Header */}
      <Header
        appName={config.appName}
        isFolderLinked={isFolderLinked}
        onOpenStorageSettings={() => setShowStorageModal(true)}
        onOpenHelp={() => setShowStorageModal(true)}
        onOpenDirectShareGuide={() => setShowDirectShareGuide(true)}
        onLoadSample={handleLoadSample}
        isLoadingSample={isLoadingSample}
      />

      {/* Offline banner */}
      {!isOnline && (
        <div className="bg-amber-600/90 text-white text-xs px-4 py-1.5 flex items-center justify-center gap-2 font-medium">
          <WifiOff className="h-3.5 w-3.5" />
          <span>Offline Mode Active — 100% of PDF processing happens locally on your device.</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">
        {/* Intro Hero Banner */}
        <div className="mb-6 rounded-2xl border border-indigo-900/30 bg-gradient-to-r from-indigo-950/40 via-slate-900 to-slate-950 p-4 sm:p-6 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-300 ring-1 ring-indigo-500/30 mb-2">
                <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
                <span>6 Pages Merged into Single 3×2 Grid Layout</span>
              </div>
              <h2 className="text-xl font-extrabold tracking-tight text-white sm:text-2xl">
                Batch PDF Imposition & Grid Print Engine
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-slate-400 max-w-2xl">
                Transform any multi-page PDF into clean, print-ready 6-in-1 sheets (3 columns × 2 rows).
                Adjust margins and gutters in millimeters, inspect live layout previews, and batch-save directly to{' '}
                <span className="font-mono text-indigo-300 font-semibold">Downloads/{config.appName}/</span>.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                onClick={() => setShowDirectShareGuide(true)}
                type="button"
                className="flex items-center gap-1.5 rounded-xl border border-cyan-500/30 bg-cyan-950/40 px-3 py-2 text-xs font-semibold text-cyan-300 hover:border-cyan-400 hover:text-white transition"
              >
                <Share2 className="h-4 w-4 text-cyan-400" />
                <span>Direct Share from Other Apps</span>
              </button>

              <button
                onClick={() => setShowStorageModal(true)}
                type="button"
                className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition ${
                  isFolderLinked
                    ? 'border-emerald-500/40 bg-emerald-950/30 text-emerald-300'
                    : 'border-slate-800 bg-slate-900/80 text-slate-300 hover:border-indigo-500/40 hover:text-white'
                }`}
              >
                <FolderCheck className={`h-4 w-4 ${isFolderLinked ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span>Target: Downloads/{config.appName}/ {isFolderLinked ? '✓' : ''}</span>
              </button>
            </div>
          </div>
        </div>

        {/* 2-Column Responsive Grid Layout */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left Column: Batch Queue & File Upload (7 cols) */}
          <div className="space-y-6 lg:col-span-7">
            <BatchQueue
              items={items}
              isProcessingBatch={isProcessingBatch}
              config={config}
              isFolderLinked={isFolderLinked}
              onConnectFolder={handleConnectFolder}
              onOpenStorageSettings={() => setShowStorageModal(true)}
              onAddFiles={handleAddFiles}
              onRemoveItem={handleRemoveItem}
              onProcessItem={handleProcessItem}
              onReprocessItem={handleProcessItem}
              onProcessAll={handleProcessAll}
              onReprocessAll={handleReprocessAll}
              onSaveItem={handleSaveItem}
              onSaveAll={handleSaveAll}
              onShareItem={handleShareItem}
              onPreviewItem={(item) => setPreviewItem(item)}
              onClearAll={handleClearAll}
              onLoadSample={handleLoadSample}
              isLoadingSample={isLoadingSample}
              onOpenDirectShareGuide={() => setShowDirectShareGuide(true)}
            />

            {/* Custom Margin Controls */}
            <MarginControls config={config} onChange={handleUpdateConfig} />
          </div>

          {/* Right Column: Live Interactive Grid Visualizer (5 cols) */}
          <div className="space-y-6 lg:col-span-5">
            <div className="sticky top-20">
              <GridVisualizer
                config={config}
                totalOriginalPages={previewPagesCount}
              />

              {/* Quick Specs Callout */}
              <div className="mt-4 rounded-xl border border-slate-800/80 bg-slate-900/40 p-3.5 text-xs text-slate-400">
                <div className="font-semibold text-slate-200 mb-1.5 flex items-center gap-1.5">
                  <Grid3X3 className="h-4 w-4 text-indigo-400" />
                  3×2 Grid Imposition Rules
                </div>
                <ul className="space-y-1 text-[11px] list-disc list-inside">
                  <li>6 pages fit onto each single output sheet.</li>
                  <li>Page scale factor is calculated automatically to prevent distortion.</li>
                  <li>Trim marks and borders assist physical cutting and folder binding.</li>
                  <li>All processing runs completely client-side in your device memory.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Floating Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 rounded-xl border border-slate-700 bg-slate-900/95 px-4 py-2.5 text-xs text-white shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2
            className={`h-4 w-4 ${
              toast.type === 'error'
                ? 'text-rose-400'
                : toast.type === 'info'
                ? 'text-cyan-400'
                : 'text-emerald-400'
            }`}
          />
          <span className="font-medium">{toast.message}</span>
        </div>
      )}

      {/* Modals */}
      {previewItem && (
        <PDFPreviewModal
          item={previewItem}
          config={config}
          onClose={() => setPreviewItem(null)}
          onSave={handleSaveItem}
          onShare={handleShareItem}
          onReprocess={(item) => handleProcessItem(item.id)}
        />
      )}

      {showStorageModal && (
        <StorageHelpModal
          appName={config.appName}
          isFolderLinked={isFolderLinked}
          onUpdateAppName={(name) => handleUpdateConfig({ appName: name })}
          onFolderLinked={() => setIsFolderLinked(true)}
          onClose={() => setShowStorageModal(false)}
        />
      )}

      {showDirectShareGuide && (
        <DirectShareGuideModal
          onClose={() => setShowDirectShareGuide(false)}
          onSimulateIncomingShare={handleSimulateIncomingShare}
        />
      )}
    </div>
  );
}

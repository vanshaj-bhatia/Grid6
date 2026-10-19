import React, { useState } from 'react';
import {
  AlertCircle,
  Archive,
  CheckCircle2,
  Download,
  FolderCheck,
  FolderOpen,
  HelpCircle,
  Info,
  Layers,
  Save,
  Share2,
  Smartphone,
  Sparkles,
  X,
} from 'lucide-react';
import {
  getActiveDirectoryHandle,
  isAndroidDevice,
  isDirectoryPickerSupported,
  pickAppDirectory,
  saveSinglePdf,
  verifyHandlePermission,
} from '../services/fileStorage';

interface StorageHelpModalProps {
  appName: string;
  isFolderLinked: boolean;
  onUpdateAppName: (name: string) => void;
  onFolderLinked: () => void;
  onClose: () => void;
}

export const StorageHelpModal: React.FC<StorageHelpModalProps> = ({
  appName,
  isFolderLinked,
  onUpdateAppName,
  onFolderLinked,
  onClose,
}) => {
  const [localName, setLocalName] = useState(appName);
  const [hasDirectoryAccess, setHasDirectoryAccess] = useState(
    isFolderLinked || !!getActiveDirectoryHandle()
  );
  const [testResult, setTestResult] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const hasDirectoryPicker = isDirectoryPickerSupported();
  const isAndroid = isAndroidDevice();

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = localName.trim().replace(/[^a-zA-Z0-9_-]/g, '') || 'Grid6_PDF';
    onUpdateAppName(clean);
  };

  const handlePickFolder = async () => {
    const handle = await pickAppDirectory(appName);
    if (handle) {
      setHasDirectoryAccess(true);
      onFolderLinked();
      setTestResult(`Successfully linked Downloads/${appName}/! Files will now write directly inside this directory.`);
    }
  };

  const handleTestWrite = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const activeHandle = getActiveDirectoryHandle();
      if (!activeHandle) {
        // Try picking
        const handle = await pickAppDirectory(appName);
        if (!handle) {
          setTestResult('No folder selected. Click "Connect Downloads Folder" to link.');
          setIsTesting(false);
          return;
        }
        setHasDirectoryAccess(true);
        onFolderLinked();
      }

      const handle = getActiveDirectoryHandle();
      if (handle) {
        const hasPerm = await verifyHandlePermission(handle, true);
        if (!hasPerm) {
          setTestResult('Write permission not granted for folder.');
          setIsTesting(false);
          return;
        }

        const testFileHandle = await handle.getFileHandle('.grid6_test.txt', { create: true });
        const writable = await testFileHandle.createWritable();
        await writable.write(`Grid6 PDF storage test: ${new Date().toISOString()}`);
        await writable.close();
        setTestResult(`✓ Verified! Direct write access confirmed for Downloads/${appName}/`);
      }
    } catch (err: unknown) {
      setTestResult(`Test failed: ${(err as Error)?.message || 'Permission denied'}`);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400">
              <FolderOpen className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Storage Location & Downloads Folder</h3>
              <p className="text-xs text-slate-400">Target Folder: <span className="font-mono text-indigo-300">Downloads/{appName}/</span></p>
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

        <div className="mt-4 space-y-4 text-xs text-slate-300">
          {/* Status Alert Banner */}
          {hasDirectoryAccess ? (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/30 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-white text-sm">
                      Direct Folder Storage Active
                    </h4>
                    <p className="text-[11px] text-slate-300 mt-1">
                      Your browser has direct file system permission. All converted PDFs are saved directly inside <span className="text-emerald-300 font-mono font-semibold">Downloads/{appName}/</span> without extra prompts.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleTestWrite}
                  disabled={isTesting}
                  className="shrink-0 rounded-lg bg-emerald-700 hover:bg-emerald-600 px-3 py-1.5 text-[11px] font-semibold text-white transition disabled:opacity-50"
                >
                  {isTesting ? 'Verifying...' : 'Test Write'}
                </button>
              </div>
              {testResult && (
                <div className="mt-2.5 rounded-lg bg-slate-900/90 px-3 py-1.5 font-mono text-[11px] text-emerald-300 border border-emerald-500/20">
                  {testResult}
                </div>
              )}
            </div>
          ) : hasDirectoryPicker ? (
            <div className="rounded-xl border border-indigo-500/30 bg-indigo-950/20 p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="font-semibold text-white flex items-center gap-1.5 text-sm">
                    <FolderCheck className="h-4 w-4 text-indigo-400" />
                    One-Click Folder Connection
                  </h4>
                  <p className="text-[11px] text-slate-300 mt-1">
                    Connect your <span className="font-mono text-indigo-300">Downloads</span> folder once. The app will automatically create and store all 6-in-1 PDFs inside <span className="text-indigo-300 font-mono font-semibold">Downloads/{appName}/</span>.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handlePickFolder}
                  className="shrink-0 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 active:scale-95 shadow-md shadow-indigo-600/30 transition"
                >
                  Connect Downloads Folder
                </button>
              </div>
              {testResult && (
                <div className="mt-2.5 rounded-lg bg-slate-900/90 px-3 py-1.5 font-mono text-[11px] text-amber-300 border border-amber-500/20">
                  {testResult}
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-cyan-500/30 bg-cyan-950/20 p-4">
              <div className="flex items-start gap-2.5">
                <Smartphone className="h-5 w-5 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-white text-sm">
                    Android Storage Information
                  </h4>
                  <p className="text-[11px] text-slate-300 mt-1">
                    Android operating system security prevents web browsers from silently creating new subdirectories inside Downloads without using the Android system picker.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Android Step-by-Step Guide on How to Store in Downloads/Grid6_PDF */}
          <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-950 p-4">
            <h4 className="font-semibold text-white flex items-center gap-1.5 text-xs sm:text-sm">
              <Smartphone className="h-4 w-4 text-cyan-400" />
              How to Save directly into Downloads/{appName}/ on Android
            </h4>

            <div className="space-y-2.5 text-[11px] text-slate-300">
              {/* Method 1 */}
              <div className="rounded-lg border border-slate-800/80 bg-slate-900/60 p-3">
                <div className="flex items-center gap-2 font-semibold text-cyan-300 text-xs">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-300 font-mono text-[10px]">1</span>
                  <span>Recommended: Tap &quot;Android Share&quot; → Select &quot;Save to Device&quot;</span>
                </div>
                <p className="mt-1.5 text-slate-400 pl-7">
                  Tap the <Share2 className="inline h-3.5 w-3.5 text-cyan-400 mx-0.5" /> <strong>Share</strong> button on any file. In Android&apos;s Share sheet, select <strong>&quot;Save to device&quot;</strong> or <strong>&quot;Files by Google&quot;</strong>. You can choose or create the <code className="text-cyan-300 font-mono">Downloads/{appName}</code> directory directly!
                </p>
              </div>

              {/* Method 2 */}
              <div className="rounded-lg border border-slate-800/80 bg-slate-900/60 p-3">
                <div className="flex items-center gap-2 font-semibold text-indigo-300 text-xs">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-300 font-mono text-[10px]">2</span>
                  <span>Download as ZIP Archive (Creates Folder Automatically)</span>
                </div>
                <p className="mt-1.5 text-slate-400 pl-7">
                  Tap the <Archive className="inline h-3.5 w-3.5 text-indigo-400 mx-0.5" /> <strong>ZIP</strong> button. The archive contains the internal <code className="text-indigo-300 font-mono">{appName}/</code> directory. When opened or extracted in Android Files, it places all PDFs inside <code className="text-indigo-300 font-mono">Downloads/{appName}/</code> automatically.
                </p>
              </div>

              {/* Method 3 */}
              <div className="rounded-lg border border-slate-800/80 bg-slate-900/60 p-3">
                <div className="flex items-center gap-2 font-semibold text-amber-300 text-xs">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/20 text-amber-300 font-mono text-[10px]">3</span>
                  <span>Direct Browser Download Location</span>
                </div>
                <p className="mt-1.5 text-slate-400 pl-7">
                  Standard downloads go straight to your Android <code className="text-amber-300 font-mono">Downloads</code> folder named <code className="text-amber-300 font-mono">{appName}_*.pdf</code> so all your grid files are grouped together.
                </p>
              </div>
            </div>
          </div>

          {/* Custom Folder Name Input */}
          <form onSubmit={handleSaveName} className="rounded-xl border border-slate-800 bg-slate-950 p-3.5">
            <label className="block text-xs font-semibold text-white mb-1">
              App Storage Subfolder Name (APP_NAME)
            </label>
            <p className="text-[11px] text-slate-400 mb-2">
              All merged PDFs and batch exports are placed inside this directory.
            </p>
            <div className="flex items-center gap-2">
              <span className="font-mono text-slate-400 text-xs">Downloads/</span>
              <input
                type="text"
                value={localName}
                onChange={(e) => setLocalName(e.target.value)}
                className="flex-1 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 font-mono text-xs text-white focus:border-indigo-500 focus:outline-none"
                placeholder="Grid6_PDF"
              />
              <button
                type="submit"
                className="rounded-lg bg-indigo-600 px-3 py-1.5 font-semibold text-white hover:bg-indigo-500"
              >
                Apply
              </button>
            </div>
          </form>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            type="button"
            className="rounded-lg bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

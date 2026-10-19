import JSZip from 'jszip';
import { BatchItem } from '../types';

export interface SaveResult {
  method: 'direct-folder' | 'zip' | 'single-download' | 'share';
  pathDescription: string;
  count: number;
}

let activeDirectoryHandle: FileSystemDirectoryHandle | null = null;
let activeBaseDirectoryHandle: FileSystemDirectoryHandle | null = null;

const DB_NAME = 'grid6_storage_db';
const STORE_NAME = 'handles';

function openStorageDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      return reject(new Error('IndexedDB not supported'));
    }
    const req = indexedDB.open(DB_NAME, 2);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE_NAME)) {
        req.result.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveDirectoryHandleToDB(
  handle: FileSystemDirectoryHandle,
  baseHandle?: FileSystemDirectoryHandle
): Promise<void> {
  try {
    const db = await openStorageDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(handle, 'app_dir_handle');
    if (baseHandle) {
      tx.objectStore(STORE_NAME).put(baseHandle, 'base_downloads_handle');
    }
  } catch (err) {
    console.warn('Could not save handle to IndexedDB:', err);
  }
}

export async function loadDirectoryHandleFromDB(): Promise<FileSystemDirectoryHandle | null> {
  try {
    const db = await openStorageDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    return new Promise((resolve) => {
      const req = tx.objectStore(STORE_NAME).get('app_dir_handle');
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch (err) {
    console.warn('Could not load handle from IndexedDB:', err);
    return null;
  }
}

export function isDirectoryPickerSupported(): boolean {
  return typeof window !== 'undefined' && 'showDirectoryPicker' in window;
}

export function isAndroidDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Android/i.test(navigator.userAgent);
}

export function getActiveDirectoryHandle(): FileSystemDirectoryHandle | null {
  return activeDirectoryHandle;
}

export function setActiveDirectoryHandle(handle: FileSystemDirectoryHandle | null) {
  activeDirectoryHandle = handle;
}

/**
 * Verify if we have readwrite permission for a directory handle.
 * If requestIfPrompt is true, requests permission (must be during a user gesture).
 */
export async function verifyHandlePermission(
  handle: FileSystemDirectoryHandle,
  requestIfPrompt: boolean = false
): Promise<boolean> {
  try {
    const handleWithPerm = handle as unknown as {
      queryPermission?: (opts: { mode: string }) => Promise<PermissionState>;
      requestPermission?: (opts: { mode: string }) => Promise<PermissionState>;
    };

    if (handleWithPerm.queryPermission) {
      const state = await handleWithPerm.queryPermission({ mode: 'readwrite' });
      if (state === 'granted') return true;
      if (state === 'prompt' && requestIfPrompt && handleWithPerm.requestPermission) {
        const reqState = await handleWithPerm.requestPermission({ mode: 'readwrite' });
        return reqState === 'granted';
      }
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Error checking directory permission:', err);
    return false;
  }
}

/**
 * Initialize directory handle from IndexedDB on startup
 */
export async function initializeStorageHandle(): Promise<FileSystemDirectoryHandle | null> {
  const saved = await loadDirectoryHandleFromDB();
  if (saved) {
    activeDirectoryHandle = saved;
    return saved;
  }
  return null;
}

/**
 * Ask user to pick target Downloads directory, creating/accessing the APP_NAME folder
 */
export async function pickAppDirectory(appName: string = 'Grid6_PDF'): Promise<FileSystemDirectoryHandle | null> {
  if (!isDirectoryPickerSupported()) {
    return null;
  }
  try {
    const baseHandle = await (window as unknown as {
      showDirectoryPicker: (opts?: { id?: string; mode?: string; startIn?: string }) => Promise<FileSystemDirectoryHandle>;
    }).showDirectoryPicker({
      id: 'pdf-grid-downloads-folder',
      mode: 'readwrite',
      startIn: 'downloads',
    });

    activeBaseDirectoryHandle = baseHandle;

    // Create or open the APP_NAME subfolder inside the selected directory
    let targetFolder = baseHandle;
    try {
      targetFolder = await baseHandle.getDirectoryHandle(appName, { create: true });
    } catch (err) {
      console.warn(`Could not create subfolder ${appName}, using base handle:`, err);
      targetFolder = baseHandle;
    }

    activeDirectoryHandle = targetFolder;
    await saveDirectoryHandleToDB(targetFolder, baseHandle);
    return targetFolder;
  } catch (err: unknown) {
    if ((err as Error)?.name === 'AbortError') {
      return null;
    }
    console.warn('Directory picker failed or was cancelled:', err);
    return null;
  }
}

/**
 * Save a single processed PDF directly to Downloads/APP_NAME or trigger fallback download
 */
export async function saveSinglePdf(
  item: BatchItem,
  appName: string = 'Grid6_PDF',
  forcePrompt: boolean = false
): Promise<SaveResult> {
  if (!item.outputBlob) {
    throw new Error('Item does not have an output file yet.');
  }

  const baseName = item.name.replace(/\.pdf$/i, '');
  const fileName = `${baseName}_3x2_grid.pdf`;

  // 1. If we have an active directory handle, check permission and write directly into Downloads/APP_NAME/
  if (activeDirectoryHandle) {
    try {
      const hasPerm = await verifyHandlePermission(activeDirectoryHandle, forcePrompt);
      if (hasPerm) {
        const fileHandle = await activeDirectoryHandle.getFileHandle(fileName, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(item.outputBlob);
        await writable.close();
        return {
          method: 'direct-folder',
          pathDescription: `Downloads/${appName}/${fileName}`,
          count: 1,
        };
      }
    } catch (err) {
      console.warn('Direct file handle write failed, falling back to download:', err);
    }
  }

  // 2. Standard browser download fallback:
  // Browsers sanitize slashes in download attribute, so we use `${appName}_${fileName}`
  const downloadFileName = `${appName}_${fileName}`;
  const url = URL.createObjectURL(item.outputBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = downloadFileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 10000);

  return {
    method: 'single-download',
    pathDescription: `Downloads/${downloadFileName}`,
    count: 1,
  };
}

/**
 * Save a single PDF as a ZIP archive containing the exact Downloads/APP_NAME/ folder structure
 * When extracted on Android or Desktop, it creates Downloads/APP_NAME/filename.pdf
 */
export async function saveSinglePdfAsZip(
  item: BatchItem,
  appName: string = 'Grid6_PDF'
): Promise<SaveResult> {
  if (!item.outputBlob) {
    throw new Error('Item does not have an output file yet.');
  }

  const baseName = item.name.replace(/\.pdf$/i, '');
  const fileName = `${baseName}_3x2_grid.pdf`;

  const zip = new JSZip();
  const folder = zip.folder(appName) || zip;
  folder.file(fileName, item.outputBlob);

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const zipName = `${appName}_${baseName}.zip`;

  const url = URL.createObjectURL(zipBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = zipName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 10000);

  return {
    method: 'zip',
    pathDescription: `Downloads/${zipName} (Extracts into Downloads/${appName}/${fileName})`,
    count: 1,
  };
}

/**
 * Save all completed batch items
 */
export async function saveAllBatchItems(
  items: BatchItem[],
  appName: string = 'Grid6_PDF',
  preferZip: boolean = false
): Promise<SaveResult> {
  const completed = items.filter((item) => item.status === 'done' && item.outputBlob);
  if (completed.length === 0) {
    throw new Error('No completed files available to save.');
  }

  // 1. Direct write to linked directory if handle exists and has permission
  if (activeDirectoryHandle && !preferZip) {
    try {
      const hasPerm = await verifyHandlePermission(activeDirectoryHandle, true);
      if (hasPerm) {
        let savedCount = 0;
        for (const item of completed) {
          if (!item.outputBlob) continue;
          const fileName = `${item.name.replace(/\.pdf$/i, '')}_3x2_grid.pdf`;
          const fileHandle = await activeDirectoryHandle.getFileHandle(fileName, { create: true });
          const writable = await fileHandle.createWritable();
          await writable.write(item.outputBlob);
          await writable.close();
          savedCount++;
        }
        return {
          method: 'direct-folder',
          pathDescription: `Downloads/${appName}/ (${savedCount} files)`,
          count: savedCount,
        };
      }
    } catch (err) {
      console.warn('Batch direct write failed, falling back to ZIP archive:', err);
    }
  }

  // 2. Create a structured ZIP archive containing the exact Downloads/APP_NAME/ directory
  const zip = new JSZip();
  const folder = zip.folder(appName) || zip;

  for (const item of completed) {
    if (!item.outputBlob) continue;
    const fileName = `${item.name.replace(/\.pdf$/i, '')}_3x2_grid.pdf`;
    folder.file(fileName, item.outputBlob);
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const zipName = `${appName}_Batch_3x2.zip`;

  const url = URL.createObjectURL(zipBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = zipName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 10000);

  return {
    method: 'zip',
    pathDescription: `Downloads/${zipName} (Extracts into Downloads/${appName}/)`,
    count: completed.length,
  };
}

/**
 * Android Web Share API: triggers native Android Share / Save to Downloads sheet
 * In Android, this allows the user to pick "Save to device" or "Files by Google"
 * and place the file directly in Downloads/Grid6_PDF/
 */
export async function sharePdfNative(item: BatchItem): Promise<boolean> {
  if (!item.outputBlob) return false;

  const fileName = `${item.name.replace(/\.pdf$/i, '')}_3x2_grid.pdf`;
  const file = new File([item.outputBlob], fileName, { type: 'application/pdf' });

  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: fileName,
        text: '6-in-1 PDF Page Grid (3x2 Layout) - Save to Downloads/Grid6_PDF/',
      });
      return true;
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') return false;
      console.warn('Share error:', err);
      return false;
    }
  }
  return false;
}

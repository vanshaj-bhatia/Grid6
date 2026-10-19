/**
 * Service to handle incoming shared files from external apps via
 * Web Share Target API and File Handling API (LaunchQueue)
 */

export async function retrieveSharedFilesFromCache(): Promise<File[]> {
  if (typeof window === 'undefined' || !('caches' in window)) {
    return [];
  }

  try {
    const cache = await caches.open('grid6-shared-target-cache');
    const requests = await cache.keys();

    if (requests.length === 0) {
      return [];
    }

    const files: File[] = [];

    for (const req of requests) {
      const response = await cache.match(req);
      if (response) {
        const rawFilename = response.headers.get('x-filename');
        const filename = rawFilename ? decodeURIComponent(rawFilename) : 'shared_document.pdf';
        const blob = await response.blob();
        const file = new File([blob], filename, {
          type: blob.type || 'application/pdf',
          lastModified: Date.now(),
        });
        files.push(file);
        await cache.delete(req);
      }
    }

    // Clean URL query param if present
    if (window.location.search.includes('shared_target')) {
      const url = new URL(window.location.href);
      url.searchParams.delete('shared_target');
      window.history.replaceState({}, '', url.pathname + (url.search ? url.search : ''));
    }

    return files;
  } catch (err) {
    console.warn('Failed retrieving shared files from cache:', err);
    return [];
  }
}

/**
 * Listen for File Handling API ("Open with" from Android File Managers)
 */
export function setupLaunchQueueConsumer(onFilesReceived: (files: File[]) => void) {
  if (typeof window === 'undefined') return;

  const w = window as unknown as {
    launchQueue?: {
      setConsumer: (callback: (params: { files: FileSystemFileHandle[] }) => Promise<void>) => void;
    };
  };

  if (w.launchQueue) {
    w.launchQueue.setConsumer(async (launchParams) => {
      if (!launchParams.files || launchParams.files.length === 0) return;
      const files: File[] = [];
      for (const handle of launchParams.files) {
        try {
          const file = await handle.getFile();
          if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
            files.push(file);
          }
        } catch (err) {
          console.warn('Could not read file from launchParams handle:', err);
        }
      }
      if (files.length > 0) {
        onFilesReceived(files);
      }
    });
  }
}

// Service Worker handler for Android Web Share Target Level 2 (Direct File Share)
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (event.request.method === 'POST' && url.pathname === '/share-target') {
    event.respondWith(
      (async () => {
        try {
          const formData = await event.request.formData();
          const incomingFiles = [];

          for (const [key, value] of formData.entries()) {
            if (value && typeof value === 'object' && 'name' in value && 'arrayBuffer' in value) {
              incomingFiles.push(value);
            }
          }

          if (incomingFiles.length > 0) {
            const cache = await caches.open('grid6-shared-target-cache');
            const staleKeys = await cache.keys();
            for (const k of staleKeys) {
              await cache.delete(k);
            }

            for (let i = 0; i < incomingFiles.length; i++) {
              const file = incomingFiles[i];
              const response = new Response(file, {
                headers: {
                  'x-filename': encodeURIComponent(file.name || `shared_doc_${i + 1}.pdf`),
                  'content-type': file.type || 'application/pdf',
                },
              });
              await cache.put(`/shared-file-entry/${i}`, response);
            }
          }
        } catch (err) {
          console.error('Error in service worker share target handler:', err);
        }

        return Response.redirect('/?shared_target=true', 303);
      })()
    );
  }
});

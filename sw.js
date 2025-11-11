// Asignar nombre y versión del caché
const CACHE_NAME = 'v1_cache_MisaelLule_PWA';

// Archivos a cachear
const urlsToCache = [
    './',
    './index.html',
    './style.css',
    './favicon/favicon-1024.png',
    './favicon/favicon-512.png',
    './favicon/favicon-384.png',
    './favicon/favicon-256.png',
    './favicon/favicon-128.png',
    './favicon/favicon-96.png',
    './favicon/favicon-64.png',
    './favicon/favicon-32.png',
    './favicon/favicon-16.png'
];

// Evento INSTALL (reemplazado para evitar que un fallo en addAll rompa la instalación)
self.addEventListener('install', e => {
    e.waitUntil(
        caches.open(CACHE_NAME).then(async cache => {
            for (const url of urlsToCache) {
                try {
                    const res = await fetch(url, { cache: 'no-cache' });
                    if (!res.ok) throw new Error(`HTTP ${res.status}`);
                    await cache.put(url, res.clone());
                } catch (err) {
                    console.warn('❌ No se pudo cachear:', url, err);
                    // seguir con los demás recursos sin abortar la instalación
                }
            }
        })
            .then(() => self.skipWaiting())
            .catch(err => console.error('❌ Error durante install', err))
    );
});

// Evento ACTIVATE
self.addEventListener('activate', e => {
    const cacheWhitelist = [CACHE_NAME];

    e.waitUntil(
        caches.keys()
            .then(cacheNames => Promise.all(
                cacheNames.map(cacheName => {
                    if (!cacheWhitelist.includes(cacheName)) {
                        console.log('🗑 Borrando caché antiguo:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            ))
            .then(() => self.clients.claim())
    );
});

// Evento FETCH
self.addEventListener('fetch', e => {
    e.respondWith(
        caches.match(e.request)
            .then(res => {
                if (res) {
                    return res;
                }
                // Evitar intentar cachear requests con esquemas no soportados
                try {
                    const requestUrl = new URL(e.request.url);
                    if (requestUrl.protocol !== 'http:' && requestUrl.protocol !== 'https:') {
                        // Solo intentar fetch normal para esquemas no-http(s)
                        return fetch(e.request);
                    }
                } catch (err) {
                    return fetch(e.request);
                }

                // Si no está en caché, intenta desde la red
                return fetch(e.request).then(networkRes => {
                    // Solo cachear respuestas GET exitosas y same-origin (opcional)
                    if (
                        e.request.method === 'GET' &&
                        networkRes &&
                        networkRes.status === 200 &&
                        (new URL(e.request.url)).origin === self.location.origin
                    ) {
                        return caches.open(CACHE_NAME).then(cache => {
                            try {
                                cache.put(e.request, networkRes.clone());
                            } catch (err) {
                                console.warn('No se pudo cachear:', e.request.url, err);
                            }
                            return networkRes;
                        });
                    }
                    return networkRes;
                }).catch(() => {
                    if (e.request.destination === 'document') {
                        return caches.match('./index.html');
                    }
                });
            })
    );
});

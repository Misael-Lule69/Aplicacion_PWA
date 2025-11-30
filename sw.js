// Asignar nombre y versión del caché
const CACHE_NAME = 'v4_cache_MisaelLule_PWA';

// SOLO cachear imágenes y favicons (NO cachear HTML, CSS, JS para ver cambios inmediatos)
const urlsToCache = [
    './favicon/favicon-1024.png',
    './favicon/favicon-512.png',
    './favicon/favicon-384.png',
    './favicon/favicon-256.png',
    './favicon/favicon-128.png',
    './favicon/favicon-96.png',
    './favicon/favicon-64.png',
    './favicon/favicon-32.png',
    './favicon/favicon-16.png',
    './favicon/favicon-192.png'
];

// Evento INSTALL
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

// Evento FETCH - NO cachear HTML, CSS, JS para ver cambios inmediatos
self.addEventListener('fetch', e => {
    const requestUrl = new URL(e.request.url);
    const isImage = /\.(jpg|jpeg|png|gif|svg|webp|ico)$/i.test(requestUrl.pathname);
    const isFavicon = requestUrl.pathname.includes('favicon');

    // Para HTML, CSS, JS y APIs: SIEMPRE desde la red (NO cachear)
    if (
        e.request.method === 'GET' &&
        !isImage &&
        !isFavicon &&
        (requestUrl.pathname.endsWith('.html') ||
            requestUrl.pathname.endsWith('.css') ||
            requestUrl.pathname.endsWith('.js') ||
            requestUrl.pathname === '/' ||
            requestUrl.pathname.includes('api/'))
    ) {
        // Siempre buscar desde la red (no cachear)
        e.respondWith(
            fetch(e.request, { cache: 'no-store' })
                .then(networkRes => {
                    return networkRes;
                })
                .catch(() => {
                    // Solo si falla completamente la red, intentar cache como último recurso
                    return caches.match(e.request).then(cachedRes => {
                        if (cachedRes) {
                            return cachedRes;
                        }
                        // Si es una página y no hay cache, devolver index.html del cache
                        if (e.request.destination === 'document') {
                            return caches.match('./index.html');
                        }
                    });
                })
        );
        return;
    }

    // Para imágenes y favicons: Cache First (más rápido, pero actualizar en segundo plano)
    if (isImage || isFavicon) {
        e.respondWith(
            caches.match(e.request)
                .then(cachedRes => {
                    // Si hay cache, devolverlo inmediatamente y actualizar en segundo plano
                    if (cachedRes) {
                        // Actualizar cache en segundo plano sin bloquear
                        fetch(e.request)
                            .then(networkRes => {
                                if (networkRes && networkRes.status === 200) {
                                    // Clonar ANTES de usar la respuesta
                                    const responseClone = networkRes.clone();
                                    caches.open(CACHE_NAME).then(cache => {
                                        cache.put(e.request, responseClone);
                                    }).catch(() => { });
                                }
                            })
                            .catch(() => { });
                        return cachedRes;
                    }

                    // Si no hay cache, buscar en la red
                    return fetch(e.request).then(networkRes => {
                        if (networkRes && networkRes.status === 200) {
                            // Clonar ANTES de usar la respuesta
                            const responseClone = networkRes.clone();
                            caches.open(CACHE_NAME).then(cache => {
                                cache.put(e.request, responseClone);
                            }).catch(() => { });
                        }
                        return networkRes;
                    });
                })
        );
        return;
    }

    // Para todo lo demás: Network only
    e.respondWith(fetch(e.request));
});

// Manejar clics en notificaciones
self.addEventListener('notificationclick', (event) => {
    console.log('Notificación clickeada:', event.notification.tag);
    event.notification.close();

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            // Buscar si hay una ventana abierta
            for (const client of clientList) {
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    return client.focus();
                }
            }
            // Si no hay ventana abierta, abrir una nueva
            if (clients.openWindow) {
                return clients.openWindow('/');
            }
        })
    );
});

// Manejar cierre de notificaciones
self.addEventListener('notificationclose', (event) => {
    console.log('Notificación cerrada:', event.notification.tag);
});

// Escuchar mensajes del cliente (para mostrar notificaciones desde la página)
self.addEventListener('message', (event) => {
    console.log('Mensaje recibido en Service Worker:', event.data);

    if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
        const { title, options } = event.data;
        event.waitUntil(
            self.registration.showNotification(title, {
                body: options.body || '',
                icon: options.icon || './favicon/favicon-192.png',
                badge: options.badge || './favicon/favicon-192.png',
                tag: options.tag || 'default-notification',
                requireInteraction: options.requireInteraction || false,
                ...options
            })
        );
    }
});

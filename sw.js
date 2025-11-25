// Service Worker simplificado - ELIMINA errores de cache
const CACHE_NAME = 'v8_cache_MisaelLule_PWA';

// Solo archivos esenciales
const urlsToCache = [
    './',
    './index.html',
    './style.css',
    './main.js',
    './favicon/favicon-192.png'
];

// Instalación
self.addEventListener('install', event => {
    console.log('Service Worker: Instalando...');

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Cache abierto');
                // Usamos addAll pero con manejo de errores
                return cache.addAll(urlsToCache)
                    .then(() => {
                        console.log('Todos los archivos cacheados');
                        return self.skipWaiting();
                    })
                    .catch(error => {
                        console.warn('Algunos archivos no se pudieron cachear:', error);
                        // Continuamos aunque falle el cache
                        return self.skipWaiting();
                    });
            })
    );
});

// Activación
self.addEventListener('activate', event => {
    console.log('Service Worker: Activado');

    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Eliminando cache antiguo:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Firebase Messaging - VERSIÓN COMPATIBLE
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

firebase.initializeApp({
    apiKey: "AIzaSyAVeQZ2181GM2V1rSXMZe6zXCbLp7wyQnc",
    authDomain: "aplicacion-pwa.firebaseapp.com",
    projectId: "aplicacion-pwa",
    storageBucket: "aplicacion-pwa.firebasestorage.app",
    messagingSenderId: "233398149796",
    appId: "1:233398149796:web:5100ccb51eb742ba3efc31"
});

const messaging = firebase.messaging();

// Manejar mensajes en segundo plano
messaging.onBackgroundMessage((payload) => {
    console.log('Mensaje en segundo plano recibido:', payload);

    const notificationTitle = payload.notification?.title || 'Nueva notificación';
    const notificationOptions = {
        body: payload.notification?.body || '',
        icon: './favicon/favicon-192.png',
        badge: './favicon/favicon-192.png'
    };

    return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Manejar clics en notificaciones
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    event.waitUntil(
        clients.matchAll({ type: 'window' }).then((clientList) => {
            for (const client of clientList) {
                if (client.url === '/' && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow('/');
            }
        })
    );
});
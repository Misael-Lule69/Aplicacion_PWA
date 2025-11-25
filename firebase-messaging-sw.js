importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

// Configuración Firebase (reemplaza con tu configuración si es necesario)
const firebaseConfig = {
    apiKey: "AIzaSyAVeQZ2181GM2V1rSXMZe6zXCbLp7wyQnc",
    authDomain: "aplicacion-pwa.firebaseapp.com",
    projectId: "aplicacion-pwa",
    storageBucket: "aplicacion-pwa.firebasestorage.app",
    messagingSenderId: "233398149796",
    appId: "1:233398149796:web:5100ccb51eb742ba3efc31",
    measurementId: "G-GBEM1H5TMJ"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage(function (payload) {
    const title = (payload.notification && payload.notification.title) || 'Notificación';
    const options = {
        body: (payload.notification && payload.notification.body) || '',
        icon: (payload.notification && payload.notification.icon) || '/favicon/favicon-192.png',
        data: payload.data || {}
    };
    self.registration.showNotification(title, options);
});

// ============================================
// FILTRO DE ERRORES DE EXTENSIONES DEL NAVEGADOR
// ============================================
// Suprimir errores de extensiones del navegador (como Cursor, autocompletado, etc.)
// que no afectan la funcionalidad de la aplicación
(function () {
    'use strict';

    // Lista de patrones a filtrar (errores de extensiones)
    const filterPatterns = [
        'content_script.js',
        'shouldOfferCompletionListForField',
        'processInputEvent',
        'inputEventHandler',
        'elementWasFocused',
        'focusInEventHandler',
        'reading \'control\''
    ];

    // Función para verificar si un error debe ser filtrado
    function shouldFilterError(message, source) {
        if (!message && !source) return false;
        const text = (message || '') + ' ' + (source || '');
        return filterPatterns.some(pattern => text.includes(pattern));
    }

    // 1. Filtrar errores en console.error
    const originalError = console.error;
    console.error = function (...args) {
        const errorString = args.map(arg =>
            typeof arg === 'string' ? arg :
                (arg && typeof arg === 'object' && (arg.message || arg.stack)) ? (arg.message || arg.stack) :
                    String(arg)
        ).join(' ');

        if (shouldFilterError(errorString, '')) {
            return; // No mostrar estos errores
        }
        originalError.apply(console, args);
    };

    // 2. Sobrescribir window.onerror (se ejecuta antes que los listeners)
    const originalOnError = window.onerror;
    window.onerror = function (message, source, lineno, colno, error) {
        if (shouldFilterError(message, source)) {
            return true; // Prevenir que se muestre en la consola
        }
        if (originalOnError) {
            return originalOnError.call(this, message, source, lineno, colno, error);
        }
        return false;
    };

    // 3. Agregar listener adicional para errores (capture phase - se ejecuta primero)
    window.addEventListener('error', function (event) {
        if (shouldFilterError(event.message, event.filename)) {
            event.stopImmediatePropagation();
            event.preventDefault();
            return false;
        }
    }, true); // true = capture phase (se ejecuta antes que otros listeners)

    // 4. Filtrar promesas rechazadas no capturadas
    window.addEventListener('unhandledrejection', function (event) {
        const reason = event.reason;
        let errorMessage = '';
        if (reason) {
            if (typeof reason === 'string') {
                errorMessage = reason;
            } else if (reason.message) {
                errorMessage = reason.message;
            } else if (reason.stack) {
                errorMessage = reason.stack;
            } else {
                errorMessage = String(reason);
            }
        }

        if (shouldFilterError(errorMessage, '')) {
            event.stopImmediatePropagation();
            event.preventDefault();
        }
    }, true); // capture phase

    // 5. Sobrescribir console.warn también
    const originalWarn = console.warn;
    console.warn = function (...args) {
        const errorString = args.map(arg =>
            typeof arg === 'string' ? arg :
                (arg && typeof arg === 'object' && arg.message) ? arg.message :
                    String(arg)
        ).join(' ');

        if (shouldFilterError(errorString, '')) {
            return; // No mostrar estos warnings
        }
        originalWarn.apply(console, args);
    };

    console.log('✅ Filtro de errores de extensiones activado');
})();

// ============================================
// SERVICE WORKER - Configuración mejorada para detectar cambios
// ============================================
// Variable global para almacenar el registro del Service Worker (necesaria para notificaciones)
let serviceWorkerRegistration = null;

if ('serviceWorker' in navigator) {
    console.log('Puedes usar los serviceworker del navegador');

    // Bandera para evitar recargas múltiples
    let isReloading = false;
    let updateCheckInterval = null;

    // Registrar Service Worker SIN cache-busting (esto causaba el bucle infinito)
    navigator.serviceWorker.register('./sw.js')
        .then(registration => {
            console.log('serviceWorker cargando correctamente', registration);
            // Guardar referencia para usar en notificaciones
            serviceWorkerRegistration = registration;

            // Función para verificar actualizaciones (sin recargar automáticamente)
            const checkForUpdates = () => {
                if (isReloading) return; // Evitar múltiples recargas

                registration.update().catch(err => {
                    console.log('Error al verificar actualizaciones:', err);
                });
            };

            // Detectar actualizaciones del Service Worker (solo una vez)
            let updateFoundHandled = false;
            registration.addEventListener('updatefound', () => {
                if (updateFoundHandled || isReloading) return;
                updateFoundHandled = true;

                const newWorker = registration.installing;
                if (!newWorker) return;

                newWorker.addEventListener('statechange', () => {
                    // Solo recargar si el nuevo worker está instalado Y hay un worker activo
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller && !isReloading) {
                        console.log('🔄 Nueva versión detectada. Recargando en 2 segundos...');
                        isReloading = true;

                        // Limpiar intervalos
                        if (updateCheckInterval) {
                            clearInterval(updateCheckInterval);
                        }

                        // Limpiar cache y recargar después de un delay
                        setTimeout(() => {
                            caches.keys().then(cacheNames => {
                                return Promise.all(
                                    cacheNames.map(cacheName => caches.delete(cacheName))
                                );
                            }).then(() => {
                                window.location.reload();
                            }).catch(() => {
                                window.location.reload();
                            });
                        }, 2000);
                    }
                });
            });

            // Verificar actualizaciones cada 30 segundos (menos frecuente)
            updateCheckInterval = setInterval(checkForUpdates, 30000);

            // Verificar al hacer foco en la ventana (solo si no está recargando)
            window.addEventListener('focus', () => {
                if (!isReloading) {
                    checkForUpdates();
                }
            });

            // Exponer función global para forzar actualización manual
            window.forceUpdate = function () {
                if (isReloading) {
                    console.log('Ya se está recargando...');
                    return;
                }

                console.log('🔄 Forzando actualización...');
                isReloading = true;

                // Limpiar intervalos
                if (updateCheckInterval) {
                    clearInterval(updateCheckInterval);
                }

                caches.keys().then(cacheNames => {
                    return Promise.all(
                        cacheNames.map(cacheName => {
                            console.log('🗑 Eliminando cache:', cacheName);
                            return caches.delete(cacheName);
                        })
                    );
                }).then(() => {
                    return registration.unregister();
                }).then(() => {
                    console.log('✅ Cache limpiado. Recargando...');
                    window.location.reload();
                }).catch(() => {
                    window.location.reload();
                });
            };
        })
        .catch(err => console.log('serviceWorker no se ha podido registrar', err))
} else {
    console.log('No puedes usar los serviceWorker del navegador');
}

// ============================================
// FUNCIONES PARA NOTIFICACIONES PUSH LOCALES
// ============================================

/**
 * Solicita permisos de notificaciones al usuario
 * @returns {Promise<boolean>} true si se concedieron permisos, false en caso contrario
 */
async function requestNotificationPermission() {
    // Verificar si el navegador soporta notificaciones
    if (!('Notification' in window)) {
        console.log('❌ Este navegador no soporta notificaciones');
        return false;
    }

    // Si ya se tienen permisos, retornar true
    if (Notification.permission === 'granted') {
        console.log('✅ Permisos de notificación ya concedidos');
        return true;
    }

    // Si los permisos fueron denegados, no se pueden solicitar de nuevo
    if (Notification.permission === 'denied') {
        console.log('❌ Permisos de notificación denegados. El usuario debe habilitarlos manualmente en la configuración del navegador.');
        return false;
    }

    // Solicitar permisos (solo si el estado es 'default')
    try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            console.log('✅ Permisos de notificación concedidos');
            return true;
        } else {
            console.log('❌ Permisos de notificación denegados por el usuario');
            return false;
        }
    } catch (error) {
        console.error('Error al solicitar permisos de notificación:', error);
        return false;
    }
}

/**
 * Muestra una notificación push local
 * @param {string} title - Título de la notificación
 * @param {Object} options - Opciones de la notificación (body, icon, badge, tag, etc.)
 */
async function showLocalNotification(title, options = {}) {
    // Verificar si el navegador soporta notificaciones
    if (!('Notification' in window)) {
        console.log('❌ Este navegador no soporta notificaciones');
        return;
    }

    // Verificar permisos
    if (Notification.permission !== 'granted') {
        console.log('⚠️ No se tienen permisos para mostrar notificaciones');
        // Intentar solicitar permisos si no están denegados
        if (Notification.permission === 'default') {
            const granted = await requestNotificationPermission();
            if (!granted) {
                return;
            }
        } else {
            return;
        }
    }

    // Configuración por defecto de la notificación
    const defaultOptions = {
        body: options.body || '',
        icon: options.icon || './favicon/favicon-192.png',
        badge: options.badge || './favicon/favicon-192.png',
        tag: options.tag || 'default-notification',
        requireInteraction: options.requireInteraction || false,
        silent: options.silent || false
    };

    // Intentar usar el Service Worker para mostrar la notificación (funciona incluso con la pestaña cerrada)
    if (serviceWorkerRegistration) {
        try {
            await serviceWorkerRegistration.showNotification(title, {
                ...defaultOptions,
                ...options
            });
            console.log('✅ Notificación mostrada mediante Service Worker');
        } catch (error) {
            console.error('Error al mostrar notificación con Service Worker:', error);
            // Fallback: usar Notification API directamente
            try {
                new Notification(title, defaultOptions);
                console.log('✅ Notificación mostrada mediante Notification API');
            } catch (fallbackError) {
                console.error('Error al mostrar notificación:', fallbackError);
            }
        }
    } else {
        // Fallback: usar Notification API directamente (solo funciona con la pestaña abierta)
        try {
            new Notification(title, defaultOptions);
            console.log('✅ Notificación mostrada mediante Notification API');
        } catch (error) {
            console.error('Error al mostrar notificación:', error);
        }
    }
}

// Solicitar permisos automáticamente después de que la página cargue
// (con un pequeño delay para mejor experiencia de usuario)
$(document).ready(function () {
    // Esperar 2 segundos antes de solicitar permisos (mejor UX)
    setTimeout(async () => {
        if (Notification.permission === 'default') {
            console.log('📢 Solicitando permisos de notificación...');
            await requestNotificationPermission();
        }
    }, 2000);
});

// JQUERY - CUANDO EL DOCUMENTO ESTÁ LISTO
$(document).ready(function () {

    // SCROLL SUAVIZADO
    $("#menu a").click(function (e) {
        e.preventDefault();

        $("html,body").animate({
            scrollTop: $($(this).attr('href')).offset().top
        });
        return false;
    });

    // CÓDIGO AÑADIDO PARA LA NAVBAR STICKY
    $(window).scroll(function () {

        // Si el scroll vertical es mayor a 50 pixeles
        if ($(this).scrollTop() > 50) {
            // Añade la clase 'scrolled' al header
            $('#main-header').addClass('scrolled');
        } else {
            // Si está arriba, quita la clase
            $('#main-header').removeClass('scrolled');
        }
    });
    // FIN DEL CÓDIGO AÑADIDO

    // Botón de actualización manual
    $('#force-update-btn').on('click', function () {
        if (typeof window.forceUpdate === 'function') {
            $(this).text('⏳').prop('disabled', true);
            window.forceUpdate();
        } else {
            // Fallback: recargar la página
            window.location.reload(true);
        }
    });

    // MANEJO DEL FORMULARIO DE CONTACTO CON NOTIFICACIONES PUSH
    $('#contact-form').on('submit', function (e) {
        e.preventDefault(); // Prevenir envío normal del formulario

        const $form = $(this);
        const $submitBtn = $('#submit-btn');
        const $messageDiv = $('#form-message');
        const originalBtnText = $submitBtn.text();

        // Deshabilitar botón y mostrar estado de carga
        $submitBtn.prop('disabled', true).text('Enviando...');
        $messageDiv.removeClass('success error').text('');

        // Obtener datos del formulario
        const formData = new FormData(this);
        const nombre = $('#nombre').val().trim(); // Guardar nombre para la notificación

        // Enviar datos con AJAX
        $.ajax({
            url: 'api/contacto.php',
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            dataType: 'json',
            success: async function (response) {
                if (response.success) {
                    // Mostrar mensaje de éxito
                    $messageDiv.addClass('success').text(response.message);
                    // Limpiar formulario
                    $form[0].reset();

                    // Mostrar notificación push local
                    await showLocalNotification('¡Mensaje enviado! 🎉', {
                        body: `Gracias ${nombre || 'por contactarnos'}. Tu mensaje ha sido enviado correctamente.`,
                        icon: './favicon/favicon-192.png',
                        badge: './favicon/favicon-192.png',
                        tag: 'contact-form-success',
                        requireInteraction: false
                    });

                    // Scroll suave al mensaje
                    $('html, body').animate({
                        scrollTop: $messageDiv.offset().top - 100
                    }, 500);
                } else {
                    // Mostrar errores
                    let errorMsg = response.message;
                    if (response.errors && response.errors.length > 0) {
                        errorMsg += ': ' + response.errors.join(', ');
                    }
                    $messageDiv.addClass('error').text(errorMsg);

                    // Notificación de error (opcional - solo si hay permisos)
                    if (Notification.permission === 'granted') {
                        await showLocalNotification('Error al enviar', {
                            body: errorMsg,
                            icon: './favicon/favicon-192.png',
                            tag: 'contact-form-error',
                            requireInteraction: false
                        });
                    }
                }
            },
            error: async function (xhr, status, error) {
                let errorMsg = 'Error al enviar el mensaje. Por favor, intenta más tarde.';
                if (xhr.responseJSON && xhr.responseJSON.message) {
                    errorMsg = xhr.responseJSON.message;
                }
                $messageDiv.addClass('error').text(errorMsg);

                // Notificación de error (opcional - solo si hay permisos)
                if (Notification.permission === 'granted') {
                    await showLocalNotification('Error de conexión', {
                        body: errorMsg,
                        icon: './favicon/favicon-192.png',
                        tag: 'contact-form-error',
                        requireInteraction: false
                    });
                }
            },
            complete: function () {
                // Rehabilitar botón
                $submitBtn.prop('disabled', false).text(originalBtnText);
            }
        });
    });

});
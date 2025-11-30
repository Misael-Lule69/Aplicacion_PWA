// SERVICE WORKER - Configuración mejorada para detectar cambios
if ('serviceWorker' in navigator) {
    console.log('Puedes usar los serviceworker del navegador');

    // Bandera para evitar recargas múltiples
    let isReloading = false;
    let updateCheckInterval = null;

    // Registrar Service Worker SIN cache-busting (esto causaba el bucle infinito)
    navigator.serviceWorker.register('./sw.js')
        .then(registration => {
            console.log('serviceWorker cargando correctamente', registration);

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

    // MANEJO DEL FORMULARIO DE CONTACTO
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

        // Enviar datos con AJAX
        $.ajax({
            url: 'api/contacto.php',
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            dataType: 'json',
            success: function (response) {
                if (response.success) {
                    // Mostrar mensaje de éxito
                    $messageDiv.addClass('success').text(response.message);
                    // Limpiar formulario
                    $form[0].reset();
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
                }
            },
            error: function (xhr, status, error) {
                let errorMsg = 'Error al enviar el mensaje. Por favor, intenta más tarde.';
                if (xhr.responseJSON && xhr.responseJSON.message) {
                    errorMsg = xhr.responseJSON.message;
                }
                $messageDiv.addClass('error').text(errorMsg);
            },
            complete: function () {
                // Rehabilitar botón
                $submitBtn.prop('disabled', false).text(originalBtnText);
            }
        });
    });

});
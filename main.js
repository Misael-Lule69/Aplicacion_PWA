if ('serviceWorker' in navigator) {
    console.log('Puedes usar los serviceworker del navegador');

    window.addEventListener('load', function () {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => {
                console.log('ServiceWorker registrado correctamente', reg);

                // Escuchar actualizaciones
                reg.addEventListener('updatefound', () => {
                    const newWorker = reg.installing;
                    console.log('Nuevo Service Worker encontrado:', newWorker);

                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            console.log('Nuevo Service Worker instalado');
                        }
                    });
                });
            })
            .catch(err => console.log('ServiceWorker no se ha podido registrar', err));

        // Manejar cambios de controlador
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            console.log('Controller changed - recargando página');
            window.location.reload();
        });
    });
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

    // Manejo del formulario de contacto
    // Helper: mostrar notificaciones usando Alertify.js
    function showAlert(message, typeOrOptions) {
        // typeOrOptions can be a string ('success','danger','warn') or an object { type, duration }
        let type = 'success';
        let duration = 4000;

        if (typeof typeOrOptions === 'string') {
            type = (typeOrOptions === 'danger') ? 'error' : typeOrOptions;
        } else if (typeof typeOrOptions === 'object' && typeOrOptions !== null) {
            type = typeOrOptions.type || type;
            duration = typeOrOptions.duration || duration;
        }

        // configure Alertify notifier position
        if (window.alertify) {
            alertify.set('notifier', 'position', 'bottom-right');
            const seconds = Math.max(1, Math.round(duration / 1000));
            if (type === 'success') {
                alertify.notify(message, 'success', seconds);
            } else if (type === 'error' || type === 'danger') {
                alertify.notify(message, 'error', seconds);
            } else if (type === 'warn' || type === 'warning') {
                alertify.notify(message, 'warning', seconds);
            } else {
                alertify.notify(message, 'message', seconds);
            }
        } else {
            // fallback
            alert(message);
        }
    }

    $('#contact-form').submit(function (e) {
        e.preventDefault();

        const nombre = $('#nombre').val().trim();
        const apellidos = $('#apellidos').val().trim();
        const edad = $('#edad').val().trim();
        const mensaje = $('#mensaje').val().trim();
        const $msg = $('#form-message');

        $msg.removeClass('error success').text('');

        if (!nombre || !apellidos || !edad || !mensaje) {
            showAlert('Por favor completa todos los campos.', 'danger');
            return;
        }

        const edadNum = Number(edad);
        if (!Number.isInteger(edadNum) || edadNum < 1 || edadNum > 120) {
            showAlert('Introduce una edad válida entre 1 y 120.', 'danger');
            return;
        }

        // Envío al servidor vía fetch a save_contact.php
        fetch('save_contact.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre: nombre, apellidos: apellidos, edad: edadNum, mensaje: mensaje })
        })
            .then(res => res.json())
            .then(data => {
                if (data && data.success) {
                    showAlert('¡Mensaje enviado! Gracias por contactarnos.', 'success');
                    $('#contact-form')[0].reset();
                } else {
                    showAlert(data && data.message ? data.message : 'Error al enviar el formulario', 'danger');
                }
            })
            .catch(err => {
                console.error('Error enviando formulario:', err);
                showAlert('Error de red al enviar el formulario', 'danger');
            });
    });

    // Nota: el flujo de suscripción Web Push nativo se ha movido a Firebase (FCM)
    // para evitar solicitudes duplicadas de permiso y tokens.

});
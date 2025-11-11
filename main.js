// SERVICE WORKER
if ('serviceWorker' in navigator) {
    console.log('Puedes usar los serviceworker del navegador');

    navigator.serviceWorker.register('./sw.js')
        .then(res => console.log('serviceWorker cargando correctamente', res))
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

});
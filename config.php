<?php
// Configuración para Web Push (rellena con tus claves VAPID)
// Genera las claves VAPID con la herramienta de Node.js: `web-push generate-vapid-keys`
// o con cualquier método que prefieras, y pega aquí las claves.

// Clave pública VAPID proporcionada por el usuario
define('VAPID_PUBLIC_KEY', 'BM4lWb5Is9MHFKZp9QZ0UMbmjti0_je-xhtRk709SA7zB0NkmjWC0LE72Y0XG_maBxywov7OQXG9dI_OjaIXFxo');
// Si tienes la clave privada, pégala aquí. Dejar vacía hasta que la tengas.
define('VAPID_PRIVATE_KEY', 'DlwZAWTYgQ0EMB4ag42Q76PglTIN1HSYfkatOVZymro');
define('VAPID_SUBJECT', 'mailto:tu-email@ejemplo.com');

// Firebase Cloud Messaging (opcional) - pega aquí tu Server Key si usarás FCM desde servidor
define('FCM_SERVER_KEY', 'BM4lWb5Is9MHFKZp9QZ0UMbmjti0_je-xhtRk709SA7zB0NkmjWC0LE72Y0XG_maBxywov7OQXG9dI_OjaIXFxo');

// Configuración de base de datos (ajusta si no usas root sin contraseña)
define('DB_HOST', '127.0.0.1');
define('DB_NAME', 'aplicacion_pwa');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_CHARSET', 'utf8mb4');

function getPdo() {
    $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ];
    return new PDO($dsn, DB_USER, DB_PASS, $options);
}

?>

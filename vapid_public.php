<?php
// Devuelve la VAPID public key para uso en el cliente
require_once __DIR__ . '/config.php';
header('Content-Type: text/plain; charset=utf-8');
echo VAPID_PUBLIC_KEY;

?>

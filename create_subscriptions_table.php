<?php
// create_subscriptions_table.php
// Ejecuta este script desde el navegador o CLI para crear la tabla `subscriptions`
// en la base de datos configurada en config.php.

require_once __DIR__ . '/config.php';

header('Content-Type: text/plain; charset=utf-8');

try {
    $pdo = getPdo();
} catch (Exception $e) {
    echo "Error conectando a la base de datos: " . $e->getMessage() . PHP_EOL;
    echo "Asegúrate de que la base de datos '" . DB_NAME . "' exista y la configuración en config.php sea correcta." . PHP_EOL;
    exit(1);
}

$sql = <<<SQL
CREATE TABLE IF NOT EXISTS subscriptions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  endpoint TEXT DEFAULT NULL,
  p256dh VARCHAR(255) DEFAULT NULL,
  auth VARCHAR(255) DEFAULT NULL,
  fcm_token VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
SQL;

try {
    $pdo->exec($sql);
    echo "Tabla 'subscriptions' creada o ya existe." . PHP_EOL;
    echo "Estructura: id, endpoint, p256dh, auth, fcm_token, created_at, updated_at" . PHP_EOL;
    exit(0);
} catch (PDOException $e) {
    echo "Error creando la tabla: " . $e->getMessage() . PHP_EOL;
    exit(1);
}

?>

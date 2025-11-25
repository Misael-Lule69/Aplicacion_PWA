<?php
header('Content-Type: application/json; charset=utf-8');

// Configuración de la base de datos - ajusta según tu entorno XAMPP
$DB_HOST = '127.0.0.1';
$DB_NAME = 'aplicacion_pwa';
$DB_USER = 'root';
$DB_PASS = '';
$DB_CHARSET = 'utf8mb4';

$raw = file_get_contents('php://input');
$data = json_decode($raw, true);

if (!$data) {
    echo json_encode(['success' => false, 'message' => 'Datos inválidos o no JSON']);
    exit;
}

$nombre = trim($data['nombre'] ?? '');
$apellidos = trim($data['apellidos'] ?? '');
$edad = isset($data['edad']) ? (int)$data['edad'] : 0;
$mensaje = trim($data['mensaje'] ?? '');

// Validación básica
if (!$nombre || !$apellidos || !$edad || !$mensaje) {
    echo json_encode(['success' => false, 'message' => 'Todos los campos son obligatorios']);
    exit;
}

if ($edad < 1 || $edad > 120) {
    echo json_encode(['success' => false, 'message' => 'Edad fuera de rango']);
    exit;
}

try {
    $dsn = "mysql:host={$DB_HOST};dbname={$DB_NAME};charset={$DB_CHARSET}";
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ];

    $pdo = new PDO($dsn, $DB_USER, $DB_PASS, $options);

    $stmt = $pdo->prepare('INSERT INTO contactos (nombre, apellidos, edad, mensaje, created_at) VALUES (?, ?, ?, ?, NOW())');
    $stmt->execute([$nombre, $apellidos, $edad, $mensaje]);

    echo json_encode(['success' => true, 'message' => 'Guardado correctamente']);
    exit;
} catch (PDOException $e) {
    // En desarrollo está bien devolver el error; en producción no exponer detalles.
    echo json_encode(['success' => false, 'message' => 'Error al guardar: ' . $e->getMessage()]);
    exit;
}

?>

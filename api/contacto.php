<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// Solo permitir método POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Método no permitido'
    ]);
    exit;
}

// Incluir configuración de base de datos
try {
    // Obtener conexión
    $pdo = require __DIR__ . '/../config/connection.php';
    
    // Validar y obtener datos del formulario
    $nombre = trim($_POST['nombre'] ?? '');
    $apellidos = trim($_POST['apellidos'] ?? '');
    $edad = isset($_POST['edad']) ? (int)$_POST['edad'] : 0;
    $mensaje = trim($_POST['mensaje'] ?? '');
    
    // Validaciones
    $errors = [];
    
    if (empty($nombre) || strlen($nombre) > 100) {
        $errors[] = 'El nombre es requerido y debe tener máximo 100 caracteres';
    }
    
    if (empty($apellidos) || strlen($apellidos) > 150) {
        $errors[] = 'Los apellidos son requeridos y deben tener máximo 150 caracteres';
    }
    
    if ($edad < 1 || $edad > 120) {
        $errors[] = 'La edad debe ser un número entre 1 y 120';
    }
    
    if (empty($mensaje)) {
        $errors[] = 'El mensaje es requerido';
    }
    
    // Si hay errores, retornarlos
    if (!empty($errors)) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Errores de validación',
            'errors' => $errors
        ]);
        exit;
    }
    
    // Preparar consulta SQL
    $sql = "INSERT INTO contactos (nombre, apellidos, edad, mensaje) VALUES (:nombre, :apellidos, :edad, :mensaje)";
    $stmt = $pdo->prepare($sql);
    
    // Ejecutar consulta
    $stmt->execute([
        ':nombre' => $nombre,
        ':apellidos' => $apellidos,
        ':edad' => $edad,
        ':mensaje' => $mensaje
    ]);
    
    // Respuesta exitosa
    echo json_encode([
        'success' => true,
        'message' => 'Mensaje enviado correctamente. ¡Gracias por contactarnos!'
    ]);
    
} catch (PDOException $e) {
    error_log("Error al guardar contacto: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error al procesar tu mensaje. Por favor, intenta más tarde.'
    ]);
} catch (Exception $e) {
    error_log("Error general: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error inesperado. Por favor, intenta más tarde.'
    ]);
}
?>


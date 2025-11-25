<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/config.php';

// Guardar únicamente tokens FCM (Firebase Cloud Messaging)
$raw = file_get_contents('php://input');
$data = json_decode($raw, true);

if (!$data || !isset($data['token'])) {
    echo json_encode(['success' => false, 'message' => 'Payload inválido: se espera {"token":"..."}']);
    exit;
}

$token = trim($data['token']);
if (!$token) {
    echo json_encode(['success' => false, 'message' => 'Token vacío']);
    exit;
}

try {
    $pdo = getPdo();

    // Evitar duplicados por token
    $stmt = $pdo->prepare('SELECT id FROM subscriptions WHERE fcm_token = ?');
    $stmt->execute([$token]);
    $exists = $stmt->fetch();

    if ($exists) {
        $up = $pdo->prepare('UPDATE subscriptions SET updated_at = NOW() WHERE id = ?');
        $up->execute([$exists['id']]);
    } else {
        $ins = $pdo->prepare('INSERT INTO subscriptions (fcm_token, created_at) VALUES (?, NOW())');
        $ins->execute([$token]);
    }

    echo json_encode(['success' => true, 'message' => 'Token FCM guardado']);
    exit;
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Error BD: ' . $e->getMessage()]);
    exit;
}

?>

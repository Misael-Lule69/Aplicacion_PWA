<?php
// send_fcm.php
// Ejemplo simple para enviar notificaciones mediante FCM (legacy HTTP).
// Requiere que config.php tenga definido FCM_SERVER_KEY.

require_once __DIR__ . '/config.php';

header('Content-Type: application/json; charset=utf-8');

if (FCM_SERVER_KEY === 'YOUR_FCM_SERVER_KEY_HERE' || empty(FCM_SERVER_KEY)) {
    echo json_encode(['success' => false, 'message' => 'FCM_SERVER_KEY no configurada en config.php']);
    exit;
}

try {
    $pdo = getPdo();
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'No se pudo conectar a la BD: ' . $e->getMessage()]);
    exit;
}

$stmt = $pdo->query("SELECT DISTINCT fcm_token FROM subscriptions WHERE fcm_token IS NOT NULL AND fcm_token != ''");
$tokens = $stmt->fetchAll(PDO::FETCH_COLUMN);

if (empty($tokens)) {
    echo json_encode(['success' => false, 'message' => 'No hay tokens FCM en la BD']);
    exit;
}

$payload = [
    'notification' => [
        'title' => 'Notificación de prueba FCM',
        'body' => 'Este es un mensaje enviado desde send_fcm.php',
        'click_action' => '/',
    ]
];

$serverKey = FCM_SERVER_KEY;
$headers = [
    'Authorization: key=' . $serverKey,
    'Content-Type: application/json'
];

$results = [];
foreach ($tokens as $token) {
    $body = $payload;
    $body['to'] = $token;
    $ch = curl_init('https://fcm.googleapis.com/fcm/send');
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));
    $res = curl_exec($ch);
    $err = curl_error($ch);
    curl_close($ch);

    if ($res === false) {
        $results[] = ['token' => $token, 'success' => false, 'error' => $err];
    } else {
        $results[] = ['token' => $token, 'success' => true, 'response' => json_decode($res, true)];
    }
}

echo json_encode(['success' => true, 'count' => count($results), 'results' => $results]);

?>

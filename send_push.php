<?php
// send_push.php
// Ejemplo de script para enviar notificaciones Web Push a todas las suscripciones
// Requiere la librería minishlink/web-push instalada vía Composer:
//   composer require minishlink/web-push
// Coloca tus claves VAPID en `config.php` antes de usar.

require_once __DIR__ . '/config.php';

header('Content-Type: application/json; charset=utf-8');

// Comprobar que las dependencias estén instaladas
if (!file_exists(__DIR__ . '/vendor/autoload.php')) {
    echo json_encode(['success' => false, 'message' => 'Dependencias no instaladas. Ejecuta: composer require minishlink/web-push']);
    exit;
}

require_once __DIR__ . '/vendor/autoload.php';

// Nota: no usamos 'use' aquí para evitar errores de análisis estático si
// la dependencia aún no está instalada en el entorno del editor.

try {
    $pdo = getPdo();
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'No se pudo conectar a la BD: ' . $e->getMessage()]);
    exit;
}

$stmt = $pdo->query("SELECT endpoint, p256dh, auth FROM subscriptions");
$subs = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Payload: aceptar JSON por POST o usar payload por defecto
$payload = json_encode([
    'title' => 'Notificación de prueba',
    'body' => 'Mensaje enviado desde el servidor',
    'url' => '/' 
]);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $raw = file_get_contents('php://input');
    $d = json_decode($raw, true);
    if ($d) {
        $payload = json_encode($d);
    }
}

$auth = [
    'VAPID' => [
        'subject' => defined('VAPID_SUBJECT') ? VAPID_SUBJECT : 'mailto:admin@example.com',
        'publicKey' => defined('VAPID_PUBLIC_KEY') ? VAPID_PUBLIC_KEY : '',
        'privateKey' => defined('VAPID_PRIVATE_KEY') ? VAPID_PRIVATE_KEY : '',
    ],
];

$webPushClass = '\\Minishlink\\WebPush\\WebPush';
if (!class_exists($webPushClass)) {
    echo json_encode(['success' => false, 'message' => 'La clase WebPush no está disponible. Ejecuta: composer require minishlink/web-push']);
    exit;
}

$webPush = new $webPushClass($auth);

$results = [];
foreach ($subs as $s) {
    if (empty($s['endpoint']) || empty($s['p256dh']) || empty($s['auth'])) continue;

    $subClass = '\\Minishlink\\WebPush\\Subscription';
    $subscription = $subClass::create([
        'endpoint' => $s['endpoint'],
        'publicKey' => $s['p256dh'],
        'authToken' => $s['auth'],
    ]);

    try {
        $report = $webPush->sendOneNotification($subscription, $payload);
        $results[] = [
            'endpoint' => $s['endpoint'],
            'status' => $report->getStatusCode(),
            'success' => $report->isSuccess(),
            'reason' => $report->getReason(),
        ];
    } catch (Exception $ex) {
        $results[] = [
            'endpoint' => $s['endpoint'],
            'status' => null,
            'success' => false,
            'reason' => $ex->getMessage(),
        ];
    }
}

echo json_encode(['success' => true, 'count' => count($results), 'results' => $results]);

?>
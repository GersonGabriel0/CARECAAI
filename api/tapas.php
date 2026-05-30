<?php

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

$configFile = __DIR__ . '/config/database.php';

if (!file_exists($configFile)) {
    http_response_code(500);
    echo json_encode(['error' => 'Configure api/config/database.php.']);
    exit;
}

$config = require $configFile;
$dsn = sprintf(
    'mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4',
    $config['host'],
    $config['port'],
    $config['database']
);

try {
    $pdo = new PDO($dsn, $config['username'], $config['password'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Nao foi possivel conectar ao banco.']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $query = $pdo->query(
        'SELECT f.id, u.usuario, u.tipo, f.score, COUNT(t.foto_id) AS tapas
         FROM fotos f
         JOIN usuarios u ON u.id = f.usuario_id
         LEFT JOIN tapas t ON t.foto_id = f.id
         GROUP BY f.id, u.usuario, u.tipo, f.score
         ORDER BY tapas DESC'
    );
    echo json_encode($query->fetchAll());
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $payload = json_decode(file_get_contents('php://input'), true);
    $fotoId  = filter_var($payload['foto_id'] ?? null, FILTER_VALIDATE_INT);

    if ($fotoId === false || $fotoId < 1) {
        http_response_code(422);
        echo json_encode(['error' => 'foto_id invalido.']);
        exit;
    }

    $ip = $_SERVER['REMOTE_ADDR'];

    $stmt = $pdo->prepare(
        'INSERT IGNORE INTO tapas (foto_id, ip) VALUES (:foto_id, :ip)'
    );
    $stmt->execute(['foto_id' => $fotoId, 'ip' => $ip]);

    http_response_code(201);
    echo json_encode(['message' => 'Tapa registrado.']);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Metodo nao permitido.']);

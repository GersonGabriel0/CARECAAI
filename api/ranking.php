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
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $query = $pdo->query(
        'SELECT u.usuario, u.tipo, r.name, r.score
         FROM rankings r
         JOIN usuarios u ON u.id = r.usuario_id
         ORDER BY r.score DESC
         LIMIT 20'
    );
    echo json_encode($query->fetchAll());
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $payload    = json_decode(file_get_contents('php://input'), true);
    $usuarioId  = filter_var($payload['usuario_id'] ?? null, FILTER_VALIDATE_INT);
    $name       = trim((string) ($payload['name'] ?? ''));
    $score      = filter_var($payload['score'] ?? null, FILTER_VALIDATE_INT);

    if (!$usuarioId || $name === '' || mb_strlen($name) > 80 || $score === false || $score < 0 || $score > 100) {
        http_response_code(422);
        echo json_encode(['error' => 'Informe usuario_id, nome e pontuacao entre 0 e 100.']);
        exit;
    }

    $stmt = $pdo->prepare(
        'INSERT INTO rankings (usuario_id, name, score) VALUES (:usuario_id, :name, :score)'
    );
    $stmt->execute(['usuario_id' => $usuarioId, 'name' => $name, 'score' => $score]);

    http_response_code(201);
    echo json_encode(['message' => 'Resultado cadastrado com sucesso.']);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Metodo nao permitido.']);

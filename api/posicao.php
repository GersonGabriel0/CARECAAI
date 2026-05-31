<?php

declare(strict_types=1);

session_start();
header('Content-Type: application/json; charset=utf-8');

$usuarioId = $_SESSION['carecai_usuario_id'] ?? null;
session_write_close();

if (!$usuarioId) {
    http_response_code(401);
    echo json_encode(['error' => 'Nao autenticado.']);
    exit;
}

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
    echo json_encode(['error' => 'Nao foi possivel conectar ao banco.']);
    exit;
}

$usuario = $pdo->prepare('SELECT tipo, score FROM usuarios WHERE id = :id');
$usuario->execute(['id' => $usuarioId]);
$me = $usuario->fetch();

if (!$me) {
    echo json_encode(['posicao' => 1, 'total' => 1]);
    exit;
}

// Quantos do mesmo tipo tem score MAIOR que eu (= quantos estao na minha frente)
$stmt = $pdo->prepare(
    'SELECT COUNT(*) FROM usuarios WHERE tipo = :tipo AND score > :score'
);
$stmt->execute(['tipo' => $me['tipo'], 'score' => $me['score']]);
$posicao = (int) $stmt->fetchColumn() + 1;

// Total do mesmo tipo
$stmt2 = $pdo->prepare('SELECT COUNT(*) FROM usuarios WHERE tipo = :tipo');
$stmt2->execute(['tipo' => $me['tipo']]);
$total = (int) $stmt2->fetchColumn();

echo json_encode([
    'posicao' => $posicao,
    'total'   => $total,
    'tipo'    => $me['tipo'],
]);

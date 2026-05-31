<?php

declare(strict_types=1);

error_reporting(0);
ini_set('display_errors', '0');

session_start();
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
    echo json_encode(['error' => 'Nao foi possivel conectar ao banco.']);
    exit;
}

$meuId = $_SESSION['carecai_usuario_id'] ?? null;
session_write_close();

try {
    // Descobre o tipo do usuario logado
    $meuTipo = null;
    if ($meuId) {
        $s = $pdo->prepare('SELECT tipo FROM usuarios WHERE id = :id');
        $s->execute(['id' => (int) $meuId]);
        $meuTipo = $s->fetchColumn() ?: null;
    }

    // Lista oponentes do mesmo tipo, excluindo o proprio
    $sql = '
        SELECT u.id, u.usuario, u.tipo, u.score,
               COALESCE(f.arquivo, \'\') AS foto
        FROM usuarios u
        LEFT JOIN fotos f ON f.id = (
            SELECT f2.id FROM fotos f2
            WHERE f2.usuario_id = u.id
            ORDER BY f2.created_at DESC, f2.id DESC
            LIMIT 1
        )
        WHERE u.id != :meu_id
          AND u.tipo = :tipo
        ORDER BY u.score DESC
    ';

    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        'meu_id' => $meuId ? (int) $meuId : 0,
        'tipo'   => $meuTipo ?? 'careca',
    ]);

    echo json_encode(array_values($stmt->fetchAll()));
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}

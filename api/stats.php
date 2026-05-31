<?php

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

$configFile = __DIR__ . '/config/database.php';

if (!file_exists($configFile)) {
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
    echo json_encode(['error' => 'Nao foi possivel conectar ao banco.']);
    exit;
}

$row = $pdo->query(
    'SELECT
        COUNT(*)                                        AS analises,
        SUM(tipo = "careca")                            AS carecas,
        SUM(tipo = "calvo")                             AS calvos,
        (SELECT COUNT(*) FROM interacoes)               AS tapas
     FROM usuarios'
)->fetch();

echo json_encode([
    'analises' => (int) $row['analises'],
    'carecas'  => (int) $row['carecas'],
    'calvos'   => (int) $row['calvos'],
    'tapas'    => (int) $row['tapas'],
]);

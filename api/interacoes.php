<?php

declare(strict_types=1);

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

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $fotos = $pdo->query(
        'SELECT f.id, u.usuario, u.tipo, f.arquivo AS foto, f.score, COUNT(i.foto_id) AS tapas
         FROM usuarios u
         JOIN fotos f ON f.id = (
             SELECT f2.id FROM fotos f2
             WHERE f2.usuario_id = u.id
             ORDER BY f2.created_at DESC, f2.id DESC
             LIMIT 1
         )
         LEFT JOIN interacoes i ON i.foto_id = f.id
         GROUP BY f.id, u.usuario, u.tipo, f.arquivo, f.score
         ORDER BY tapas DESC, f.score DESC'
    )->fetchAll();

    $jaTapou   = [];
    $usuarioId = $_SESSION['carecai_usuario_id'] ?? null;
    session_write_close();

    if ($usuarioId) {
        $stmt = $pdo->prepare('SELECT foto_id FROM interacoes WHERE usuario_id = :uid');
        $stmt->execute(['uid' => $usuarioId]);
        $jaTapou = array_map('intval', array_column($stmt->fetchAll(), 'foto_id'));
    }

    foreach ($fotos as &$foto) {
        $foto['ja_tapou'] = in_array((int) $foto['id'], $jaTapou, true);
    }

    echo json_encode(array_values($fotos));
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $usuarioId = $_SESSION['carecai_usuario_id'] ?? null;

    if (!$usuarioId) {
        http_response_code(401);
        echo json_encode(['error' => 'Faca login para interagir.']);
        exit;
    }

    $payload = json_decode(file_get_contents('php://input'), true);
    $fotoId  = filter_var($payload['foto_id'] ?? null, FILTER_VALIDATE_INT);

    if ($fotoId === false || $fotoId < 1) {
        http_response_code(422);
        echo json_encode(['error' => 'foto_id invalido.']);
        exit;
    }

    $check = $pdo->prepare(
        'SELECT 1 FROM interacoes WHERE foto_id = :foto_id AND usuario_id = :usuario_id'
    );
    $check->execute(['foto_id' => $fotoId, 'usuario_id' => $usuarioId]);

    if ($check->fetchColumn()) {
        $pdo->prepare(
            'DELETE FROM interacoes WHERE foto_id = :foto_id AND usuario_id = :usuario_id'
        )->execute(['foto_id' => $fotoId, 'usuario_id' => $usuarioId]);
        echo json_encode(['acao' => 'removida']);
    } else {
        $pdo->prepare(
            'INSERT INTO interacoes (foto_id, usuario_id) VALUES (:foto_id, :usuario_id)'
        )->execute(['foto_id' => $fotoId, 'usuario_id' => $usuarioId]);
        http_response_code(201);
        echo json_encode(['acao' => 'adicionada']);
    }
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Metodo nao permitido.']);

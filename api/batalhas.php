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
    $config['host'], $config['port'], $config['database']
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

// Garante que a tabela existe (para ambientes recém-configurados)
try {
    $pdo->exec('
        CREATE TABLE IF NOT EXISTS batalhas (
            id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            desafiante_id  INT UNSIGNED NOT NULL,
            oponente_id    INT UNSIGNED NOT NULL,
            vencedor_id    INT UNSIGNED NOT NULL,
            vit_desafiante TINYINT UNSIGNED NOT NULL DEFAULT 0,
            vit_oponente   TINYINT UNSIGNED NOT NULL DEFAULT 0,
            created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (desafiante_id) REFERENCES usuarios(id) ON DELETE CASCADE,
            FOREIGN KEY (oponente_id)   REFERENCES usuarios(id) ON DELETE CASCADE,
            FOREIGN KEY (vencedor_id)   REFERENCES usuarios(id) ON DELETE CASCADE
        )
    ');
} catch (PDOException $e) {
    // Tabela nao criada, mas nao bloqueia o restante da API
}

// Libera o lock da sessao imediatamente para nao bloquear requests concorrentes
$meuIdGlobal = $_SESSION['carecai_usuario_id'] ?? null;
session_write_close();

// ── GET: historico publico de batalhas ────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $rows = $pdo->query('
        SELECT
            b.id,
            b.vit_desafiante,
            b.vit_oponente,
            b.created_at,
            d.id       AS desafiante_id,
            d.usuario  AS desafiante,
            d.tipo     AS tipo_desafiante,
            o.id       AS oponente_id,
            o.usuario  AS oponente,
            o.tipo     AS tipo_oponente,
            v.usuario  AS vencedor,
            COALESCE(fd.arquivo, "") AS foto_desafiante,
            COALESCE(fo.arquivo, "") AS foto_oponente
        FROM batalhas b
        JOIN usuarios d ON d.id = b.desafiante_id
        JOIN usuarios o ON o.id = b.oponente_id
        JOIN usuarios v ON v.id = b.vencedor_id
        LEFT JOIN fotos fd ON fd.id = (
            SELECT f.id FROM fotos f
            WHERE f.usuario_id = b.desafiante_id
            ORDER BY f.created_at DESC LIMIT 1
        )
        LEFT JOIN fotos fo ON fo.id = (
            SELECT f.id FROM fotos f
            WHERE f.usuario_id = b.oponente_id
            ORDER BY f.created_at DESC LIMIT 1
        )
        ORDER BY b.created_at DESC
        LIMIT 60
    ')->fetchAll();

    echo json_encode(array_values($rows));
    exit;
}

// ── POST: registrar batalha ────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $meuId = $meuIdGlobal;

    if (!$meuId) {
        http_response_code(401);
        echo json_encode(['error' => 'Nao autenticado.']);
        exit;
    }

    $payload      = json_decode(file_get_contents('php://input'), true);
    $oponenteId   = filter_var($payload['oponente_id']    ?? null, FILTER_VALIDATE_INT);
    $vitDes       = max(0, (int) ($payload['vit_desafiante'] ?? 0));
    $vitOp        = max(0, (int) ($payload['vit_oponente']   ?? 0));
    $euVenci      = (bool) ($payload['eu_venci'] ?? false);

    if (!$oponenteId || $oponenteId === $meuId) {
        http_response_code(422);
        echo json_encode(['error' => 'Dados de batalha invalidos.']);
        exit;
    }

    $vencedorId = $euVenci ? (int) $meuId : $oponenteId;

    $stmt = $pdo->prepare('
        INSERT INTO batalhas (desafiante_id, oponente_id, vencedor_id, vit_desafiante, vit_oponente)
        VALUES (:des, :op, :venc, :vd, :vo)
    ');
    $stmt->execute([
        'des'  => (int) $meuId,
        'op'   => $oponenteId,
        'venc' => $vencedorId,
        'vd'   => $vitDes,
        'vo'   => $vitOp,
    ]);

    echo json_encode(['id' => (int) $pdo->lastInsertId()]);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Metodo nao permitido.']);

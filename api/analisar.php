<?php

declare(strict_types=1);

session_start();
header('Content-Type: application/json; charset=utf-8');

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

function respond(array $payload, int $status = 200): never
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

function loadGeminiConfig(): array
{
    $configFile = __DIR__ . '/config/gemini.php';

    if (!file_exists($configFile)) {
        respond(['error' => 'Configure api/config/gemini.php antes de analisar fotos.'], 500);
    }

    $config = require $configFile;

    if (empty($config['api_key']) || $config['api_key'] === 'COLE_SUA_CHAVE_GEMINI_AQUI') {
        respond(['error' => 'Informe uma chave valida da API Gemini.'], 500);
    }

    return $config;
}

function loadXaiConfig(): array
{
    $configFile = __DIR__ . '/config/xai.php';

    if (!file_exists($configFile)) {
        respond(['error' => 'Configure api/config/xai.php antes de usar o Grok.'], 500);
    }

    $config = require $configFile;

    if (empty($config['api_key']) || $config['api_key'] === 'COLE_SUA_CHAVE_XAI_AQUI') {
        respond(['error' => 'Informe uma chave valida da API xAI.'], 500);
    }

    return $config;
}

function connectDatabase(): PDO
{
    $configFile = __DIR__ . '/config/database.php';

    if (!file_exists($configFile)) {
        respond(['error' => 'Configure api/config/database.php antes de entrar.'], 500);
    }

    $config = require $configFile;

    if (!in_array('mysql', PDO::getAvailableDrivers(), true)) {
        respond(['error' => 'Habilite a extensao pdo_mysql do PHP.'], 500);
    }

    $dsn = sprintf(
        'mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4',
        $config['host'],
        $config['port'],
        $config['database']
    );

    try {
        return new PDO($dsn, $config['username'], $config['password'], [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);
    } catch (PDOException $exception) {
        respond(['error' => 'Nao foi possivel conectar ao banco de dados.'], 500);
    }
}

function validateImage(): array
{
    if (!isset($_FILES['photo']) || $_FILES['photo']['error'] !== UPLOAD_ERR_OK) {
        respond(['error' => 'Envie uma imagem valida para analise.'], 422);
    }

    $photo = $_FILES['photo'];

    if ($photo['size'] > MAX_IMAGE_SIZE) {
        respond(['error' => 'A imagem deve ter no maximo 5 MB.'], 422);
    }

    $imageInfo = getimagesize($photo['tmp_name']);
    $mimeType = $imageInfo['mime'] ?? '';

    if (!in_array($mimeType, ALLOWED_IMAGE_TYPES, true)) {
        respond(['error' => 'Use uma imagem JPG, PNG ou WEBP.'], 422);
    }

    return [$photo, $mimeType];
}

function analyzeWithGemini(array $photo, string $mimeType, array $config): array
{
    $schema = [
        'type' => 'object',
        'properties' => [
            'classification' => [
                'type' => 'string',
                'enum' => ['careca', 'calvo', 'cabelo'],
                'description' => 'careca sem cabelo, calvo com perda visivel, cabelo com cobertura abundante',
            ],
            'score' => [
                'type' => 'integer',
                'minimum' => 0,
                'maximum' => 100,
                'description' => 'pontuacao humoristica de potencial careca',
            ],
            'hair_level' => [
                'type' => 'integer',
                'minimum' => 0,
                'maximum' => 100,
                'description' => 'quantidade visual aproximada de cabelo',
            ],
            'baldness_level' => [
                'type' => 'integer',
                'minimum' => 0,
                'maximum' => 100,
                'description' => 'percentual visual aproximado de calvicie ou rarefacao capilar',
            ],
            'message' => [
                'type' => 'string',
                'description' => 'diagnostico curto, leve e humoristico em portugues brasileiro',
            ],
        ],
        'required' => ['classification', 'score', 'hair_level', 'baldness_level', 'message'],
    ];

    $payload = [
        'contents' => [[
            'parts' => [
                [
                    'text' => 'Analise somente a quantidade visual de cabelo da pessoa na foto. Classifique como careca, calvo ou cabelo. Considere calvo quando houver pelo menos 10% de calvicie, rarefacao ou recuo visivel da linha capilar. Gere uma pontuacao humoristica de potencial careca. Nao identifique a pessoa, nao infira dados pessoais e escreva uma mensagem leve sem ofender.',
                ],
                [
                    'inline_data' => [
                        'mime_type' => $mimeType,
                        'data' => base64_encode((string) file_get_contents($photo['tmp_name'])),
                    ],
                ],
            ],
        ]],
        'generationConfig' => [
            'responseMimeType' => 'application/json',
            'responseJsonSchema' => $schema,
        ],
    ];

    $model = normalizeModelName($config['model'] ?? 'gemini-2.5-flash');
    $url = sprintf(
        'https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent',
        rawurlencode($model)
    );

    [$rawResponse, $status, $requestError] = postJson($url, $payload, $config['api_key']);

    if ($rawResponse === false || $status >= 400) {
        $apiError = extractApiError($rawResponse);

        if ($status === 429 || str_contains(strtolower($apiError), 'quota')) {
            $retryAfter = extractRetrySeconds($apiError);
            respond([
                'error' => $retryAfter > 0
                    ? "Limite gratuito do Gemini atingido. Tente novamente em {$retryAfter} segundos."
                    : 'Limite gratuito do Gemini atingido. Aguarde um pouco e tente novamente.',
                'retry_after' => $retryAfter,
            ], 429);
        }

        respond([
            'error' => $requestError
                ?: $apiError
                ?: 'O Gemini nao conseguiu analisar a foto agora.',
            'detail' => $requestError
                ?: $apiError
                ?: 'Resposta HTTP ' . $status,
        ], 502);
    }

    $response = json_decode((string) $rawResponse, true);
    $text = $response['candidates'][0]['content']['parts'][0]['text'] ?? null;
    $analysis = is_string($text) ? json_decode($text, true) : null;

    if (!is_array($analysis)) {
        respond(['error' => 'O Gemini retornou uma resposta inesperada.'], 502);
    }

    return $analysis;
}

function loadClaudeConfig(): array
{
    $configFile = __DIR__ . '/config/claude.php';

    if (!file_exists($configFile)) {
        respond(['error' => 'Configure api/config/claude.php antes de usar o Claude.'], 500);
    }

    $config = require $configFile;

    if (empty($config['api_key']) || $config['api_key'] === 'COLE_SUA_CHAVE_ANTHROPIC_AQUI') {
        respond(['error' => 'Informe uma chave valida da API Anthropic.'], 500);
    }

    return $config;
}

function analyzeWithClaude(array $photo, string $mimeType, array $config): array
{
    if (!function_exists('curl_init')) {
        respond(['error' => 'Habilite a extensao curl no php.ini para usar o Claude.'], 500);
    }

    $imageData = base64_encode((string) file_get_contents($photo['tmp_name']));

    $payload = [
        'model'      => $config['model'] ?? 'claude-opus-4-8',
        'max_tokens' => 300,
        'messages'   => [[
            'role'    => 'user',
            'content' => [
                [
                    'type'   => 'image',
                    'source' => [
                        'type'       => 'base64',
                        'media_type' => $mimeType,
                        'data'       => $imageData,
                    ],
                ],
                [
                    'type' => 'text',
                    'text' => 'Analise somente a quantidade visual de cabelo da pessoa na foto. Retorne APENAS um JSON valido sem markdown com este formato exato: {"classification":"careca","score":95,"hair_level":5,"baldness_level":95,"message":"mensagem curta humoristica em portugues"}. classification deve ser "careca" (sem cabelo), "calvo" (perda visivel >= 10%) ou "cabelo" (cobertura abundante). score e hair_level e baldness_level sao inteiros de 0 a 100. message deve ser leve e humoristica em portugues brasileiro. Nao identifique a pessoa.',
                ],
            ],
        ]],
    ];

    $curl = curl_init('https://api.anthropic.com/v1/messages');
    curl_setopt_array($curl, [
        CURLOPT_POST           => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 35,
        CURLOPT_HTTPHEADER     => [
            'Content-Type: application/json',
            'x-api-key: ' . $config['api_key'],
            'anthropic-version: 2023-06-01',
        ],
        CURLOPT_POSTFIELDS => json_encode($payload),
    ]);
    $rawResponse = curl_exec($curl);
    $status      = curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
    $curlError   = curl_error($curl);
    curl_close($curl);

    if ($rawResponse === false || $status >= 400) {
        $decoded  = is_string($rawResponse) ? json_decode($rawResponse, true) : [];
        $apiError = $decoded['error']['message'] ?? '';
        respond([
            'error' => $curlError ?: $apiError ?: 'O Claude nao conseguiu analisar a foto agora.',
        ], $status === 429 ? 429 : 502);
    }

    $response = json_decode((string) $rawResponse, true);
    $text     = $response['content'][0]['text'] ?? null;

    if (!is_string($text)) {
        respond(['error' => 'O Claude retornou uma resposta inesperada.'], 502);
    }

    // Extrai JSON da resposta (Claude pode incluir texto extra)
    $analysis = json_decode($text, true);
    if (!is_array($analysis) && preg_match('/\{[^{}]+\}/s', $text, $matches)) {
        $analysis = json_decode($matches[0], true);
    }

    if (!is_array($analysis)) {
        respond(['error' => 'O Claude nao retornou JSON valido.'], 502);
    }

    return $analysis;
}

function analyzeWithXai(array $photo, string $mimeType, array $config): array
{
    $schema = [
        'type' => 'object',
        'properties' => [
            'classification' => [
                'type' => 'string',
                'enum' => ['careca', 'calvo', 'cabelo'],
            ],
            'score' => ['type' => 'integer'],
            'hair_level' => ['type' => 'integer'],
            'baldness_level' => ['type' => 'integer'],
            'message' => ['type' => 'string'],
        ],
        'required' => ['classification', 'score', 'hair_level', 'baldness_level', 'message'],
        'additionalProperties' => false,
    ];
    $imageDataUri = sprintf(
        'data:%s;base64,%s',
        $mimeType,
        base64_encode((string) file_get_contents($photo['tmp_name']))
    );
    $payload = [
        'model' => $config['analysis_model'] ?? 'grok-4-1-fast-non-reasoning',
        'messages' => [[
            'role' => 'user',
            'content' => [
                [
                    'type' => 'image_url',
                    'image_url' => [
                        'url' => $imageDataUri,
                        'detail' => 'high',
                    ],
                ],
                [
                    'type' => 'text',
                    'text' => 'Analise somente a quantidade visual de cabelo. Classifique como careca, calvo ou cabelo. Considere calvo quando houver pelo menos 10% de calvicie, rarefacao ou recuo da linha capilar. Retorne uma pontuacao humoristica de potencial careca entre 0 e 100 e uma mensagem curta em portugues brasileiro. Nao identifique a pessoa e nao infira dados pessoais.',
                ],
            ],
        ]],
        'response_format' => [
            'type' => 'json_schema',
            'json_schema' => [
                'name' => 'carecai_analysis',
                'strict' => true,
                'schema' => $schema,
            ],
        ],
    ];

    [$rawResponse, $status, $requestError] = postXaiJson(
        'https://api.x.ai/v1/chat/completions',
        $payload,
        $config['api_key']
    );

    if ($rawResponse === false || $status >= 400) {
        $apiError = extractApiError($rawResponse);
        respond([
            'error' => $requestError ?: $apiError ?: 'O Grok nao conseguiu analisar a foto agora.',
            'detail' => $requestError ?: $apiError ?: 'Resposta HTTP ' . $status,
        ], $status === 429 ? 429 : 502);
    }

    $response = json_decode((string) $rawResponse, true);
    $content = $response['choices'][0]['message']['content'] ?? null;
    $analysis = is_string($content) ? json_decode($content, true) : null;

    if (!is_array($analysis)) {
        respond(['error' => 'O Grok retornou uma resposta inesperada.'], 502);
    }

    return $analysis;
}

function extractApiError(string|false $rawResponse): string
{
    if (!is_string($rawResponse) || $rawResponse === '') {
        return '';
    }

    $response = json_decode($rawResponse, true);
    return trim((string) ($response['error']['message'] ?? ''));
}

function extractRetrySeconds(string $message): int
{
    if (preg_match('/retry in ([0-9.]+)s/i', $message, $matches) !== 1) {
        return 0;
    }

    return (int) ceil((float) $matches[1]);
}

function normalizeModelName(string $model): string
{
    $model = strtolower(trim($model));
    $model = preg_replace('/^models\//', '', $model);
    return (string) preg_replace('/[^a-z0-9._-]+/', '-', $model);
}

function postJson(string $url, array $payload, string $apiKey): array
{
    $body = (string) json_encode($payload);

    if (function_exists('curl_init')) {
        $curl = curl_init($url);
        curl_setopt_array($curl, [
            CURLOPT_POST => true,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 35,
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json',
                'x-goog-api-key: ' . $apiKey,
            ],
            CURLOPT_POSTFIELDS => $body,
        ]);
        $response = curl_exec($curl);
        $status = curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
        $error = curl_error($curl);
        curl_close($curl);
        return [$response, $status, $error];
    }

    if (!in_array('https', stream_get_wrappers(), true)) {
        return [
            false,
            0,
            'O PHP local nao possui suporte a HTTPS. Habilite as extensoes openssl ou curl no php.ini.',
        ];
    }

    $context = stream_context_create([
        'http' => [
            'method' => 'POST',
            'header' => "Content-Type: application/json\r\nx-goog-api-key: {$apiKey}\r\n",
            'content' => $body,
            'timeout' => 35,
            'ignore_errors' => true,
        ],
    ]);
    $response = @file_get_contents($url, false, $context);
    $headers = $http_response_header ?? [];
    preg_match('/\s(\d{3})\s/', $headers[0] ?? '', $matches);
    return [$response, (int) ($matches[1] ?? 0), $response === false ? 'Falha na requisicao HTTPS.' : ''];
}

function postXaiJson(string $url, array $payload, string $apiKey): array
{
    if (!function_exists('curl_init')) {
        return [false, 0, 'Habilite a extensao curl no php.ini para usar a xAI.'];
    }

    $curl = curl_init($url);
    curl_setopt_array($curl, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 60,
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $apiKey,
        ],
        CURLOPT_POSTFIELDS => json_encode($payload),
    ]);
    $response = curl_exec($curl);
    $status = curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
    $error = curl_error($curl);
    curl_close($curl);
    return [$response, $status, $error];
}

function saveProfilePhoto(array $photo, string $mimeType, string $username): string
{
    $dir = __DIR__ . '/../assets/images/perfil/';
    if (!is_dir($dir)) {
        mkdir($dir, 0755, true);
    }

    $ext = match($mimeType) {
        'image/png'  => 'png',
        'image/webp' => 'webp',
        default      => 'jpg',
    };

    $safe     = preg_replace('/[^a-z0-9_-]/', '', strtolower($username));
    $filename = $safe . '.' . $ext;

    move_uploaded_file($photo['tmp_name'], $dir . $filename);

    return 'assets/images/perfil/' . $filename;
}

function saveLogin(array $analysis, string $username, string $fotoPath): int
{
    $pdo   = connectDatabase();
    $type  = $analysis['classification'] === 'careca' ? 'careca' : 'calvo';
    $score = max(0, min(100, (int) $analysis['score']));

    $pdo->prepare(
        'INSERT INTO usuarios (usuario, tipo, score)
         VALUES (:usuario, :tipo, :score)
         ON DUPLICATE KEY UPDATE tipo = VALUES(tipo), score = VALUES(score)'
    )->execute(['usuario' => $username, 'tipo' => $type, 'score' => $score]);

    $idStmt = $pdo->prepare('SELECT id FROM usuarios WHERE usuario = :usuario');
    $idStmt->execute(['usuario' => $username]);
    $userId = (int) $idStmt->fetchColumn();

    $pdo->prepare(
        'INSERT INTO fotos (usuario_id, arquivo, score) VALUES (:usuario_id, :arquivo, :score)'
    )->execute(['usuario_id' => $userId, 'arquivo' => $fotoPath, 'score' => $score]);

    $_SESSION['carecai_usuario_id'] = $userId;
    $_SESSION['carecai_usuario']    = $username;
    $_SESSION['carecai_tipo']       = $type;
    $_SESSION['carecai_score']      = $score;

    return $userId;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(['error' => 'Metodo nao permitido.'], 405);
}

[$photo, $mimeType] = validateImage();
$provider = $_POST['provider'] ?? 'gemini';
$analysis = match ($provider) {
    'xai'    => analyzeWithXai($photo, $mimeType, loadXaiConfig()),
    'claude' => analyzeWithClaude($photo, $mimeType, loadClaudeConfig()),
    default  => analyzeWithGemini($photo, $mimeType, loadGeminiConfig()),
};
$analysis['baldness_level'] = max(0, min(100, (int) ($analysis['baldness_level'] ?? 0)));

if ($analysis['classification'] !== 'careca' && $analysis['baldness_level'] >= 10) {
    $analysis['classification'] = 'calvo';
}

$username = trim((string) ($_POST['usuario'] ?? ''));

$fotoPath = '';

if ($username !== '') {
    if (strlen($username) < 3 || strlen($username) > 60) {
        respond(['error' => 'O usuario deve ter entre 3 e 60 caracteres.'], 422);
    }

    $fotoPath                 = saveProfilePhoto($photo, $mimeType, $username);
    $analysis['usuario_id']   = saveLogin($analysis, $username, $fotoPath);
}

$analysis['tipo']             = $analysis['classification'] === 'careca' ? 'careca' : 'calvo';
$analysis['needs_bald_filter'] = $analysis['classification'] === 'cabelo'
    || (int) $analysis['hair_level'] >= 65;
$analysis['foto_path']        = $fotoPath;

respond($analysis);

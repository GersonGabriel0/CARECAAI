<?php

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

function respond(array $payload, int $status = 200): never
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
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
            CURLOPT_TIMEOUT => 60,
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
            'timeout' => 60,
            'ignore_errors' => true,
        ],
    ]);
    $response = @file_get_contents($url, false, $context);
    $headers = $http_response_header ?? [];
    preg_match('/\s(\d{3})\s/', $headers[0] ?? '', $matches);
    return [$response, (int) ($matches[1] ?? 0), $response === false ? 'Falha na requisicao HTTPS.' : ''];
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(['error' => 'Metodo nao permitido.'], 405);
}

$configFile = __DIR__ . '/config/gemini.php';

if (!file_exists($configFile)) {
    respond(['error' => 'Configure api/config/gemini.php antes de aplicar o filtro.'], 500);
}

$config = require $configFile;

if (empty($config['api_key']) || $config['api_key'] === 'COLE_SUA_CHAVE_GEMINI_AQUI') {
    respond(['error' => 'Informe uma chave valida da API Gemini.'], 500);
}

$fotoPath = trim($_POST['foto_path'] ?? '');
$uploadedPhoto = $_FILES['photo'] ?? null;

if ($uploadedPhoto && $uploadedPhoto['error'] === UPLOAD_ERR_OK) {
    if ($uploadedPhoto['size'] > 5 * 1024 * 1024) {
        respond(['error' => 'A imagem deve ter no maximo 5 MB.'], 422);
    }

    $realFile = $uploadedPhoto['tmp_name'];
} else {
    if ($fotoPath === '') {
        respond(['error' => 'Envie uma foto ou informe foto_path.'], 422);
    }

    // Impede path traversal quando a foto ja foi salva pelo login.
    $realBase = realpath(__DIR__ . '/../assets/images/perfil');
    $realFile = realpath(__DIR__ . '/../' . $fotoPath);

    if ($realFile === false || $realBase === false || !str_starts_with($realFile, $realBase)) {
        respond(['error' => 'Caminho de imagem invalido.'], 403);
    }

    if (!is_file($realFile)) {
        respond(['error' => 'Imagem de perfil nao encontrada. Faca o login novamente.'], 404);
    }
}

$imageInfo = getimagesize($realFile);
$mimeType  = $imageInfo['mime'] ?? '';

if (!in_array($mimeType, ['image/jpeg', 'image/png', 'image/webp'], true)) {
    respond(['error' => 'Formato de imagem invalido no servidor.'], 422);
}

$imageData = file_get_contents($realFile);

$payload = [
    'contents' => [[
        'parts' => [
            [
                'text' => 'Edite a foto inteira enviada. Mantenha exatamente a mesma pessoa, rosto, expressao, pose, enquadramento, roupa, fundo, iluminacao e proporcao da imagem original. Altere somente o cabelo: remova visualmente o cabelo do topo da cabeca e produza uma aparencia careca ou calva natural. Retorne a foto inteira editada, nunca um recorte e nunca um borrao.',
            ],
            [
                'inline_data' => [
                    'mime_type' => $mimeType,
                    'data'      => base64_encode((string) $imageData),
                ],
            ],
        ],
    ]],
    'generationConfig' => [
        'responseModalities' => ['Image'],
    ],
];

$model = normalizeModelName($config['image_model'] ?? 'gemini-2.5-flash-image');
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
            ?: 'O filtro por IA nao ficou disponivel agora.',
        'detail' => $requestError
            ?: $apiError
            ?: 'Resposta HTTP ' . $status,
    ], 502);
}

$response = json_decode((string) $rawResponse, true);
$parts = $response['candidates'][0]['content']['parts'] ?? [];

foreach ($parts as $part) {
    $image = $part['inlineData'] ?? $part['inline_data'] ?? null;

    if (isset($image['data'])) {
        respond([
            'image' => 'data:' . ($image['mimeType'] ?? $image['mime_type'] ?? 'image/png')
                . ';base64,' . $image['data'],
        ]);
    }
}

respond(['error' => 'O Gemini nao retornou a imagem editada.'], 502);

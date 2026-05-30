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
    return trim((string) ($response['error']['message'] ?? $response['error'] ?? ''));
}

function postJson(string $url, array $payload, string $apiKey): array
{
    if (!function_exists('curl_init')) {
        return [false, 0, 'Habilite a extensao curl no php.ini para usar a xAI.'];
    }

    $curl = curl_init($url);
    curl_setopt_array($curl, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 90,
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

function postGeminiJson(string $url, array $payload, string $apiKey): array
{
    if (!function_exists('curl_init')) {
        return [false, 0, 'Habilite a extensao curl no php.ini para usar o Gemini.'];
    }

    $curl = curl_init($url);
    curl_setopt_array($curl, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 90,
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'x-goog-api-key: ' . $apiKey,
        ],
        CURLOPT_POSTFIELDS => json_encode($payload),
    ]);
    $response = curl_exec($curl);
    $status = curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
    $error = curl_error($curl);
    curl_close($curl);
    return [$response, $status, $error];
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(['error' => 'Metodo nao permitido.'], 405);
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

    $realBase = realpath(__DIR__ . '/../assets/images/perfil');
    $realFile = realpath(__DIR__ . '/../' . $fotoPath);

    if ($realFile === false || $realBase === false || !str_starts_with($realFile, $realBase)) {
        respond(['error' => 'Caminho de imagem invalido.'], 403);
    }
}

if (!is_file($realFile)) {
    respond(['error' => 'Imagem de perfil nao encontrada. Faca o login novamente.'], 404);
}

$imageInfo = getimagesize($realFile);
$mimeType = $imageInfo['mime'] ?? '';

if (!in_array($mimeType, ['image/jpeg', 'image/png', 'image/webp'], true)) {
    respond(['error' => 'Use uma imagem JPG, PNG ou WEBP.'], 422);
}

$imageDataUri = sprintf(
    'data:%s;base64,%s',
    $mimeType,
    base64_encode((string) file_get_contents($realFile))
);
$provider = $_POST['provider'] ?? 'xai';
$prompt = 'Edite a foto inteira enviada. Preserve exatamente a mesma pessoa, rosto, expressao, pose, enquadramento, roupa, fundo, iluminacao e proporcao. Altere somente o cabelo: remova visualmente o cabelo do topo da cabeca e produza uma aparencia careca ou calva natural. Retorne a foto inteira editada, nunca um recorte e nunca um borrao.';

if ($provider === 'gemini') {
    $geminiConfigFile = __DIR__ . '/config/gemini.php';

    if (!file_exists($geminiConfigFile)) {
        respond(['error' => 'Configure api/config/gemini.php antes de aplicar o filtro.'], 500);
    }

    $geminiConfig = require $geminiConfigFile;
    $model = $geminiConfig['image_model'] ?? 'gemini-2.5-flash-image';
    $geminiPayload = [
        'contents' => [[
            'parts' => [
                ['text' => $prompt],
                [
                    'inline_data' => [
                        'mime_type' => $mimeType,
                        'data' => base64_encode((string) file_get_contents($realFile)),
                    ],
                ],
            ],
        ]],
        'generationConfig' => [
            'responseModalities' => ['Image'],
        ],
    ];
    [$rawResponse, $status, $requestError] = postGeminiJson(
        sprintf(
            'https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent',
            rawurlencode($model)
        ),
        $geminiPayload,
        $geminiConfig['api_key']
    );

    if ($rawResponse === false || $status >= 400) {
        $apiError = extractApiError($rawResponse);
        respond([
            'error' => $requestError ?: $apiError ?: 'O Gemini nao conseguiu aplicar o filtro agora.',
        ], $status === 429 ? 429 : 502);
    }

    $geminiResponse = json_decode((string) $rawResponse, true);
    $parts = $geminiResponse['candidates'][0]['content']['parts'] ?? [];

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
}

$configFile = __DIR__ . '/config/xai.php';

if (!file_exists($configFile)) {
    respond(['error' => 'Configure api/config/xai.php antes de aplicar o filtro.'], 500);
}

$config = require $configFile;

if (empty($config['api_key']) || $config['api_key'] === 'COLE_SUA_CHAVE_XAI_AQUI') {
    respond(['error' => 'Informe uma chave valida da API xAI.'], 500);
}

$payload = [
    'model' => $config['image_model'] ?? 'grok-imagine-image-quality',
    'prompt' => $prompt,
    'image' => [
        'type' => 'image_url',
        'url' => $imageDataUri,
    ],
    'response_format' => 'b64_json',
];

[$rawResponse, $status, $requestError] = postJson(
    'https://api.x.ai/v1/images/edits',
    $payload,
    $config['api_key']
);

if ($rawResponse === false || $status >= 400) {
    $apiError = extractApiError($rawResponse);

    respond([
        'error' => $requestError
            ?: $apiError
            ?: 'A xAI nao conseguiu aplicar o modo pista de pouso agora.',
        'detail' => $requestError
            ?: $apiError
            ?: 'Resposta HTTP ' . $status,
    ], $status === 429 ? 429 : 502);
}

$response = json_decode((string) $rawResponse, true);
$result = $response['data'][0] ?? [];

if (!empty($result['b64_json'])) {
    respond(['image' => 'data:image/png;base64,' . $result['b64_json']]);
}

if (!empty($result['url'])) {
    respond(['image' => $result['url']]);
}

respond(['error' => 'A xAI nao retornou a imagem editada.'], 502);

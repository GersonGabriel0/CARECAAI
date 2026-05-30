<?php

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

function respond(array $payload, int $status = 200): never
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
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

if ($fotoPath === '') {
    respond(['error' => 'foto_path e obrigatorio.'], 422);
}

// impede path traversal
$realBase = realpath(__DIR__ . '/../assets/images/perfil');
$realFile = realpath(__DIR__ . '/../' . $fotoPath);

if ($realFile === false || $realBase === false || !str_starts_with($realFile, $realBase)) {
    respond(['error' => 'Caminho de imagem invalido.'], 403);
}

if (!is_file($realFile)) {
    respond(['error' => 'Imagem de perfil nao encontrada. Faca o login novamente.'], 404);
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
                'text' => 'Esta e uma foto de perfil. Aplique um filtro que remove visualmente o cabelo da pessoa, simulando uma careca. Mantenha o rosto e o restante da imagem. Retorne apenas a imagem editada.',
            ],
            [
                'inline_data' => [
                    'mime_type' => $mimeType,
                    'data'      => base64_encode((string) $imageData),
                ],
            ],
        ],
    ]],
];

$model = $config['image_model'] ?? 'gemini-2.5-flash-image';
$url = sprintf(
    'https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent',
    rawurlencode($model)
);
[$rawResponse, $status, $requestError] = postJson($url, $payload, $config['api_key']);

if ($rawResponse === false || $status >= 400) {
    respond([
        'error' => $requestError
            ?: 'O filtro por IA nao ficou disponivel agora.',
        'detail' => $requestError ?: 'Resposta HTTP ' . $status,
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

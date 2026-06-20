<?php
// ── CORS ─────────────────────────────────────────────────────────────────────
function cors(): void {
    $allowed = ['https://bms.valosystems.co.za', 'http://localhost:5173', 'http://localhost:5174'];
    $origin  = $_SERVER['HTTP_ORIGIN'] ?? '';
    if (in_array($origin, $allowed, true)) {
        header("Access-Control-Allow-Origin: $origin");
    }
    header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    header('Content-Type: application/json; charset=utf-8');
    // Security headers
    header('X-Content-Type-Options: nosniff');
    header('X-Frame-Options: DENY');
    header('Referrer-Policy: strict-origin-when-cross-origin');
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
}

// ── REQUEST / RESPONSE ───────────────────────────────────────────────────────
function body(): array {
    $raw = file_get_contents('php://input');
    return json_decode($raw, true) ?? [];
}

function ok(array $data, int $code = 200): void {
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function fail(string $msg, int $code = 400, string $errorCode = ''): void {
    http_response_code($code);
    echo json_encode([
        'error' => $msg,
        'code'  => $errorCode ?: match($code) {
            400 => 'BAD_REQUEST', 401 => 'UNAUTHORIZED', 403 => 'FORBIDDEN',
            404 => 'NOT_FOUND',   409 => 'CONFLICT',     422 => 'UNPROCESSABLE',
            500 => 'SERVER_ERROR', default => 'ERROR'
        },
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// ── INPUT VALIDATION ─────────────────────────────────────────────────────────
function require_fields(array $body, array $fields): void {
    foreach ($fields as $f) {
        if (!isset($body[$f]) || (is_string($body[$f]) && trim($body[$f]) === '')) {
            fail("Field '$f' is required", 422);
        }
    }
}

function sanitize_string(?string $v, int $maxLen = 255): ?string {
    if ($v === null) return null;
    return mb_substr(trim($v), 0, $maxLen);
}

function sanitize_int(mixed $v): ?int {
    if ($v === null || $v === '') return null;
    return filter_var($v, FILTER_VALIDATE_INT) !== false ? (int)$v : null;
}

function sanitize_decimal(mixed $v): ?float {
    if ($v === null || $v === '') return null;
    $f = filter_var($v, FILTER_VALIDATE_FLOAT);
    return $f !== false ? round($f, 4) : null;
}

function sanitize_bool(mixed $v): bool {
    if (is_bool($v)) return $v;
    if (is_string($v)) return in_array(strtolower($v), ['true','1','yes'], true);
    return (bool)$v;
}


// ── JWT ──────────────────────────────────────────────────────────────────────
function jwt_create(array $payload): string {
    $header  = base64url_encode(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
    $payload['iat'] = time();
    $payload['exp'] = time() + 86400 * 7;
    $body    = base64url_encode(json_encode($payload));
    $sig     = base64url_encode(hash_hmac('sha256', "$header.$body", JWT_SECRET, true));
    return "$header.$body.$sig";
}

function jwt_verify(string $token): ?array {
    $parts = explode('.', $token);
    if (count($parts) !== 3) return null;
    [$header, $payload, $sig] = $parts;
    $expected = base64url_encode(hash_hmac('sha256', "$header.$payload", JWT_SECRET, true));
    if (!hash_equals($expected, $sig)) return null;
    $data = json_decode(base64url_decode($payload), true);
    if (!$data || ($data['exp'] ?? 0) < time()) return null;
    return $data;
}

function auth_required(): array {
    $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    $token  = str_replace('Bearer ', '', $header);
    if (!$token) fail('Unauthorized', 401);
    $payload = jwt_verify($token);
    if (!$payload) fail('Unauthorized', 401);
    return $payload;
}

function require_admin(array $payload): void {
    if (($payload['role'] ?? '') !== 'admin') fail('Admin access required', 403, 'FORBIDDEN');
}

// ── PAGINATION ───────────────────────────────────────────────────────────────
function pagination(): array {
    $page    = max(1, (int)($_GET['page'] ?? 1));
    $perPage = min(100, max(10, (int)($_GET['per_page'] ?? 50)));
    $offset  = ($page - 1) * $perPage;
    return ['page' => $page, 'per_page' => $perPage, 'offset' => $offset];
}

function paginated(array $data, int $total, array $pg): array {
    return [
        'data'  => $data,
        'meta'  => [
            'total'    => $total,
            'page'     => $pg['page'],
            'per_page' => $pg['per_page'],
            'pages'    => (int)ceil($total / $pg['per_page']),
        ],
    ];
}

// ── UTILITIES ────────────────────────────────────────────────────────────────
function base64url_encode(string $data): string {
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

function base64url_decode(string $data): string {
    return base64_decode(strtr($data, '-_', '+/'));
}

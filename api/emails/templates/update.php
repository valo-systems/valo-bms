<?php
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/helpers.php';
cors();
auth_required();

if (!in_array($_SERVER['REQUEST_METHOD'], ['PUT', 'PATCH'])) fail('Method not allowed', 405);
$id = (int)($_GET['id'] ?? 0);
if (!$id) fail('ID required');

$b = body();
$pdo = db();

$stmt = $pdo->prepare('SELECT * FROM email_templates WHERE id = ? LIMIT 1');
$stmt->execute([$id]);
$t = $stmt->fetch();
if (!$t) fail('Not found', 404);

$fields = [];
$params = [];

if (array_key_exists('name', $b))      { $fields[] = 'name = ?';      $params[] = sanitize_string($b['name'], 100); }
if (array_key_exists('subject', $b))   { $fields[] = 'subject = ?';   $params[] = sanitize_string($b['subject'], 255); }
if (array_key_exists('body_html', $b)) { $fields[] = 'body_html = ?'; $params[] = $b['body_html']; }
if (array_key_exists('is_active', $b)) { $fields[] = 'is_active = ?'; $params[] = (int)(bool)$b['is_active']; }
if (array_key_exists('variables', $b)) {
    $fields[] = 'variables = ?';
    $params[] = is_array($b['variables']) ? json_encode($b['variables']) : '[]';
}

if (!$fields) fail('Nothing to update', 422);

$params[] = $id;
$pdo->prepare('UPDATE email_templates SET ' . implode(', ', $fields) . ' WHERE id = ?')->execute($params);

$s2 = $pdo->prepare('SELECT * FROM email_templates WHERE id = ?');
$s2->execute([$id]);
ok(['template' => $s2->fetch()]);

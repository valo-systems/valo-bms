<?php
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/helpers.php';
cors();
auth_required();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') fail('Method not allowed', 405);
$b = body();
require_fields($b, ['name', 'slug', 'subject', 'body_html']);

$slug = preg_replace('/[^a-z0-9-]/', '', strtolower(trim($b['slug'])));
if (!$slug) fail('Invalid slug', 422);

$vars = is_array($b['variables'] ?? null) ? json_encode($b['variables']) : '[]';

try {
    $stmt = db()->prepare('
        INSERT INTO email_templates (name, slug, subject, body_html, variables, is_active)
        VALUES (?,?,?,?,?,?)
    ');
    $stmt->execute([
        sanitize_string($b['name'], 100),
        $slug,
        sanitize_string($b['subject'], 255),
        $b['body_html'],
        $vars,
        isset($b['is_active']) ? (int)(bool)$b['is_active'] : 1,
    ]);
    $id = (int)db()->lastInsertId();
    $t = db()->prepare('SELECT * FROM email_templates WHERE id = ?');
    $t->execute([$id]);
    ok(['template' => $t->fetch()], 201);
} catch (PDOException $e) {
    if (str_contains($e->getMessage(), 'Duplicate')) fail('Slug already exists', 409);
    fail('Could not create template', 500);
}

<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/helpers.php';
cors();
auth_required();

if ($_SERVER['REQUEST_METHOD'] !== 'PUT') fail('Method not allowed', 405);
$id = (int)($_GET['id'] ?? 0);
if (!$id) fail('ID required', 400);
$b = body();

$pdo  = db();
$stmt = $pdo->prepare('
    UPDATE documents SET
        name      = COALESCE(?, name),
        category  = COALESCE(?, category),
        ref       = ?,
        client_id = ?,
        file_path = COALESCE(NULLIF(?, ""), file_path),
        status    = COALESCE(?, status),
        notes     = ?,
        date      = COALESCE(NULLIF(?, ""), date)
    WHERE id = ?
');
$stmt->execute([
    $b['name']      ?? null,
    $b['category']  ?? null,
    $b['ref']       ?? null,
    $b['client_id'] ? (int)$b['client_id'] : null,
    $b['file_path'] ?? null,
    $b['status']    ?? null,
    $b['notes']     ?? null,
    $b['date']      ?? null,
    $id,
]);

$stmt2 = $pdo->prepare('SELECT d.*, c.name as client_name FROM documents d LEFT JOIN clients c ON d.client_id = c.id WHERE d.id = ?');
$stmt2->execute([$id]);
ok(['document' => $stmt2->fetch()]);

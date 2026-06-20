<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/helpers.php';
cors();
auth_required();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') fail('Method not allowed', 405);
$b = body();
require_fields($b, ['name']);

$pdo = db();
$stmt = $pdo->prepare('
    INSERT INTO documents (client_id, name, ref, category, file_path, status, notes, date)
    VALUES (?,?,?,?,?,?,?,?)
');
$stmt->execute([
    $b['client_id'] ? (int)$b['client_id'] : null,
    $b['name'],
    $b['ref'] ?? null,
    $b['category'] ?? null,
    $b['file_path'] ?? null,
    $b['status'] ?? 'pending',
    $b['notes'] ?? null,
    $b['date'] ?: null,
]);

$id = (int)$pdo->lastInsertId();
$stmt2 = $pdo->prepare('SELECT d.*, c.name as client_name FROM documents d LEFT JOIN clients c ON d.client_id = c.id WHERE d.id = ?');
$stmt2->execute([$id]);
ok(['document' => $stmt2->fetch()], 201);

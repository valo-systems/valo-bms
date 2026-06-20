<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/helpers.php';
cors();
auth_required();

$id = (int)($_GET['id'] ?? 0);
if (!$id) fail('ID required');

$stmt = db()->prepare('SELECT * FROM clients WHERE id = ? LIMIT 1');
$stmt->execute([$id]);
$client = $stmt->fetch();
if (!$client) fail('Client not found', 404);
ok(['client' => $client]);

<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/helpers.php';
cors();
$p = auth_required();
if ($p['role'] !== 'admin') fail('Admin only', 403);

$id = (int)($_GET['id'] ?? 0);
if (!$id) fail('ID required');

db()->prepare('UPDATE clients SET status = ? WHERE id = ?')->execute(['inactive', $id]);
ok(['message' => 'Client deactivated']);

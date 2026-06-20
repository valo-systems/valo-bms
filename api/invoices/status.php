<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/helpers.php';
cors();
auth_required();

$id = (int)($_GET['id'] ?? 0);
if (!$id) fail('ID required');
$b = body();
$valid = ['draft','estimated','confirmed','sent','paid','overdue','partial'];
$status = $b['status'] ?? '';
if (!in_array($status, $valid)) fail('Invalid status');

db()->prepare('UPDATE invoices SET status = ? WHERE id = ?')->execute([$status, $id]);
ok(['message' => 'Status updated', 'status' => $status]);

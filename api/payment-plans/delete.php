<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/helpers.php';
cors();
auth_required();

$id = (int)($_GET['id'] ?? 0);
if (!$id) fail('ID required');
if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') fail('Method not allowed', 405);

$pdo = db();
$pdo->prepare('DELETE FROM payment_plan_instalments WHERE plan_id = ?')->execute([$id]);
$pdo->prepare('DELETE FROM payment_plans WHERE id = ?')->execute([$id]);

ok(['deleted' => true]);

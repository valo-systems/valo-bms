<?php
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/helpers.php';
cors();
auth_required();

if ($_SERVER['REQUEST_METHOD'] !== 'PATCH') fail('Method not allowed', 405);
$id = (int)($_GET['id'] ?? 0);
if (!$id) fail('ID required');

$pdo = db();
$stmt = $pdo->prepare('UPDATE email_inbox SET read_at = NOW() WHERE id = ? AND read_at IS NULL');
$stmt->execute([$id]);

$s2 = $pdo->prepare('SELECT * FROM email_inbox WHERE id = ? LIMIT 1');
$s2->execute([$id]);
$msg = $s2->fetch();
if (!$msg) fail('Not found', 404);

ok(['message' => $msg]);

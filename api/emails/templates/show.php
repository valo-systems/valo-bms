<?php
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/helpers.php';
cors();
auth_required();

$id = (int)($_GET['id'] ?? 0);
if (!$id) fail('ID required');

$stmt = db()->prepare('SELECT * FROM email_templates WHERE id = ? LIMIT 1');
$stmt->execute([$id]);
$t = $stmt->fetch();
if (!$t) fail('Not found', 404);

ok(['template' => $t]);

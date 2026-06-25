<?php
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/helpers.php';
cors();
$payload = auth_required();
require_admin($payload);

if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') fail('Method not allowed', 405);
$id = (int)($_GET['id'] ?? 0);
if (!$id) fail('ID required');

$stmt = db()->prepare('DELETE FROM email_templates WHERE id = ?');
$stmt->execute([$id]);
if (!$stmt->rowCount()) fail('Not found', 404);

ok(['deleted' => true]);

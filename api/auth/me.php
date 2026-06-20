<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/helpers.php';
cors();

$payload = auth_required();

$stmt = db()->prepare('SELECT id, name, email, role FROM users WHERE id = ? LIMIT 1');
$stmt->execute([$payload['user_id']]);
$user = $stmt->fetch();

if (!$user) fail('User not found', 404);
ok(['user' => $user]);

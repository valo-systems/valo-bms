<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/helpers.php';

cors();
if ($_SERVER['REQUEST_METHOD'] !== 'POST') fail('Method not allowed', 405);

$b        = body();
$token    = trim($b['token']    ?? '');
$password = trim($b['password'] ?? '');

if (!$token)    fail('Reset token is required.', 422);
if (!$password) fail('New password is required.', 422);
if (strlen($password) < 8) fail('Password must be at least 8 characters.', 422);

$pdo  = db();
$hash = hash('sha256', $token);

$stmt = $pdo->prepare('
    SELECT pr.id, pr.user_id, pr.expires_at, pr.used
    FROM password_resets pr
    WHERE pr.token = ? LIMIT 1
');
$stmt->execute([$hash]);
$reset = $stmt->fetch();

if (!$reset)              fail('This reset link is invalid.', 400);
if ($reset['used'])       fail('This reset link has already been used. Please request a new one.', 400);
if (strtotime($reset['expires_at']) < time()) fail('This reset link has expired. Please request a new one.', 400);

// Update password and mark token used
$pdo->beginTransaction();
$pdo->prepare('UPDATE users SET password_hash = ? WHERE id = ?')
    ->execute([password_hash($password, PASSWORD_BCRYPT), $reset['user_id']]);
$pdo->prepare('UPDATE password_resets SET used = 1 WHERE id = ?')
    ->execute([$reset['id']]);
$pdo->commit();

ok(['message' => 'Password updated successfully. You can now sign in.']);

<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/helpers.php';
cors();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') fail('Method not allowed', 405);

$body = body();
$email = trim($body['email'] ?? '');
$password = $body['password'] ?? '';

if (!$email || !$password) fail('Email and password are required');

$stmt = db()->prepare('SELECT * FROM users WHERE email = ? AND active = 1 LIMIT 1');
$stmt->execute([$email]);
$user = $stmt->fetch();

if (!$user || !password_verify($password, $user['password_hash'])) {
    fail('Invalid email or password', 401);
}

$token = jwt_create(['user_id' => $user['id'], 'email' => $user['email'], 'role' => $user['role']]);

ok([
    'token' => $token,
    'user' => [
        'id'    => $user['id'],
        'name'  => $user['name'],
        'email' => $user['email'],
        'role'  => $user['role'],
    ]
]);

<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/helpers.php';
cors();
auth_required();

$id = (int)($_GET['id'] ?? 0);
if (!$id) fail('ID required');

$stmt = db()->prepare("
    SELECT id, name, email, role, active, title, department, phone,
           id_number, date_of_birth, nationality, address,
           start_date, employment_type, notes,
           bank_name, bank_account, bank_branch, bank_type, tax_number,
           created_at
    FROM users WHERE id = ? LIMIT 1
");
$stmt->execute([$id]);
$user = $stmt->fetch();
if (!$user) fail('Not found', 404);
ok(['user' => $user]);

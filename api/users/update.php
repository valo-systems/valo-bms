<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/helpers.php';
cors();
$me = auth_required();

$id = (int)($_GET['id'] ?? 0);
if (!$id) fail('ID required');
// Only admin can edit others; finance can edit their own profile
if ($me['role'] !== 'admin' && (int)$me['user_id'] !== $id) fail('Forbidden', 403);

$b = body();

$stmt = db()->prepare("
    UPDATE users SET
        name=?, title=?, department=?, phone=?, nationality=?, address=?,
        start_date=?, employment_type=?, notes=?,
        bank_name=?, bank_account=?, bank_branch=?, bank_type=?, tax_number=?
    WHERE id=?
");
$stmt->execute([
    $b['name'] ?? null,
    $b['title'] ?? null,
    $b['department'] ?? null,
    $b['phone'] ?? null,
    $b['nationality'] ?? null,
    $b['address'] ?? null,
    $b['start_date'] ?: null,
    $b['employment_type'] ?? null,
    $b['notes'] ?? null,
    $b['bank_name'] ?? null,
    $b['bank_account'] ?? null,
    $b['bank_branch'] ?? null,
    $b['bank_type'] ?? null,
    $b['tax_number'] ?? null,
    $id,
]);

$stmt2 = db()->prepare("SELECT id, name, email, role, active, title, department, phone, id_number, date_of_birth, nationality, address, start_date, employment_type, notes, bank_name, bank_account, bank_branch, bank_type, tax_number FROM users WHERE id=?");
$stmt2->execute([$id]);
ok(['user' => $stmt2->fetch()]);

<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/helpers.php';
cors();
auth_required();

$stmt = db()->query("
    SELECT id, name, email, role, active, title, department, phone,
           id_number, date_of_birth, nationality, address,
           start_date, employment_type, notes,
           bank_name, bank_account, bank_branch, bank_type, tax_number,
           created_at
    FROM users
    WHERE active = 1
    ORDER BY id ASC
");
ok(['users' => $stmt->fetchAll()]);

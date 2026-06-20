<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/helpers.php';
cors();
$p = auth_required();
if ($p['role'] !== 'admin') fail('Admin only', 403);

$b = body();
$pdo = db();
$check = $pdo->query('SELECT id FROM company LIMIT 1')->fetch();

$fields = [
    'name', 'trading_name', 'reg_number', 'tax_number', 'vat_number',
    'email', 'phone', 'address', 'website',
    'bank_name', 'account_holder', 'account_number', 'branch_code', 'account_type',
    'capitec_account_number', 'capitec_branch_code', 'capitec_swift',
    'csd_number', 'bee_level', 'bee_expiry', 'bee_type',
    'financial_year_end', 'registration_date',
    'director_name', 'director_id', 'director_email', 'director_phone',
];

$vals = array_map(fn($f) => ($b[$f] ?? null) ?: null, $fields);

if ($check) {
    $sets = implode(', ', array_map(fn($f) => "$f=?", $fields));
    $stmt = $pdo->prepare("UPDATE company SET $sets WHERE id=?");
    $stmt->execute([...$vals, $check['id']]);
} else {
    $cols = implode(', ', $fields);
    $phs  = implode(', ', array_fill(0, count($fields), '?'));
    $pdo->prepare("INSERT INTO company ($cols) VALUES ($phs)")->execute($vals);
}
ok(['message' => 'Company updated']);

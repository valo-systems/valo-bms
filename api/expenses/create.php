<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/helpers.php';
cors();
auth_required();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') fail('Method not allowed', 405);
$b = body();
require_fields($b, ['description', 'amount', 'date']);

$pdo = db();
$stmt = $pdo->prepare('
    INSERT INTO expenses (description, category, supplier, amount, usd_amount, fx_rate, date, client_id, billable, pass_through, notes, invoice_id)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
');
$stmt->execute([
    sanitize_string($b['description'], 500),
    in_array($b['category'] ?? '', ['infrastructure','software','operations','marketing','travel','other'])
        ? $b['category'] : 'other',
    sanitize_string($b['supplier'] ?? null, 100),
    sanitize_decimal($b['amount']),
    sanitize_decimal($b['usd_amount'] ?? null),
    sanitize_decimal($b['fx_rate'] ?? null),
    sanitize_string($b['date'], 10),
    sanitize_int($b['client_id'] ?? null),
    sanitize_bool($b['billable'] ?? true) ? 1 : 0,
    sanitize_bool($b['pass_through'] ?? false) ? 1 : 0,
    sanitize_string($b['notes'] ?? null, 1000),
    sanitize_int($b['invoice_id'] ?? null),
]);

$id = (int)$pdo->lastInsertId();
$stmt2 = $pdo->prepare('SELECT e.*, c.name AS client_name FROM expenses e LEFT JOIN clients c ON e.client_id = c.id WHERE e.id = ?');
$stmt2->execute([$id]);
ok(['expense' => $stmt2->fetch()], 201);

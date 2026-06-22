<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/helpers.php';
cors();
auth_required();

$client_id = (int)($_GET['client_id'] ?? 0);

$sql = '
    SELECT p.*,
           c.name AS client_name,
           i.number AS invoice_number
    FROM payment_plans p
    LEFT JOIN clients c ON p.client_id = c.id
    LEFT JOIN invoices i ON p.invoice_id = i.id
';
$params = [];
if ($client_id) {
    $sql .= ' WHERE p.client_id = ?';
    $params[] = $client_id;
}
$sql .= ' ORDER BY p.created_at DESC';

$stmt = db()->prepare($sql);
$stmt->execute($params);
$plans = $stmt->fetchAll();

$pdo = db();
foreach ($plans as &$plan) {
    $s = $pdo->prepare('
        SELECT * FROM payment_plan_instalments WHERE plan_id = ? ORDER BY instalment_no ASC
    ');
    $s->execute([$plan['id']]);
    $plan['instalments'] = $s->fetchAll();
}

ok(['plans' => $plans]);

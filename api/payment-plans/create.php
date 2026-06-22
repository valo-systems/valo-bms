<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/helpers.php';
cors();
auth_required();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') fail('Method not allowed', 405);
$b = body();
require_fields($b, ['client_id', 'reference', 'total_amount', 'instalments']);

$pdo = db();
$pdo->beginTransaction();
try {
    $stmt = $pdo->prepare('
        INSERT INTO payment_plans (client_id, invoice_id, reference, description, total_amount, currency, status, notes)
        VALUES (?,?,?,?,?,?,?,?)
    ');
    $stmt->execute([
        sanitize_int($b['client_id']),
        sanitize_int($b['invoice_id'] ?? null),
        sanitize_string($b['reference'], 100),
        sanitize_string($b['description'] ?? null, 500),
        sanitize_decimal($b['total_amount']),
        sanitize_string($b['currency'] ?? 'ZAR', 3),
        in_array($b['status'] ?? '', ['active','completed','cancelled']) ? $b['status'] : 'active',
        sanitize_string($b['notes'] ?? null, 2000),
    ]);
    $plan_id = (int)$pdo->lastInsertId();

    $lineStmt = $pdo->prepare('
        INSERT INTO payment_plan_instalments (plan_id, instalment_no, due_date, amount, status, paid_date, notes)
        VALUES (?,?,?,?,?,?,?)
    ');
    foreach ($b['instalments'] as $i => $inst) {
        $status = in_array($inst['status'] ?? '', ['pending','paid','overdue']) ? $inst['status'] : 'pending';
        $lineStmt->execute([
            $plan_id,
            (int)($inst['instalment_no'] ?? $i + 1),
            sanitize_string($inst['due_date'], 10),
            sanitize_decimal($inst['amount'] ?? 0),
            $status,
            sanitize_string($inst['paid_date'] ?? null, 10) ?: null,
            sanitize_string($inst['notes'] ?? null, 500),
        ]);
    }

    $pdo->commit();

    $s = $pdo->prepare('SELECT * FROM payment_plans WHERE id = ?');
    $s->execute([$plan_id]);
    $plan = $s->fetch();
    $s2 = $pdo->prepare('SELECT * FROM payment_plan_instalments WHERE plan_id = ? ORDER BY instalment_no ASC');
    $s2->execute([$plan_id]);
    $plan['instalments'] = $s2->fetchAll();

    ok(['plan' => $plan], 201);
} catch (Exception $e) {
    $pdo->rollBack();
    fail('Failed to create payment plan: ' . $e->getMessage(), 500);
}

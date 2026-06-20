<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/helpers.php';
cors();
auth_required();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') fail('Method not allowed', 405);
$b = body();
require_fields($b, ['client_id', 'number', 'date']);

$pdo = db();
$pdo->beginTransaction();
try {
    $stmt = $pdo->prepare('
        INSERT INTO invoices (
            client_id, number, period, period_from, period_to,
            date, due_date, status, subtotal, vat, total, notes,
            invoice_type, fx_rate, fx_policy,
            period_note, commercial_conditions, internal_notes, footer_note
        )
        VALUES (?,?,?,?,?, ?,?,?,?,?,?,?, ?,?,?, ?,?,?,?)
    ');
    $stmt->execute([
        sanitize_int($b['client_id']),
        sanitize_string($b['number'], 30),
        sanitize_string($b['period'] ?? '', 50),
        sanitize_string($b['period_from'] ?? null, 10) ?: null,
        sanitize_string($b['period_to']   ?? null, 10) ?: null,
        sanitize_string($b['date'], 10),
        sanitize_string($b['due_date'] ?? null, 10) ?: null,
        in_array($b['status'] ?? '', ['draft','estimated','confirmed','sent','paid','overdue','partial'])
            ? $b['status'] : 'draft',
        sanitize_decimal($b['subtotal'] ?? 0),
        sanitize_decimal($b['vat'] ?? 0),
        sanitize_decimal($b['total'] ?? $b['subtotal'] ?? 0),
        sanitize_string($b['notes'] ?? null, 2000),
        in_array($b['invoice_type'] ?? '', ['monthly_service','implementation','project','infrastructure','custom'])
            ? $b['invoice_type'] : 'monthly_service',
        sanitize_decimal($b['fx_rate'] ?? null),
        sanitize_string($b['fx_policy'] ?? null, 255),
        sanitize_string($b['period_note'] ?? null, 1000),
        sanitize_string($b['commercial_conditions'] ?? null, 5000),
        sanitize_string($b['internal_notes'] ?? null, 2000),
        sanitize_string($b['footer_note'] ?? null, 1000),
    ]);
    $invoice_id = (int)$pdo->lastInsertId();

    $lineStmt = $pdo->prepare('
        INSERT INTO invoice_line_items (
            invoice_id, sort_order,
            section_label, section_description, description, item_note, calculation_detail,
            usd_amount, quantity, unit_price, total,
            is_discount, is_section_header, is_estimated
        ) VALUES (?,?, ?,?,?,?,?, ?,?,?,?, ?,?,?)
    ');
    foreach (($b['line_items'] ?? []) as $i => $line) {
        $lineStmt->execute([
            $invoice_id, $i,
            sanitize_string($line['section_label'] ?? null, 10),
            sanitize_string($line['section_description'] ?? null, 2000),
            sanitize_string($line['description'] ?? '', 500),
            sanitize_string($line['item_note'] ?? null, 500),
            sanitize_string($line['calculation_detail'] ?? null, 500),
            sanitize_decimal($line['usd_amount'] ?? null),
            sanitize_decimal($line['quantity'] ?? 1),
            sanitize_decimal($line['unit_price'] ?? 0),
            sanitize_decimal($line['total'] ?? 0),
            sanitize_bool($line['is_discount'] ?? false) ? 1 : 0,
            sanitize_bool($line['is_section_header'] ?? false) ? 1 : 0,
            sanitize_bool($line['is_estimated'] ?? false) ? 1 : 0,
        ]);
    }

    $pdo->commit();
    $stmt2 = $pdo->prepare('SELECT i.*, c.name as client_name FROM invoices i LEFT JOIN clients c ON i.client_id = c.id WHERE i.id = ?');
    $stmt2->execute([$invoice_id]);
    ok(['invoice' => $stmt2->fetch()], 201);
} catch (Exception $e) {
    $pdo->rollBack();
    $msg = str_contains($e->getMessage(), 'Duplicate') ? 'Invoice number already exists' : 'Failed to create invoice';
    fail($msg, 500);
}

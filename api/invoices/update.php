<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/helpers.php';
cors();
auth_required();

$id = (int)($_GET['id'] ?? 0);
if (!$id) fail('ID required');
if ($_SERVER['REQUEST_METHOD'] !== 'PUT' && $_SERVER['REQUEST_METHOD'] !== 'POST') fail('Method not allowed', 405);
$b = body();

$pdo = db();
$pdo->beginTransaction();

try {
    $stmt = $pdo->prepare('
        UPDATE invoices SET
            client_id=?, number=?, period=?, period_from=?, period_to=?,
            date=?, due_date=?, status=?, subtotal=?, vat=?, total=?, notes=?,
            invoice_type=?, fx_rate=?, fx_policy=?,
            period_note=?, commercial_conditions=?, internal_notes=?, footer_note=?
        WHERE id=?
    ');
    $stmt->execute([
        (int)$b['client_id'],
        $b['number'] ?? '',
        $b['period'] ?? '',
        $b['period_from'] ?: null,
        $b['period_to'] ?: null,
        $b['date'] ?? date('Y-m-d'),
        $b['due_date'] ?: null,
        $b['status'] ?? 'draft',
        (float)($b['subtotal'] ?? 0),
        (float)($b['vat'] ?? 0),
        (float)($b['total'] ?? $b['subtotal'] ?? 0),
        $b['notes'] ?? '',
        $b['invoice_type'] ?? 'monthly_service',
        $b['fx_rate'] ?: null,
        $b['fx_policy'] ?? null,
        $b['period_note'] ?? null,
        $b['commercial_conditions'] ?? null,
        $b['internal_notes'] ?? null,
        $b['footer_note'] ?? null,
        $id,
    ]);

    if (isset($b['line_items'])) {
        $pdo->prepare('DELETE FROM invoice_line_items WHERE invoice_id = ?')->execute([$id]);
        $lineStmt = $pdo->prepare('
            INSERT INTO invoice_line_items (
                invoice_id, sort_order,
                section_label, section_description, description, item_note, calculation_detail,
                usd_amount, quantity, unit_price, total,
                is_discount, is_section_header, is_estimated
            )
            VALUES (?,?, ?,?,?,?,?, ?,?,?,?, ?,?,?)
        ');
        foreach ($b['line_items'] as $i => $line) {
            $lineStmt->execute([
                $id, $i,
                $line['section_label'] ?? null,
                $line['section_description'] ?? null,
                $line['description'] ?? '',
                $line['item_note'] ?? null,
                $line['calculation_detail'] ?? null,
                isset($line['usd_amount']) && $line['usd_amount'] !== '' && $line['usd_amount'] !== null
                    ? (float)$line['usd_amount'] : null,
                (float)($line['quantity'] ?? 1),
                (float)($line['unit_price'] ?? 0),
                (float)($line['total'] ?? 0),
                !empty($line['is_discount']) ? 1 : 0,
                !empty($line['is_section_header']) ? 1 : 0,
                !empty($line['is_estimated']) ? 1 : 0,
            ]);
        }
    }

    $pdo->commit();

    $stmt2 = $pdo->prepare('
        SELECT i.*,
               c.name    AS client_name,
               c.email   AS client_email,
               c.phone   AS client_phone,
               c.address AS client_address
        FROM invoices i
        LEFT JOIN clients c ON i.client_id = c.id
        WHERE i.id = ? LIMIT 1
    ');
    $stmt2->execute([$id]);
    $invoice = $stmt2->fetch();

    $stmt3 = $pdo->prepare('
        SELECT id, invoice_id, sort_order,
               section_label, section_description, description, item_note, calculation_detail,
               usd_amount, quantity, unit_price, total,
               is_discount, is_section_header, is_estimated, template_id
        FROM invoice_line_items
        WHERE invoice_id = ?
        ORDER BY sort_order ASC
    ');
    $stmt3->execute([$id]);
    $invoice['line_items'] = $stmt3->fetchAll();

    ok(['invoice' => $invoice]);
} catch (Exception $e) {
    $pdo->rollBack();
    fail('Failed to update invoice: ' . $e->getMessage(), 500);
}

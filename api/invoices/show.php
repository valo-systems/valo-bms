<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/helpers.php';
cors();
auth_required();

$id = (int)($_GET['id'] ?? 0);
if (!$id) fail('ID required');

$stmt = db()->prepare('
    SELECT i.*,
           c.name  AS client_name,
           c.email AS client_email,
           c.accounts_email,
           c.phone AS client_phone,
           c.address AS client_address,
           c.company_registration AS client_reg
    FROM invoices i
    LEFT JOIN clients c ON i.client_id = c.id
    WHERE i.id = ? LIMIT 1
');
$stmt->execute([$id]);
$invoice = $stmt->fetch();
if (!$invoice) fail('Invoice not found', 404);

$stmt2 = db()->prepare('
    SELECT id, invoice_id, sort_order,
           section_label, section_description, description, item_note, calculation_detail,
           usd_amount, quantity, unit_price, total,
           is_discount, is_section_header, is_estimated, template_id
    FROM invoice_line_items
    WHERE invoice_id = ?
    ORDER BY sort_order ASC
');
$stmt2->execute([$id]);
$invoice['line_items'] = $stmt2->fetchAll();

ok(['invoice' => $invoice]);

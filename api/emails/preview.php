<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/helpers.php';
require_once __DIR__ . '/mailer.php';

cors();
auth_required();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') fail('Method not allowed', 405);
$b = body();
require_fields($b, ['template_id']);

$pdo        = db();
$templateId = (int)$b['template_id'];
$invoiceId  = isset($b['invoice_id']) ? (int)$b['invoice_id'] : null;

$tStmt = $pdo->prepare('SELECT * FROM email_templates WHERE id = ? LIMIT 1');
$tStmt->execute([$templateId]);
$template = $tStmt->fetch();
if (!$template) fail('Template not found', 404);

$vars = [];
if ($invoiceId) {
    $iStmt = $pdo->prepare('
        SELECT i.*, c.name AS client_name, c.contact_person AS contact_name
        FROM invoices i LEFT JOIN clients c ON i.client_id = c.id
        WHERE i.id = ? LIMIT 1
    ');
    $iStmt->execute([$invoiceId]);
    $invoice = $iStmt->fetch();
    if ($invoice) {
        $fmt = fn($n) => 'R ' . number_format((float)$n, 2, '.', ',');
        $vars = [
            'client_name'    => $invoice['client_name']  ?? '',
            'contact_name'   => $invoice['contact_name'] ?? ($invoice['client_name'] ?? ''),
            'invoice_number' => $invoice['number']       ?? '',
            'invoice_amount' => $fmt($invoice['total']   ?? 0),
            'amount'         => $fmt($invoice['total']   ?? 0),
            'due_date'       => $invoice['due_date'] ? date('j F Y', strtotime($invoice['due_date'])) : '',
            'period'         => $invoice['period']       ?? '',
        ];
    }
}

$extraVars = $b['vars'] ?? [];
if (is_array($extraVars)) $vars = array_merge($vars, $extraVars);

ok([
    'subject'   => render_template($template['subject'],   $vars),
    'body_html' => render_template($template['body_html'], $vars),
]);

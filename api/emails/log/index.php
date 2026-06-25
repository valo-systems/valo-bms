<?php
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/helpers.php';
cors();
auth_required();

$invoiceId = isset($_GET['invoice_id']) ? (int)$_GET['invoice_id'] : null;
$clientId  = isset($_GET['client_id'])  ? (int)$_GET['client_id']  : null;

$where  = [];
$params = [];

if ($invoiceId) { $where[] = 'l.invoice_id = ?'; $params[] = $invoiceId; }
if ($clientId)  { $where[] = 'l.client_id = ?';  $params[] = $clientId; }

$sql = '
    SELECT l.*, t.name AS template_name
    FROM email_log l
    LEFT JOIN email_templates t ON l.template_id = t.id
' . ($where ? 'WHERE ' . implode(' AND ', $where) : '') . '
    ORDER BY l.sent_at DESC
    LIMIT 100
';

$stmt = db()->prepare($sql);
$stmt->execute($params);
ok(['log' => $stmt->fetchAll()]);

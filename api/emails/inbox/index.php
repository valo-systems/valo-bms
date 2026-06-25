<?php
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/helpers.php';
cors();
auth_required();

$pdo       = db();
$invoiceId = isset($_GET['invoice_id']) ? (int)$_GET['invoice_id'] : null;
$clientId  = isset($_GET['client_id'])  ? (int)$_GET['client_id']  : null;
$unread    = isset($_GET['unread'])     ? (bool)$_GET['unread']     : false;

$where  = [];
$params = [];

if ($invoiceId) { $where[] = 'invoice_id = ?';  $params[] = $invoiceId; }
if ($clientId)  { $where[] = 'client_id = ?';   $params[] = $clientId; }
if ($unread)    { $where[] = 'read_at IS NULL'; }

$sql = 'SELECT * FROM email_inbox'
     . ($where ? ' WHERE ' . implode(' AND ', $where) : '')
     . ' ORDER BY received_at DESC LIMIT 200';

$stmt = $pdo->prepare($sql);
$stmt->execute($params);

$unreadCount = (int)$pdo->query('SELECT COUNT(*) FROM email_inbox WHERE read_at IS NULL')->fetchColumn();

ok(['messages' => $stmt->fetchAll(), 'unread_count' => $unreadCount]);

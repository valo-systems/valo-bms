<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/helpers.php';
cors();
auth_required();

$pdo = db();

$totalRevenue = $pdo->query("SELECT COALESCE(SUM(total),0) FROM invoices WHERE status NOT IN ('draft')")->fetchColumn();
$outstanding  = $pdo->query("SELECT COALESCE(SUM(total),0) FROM invoices WHERE status IN ('confirmed','estimated','sent','partial')")->fetchColumn();
$clientCount  = $pdo->query("SELECT COUNT(*) FROM clients WHERE status = 'active'")->fetchColumn();
$invoiceCount = $pdo->query('SELECT COUNT(*) FROM invoices')->fetchColumn();

$recentStmt = $pdo->query('
    SELECT i.id, i.number, c.name as client_name, i.total, i.status, i.date
    FROM invoices i LEFT JOIN clients c ON i.client_id = c.id
    ORDER BY i.created_at DESC LIMIT 5
');
$recentInvoices = $recentStmt->fetchAll();

$revStmt = $pdo->query("
    SELECT c.name as client, COALESCE(SUM(i.total),0) as total, COUNT(i.id) as invoices
    FROM invoices i LEFT JOIN clients c ON i.client_id = c.id
    WHERE i.status NOT IN ('draft')
    GROUP BY c.id, c.name ORDER BY total DESC
");
$revenueByClient = $revStmt->fetchAll();

ok([
    'totalRevenue'    => (float)$totalRevenue,
    'outstanding'     => (float)$outstanding,
    'clientCount'     => (int)$clientCount,
    'invoiceCount'    => (int)$invoiceCount,
    'recentInvoices'  => $recentInvoices,
    'revenueByClient' => $revenueByClient,
]);

<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/helpers.php';
cors();
auth_required();

$client_id = isset($_GET['client_id']) ? (int)$_GET['client_id'] : null;
$status = $_GET['status'] ?? null;

$sql = 'SELECT i.*, c.name as client_name FROM invoices i LEFT JOIN clients c ON i.client_id = c.id WHERE 1=1';
$params = [];

if ($client_id) { $sql .= ' AND i.client_id = ?'; $params[] = $client_id; }
if ($status) { $sql .= ' AND i.status = ?'; $params[] = $status; }
$sql .= ' ORDER BY i.date DESC';

$stmt = db()->prepare($sql);
$stmt->execute($params);
ok(['invoices' => $stmt->fetchAll()]);

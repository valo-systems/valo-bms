<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/helpers.php';
cors();
auth_required();

$stmt = db()->query('SELECT * FROM company LIMIT 1');
$company = $stmt->fetch();

$teamStmt = db()->query("SELECT id, name, email, role, title FROM users WHERE active = 1 ORDER BY id ASC");
if ($company) $company['team'] = $teamStmt->fetchAll();

ok(['company' => $company ?: []]);

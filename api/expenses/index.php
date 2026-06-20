<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/helpers.php';
cors();
auth_required();

$sql = '
    SELECT e.*, c.name AS client_name
    FROM expenses e
    LEFT JOIN clients c ON e.client_id = c.id
    ORDER BY e.date DESC, e.id DESC
';
$stmt = db()->query($sql);
ok(['expenses' => $stmt->fetchAll()]);

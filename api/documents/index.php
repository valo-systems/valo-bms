<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/helpers.php';
cors();
auth_required();

$stmt = db()->query('SELECT d.*, c.name as client_name FROM documents d LEFT JOIN clients c ON d.client_id = c.id ORDER BY d.date DESC');
ok(['documents' => $stmt->fetchAll()]);

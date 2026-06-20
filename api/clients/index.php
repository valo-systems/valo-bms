<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/helpers.php';
cors();
auth_required();

$stmt = db()->query('SELECT * FROM clients ORDER BY name ASC');
ok(['clients' => $stmt->fetchAll()]);

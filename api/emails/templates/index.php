<?php
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/helpers.php';
cors();
auth_required();

$rows = db()->query('SELECT * FROM email_templates ORDER BY id ASC')->fetchAll();
ok(['templates' => $rows]);

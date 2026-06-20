<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/helpers.php';
cors();
auth_required();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') fail('Method not allowed', 405);
$b = body();
require_fields($b, ['name', 'code']);

$pdo = db();
$stmt = $pdo->prepare('
    INSERT INTO clients (
      name, code, trading_name, email, accounts_email, phone, contact_person,
      company_registration, address, billing_model, payment_terms, service_fee_pct,
      minimum_monthly, minimum_period_months, minimum_description, late_interest_policy,
      fx_policy, sms_rate, sms_provider, domain, domain_monthly, hosting,
      agreement_ref, platform_live_date, first_billing_month, agreement_notes, notes, status
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
');
$stmt->execute([
    $b['name'], strtoupper($b['code']), $b['trading_name'] ?? null,
    $b['email'] ?? null, $b['accounts_email'] ?? null, $b['phone'] ?? null,
    $b['contact_person'] ?? null, $b['company_registration'] ?? null, $b['address'] ?? null,
    $b['billing_model'] ?? 'project', (int)($b['payment_terms'] ?? 30),
    $b['service_fee_pct'] ?: null, $b['minimum_monthly'] ?: null,
    $b['minimum_period_months'] ?: null, $b['minimum_description'] ?? null,
    $b['late_interest_policy'] ?? 'South African prime lending rate + 2% per annum, calculated daily from due date',
    $b['fx_policy'] ?? null, $b['sms_rate'] ?: null, $b['sms_provider'] ?? null,
    $b['domain'] ?? null, $b['domain_monthly'] ?: null, $b['hosting'] ?? null,
    $b['agreement_ref'] ?? null, $b['platform_live_date'] ?: null,
    $b['first_billing_month'] ?? null, $b['agreement_notes'] ?? null,
    $b['notes'] ?? null, $b['status'] ?? 'active',
]);

$id = (int)$pdo->lastInsertId();
$stmt2 = $pdo->prepare('SELECT * FROM clients WHERE id = ?');
$stmt2->execute([$id]);
ok(['client' => $stmt2->fetch()], 201);

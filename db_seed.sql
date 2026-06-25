-- ============================================================
-- Valo BMS — Seed Data
-- Run AFTER db_schema.sql on a fresh database.
--
-- phpMyAdmin (prod):  select valosyst_bms, then import this file
-- CLI:                mysql -u <user> -p <database> < db_seed.sql
--
-- Safe to re-run: all INSERTs use INSERT IGNORE (id-keyed rows)
-- or ON DUPLICATE KEY UPDATE (slug-keyed email templates).
-- ============================================================

SET NAMES utf8mb4;
SET time_zone = '+02:00';
SET FOREIGN_KEY_CHECKS = 0;


-- ============================================================
-- USERS
-- ============================================================
INSERT IGNORE INTO users
    (id, name, email, password_hash, role, active,
     title, department, phone,
     id_number, date_of_birth, nationality,
     start_date, employment_type)
VALUES
(1, 'Sibusiso Mashita', 'sibusiso.mashita@valosystems.co.za',
 '$2y$12$dVyq.5.PG/4rFTSWCc5I5eVls5nIPqCM/MYEAxorONLnzjD15oHVq',
 'admin', 1, 'Director', 'Technology', '078 078 5043',
 '9103275496084', '1991-03-27', 'South African', '2026-01-29', 'Director'),

(2, 'Hataluli Netshidzivhani', 'hataluli.netshidzivhani@valosystems.co.za',
 '$2y$12$NA/xe/9PnZhByiuIKk7rWuZeDmMYq7veMNAdXVe9ChjjoBYdBunom',
 'finance', 1, 'Finance Officer', 'Finance', NULL,
 NULL, NULL, 'South African', NULL, 'Full-time'),

(3, 'Bophelo Monyayi', 'bophelo.monyayi@valosystems.co.za',
 '$2y$12$YsH2R3q2U.CN1Dk5XNJMlOSLWdawERRsXqB9gQHKw87DRD4i3v3Ri',
 'finance', 1, 'Head of Finance', 'Finance', NULL,
 NULL, NULL, 'South African', NULL, 'Full-time');


-- ============================================================
-- COMPANY  (singleton)
-- ============================================================
INSERT IGNORE INTO company
    (id, name, trading_name, reg_number, registration_date,
     tax_number, csd_number,
     email, phone, address, website,
     financial_year_end,
     bee_level, bee_expiry, bee_type,
     bank_name, account_holder, account_number, branch_code, account_type,
     capitec_account_number, capitec_branch_code, capitec_swift,
     director_name, director_id, director_email, director_phone)
VALUES
(1, 'VALO (PTY) LTD', 'Valo Systems',
 '2026/072094/07', '2026-01-29',
 '9594324221', 'MAAA1722994',
 'billing@valosystems.co.za', '078 078 5043',
 '50 C Carlswald Luxury Apartments, 82 Tamboti Rd, Carlswald, Midrand, Gauteng, 1685, South Africa',
 'valosystems.co.za',
 'February',
 '1', '2027-01-01', 'Exempt Micro Enterprise (EME)',
 'FNB / RMB', 'Valo', '63194158987', '255355', 'Gold Business Account',
 '1055332383', '450105', 'CABLZAJJ',
 'Sibusiso Siphosenkosi Mashita', '9103275496084',
 'sibusiso.mashita@valosystems.co.za', '078 078 5043');


-- ============================================================
-- CLIENTS
-- ============================================================
INSERT IGNORE INTO clients
    (id, name, code, trading_name,
     email, accounts_email, phone, contact_person,
     company_registration, address,
     billing_model, payment_terms,
     service_fee_pct, minimum_monthly, minimum_period_months,
     minimum_description, late_interest_policy, fx_policy,
     sms_rate, sms_provider,
     domain, domain_monthly,
     agreement_ref, platform_live_date, first_billing_month,
     agreement_notes, notes, status, contract_start)
VALUES
-- Convenient Gas Solutions
(1, 'Convenient Gas Solutions', 'CGS', NULL,
 'ndivhupmulaudzi@gmail.com', 'ndivhupmulaudzi@gmail.com',
 '+27 65 948 3175', 'Ndivhu Pmulaudzi',
 NULL, 'Address and accounts contact to be confirmed. Update once received.',
 'percentage', 30,
 5.00, 2000.00, 6,
 'Minimum applies for first 6 months or until 5% share exceeds R2,000 (monthly delivered order revenue > R40,000).',
 'South African prime lending rate + 2% per annum, calculated daily from due date',
 'SARB interbank mid-rate + 8% FX cover on billing date',
 0.3800, 'WinSMS',
 'gassolution.co.za', 13.00,
 'Technology Partnership Agreement - CGS', '2026-03-24', 'April 2026',
 'By mutual agreement, April 2026 is treated as the first full billing month. No partial charge for March.',
 NULL, 'active', '2026-03-24'),

-- Kasi to Home
(2, 'Kasi to Home', 'K2H', 'Kasi to Home Funeral Services',
 'sibusiso.moolar@kasitohomefunerals.co.za', 'sibusiso.moolar@kasitohomefunerals.co.za',
 '+27762327358', 'Sibusiso Moolar',
 '2026/254458/07',
 'Small startup funeral services business. Owner is sole contact. Address to be confirmed.',
 'project', 30,
 NULL, NULL, NULL, NULL,
 'South African prime lending rate + 2% per annum, calculated daily from due date',
 'SARB interbank mid-rate + 8% FX cover on billing date',
 NULL, NULL,
 'kasitohomefunerals.co.za', NULL,
 NULL, '2026-06-20', NULL,
 'Once-off project fee. Domain purchased at R99 actual cost. Hosting R40/month (R480/year) pass-through on Valo shared cPanel.',
 NULL, 'active', '2026-03-24'),

-- OmniSolve
(3, 'OmniSolve', 'OS', NULL,
 'accounts@omnisolve.africa', 'accounts@omnisolve.africa',
 NULL, 'Accounts',
 NULL, 'Compliance Management Platform. AWS account 861870144419.',
 'passthrough', 30,
 NULL, NULL, NULL, NULL,
 'South African prime lending rate + 2% per annum, calculated daily from due date',
 'SARB interbank mid-rate + 8% FX cover on billing date',
 NULL, NULL, NULL, NULL,
 'VS-OS-TPA-2026-001', NULL, NULL,
 'Valo development and management fees waived per VS-OS-TPA-2026-001. OmniSolve pays AWS costs only. Waiver ends 24 Sep 2026.',
 NULL, 'active', '2026-01-01');


-- ============================================================
-- INVOICES
-- ============================================================
INSERT IGNORE INTO invoices
    (id, client_id, number, invoice_type,
     period, period_from, period_to, period_note,
     date, due_date, status,
     subtotal, vat, total,
     fx_rate, fx_policy,
     commercial_conditions, footer_note)
VALUES
-- VAL-CGS-2026-000: Implementation & Go-Live Fee
(1, 1, 'VAL-CGS-2026-000', 'implementation',
 NULL, NULL, NULL,
 'Once-off implementation and go-live fee - Pre-go-live / Implementation Phase. Production go-live is conditional upon settlement of this invoice in full. Monthly service fees and infrastructure billing commence from April 2026.',
 '2026-03-10', '2026-03-24', 'paid',
 3600.00, 0.00, 3600.00,
 NULL, NULL,
 'Production go-live is conditional upon settlement of this invoice in full.\n\nMonthly service fees and infrastructure billing commence from April 2026, in accordance with the Technology Partnership Agreement between Valo Systems and Convenient Gas Solutions. This implementation fee is a once-off charge and is separate from all ongoing monthly billing.',
 'This invoice is issued in accordance with the Technology Partnership Agreement between Valo Systems and Convenient Gas Solutions.'),

-- VAL-CGS-2026-001: Monthly Service (April 2026) — actual FX + SMS
(2, 1, 'VAL-CGS-2026-001', 'monthly_service',
 'April 2026', '2026-04-01', '2026-04-30',
 'Platform provisioned and live: 24 March 2026. By mutual agreement, April 2026 is treated as the first full billing month. No partial charge for March.',
 '2026-05-01', '2026-05-14', 'confirmed',
 2602.78, 0.00, 2602.78,
 18.1335, 'SARB interbank mid-rate + 8% FX cover on billing date (1 May 2026) - mid-rate R16.7903',
 NULL,
 'This invoice is issued in accordance with the Technology Partnership Agreement between Valo Systems and Convenient Gas Solutions.'),

-- VAL-CGS-2026-002: Monthly Service (May 2026)
(3, 1, 'VAL-CGS-2026-002', 'monthly_service',
 'May 2026', '2026-05-01', '2026-05-31',
 'Second monthly billing period under the Technology Partnership Agreement.',
 '2026-06-01', '2026-06-15', 'confirmed',
 2568.94, 0.00, 2568.94,
 17.5539, 'SARB interbank mid-rate + 8% FX cover on billing date (1 June 2026) - mid-rate R16.2536',
 NULL,
 'This invoice is issued in accordance with the Technology Partnership Agreement between Valo Systems and Convenient Gas Solutions.'),

-- VAL-CGS-2026-003: Monthly Service (June 2026, estimated)
(4, 1, 'VAL-CGS-2026-003', 'monthly_service',
 'June 2026', '2026-06-01', '2026-06-30',
 'Third monthly billing period. AWS costs and SMS count are estimated based on actual June-to-date data (20 June 2026). Final figure will be confirmed at month-end.',
 '2026-07-01', '2026-07-15', 'draft',
 2560.23, 0.00, 2560.23,
 17.7919, 'SARB interbank mid-rate + 8% FX cover (20 June 2026) - mid-rate R16.474. Rate will be re-confirmed on 1 July 2026 billing date.',
 NULL,
 'This invoice is issued in accordance with the Technology Partnership Agreement between Valo Systems and Convenient Gas Solutions.'),

-- VAL-K2H-2026-000: Website Build & Digital Presence
(5, 2, 'VAL-K2H-2026-000', 'project',
 NULL, NULL, NULL,
 'Once-off project fee covering the full design, development, and deployment of the Kasi to Home Funeral Services digital presence - including website, brochure, agent flyer tool, SEO setup, domain, and hosting. All deliverables are live as of 20 June 2026.',
 '2026-06-20', '2026-07-04', 'confirmed',
 10979.00, 0.00, 10979.00,
 NULL, NULL, NULL,
 'This invoice is issued in accordance with the Website Services & Hosting Agreement between Valo Systems and Kasi to Home Funeral Services.'),

-- VAL-OS-2026-001: OmniSolve AWS pass-through
(6, 3, 'VAL-OS-2026-001', 'infrastructure',
 'Q1 2026', '2026-01-01', '2026-03-31', NULL,
 '2026-04-01', '2026-04-15', 'partial',
 8420.03, 0.00, 8420.03,
 18.9600, 'SARB interbank mid-rate + 8% FX cover on billing date',
 'OmniSolve pays AWS costs only per VS-OS-TPA-2026-001. Valo development and management fees are waived.',
 'This invoice is issued in accordance with VS-OS-TPA-2026-001 between Valo Systems and OmniSolve.');


-- ============================================================
-- LINE ITEMS — VAL-CGS-2026-000 (Implementation)
-- ============================================================
INSERT IGNORE INTO invoice_line_items
    (invoice_id, sort_order, section_label, section_description,
     is_section_header, is_discount, is_estimated,
     description, calculation_detail, item_note,
     usd_amount, quantity, unit_price, total)
VALUES
(1, 10, 'A',
 'Once-off fee covering full platform implementation, configuration, deployment, and production go-live. This fee is payable prior to go-live and is not subject to the ongoing monthly revenue share arrangement.',
 1, 0, 0, 'Implementation & Go-Live Fee', NULL, NULL, NULL, 1, 0.00, 0.00),

(1, 20, 'A', NULL, 0, 0, 0,
 'Platform implementation, configuration, deployment, and go-live - Convenient Gas Solutions',
 NULL,
 'Covers: AWS infrastructure provisioning - Backend API and database deployment - Customer and admin frontend deployment - OTP authentication and WinSMS integration - Order management, delivery workflow, and inventory configuration - Role-based access control - AI integration (AWS Bedrock) - CloudWatch monitoring and alerting - Domain, DNS, SSL, and CDN setup - Production readiness testing and validation - Go-live support and handover',
 NULL, 1, 25000.00, 25000.00),

(1, 30, 'A', NULL, 0, 1, 0,
 'Partner Support Discount - Launch Phase',
 NULL,
 'Valo recognises that Convenient Gas Solutions is at an early stage of operations. In support of the business and this partnership, Valo is waiving R21,400.00 of the standard implementation fee. This discount is a once-off gesture of goodwill and does not set a precedent for future engagements.',
 NULL, 1, 21400.00, -21400.00);


-- ============================================================
-- LINE ITEMS — VAL-CGS-2026-001 (April 2026, actual figures)
-- ============================================================
INSERT IGNORE INTO invoice_line_items
    (invoice_id, sort_order, section_label, section_description,
     is_section_header, is_discount, is_estimated,
     description, calculation_detail, item_note,
     usd_amount, quantity, unit_price, total)
VALUES
(2, 10, 'A',
 '5% of gross delivered order value. Minimum R2,000/month applies during the first 6 months (ramp-up period) or until 5% share exceeds R2,000.',
 1, 0, 0, 'Section A - Valo Technology Service Fee', NULL, NULL, NULL, 1, 0.00, 0.00),
(2, 20, 'A', NULL, 0, 0, 0,
 'Platform service fee - April 2026', 'First operating month - minimum applies', NULL, NULL, 1, 2000.00, 2000.00),

(2, 100, 'B',
 'AWS costs are converted from USD to ZAR using the SARB interbank mid-rate + 8% FX cover on the billing date. This buffer protects both parties from exchange rate movement during the 14-day payment window. No markup beyond FX cover is applied.',
 1, 0, 0, 'Section B - Infrastructure Pass-Through (At Cost + FX Cover)', NULL, NULL, NULL, 1, 0.00, 0.00),
(2, 110, 'B', NULL, 1, 0, 0, 'AWS Prod Infrastructure - April 2026', NULL, NULL, NULL, 1, 0.00, 0.00),
(2, 120, 'B', NULL, 0, 0, 0, 'EC2 t3.micro',             'cgs-prod-backend (i-0c0e6c431dc1dd9ff)', NULL, 8.35, 1, 151.41, 151.41),
(2, 130, 'B', NULL, 0, 0, 0, 'EBS 16GB gp3',              'vol-033e6dee749ed098b',                 NULL, 1.28, 1, 23.21, 23.21),
(2, 140, 'B', NULL, 0, 0, 0, 'RDS db.t3.micro instance',  'cgs-prod-postgres',                     NULL, 12.96, 1, 235.01, 235.01),
(2, 150, 'B', NULL, 0, 0, 0, 'RDS 20GB storage',          'cgs-prod-postgres',                     NULL, 2.30, 1, 41.71, 41.71),
(2, 160, 'B', NULL, 0, 0, 0, 'RDS automated backups',     '14-day retention',                      NULL, 0.50, 1, 9.07, 9.07),
(2, 170, 'B', NULL, 0, 0, 0, 'S3 (2 prod buckets)',       'cgs-prod-web + cgs-prod-admin-frontend', NULL, 0.02, 1, 0.36, 0.36),
(2, 180, 'B', NULL, 0, 0, 0, 'CloudFront x 3',            'gassolution.co.za, admin, api',         NULL, 0.30, 1, 5.44, 5.44),
(2, 190, 'B', NULL, 0, 0, 0, 'Secrets Manager x 4',       'cgs-prod/* (4 secrets)',                NULL, 1.60, 1, 29.01, 29.01),
(2, 200, 'B', NULL, 0, 0, 0, 'Route53',                   'gassolution.co.za hosted zone + queries', NULL, 0.90, 1, 16.32, 16.32),
(2, 210, 'B', NULL, 0, 0, 0, 'CloudWatch alarms x 5',     'cgs-prod-* alarms',                     NULL, 0.50, 1, 9.07, 9.07),
(2, 220, 'B', NULL, 0, 0, 0, 'CloudWatch logs',           '/cgs/prod/api + /cgs/prod/api-error',   NULL, 0.16, 1, 2.90, 2.90),
(2, 230, 'B', NULL, 0, 0, 0, 'EC2 data transfer',         'Network egress (API traffic)',           NULL, 0.05, 1, 0.91, 0.91),

(2, 300, 'B', NULL, 1, 0, 0, 'WinSMS - SMS Notifications (April 2026)', NULL, NULL, NULL, 1, 0.00, 0.00),
(2, 310, 'B', NULL, 0, 0, 0, 'SMS notifications - April 2026',
 '172 SMS x R0.38/SMS',
 '101 OTP login verifications + 71 order status notifications. Actual count from CGS production database.',
 NULL, 172, 0.38, 65.36),

(2, 400, 'B', NULL, 1, 0, 0, 'Domain', NULL, NULL, NULL, 1, 0.00, 0.00),
(2, 410, 'B', NULL, 0, 0, 0, 'gassolution.co.za domain (1/12 annual)', NULL, NULL, NULL, 1, 13.00, 13.00);


-- ============================================================
-- LINE ITEMS — VAL-CGS-2026-002 (May 2026)
-- ============================================================
INSERT IGNORE INTO invoice_line_items
    (invoice_id, sort_order, section_label, section_description,
     is_section_header, is_discount, is_estimated,
     description, calculation_detail, item_note,
     usd_amount, quantity, unit_price, total)
VALUES
(3, 10, 'A',
 '5% of gross delivered order value. Minimum R2,000/month applies during the first 6 months (ramp-up period) or until 5% share exceeds R2,000.',
 1, 0, 0, 'Section A - Valo Technology Service Fee', NULL, NULL, NULL, 1, 0.00, 0.00),
(3, 20, 'A', NULL, 0, 0, 0,
 'Platform service fee - May 2026', 'Second operating month - minimum applies', NULL, NULL, 1, 2000.00, 2000.00),

(3, 100, 'B',
 'AWS costs are converted from USD to ZAR using the SARB interbank mid-rate + 8% FX cover on the billing date. This buffer protects both parties from exchange rate movement during the 14-day payment window. No markup beyond FX cover is applied.',
 1, 0, 0, 'Section B - Infrastructure Pass-Through (At Cost + FX Cover)', NULL, NULL, NULL, 1, 0.00, 0.00),
(3, 110, 'B', NULL, 1, 0, 0, 'AWS Prod Infrastructure - May 2026', NULL, NULL, NULL, 1, 0.00, 0.00),
(3, 120, 'B', NULL, 0, 0, 0, 'EC2 t3.micro',             'cgs-prod-backend (i-0c0e6c431dc1dd9ff)', NULL, 8.35, 1, 146.58, 146.58),
(3, 130, 'B', NULL, 0, 0, 0, 'EBS 16GB gp3',              'vol-033e6dee749ed098b',                 NULL, 1.28, 1, 22.47, 22.47),
(3, 140, 'B', NULL, 0, 0, 0, 'RDS db.t3.micro instance',  'cgs-prod-postgres',                     NULL, 12.96, 1, 227.50, 227.50),
(3, 150, 'B', NULL, 0, 0, 0, 'RDS 20GB storage',          'cgs-prod-postgres',                     NULL, 2.30, 1, 40.37, 40.37),
(3, 160, 'B', NULL, 0, 0, 0, 'RDS automated backups',     '14-day retention',                      NULL, 0.50, 1, 8.78, 8.78),
(3, 170, 'B', NULL, 0, 0, 0, 'S3 (2 prod buckets)',       'cgs-prod-web + cgs-prod-admin-frontend', NULL, 0.02, 1, 0.35, 0.35),
(3, 180, 'B', NULL, 0, 0, 0, 'CloudFront x 3',            'gassolution.co.za, admin, api',         NULL, 0.30, 1, 5.27, 5.27),
(3, 190, 'B', NULL, 0, 0, 0, 'Secrets Manager x 4',       'cgs-prod/* (4 secrets)',                NULL, 1.60, 1, 28.09, 28.09),
(3, 200, 'B', NULL, 0, 0, 0, 'Route53',                   'gassolution.co.za hosted zone + queries', NULL, 0.90, 1, 15.80, 15.80),
(3, 210, 'B', NULL, 0, 0, 0, 'CloudWatch alarms x 5',     'cgs-prod-* alarms',                     NULL, 0.50, 1, 8.78, 8.78),
(3, 220, 'B', NULL, 0, 0, 0, 'CloudWatch logs',           '/cgs/prod/api + /cgs/prod/api-error',   NULL, 0.16, 1, 2.81, 2.81),
(3, 230, 'B', NULL, 0, 0, 0, 'EC2 data transfer',         'Network egress (API traffic)',           NULL, 0.05, 1, 0.88, 0.88),

(3, 300, 'B', NULL, 1, 0, 0, 'WinSMS - SMS Notifications (May 2026)', NULL, NULL, NULL, 1, 0.00, 0.00),
(3, 310, 'B', NULL, 0, 0, 0, 'SMS notifications - May 2026',
 '127 SMS x R0.38/SMS',
 '74 OTP login verifications + 53 order status notifications. Actual count from CGS production database.',
 NULL, 127, 0.38, 48.26),

(3, 400, 'B', NULL, 1, 0, 0, 'Domain', NULL, NULL, NULL, 1, 0.00, 0.00),
(3, 410, 'B', NULL, 0, 0, 0, 'gassolution.co.za domain (1/12 annual)', NULL, NULL, NULL, 1, 13.00, 13.00);


-- ============================================================
-- LINE ITEMS — VAL-CGS-2026-003 (June 2026, estimated)
-- ============================================================
INSERT IGNORE INTO invoice_line_items
    (invoice_id, sort_order, section_label, section_description,
     is_section_header, is_discount, is_estimated,
     description, calculation_detail, item_note,
     usd_amount, quantity, unit_price, total)
VALUES
(4, 10, 'A',
 '5% of gross delivered order value. Minimum R2,000/month applies during the first 6 months (ramp-up period) or until 5% share exceeds R2,000.',
 1, 0, 0, 'Section A - Valo Technology Service Fee', NULL, NULL, NULL, 1, 0.00, 0.00),
(4, 20, 'A', NULL, 0, 0, 0,
 'Platform service fee - June 2026', 'Third operating month - minimum applies', NULL, NULL, 1, 2000.00, 2000.00),

(4, 100, 'B',
 'AWS costs are converted from USD to ZAR using the SARB interbank mid-rate + 8% FX cover on the billing date. This buffer protects both parties from exchange rate movement during the 14-day payment window. No markup beyond FX cover is applied.',
 1, 0, 0, 'Section B - Infrastructure Pass-Through (At Cost + FX Cover)', NULL, NULL, NULL, 1, 0.00, 0.00),
(4, 110, 'B', NULL, 1, 0, 0, 'AWS Prod Infrastructure - June 2026', NULL, NULL, NULL, 1, 0.00, 0.00),
(4, 120, 'B', NULL, 0, 0, 1, 'EC2 t3.micro',             'cgs-prod-backend (i-0c0e6c431dc1dd9ff)', NULL, 8.35, 1, 148.56, 148.56),
(4, 130, 'B', NULL, 0, 0, 1, 'EBS 16GB gp3',              'vol-033e6dee749ed098b',                 NULL, 1.28, 1, 22.77, 22.77),
(4, 140, 'B', NULL, 0, 0, 1, 'RDS db.t3.micro instance',  'cgs-prod-postgres',                     NULL, 12.96, 1, 230.58, 230.58),
(4, 150, 'B', NULL, 0, 0, 1, 'RDS 20GB storage',          'cgs-prod-postgres',                     NULL, 2.30, 1, 40.92, 40.92),
(4, 160, 'B', NULL, 0, 0, 1, 'RDS automated backups',     '14-day retention',                      NULL, 0.50, 1, 8.90, 8.90),
(4, 170, 'B', NULL, 0, 0, 1, 'S3 (2 prod buckets)',       'cgs-prod-web + cgs-prod-admin-frontend', NULL, 0.02, 1, 0.36, 0.36),
(4, 180, 'B', NULL, 0, 0, 1, 'CloudFront x 3',            'gassolution.co.za, admin, api',         NULL, 0.30, 1, 5.34, 5.34),
(4, 190, 'B', NULL, 0, 0, 1, 'Secrets Manager x 4',       'cgs-prod/* (4 secrets)',                NULL, 1.60, 1, 28.47, 28.47),
(4, 200, 'B', NULL, 0, 0, 1, 'Route53',                   'gassolution.co.za hosted zone + queries', NULL, 0.90, 1, 16.01, 16.01),
(4, 210, 'B', NULL, 0, 0, 1, 'CloudWatch alarms x 5',     'cgs-prod-* alarms',                     NULL, 0.50, 1, 8.90, 8.90),
(4, 220, 'B', NULL, 0, 0, 1, 'CloudWatch logs',           '/cgs/prod/api + /cgs/prod/api-error',   NULL, 0.16, 1, 2.85, 2.85),
(4, 230, 'B', NULL, 0, 0, 1, 'EC2 data transfer',         'Network egress (API traffic)',           NULL, 0.05, 1, 0.89, 0.89),

(4, 300, 'B', NULL, 1, 0, 0, 'WinSMS - SMS Notifications (June 2026)', NULL, NULL, NULL, 1, 0.00, 0.00),
(4, 310, 'B', NULL, 0, 0, 1, 'SMS notifications - June 2026',
 '86 SMS x R0.38/SMS',
 'June-to-date count (20 Jun 2026): 61 OTP login verifications + 25 order status notifications. Estimated to ~129 SMS for full month. Final count to be confirmed at month-end.',
 NULL, 86, 0.38, 32.68),

(4, 400, 'B', NULL, 1, 0, 0, 'Domain', NULL, NULL, NULL, 1, 0.00, 0.00),
(4, 410, 'B', NULL, 0, 0, 0, 'gassolution.co.za domain (1/12 annual)', NULL, NULL, NULL, 1, 13.00, 13.00);


-- ============================================================
-- LINE ITEMS — VAL-K2H-2026-000 (Website Build)
-- ============================================================
INSERT IGNORE INTO invoice_line_items
    (invoice_id, sort_order, section_label, section_description,
     is_section_header, is_discount, is_estimated,
     description, calculation_detail, item_note,
     usd_amount, quantity, unit_price, total)
VALUES
(5, 10, 'A',
 'All design, development, and content work delivered for the Kasi to Home digital presence. Prices reflect standard rates for a small South African digital agency. As an early-stage business, a startup support discount has been applied.',
 1, 0, 0, 'Section A - Design & Development', NULL, NULL, NULL, 1, 0.00, 0.00),
(5, 20, 'A', NULL, 0, 0, 0, 'Single-page marketing website - Design & Development', NULL,
 'Full custom React 18 + TypeScript + Vite + Tailwind CSS SPA. Sections: Hero, Trust Strip, About, Funeral Plans (4 plans, expandable cards), Standard Benefits, Cover Options, Underwriter, Policy Accordion, Contact, Footer, Sticky Mobile Bar. Brand design system, Playfair Display serif headings, Framer Motion scroll animations. Fully responsive. Deployed to kasitohomefunerals.co.za via cPanel Git Version Control.',
 NULL, 1, 5500.00, 5500.00),
(5, 30, 'A', NULL, 0, 0, 0, 'Branded PDF brochure - 3 pages, print-ready', NULL,
 'Programmatically generated 3-page PDF via Puppeteer + pdf-lib. Pages: (1) Cover page with logo, contact details, and Atlehang Life underwriter details; (2) All four funeral plans with cover amounts, benefits, and policy notes; (3) Standard benefits, cemetery support, cover options, underwriter, contact, and key policy notes. Delivered as a downloadable file from the website.',
 NULL, 1, 1200.00, 1200.00),
(5, 40, 'A', NULL, 0, 0, 0, 'Agent flyer generator - Custom web tool', NULL,
 'Standalone HTML canvas-based flyer generator for Kasi to Home agents. Features: live preview at 800x1120px, agent name & phone input (updates canvas in real time), photo upload with in-form preview, all 4 funeral plans, included benefits, policy notes, and contact section. Logos base64-embedded (fully offline-capable). Password-gated internal tool deployed at kasitohomefunerals.co.za/agent-flyer.',
 NULL, 1, 1800.00, 1800.00),
(5, 50, 'A', NULL, 0, 0, 0, 'SEO setup & PWA configuration', NULL,
 'Full technical SEO: canonical URL, meta title and description, robots index/follow, Open Graph tags, Twitter Card, LocalBusiness JSON-LD structured data. PWA: site.webmanifest with start_url, scope, maskable and standard icons (192px & 512px), theme_color, background_color. Robots.txt. Sitemap-ready structure.',
 NULL, 1, 950.00, 950.00),
(5, 60, 'A', NULL, 0, 0, 0, 'Git repository & cPanel deployment pipeline setup', NULL,
 'Private GitHub repository created under valo-systems organisation. .cpanel.yml deployment config targeting /home/valosyst/public_html/kasitohomefunerals.co.za. .htaccess with HTTPS enforcement, www to non-www redirect, and React SPA fallback routing. First full deployment executed.',
 NULL, 1, 550.00, 550.00),
(5, 70, 'A', NULL, 0, 0, 0, 'Brand asset pack - Integration & deployment', NULL,
 'Integration of all supplied brand assets: logo in all sizes (16-1024px), favicon set, Apple touch icon, Android Chrome icons, maskable icons, OG image (1200x630), Atlehang Life underwriter logo. Assets organised into public/ and src/assets/, embedded in header (favicons, manifest), and used throughout UI and brochure.',
 NULL, 1, 400.00, 400.00),

(5, 200, 'B',
 'Actual third-party costs incurred on behalf of the client. Passed through at cost with no markup. Domain registration at actual invoiced price. Hosting is billed at R40/month on Valo managed cPanel account.',
 1, 0, 0, 'Section B - Infrastructure & Third-Party Costs', NULL, NULL, NULL, 1, 0.00, 0.00),
(5, 210, 'B', NULL, 0, 0, 0, 'Domain registration - kasitohomefunerals.co.za (1 year)', NULL,
 'Registered via domains.co.za. Valid 1 year from registration date. Renewal at current market rate applies from Year 2.',
 NULL, 1, 99.00, 99.00),
(5, 220, 'B', NULL, 0, 0, 0, 'Website hosting - cPanel shared hosting, 1 year',
 'R40.00/month x 12 months',
 'Hosted on Valo Systems managed cPanel account (valosyst). Deployed to /home/valosyst/public_html/kasitohomefunerals.co.za. Includes SSL (AutoSSL), Git Version Control, email hosting capability.',
 NULL, 12, 40.00, 480.00);


-- ============================================================
-- LINE ITEMS — VAL-OS-2026-001 (OmniSolve AWS)
-- ============================================================
INSERT IGNORE INTO invoice_line_items
    (invoice_id, sort_order, section_label, section_description,
     is_section_header, is_discount, is_estimated,
     description, calculation_detail, item_note,
     usd_amount, quantity, unit_price, total)
VALUES
(6, 10, 'B',
 'AWS costs passed through at cost per VS-OS-TPA-2026-001. Valo development and management fees waived during waiver period ending 24 September 2026.',
 1, 0, 0, 'Section B - AWS Infrastructure Pass-Through', NULL, NULL, NULL, 1, 0.00, 0.00),
(6, 20, 'B', NULL, 0, 0, 0,
 'Amazon Web Services - OmniSolve account 861870144419 (Q1 2026)',
 '444.05 USD x R18.96/USD',
 'AWS Cost Explorer export: cgs-prod tag group. Covers EC2, RDS, S3, CloudFront, Route53, CloudWatch - January to March 2026.',
 444.0500, 1, 8420.03, 8420.03);


-- ============================================================
-- EXPENSES
-- ============================================================
INSERT IGNORE INTO expenses
    (description, category, supplier, amount, usd_amount, fx_rate,
     date, client_id, invoice_id, billable, pass_through, notes)
VALUES
('WinSMS - CGS (327 SMS x R0.38, March 2026)',
 'infrastructure', 'WinSMS', 124.26, NULL, NULL,
 '2026-03-31', 1, 1, 1, 1, 'Bulk SMS billed on VAL-CGS-2026-000'),

('Domain - gassolution.co.za (April 2026)',
 'infrastructure', 'Domain Registrar', 13.00, NULL, NULL,
 '2026-04-01', 1, 2, 1, 1, 'Monthly domain cost passed through'),

('WinSMS - CGS (172 SMS x R0.38, April 2026)',
 'infrastructure', 'WinSMS', 65.36, NULL, NULL,
 '2026-04-30', 1, 2, 1, 1, 'Actual April SMS count from CGS production database'),

('WinSMS - CGS (127 SMS x R0.38, May 2026)',
 'infrastructure', 'WinSMS', 48.26, NULL, NULL,
 '2026-05-31', 1, 3, 1, 1, 'Actual May SMS count from CGS production database'),

('cPanel Hosting - kasitohomefunerals.co.za',
 'infrastructure', 'cPanel', 40.00, NULL, NULL,
 '2026-04-01', 2, NULL, 1, 1, 'Monthly hosting Valo cPanel account'),

('AWS - OmniSolve account 861870144419 (Q1 2026)',
 'infrastructure', 'Amazon Web Services', 8420.03, 444.0500, 18.9600,
 '2026-04-01', 3, 6, 1, 1, 'OmniSolve pays AWS directly per TPA waiver clause'),

('OpenAI ChatGPT Subscription (April 2026)',
 'software', 'OpenAI', 388.52, 20.5000, 18.9500,
 '2026-04-15', NULL, NULL, 0, 0, 'Internal tool cost'),

('Amazon Web Services - Valo infrastructure (April 2026)',
 'infrastructure', 'Amazon Web Services', 311.04, 16.4100, 18.9500,
 '2026-04-02', NULL, NULL, 0, 0, 'Valo platform hosting costs');


-- ============================================================
-- INVOICE ITEM TEMPLATES
-- ============================================================
INSERT IGNORE INTO invoice_item_templates
    (client_id, name, section_label, category,
     description, calculation_detail, item_note,
     default_usd_amount, default_unit_price, sort_order)
VALUES
-- CGS Section A
(1, 'CGS - Platform service fee', 'A', 'service-fee',
 'Platform service fee - {PERIOD}', 'Minimum applies', NULL, NULL, 2000.00, 10),

-- CGS Section B - AWS
(1, 'CGS - EC2 t3.micro',          'B', 'aws', 'EC2 t3.micro',            'cgs-prod-backend (i-0c0e6c431dc1dd9ff)', NULL, 8.3500, 0.00, 20),
(1, 'CGS - EBS 16GB gp3',          'B', 'aws', 'EBS 16GB gp3',             'vol-033e6dee749ed098b',                 NULL, 1.2800, 0.00, 30),
(1, 'CGS - RDS db.t3.micro',       'B', 'aws', 'RDS db.t3.micro instance', 'cgs-prod-postgres',                     NULL, 12.9600, 0.00, 40),
(1, 'CGS - RDS 20GB storage',      'B', 'aws', 'RDS 20GB storage',         'cgs-prod-postgres',                     NULL, 2.3000, 0.00, 50),
(1, 'CGS - RDS automated backups', 'B', 'aws', 'RDS automated backups',    '14-day retention',                      NULL, 0.5000, 0.00, 60),
(1, 'CGS - S3 2 prod buckets',     'B', 'aws', 'S3 (2 prod buckets)',      'cgs-prod-web + cgs-prod-admin-frontend', NULL, 0.0200, 0.00, 70),
(1, 'CGS - CloudFront x 3',        'B', 'aws', 'CloudFront x 3',           'gassolution.co.za, admin, api',         NULL, 0.3000, 0.00, 80),
(1, 'CGS - Secrets Manager x 4',   'B', 'aws', 'Secrets Manager x 4',     'cgs-prod/* (4 secrets)',                NULL, 1.6000, 0.00, 90),
(1, 'CGS - Route53',               'B', 'aws', 'Route53',                  'gassolution.co.za hosted zone + queries', NULL, 0.9000, 0.00, 100),
(1, 'CGS - CloudWatch alarms x 5', 'B', 'aws', 'CloudWatch alarms x 5',   'cgs-prod-* alarms',                     NULL, 0.5000, 0.00, 110),
(1, 'CGS - CloudWatch logs',       'B', 'aws', 'CloudWatch logs',          '/cgs/prod/api + /cgs/prod/api-error',   NULL, 0.1600, 0.00, 120),
(1, 'CGS - EC2 data transfer',     'B', 'aws', 'EC2 data transfer',        'Network egress (API traffic)',           NULL, 0.0500, 0.00, 130),

-- CGS WinSMS
(1, 'CGS - WinSMS SMS', 'B', 'sms',
 'SMS notifications - {PERIOD}', '{N} SMS x R0.38/SMS',
 'Attach WinSMS usage export as evidence.', NULL, 0.38, 140),

-- CGS Domain
(1, 'CGS - Domain monthly', 'B', 'domain',
 'gassolution.co.za domain (1/12 annual)', NULL, NULL, NULL, 13.00, 150),

-- Global templates
(NULL, 'cPanel hosting - monthly', 'B', 'hosting',
 'Website hosting - cPanel shared hosting', 'R40.00/month',
 'Hosted on Valo Systems managed cPanel account (valosyst). Includes SSL (AutoSSL), Git Version Control.',
 NULL, 40.00, 10),

(NULL, 'Domain registration 1 year', 'B', 'domain',
 'Domain registration - {DOMAIN} (1 year)', NULL,
 'Registered via domains.co.za. Renewal at current market rate applies from Year 2.',
 NULL, 99.00, 20);


-- ============================================================
-- DOCUMENTS — CICP Compliance Vault
-- ============================================================
INSERT IGNORE INTO documents (name, ref, category, file_path, status, date, notes) VALUES
('CIPC Registration - CM1 Form (COR14.1)',       'COR-2026-001', 'compliance', '/uploads/documents/cicp/COR14.1.pdf',                    'available', '2026-01-29', 'CIPC CM1 company registration form - VALO (PTY) LTD reg 2026/072094/07'),
('CIPC Registration - Name Reservation (COR14.1A)', 'COR-2026-002', 'compliance', '/uploads/documents/cicp/COR14.1A.pdf',               'available', '2026-01-29', 'CIPC name reservation certificate for Valo (Pty) Ltd'),
('Memorandum of Incorporation (COR14.3)',         'COR-2026-003', 'compliance', '/uploads/documents/cicp/COR14.3.pdf',                    'available', '2026-01-29', 'Standard MOI filed with CIPC on incorporation'),
('CIPC Registration Certificate (COR15.1A)',      'COR-2026-004', 'compliance', '/uploads/documents/cicp/COR15.1A.pdf',                   'available', '2026-01-29', 'Official CIPC certificate of incorporation - primary registration document'),
('CIPC Welcome Letter',                           'COR-2026-005', 'compliance', '/uploads/documents/cicp/CIPC-Welcome-Letter.pdf',        'available', '2026-01-29', 'CIPC welcome letter issued on registration'),
('SARS Income Tax Registration',                  'TAX-2026-001', 'tax',        '/uploads/documents/cicp/SARS-Tax-Registration.pdf',       'available', '2026-01-29', 'SARS income tax registration - tax number 9594324221'),
('CSD Registration Summary Report',               'CSD-2026-001', 'compliance', '/uploads/documents/cicp/CSD-Registration-Summary.pdf',   'available', '2026-05-23', 'Central Supplier Database registration - CSD number MAAA1722994'),
('B-BBEE Verification Certificate - Level 1',     'BEE-2026-001', 'compliance', '/uploads/documents/cicp/BEE-Verification-Level1.pdf',    'available', '2026-02-05', 'B-BBEE Level 1 EME certificate. Expires 2027-01-01'),
('B-BBEE Sworn Affidavit',                        'BEE-2026-002', 'compliance', '/uploads/documents/cicp/BEE-Sworn-Affidavit.pdf',         'available', '2026-01-30', 'Sworn affidavit supporting Exempt Micro Enterprise B-BBEE Level 1 status'),
('Bank Account Confirmation - FNB',               'BNK-2026-001', 'banking',    '/uploads/documents/cicp/Bank-FNB-Account-Confirmation.pdf', 'available', '2026-05-17', 'FNB Gold Business Account confirmation - account 63194158987, branch 255355'),
('Bank Account Confirmation - Capitec',           'BNK-2026-002', 'banking',    '/uploads/documents/cicp/Bank-Capitec-Account-Confirmation.pdf', 'available', '2026-05-17', 'Capitec Business account confirmation - account 1055332383, branch 450105'),
('Company Proof of Address',                      'POA-2026-001', 'compliance', '/uploads/documents/cicp/Proof-Of-Address.pdf',            'available', '2026-05-17', '50 C Carlswald Luxury Apartments, 82 Tamboti Rd, Carlswald, Midrand');


-- ============================================================
-- EMAIL TEMPLATES
-- ON DUPLICATE KEY UPDATE makes re-running safe.
-- ============================================================
INSERT INTO email_templates (name, slug, subject, body_html, variables) VALUES (
  'Onboarding / Contract',
  'onboarding',
  'Invoice {{invoice_number}} & Technology Platform Agreement - Valo Systems',
  '<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Invoice {{invoice_number}} - Valo Systems</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4f4f4;padding:32px 0;">
<tr><td align="center">
  <table width="600" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;border-radius:4px;overflow:hidden;border:1px solid #e0e0e0;">
    <tr><td style="background:#d4af37;height:4px;font-size:0;line-height:0;">&nbsp;</td></tr>
    <tr>
      <td style="padding:28px 40px 20px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="vertical-align:middle;width:64px;">
              <img src="cid:valo_logo" alt="Valo Systems" width="56" height="56" style="display:block;border:0;">
            </td>
            <td style="vertical-align:middle;padding-left:16px;">
              <p style="margin:0;font-size:15px;font-weight:bold;color:#1a1a1a;letter-spacing:0.5px;">VALO SYSTEMS</p>
              <p style="margin:3px 0 0;font-size:12px;color:#888888;">Software Development &amp; Digital Systems</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding:0 40px 24px;border-bottom:1px solid #eeeeee;">
        <p style="margin:0;font-size:20px;font-weight:bold;color:#1a1a1a;">Invoice {{invoice_number}}</p>
        <p style="margin:6px 0 0;font-size:14px;color:#555555;">Technology Platform Agreement</p>
      </td>
    </tr>
    <tr>
      <td style="padding:28px 40px 0;">
        <p style="margin:0 0 16px;font-size:15px;color:#333333;line-height:1.6;">Dear {{contact_name}},</p>
        <p style="margin:0 0 16px;font-size:15px;color:#333333;line-height:1.6;">
          Please find attached invoice <strong>{{invoice_number}}</strong> for <strong>{{client_name}}</strong>,
          together with our Technology Platform Agreement.
          This covers the initial setup, onboarding, and the first period of service on the Valo platform.
        </p>
        <p style="margin:0 0 24px;font-size:15px;color:#333333;line-height:1.6;">
          Please review both documents and return the signed agreement at your earliest convenience
          so we can proceed with the activation of your account.
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:0 40px 28px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0"
               style="background:#fafafa;border:1px solid #e8dfc0;border-left:4px solid #d4af37;border-radius:3px;">
          <tr>
            <td style="padding:20px 24px;">
              <p style="margin:0 0 4px;font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#888888;">Amount Due</p>
              <p style="margin:0;font-size:32px;font-weight:bold;color:#1a1a1a;">{{invoice_amount}}</p>
              {{#if due_date}}
              <p style="margin:8px 0 0;font-size:13px;color:#666666;">Due by {{due_date}}</p>
              {{/if due_date}}
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding:0 40px 28px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0"
               style="background:#fffbf0;border:1px solid #f0e8cc;border-radius:3px;">
          <tr>
            <td style="padding:16px 20px;">
              <p style="margin:0;font-size:13px;color:#7a6020;line-height:1.6;">
                <strong>Payment reference:</strong> Please use <strong>{{invoice_number}}</strong> as your payment reference.
                Payments should only be made to the banking details shown on the attached invoice.
                If you receive any communication asking you to pay to different banking details, please contact us immediately before making any payment.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding:0 40px 32px;">
        <p style="margin:0 0 16px;font-size:15px;color:#333333;line-height:1.6;">
          If anything on this invoice or agreement needs to be corrected before payment, please reply to this email and we will assist.
        </p>
        <p style="margin:0;font-size:15px;color:#333333;line-height:1.6;">
          Thank you for choosing Valo Systems - we look forward to working with you.
        </p>
      </td>
    </tr>
    <tr>
      <td style="background:#f9f9f9;border-top:1px solid #eeeeee;padding:20px 40px;">
        <p style="margin:0;font-size:13px;font-weight:bold;color:#1a1a1a;letter-spacing:0.5px;">VALO SYSTEMS</p>
        <p style="margin:2px 0 0;font-size:12px;color:#777777;">Software Development &amp; Digital Systems</p>
        <p style="margin:6px 0 0;font-size:12px;color:#777777;">
          <a href="mailto:billing@valosystems.co.za" style="color:#d4af37;text-decoration:none;">billing@valosystems.co.za</a>
          &nbsp;·&nbsp;
          <a href="https://valosystems.co.za" style="color:#d4af37;text-decoration:none;">valosystems.co.za</a>
        </p>
      </td>
    </tr>
  </table>
</td></tr>
</table>
</body>
</html>',
  '[{"key":"contact_name","label":"Contact name","example":"John"},{"key":"client_name","label":"Client name","example":"CGS"},{"key":"invoice_number","label":"Invoice number","example":"VAL-CGS-2026-001"},{"key":"invoice_amount","label":"Invoice amount","example":"R 3,500.00"},{"key":"due_date","label":"Due date","example":"30 June 2026"}]'
)
ON DUPLICATE KEY UPDATE
  name      = VALUES(name),
  subject   = VALUES(subject),
  body_html = VALUES(body_html),
  variables = VALUES(variables);


INSERT INTO email_templates (name, slug, subject, body_html, variables) VALUES (
  'Monthly Billing',
  'monthly-billing',
  'Invoice {{invoice_number}} - {{period}} - Valo Systems',
  '<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Invoice {{invoice_number}} - Valo Systems</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4f4f4;padding:32px 0;">
<tr><td align="center">
  <table width="600" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;border-radius:4px;overflow:hidden;border:1px solid #e0e0e0;">
    <tr><td style="background:#d4af37;height:4px;font-size:0;line-height:0;">&nbsp;</td></tr>
    <tr>
      <td style="padding:28px 40px 20px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="vertical-align:middle;width:64px;">
              <img src="cid:valo_logo" alt="Valo Systems" width="56" height="56" style="display:block;border:0;">
            </td>
            <td style="vertical-align:middle;padding-left:16px;">
              <p style="margin:0;font-size:15px;font-weight:bold;color:#1a1a1a;letter-spacing:0.5px;">VALO SYSTEMS</p>
              <p style="margin:3px 0 0;font-size:12px;color:#888888;">Software Development &amp; Digital Systems</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding:0 40px 24px;border-bottom:1px solid #eeeeee;">
        <p style="margin:0;font-size:20px;font-weight:bold;color:#1a1a1a;">Invoice {{invoice_number}}</p>
        <p style="margin:6px 0 0;font-size:14px;color:#555555;">{{period}}</p>
      </td>
    </tr>
    <tr>
      <td style="padding:28px 40px 0;">
        <p style="margin:0 0 16px;font-size:15px;color:#333333;line-height:1.6;">Dear {{contact_name}},</p>
        <p style="margin:0 0 16px;font-size:15px;color:#333333;line-height:1.6;">
          Please find attached invoice <strong>{{invoice_number}}</strong> for <strong>{{client_name}}</strong>
          covering the period <strong>{{period}}</strong>.
          This invoice relates to the ongoing software development and digital systems services provided
          under your agreement with Valo Systems.
        </p>
        <p style="margin:0 0 24px;font-size:15px;color:#333333;line-height:1.6;">
          Please review the attached invoice at your convenience.
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:0 40px 28px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0"
               style="background:#fafafa;border:1px solid #e8dfc0;border-left:4px solid #d4af37;border-radius:3px;">
          <tr>
            <td style="padding:20px 24px;">
              <p style="margin:0 0 4px;font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#888888;">Amount Due</p>
              <p style="margin:0;font-size:32px;font-weight:bold;color:#1a1a1a;">{{invoice_amount}}</p>
              {{#if due_date}}
              <p style="margin:8px 0 0;font-size:13px;color:#666666;">Due by {{due_date}}</p>
              {{/if due_date}}
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding:0 40px 28px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0"
               style="background:#fffbf0;border:1px solid #f0e8cc;border-radius:3px;">
          <tr>
            <td style="padding:16px 20px;">
              <p style="margin:0;font-size:13px;color:#7a6020;line-height:1.6;">
                <strong>Payment reference:</strong> Please use <strong>{{invoice_number}}</strong> as your payment reference.
                Payments should only be made to the banking details shown on the attached invoice.
                If you receive any communication asking you to pay to different banking details, please contact us immediately before making any payment.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding:0 40px 32px;">
        <p style="margin:0 0 16px;font-size:15px;color:#333333;line-height:1.6;">
          If anything on this invoice needs to be corrected before payment, please reply to this email and we will assist.
        </p>
        <p style="margin:0;font-size:15px;color:#333333;line-height:1.6;">
          Thank you - we appreciate your continued partnership.
        </p>
      </td>
    </tr>
    <tr>
      <td style="background:#f9f9f9;border-top:1px solid #eeeeee;padding:20px 40px;">
        <p style="margin:0;font-size:13px;font-weight:bold;color:#1a1a1a;letter-spacing:0.5px;">VALO SYSTEMS</p>
        <p style="margin:2px 0 0;font-size:12px;color:#777777;">Software Development &amp; Digital Systems</p>
        <p style="margin:6px 0 0;font-size:12px;color:#777777;">
          <a href="mailto:billing@valosystems.co.za" style="color:#d4af37;text-decoration:none;">billing@valosystems.co.za</a>
          &nbsp;·&nbsp;
          <a href="https://valosystems.co.za" style="color:#d4af37;text-decoration:none;">valosystems.co.za</a>
        </p>
      </td>
    </tr>
  </table>
</td></tr>
</table>
</body>
</html>',
  '[{"key":"contact_name","label":"Contact name","example":"John"},{"key":"client_name","label":"Client name","example":"CGS"},{"key":"invoice_number","label":"Invoice number","example":"VAL-CGS-2026-002"},{"key":"invoice_amount","label":"Invoice amount","example":"R 3,500.00"},{"key":"period","label":"Billing period","example":"June 2026"},{"key":"due_date","label":"Due date","example":"30 June 2026"}]'
)
ON DUPLICATE KEY UPDATE
  name      = VALUES(name),
  subject   = VALUES(subject),
  body_html = VALUES(body_html),
  variables = VALUES(variables);


SET FOREIGN_KEY_CHECKS = 1;

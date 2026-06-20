-- ============================================================
-- CGS Invoice Patch: correct -001, add -002 and -003
-- Generated: 2026-06-21
-- FX rates: SARB interbank mid-rate + 8% cover (Frankfurter API)
-- SMS counts: actual from CGS production DB via SSM
-- ============================================================

-- ── 1. Correct VAL-CGS-2026-001 (April 2026) ─────────────────
--   Original was estimated (FX R20, SMS 350 est.)
--   Actual: FX R18.1335 (mid R16.7903), SMS 172 actual
--   New total: R2,602.78

UPDATE invoices
SET
  subtotal    = 2602.78,
  total       = 2602.78,
  fx_rate     = 18.1335,
  fx_policy   = 'SARB interbank mid-rate + 8% FX cover on billing date (1 May 2026) — mid-rate R16.7903',
  internal_notes = 'Corrected 2026-06-21: FX updated from estimated R20 to actual R18.1335. SMS updated from 350 estimated to 172 actual (101 OTPs + 71 order status notifications from CGS production DB).'
WHERE number = 'VAL-CGS-2026-001';

-- Delete old Section B line items for invoice 2 (keep Section A items 4,5)
DELETE FROM invoice_line_items WHERE invoice_id = 2 AND sort_order >= 100;

-- Re-insert corrected Section B for VAL-CGS-2026-001
INSERT INTO invoice_line_items
  (invoice_id, sort_order, section_label, section_description, is_section_header, is_discount, is_estimated, description, calculation_detail, item_note, usd_amount, quantity, unit_price, total)
VALUES
-- Section B header
(2, 100, 'B', 'AWS costs are converted from USD to ZAR using the SARB interbank mid-rate + 8% FX cover on the billing date. This buffer protects both parties from exchange rate movement during the 14-day payment window. No markup beyond FX cover is applied.', 1, 0, 0, 'Section B — Infrastructure Pass-Through (At Cost + FX Cover)', NULL, NULL, NULL, 1, 0.00, 0.00),
-- AWS prod subheader
(2, 110, 'B', NULL, 1, 0, 0, 'AWS Prod Infrastructure — April 2026', NULL, NULL, NULL, 1, 0.00, 0.00),
-- AWS line items (FX R18.1335)
(2, 120, 'B', NULL, 0, 0, 0, 'EC2 t3.micro', 'cgs-prod-backend (i-0c0e6c431dc1dd9ff)', NULL, 8.35, 1, 151.41, 151.41),
(2, 130, 'B', NULL, 0, 0, 0, 'EBS 16GB gp3', 'vol-033e6dee749ed098b', NULL, 1.28, 1, 23.21, 23.21),
(2, 140, 'B', NULL, 0, 0, 0, 'RDS db.t3.micro instance', 'cgs-prod-postgres', NULL, 12.96, 1, 235.01, 235.01),
(2, 150, 'B', NULL, 0, 0, 0, 'RDS 20GB storage', 'cgs-prod-postgres', NULL, 2.30, 1, 41.71, 41.71),
(2, 160, 'B', NULL, 0, 0, 0, 'RDS automated backups', '14-day retention', NULL, 0.50, 1, 9.07, 9.07),
(2, 170, 'B', NULL, 0, 0, 0, 'S3 (2 prod buckets)', 'cgs-prod-web + cgs-prod-admin-frontend', NULL, 0.02, 1, 0.36, 0.36),
(2, 180, 'B', NULL, 0, 0, 0, 'CloudFront × 3', 'gassolution.co.za, admin, api', NULL, 0.30, 1, 5.44, 5.44),
(2, 190, 'B', NULL, 0, 0, 0, 'Secrets Manager × 4', 'cgs-prod/* (4 secrets)', NULL, 1.60, 1, 29.01, 29.01),
(2, 200, 'B', NULL, 0, 0, 0, 'Route53', 'gassolution.co.za hosted zone + queries', NULL, 0.90, 1, 16.32, 16.32),
(2, 210, 'B', NULL, 0, 0, 0, 'CloudWatch alarms × 5', 'cgs-prod-* alarms', NULL, 0.50, 1, 9.07, 9.07),
(2, 220, 'B', NULL, 0, 0, 0, 'CloudWatch logs', '/cgs/prod/api + /cgs/prod/api-error', NULL, 0.16, 1, 2.90, 2.90),
(2, 230, 'B', NULL, 0, 0, 0, 'EC2 data transfer', 'Network egress (API traffic)', NULL, 0.05, 1, 0.91, 0.91),
-- WinSMS header
(2, 300, 'B', NULL, 1, 0, 0, 'WinSMS — SMS Notifications (April 2026)', NULL, NULL, NULL, 1, 0.00, 0.00),
-- SMS actual
(2, 310, 'B', NULL, 0, 0, 0, 'SMS notifications — April 2026', '172 SMS × R0.38/SMS', '101 OTP login verifications + 71 order status notifications. Actual count from CGS production database.', NULL, 172, 0.38, 65.36),
-- Domain header + line
(2, 400, 'B', NULL, 1, 0, 0, 'Domain', NULL, NULL, NULL, 1, 0.00, 0.00),
(2, 410, 'B', NULL, 0, 0, 0, 'gassolution.co.za domain (1/12 annual)', NULL, NULL, NULL, 1, 13.00, 13.00);


-- ── 2. Insert VAL-CGS-2026-002 (May 2026) ─────────────────────
--   FX R17.5539 (mid R16.2536 on 1 Jun 2026)
--   SMS 127 actual, total R2,568.94

INSERT INTO invoices
  (client_id, number, invoice_type, period, period_from, period_to, period_note,
   date, due_date, status, subtotal, vat, total,
   fx_rate, fx_policy, footer_note)
VALUES
  (1, 'VAL-CGS-2026-002', 'monthly_service', 'May 2026', '2026-05-01', '2026-05-31',
   'Second monthly billing period under the Technology Partnership Agreement.',
   '2026-06-01', '2026-06-15', 'confirmed', 2568.94, 0.00, 2568.94,
   17.5539, 'SARB interbank mid-rate + 8% FX cover on billing date (1 June 2026) — mid-rate R16.2536',
   'This invoice is issued in accordance with the Technology Partnership Agreement between Valo Systems and Convenient Gas Solutions.');

SET @inv002 = LAST_INSERT_ID();

INSERT INTO invoice_line_items
  (invoice_id, sort_order, section_label, section_description, is_section_header, is_discount, is_estimated, description, calculation_detail, item_note, usd_amount, quantity, unit_price, total)
VALUES
-- Section A
(@inv002, 10, 'A', '5% of gross delivered order value. Minimum R2,000/month applies during the first 6 months (ramp-up period) or until 5% share exceeds R2,000.', 1, 0, 0, 'Section A — Valo Technology Service Fee', NULL, NULL, NULL, 1, 0.00, 0.00),
(@inv002, 20, 'A', NULL, 0, 0, 0, 'Platform service fee — May 2026', 'Second operating month — minimum applies', NULL, NULL, 1, 2000.00, 2000.00),
-- Section B header
(@inv002, 100, 'B', 'AWS costs are converted from USD to ZAR using the SARB interbank mid-rate + 8% FX cover on the billing date. This buffer protects both parties from exchange rate movement during the 14-day payment window. No markup beyond FX cover is applied.', 1, 0, 0, 'Section B — Infrastructure Pass-Through (At Cost + FX Cover)', NULL, NULL, NULL, 1, 0.00, 0.00),
-- AWS prod subheader
(@inv002, 110, 'B', NULL, 1, 0, 0, 'AWS Prod Infrastructure — May 2026', NULL, NULL, NULL, 1, 0.00, 0.00),
-- AWS line items (FX R17.5539)
(@inv002, 120, 'B', NULL, 0, 0, 0, 'EC2 t3.micro', 'cgs-prod-backend (i-0c0e6c431dc1dd9ff)', NULL, 8.35, 1, 146.58, 146.58),
(@inv002, 130, 'B', NULL, 0, 0, 0, 'EBS 16GB gp3', 'vol-033e6dee749ed098b', NULL, 1.28, 1, 22.47, 22.47),
(@inv002, 140, 'B', NULL, 0, 0, 0, 'RDS db.t3.micro instance', 'cgs-prod-postgres', NULL, 12.96, 1, 227.50, 227.50),
(@inv002, 150, 'B', NULL, 0, 0, 0, 'RDS 20GB storage', 'cgs-prod-postgres', NULL, 2.30, 1, 40.37, 40.37),
(@inv002, 160, 'B', NULL, 0, 0, 0, 'RDS automated backups', '14-day retention', NULL, 0.50, 1, 8.78, 8.78),
(@inv002, 170, 'B', NULL, 0, 0, 0, 'S3 (2 prod buckets)', 'cgs-prod-web + cgs-prod-admin-frontend', NULL, 0.02, 1, 0.35, 0.35),
(@inv002, 180, 'B', NULL, 0, 0, 0, 'CloudFront × 3', 'gassolution.co.za, admin, api', NULL, 0.30, 1, 5.27, 5.27),
(@inv002, 190, 'B', NULL, 0, 0, 0, 'Secrets Manager × 4', 'cgs-prod/* (4 secrets)', NULL, 1.60, 1, 28.09, 28.09),
(@inv002, 200, 'B', NULL, 0, 0, 0, 'Route53', 'gassolution.co.za hosted zone + queries', NULL, 0.90, 1, 15.80, 15.80),
(@inv002, 210, 'B', NULL, 0, 0, 0, 'CloudWatch alarms × 5', 'cgs-prod-* alarms', NULL, 0.50, 1, 8.78, 8.78),
(@inv002, 220, 'B', NULL, 0, 0, 0, 'CloudWatch logs', '/cgs/prod/api + /cgs/prod/api-error', NULL, 0.16, 1, 2.81, 2.81),
(@inv002, 230, 'B', NULL, 0, 0, 0, 'EC2 data transfer', 'Network egress (API traffic)', NULL, 0.05, 1, 0.88, 0.88),
-- WinSMS header
(@inv002, 300, 'B', NULL, 1, 0, 0, 'WinSMS — SMS Notifications (May 2026)', NULL, NULL, NULL, 1, 0.00, 0.00),
(@inv002, 310, 'B', NULL, 0, 0, 0, 'SMS notifications — May 2026', '127 SMS × R0.38/SMS', '74 OTP login verifications + 53 order status notifications. Actual count from CGS production database.', NULL, 127, 0.38, 48.26),
-- Domain
(@inv002, 400, 'B', NULL, 1, 0, 0, 'Domain', NULL, NULL, NULL, 1, 0.00, 0.00),
(@inv002, 410, 'B', NULL, 0, 0, 0, 'gassolution.co.za domain (1/12 annual)', NULL, NULL, NULL, 1, 13.00, 13.00);


-- ── 3. Insert VAL-CGS-2026-003 (June 2026, estimated) ─────────
--   FX R17.7919 (mid R16.474 on 20 Jun 2026)
--   SMS 86 to date (partial month — estimated)
--   total R2,560.23 (estimate)

INSERT INTO invoices
  (client_id, number, invoice_type, period, period_from, period_to, period_note,
   date, due_date, status, subtotal, vat, total,
   fx_rate, fx_policy, footer_note)
VALUES
  (1, 'VAL-CGS-2026-003', 'monthly_service', 'June 2026', '2026-06-01', '2026-06-30',
   'Third monthly billing period. AWS costs and SMS count are estimated based on actual June-to-date data (20 June 2026). Final figure will be confirmed at month-end.',
   '2026-07-01', '2026-07-15', 'draft', 2560.23, 0.00, 2560.23,
   17.7919, 'SARB interbank mid-rate + 8% FX cover (20 June 2026) — mid-rate R16.474. Rate will be re-confirmed on 1 July 2026 billing date.',
   'This invoice is issued in accordance with the Technology Partnership Agreement between Valo Systems and Convenient Gas Solutions.');

SET @inv003 = LAST_INSERT_ID();

INSERT INTO invoice_line_items
  (invoice_id, sort_order, section_label, section_description, is_section_header, is_discount, is_estimated, description, calculation_detail, item_note, usd_amount, quantity, unit_price, total)
VALUES
-- Section A
(@inv003, 10, 'A', '5% of gross delivered order value. Minimum R2,000/month applies during the first 6 months (ramp-up period) or until 5% share exceeds R2,000.', 1, 0, 0, 'Section A — Valo Technology Service Fee', NULL, NULL, NULL, 1, 0.00, 0.00),
(@inv003, 20, 'A', NULL, 0, 0, 0, 'Platform service fee — June 2026', 'Third operating month — minimum applies', NULL, NULL, 1, 2000.00, 2000.00),
-- Section B header
(@inv003, 100, 'B', 'AWS costs are converted from USD to ZAR using the SARB interbank mid-rate + 8% FX cover on the billing date. This buffer protects both parties from exchange rate movement during the 14-day payment window. No markup beyond FX cover is applied.', 1, 0, 0, 'Section B — Infrastructure Pass-Through (At Cost + FX Cover)', NULL, NULL, NULL, 1, 0.00, 0.00),
-- AWS prod subheader
(@inv003, 110, 'B', NULL, 1, 0, 0, 'AWS Prod Infrastructure — June 2026', NULL, NULL, NULL, 1, 0.00, 0.00),
-- AWS line items (FX R17.7919, estimated)
(@inv003, 120, 'B', NULL, 0, 0, 1, 'EC2 t3.micro', 'cgs-prod-backend (i-0c0e6c431dc1dd9ff)', NULL, 8.35, 1, 148.56, 148.56),
(@inv003, 130, 'B', NULL, 0, 0, 1, 'EBS 16GB gp3', 'vol-033e6dee749ed098b', NULL, 1.28, 1, 22.77, 22.77),
(@inv003, 140, 'B', NULL, 0, 0, 1, 'RDS db.t3.micro instance', 'cgs-prod-postgres', NULL, 12.96, 1, 230.58, 230.58),
(@inv003, 150, 'B', NULL, 0, 0, 1, 'RDS 20GB storage', 'cgs-prod-postgres', NULL, 2.30, 1, 40.92, 40.92),
(@inv003, 160, 'B', NULL, 0, 0, 1, 'RDS automated backups', '14-day retention', NULL, 0.50, 1, 8.90, 8.90),
(@inv003, 170, 'B', NULL, 0, 0, 1, 'S3 (2 prod buckets)', 'cgs-prod-web + cgs-prod-admin-frontend', NULL, 0.02, 1, 0.36, 0.36),
(@inv003, 180, 'B', NULL, 0, 0, 1, 'CloudFront × 3', 'gassolution.co.za, admin, api', NULL, 0.30, 1, 5.34, 5.34),
(@inv003, 190, 'B', NULL, 0, 0, 1, 'Secrets Manager × 4', 'cgs-prod/* (4 secrets)', NULL, 1.60, 1, 28.47, 28.47),
(@inv003, 200, 'B', NULL, 0, 0, 1, 'Route53', 'gassolution.co.za hosted zone + queries', NULL, 0.90, 1, 16.01, 16.01),
(@inv003, 210, 'B', NULL, 0, 0, 1, 'CloudWatch alarms × 5', 'cgs-prod-* alarms', NULL, 0.50, 1, 8.90, 8.90),
(@inv003, 220, 'B', NULL, 0, 0, 1, 'CloudWatch logs', '/cgs/prod/api + /cgs/prod/api-error', NULL, 0.16, 1, 2.85, 2.85),
(@inv003, 230, 'B', NULL, 0, 0, 1, 'EC2 data transfer', 'Network egress (API traffic)', NULL, 0.05, 1, 0.89, 0.89),
-- WinSMS header
(@inv003, 300, 'B', NULL, 1, 0, 0, 'WinSMS — SMS Notifications (June 2026)', NULL, NULL, NULL, 1, 0.00, 0.00),
(@inv003, 310, 'B', NULL, 0, 0, 1, 'SMS notifications — June 2026', '86 SMS × R0.38/SMS', 'June-to-date count (20 Jun 2026): 61 OTP login verifications + 25 order status notifications. Estimated to ~129 SMS for full month. Final count to be confirmed at month-end.', NULL, 86, 0.38, 32.68),
-- Domain
(@inv003, 400, 'B', NULL, 1, 0, 0, 'Domain', NULL, NULL, NULL, 1, 0.00, 0.00),
(@inv003, 410, 'B', NULL, 0, 0, 0, 'gassolution.co.za domain (1/12 annual)', NULL, NULL, NULL, 1, 13.00, 13.00);

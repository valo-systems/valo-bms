-- ============================================================
-- Valo BMS — MySQL Database Schema & Seed Data
-- Version: 2.0 — Clean rebuild
--
-- Engine  : InnoDB (ACID, foreign keys, row-level locking)
-- Charset : utf8mb4 / utf8mb4_unicode_ci  (full Unicode + emoji)
-- Naming  : snake_case, lowercase
-- PKs     : INT UNSIGNED AUTO_INCREMENT
-- Money   : DECIMAL(12,2) — never FLOAT for currency
-- Booleans: TINYINT(1)  — 1=true, 0=false
-- Enums   : ENUM() for all constrained string columns
-- Auditing: created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
--            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
--
-- Run as: mysql -u root -p < db_setup.sql
-- ============================================================

SET NAMES utf8mb4;
SET time_zone = '+02:00';   -- SAST
SET FOREIGN_KEY_CHECKS = 0;

DROP DATABASE IF EXISTS valo_bms;
CREATE DATABASE valo_bms
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE valo_bms;

-- ============================================================
-- USERS
-- Valo BMS system users. Role-based access control.
-- ============================================================
CREATE TABLE users (
    id               INT UNSIGNED     NOT NULL AUTO_INCREMENT,
    name             VARCHAR(100)     NOT NULL,
    email            VARCHAR(150)     NOT NULL,
    password_hash    VARCHAR(255)     NOT NULL,
    role             ENUM('admin','finance','viewer') NOT NULL DEFAULT 'finance',
    active           TINYINT(1)       NOT NULL DEFAULT 1,
    -- Profile
    title            VARCHAR(100)     NULL,
    department       VARCHAR(100)     NULL,
    phone            VARCHAR(50)      NULL,
    -- Identity & compliance
    id_number        VARCHAR(20)      NULL,
    date_of_birth    DATE             NULL,
    nationality      VARCHAR(50)      NULL,
    address          TEXT             NULL,
    -- Employment
    start_date       DATE             NULL,
    employment_type  VARCHAR(50)      NULL,
    notes            TEXT             NULL,
    -- Payroll / banking
    bank_name        VARCHAR(100)     NULL,
    bank_account     VARCHAR(50)      NULL,
    bank_branch      VARCHAR(20)      NULL,
    bank_type        VARCHAR(50)      NULL,
    tax_number       VARCHAR(30)      NULL,
    -- Audit
    created_at       TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY uq_users_email     (email),
    KEY        idx_users_role     (role),
    KEY        idx_users_active   (active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='BMS users and Valo team members';


-- ============================================================
-- CLIENTS
-- Billable client accounts with full contract configuration.
-- ============================================================
CREATE TABLE clients (
    id                     INT UNSIGNED     NOT NULL AUTO_INCREMENT,
    name                   VARCHAR(150)     NOT NULL,
    code                   VARCHAR(10)      NOT NULL COMMENT 'Short uppercase code used in invoice numbers',
    trading_name           VARCHAR(150)     NULL,
    email                  VARCHAR(150)     NULL,
    accounts_email         VARCHAR(150)     NULL,
    phone                  VARCHAR(50)      NULL,
    contact_person         VARCHAR(100)     NULL,
    company_registration   VARCHAR(50)      NULL,
    address                TEXT             NULL,
    -- Billing configuration
    billing_model          ENUM('project','percentage','retainer','passthrough','hourly') NOT NULL DEFAULT 'project',
    payment_terms          TINYINT UNSIGNED NOT NULL DEFAULT 30 COMMENT 'Days',
    service_fee_pct        DECIMAL(5,2)     NULL COMMENT 'For percentage billing model',
    minimum_monthly        DECIMAL(12,2)    NULL,
    minimum_period_months  TINYINT UNSIGNED NULL,
    minimum_description    TEXT             NULL,
    late_interest_policy   VARCHAR(255)     NULL DEFAULT 'South African prime lending rate + 2% per annum, calculated daily from due date',
    fx_policy              VARCHAR(255)     NULL DEFAULT 'SARB interbank mid-rate + 8% FX cover on billing date',
    sms_rate               DECIMAL(8,4)     NULL COMMENT 'Per-SMS rate in ZAR',
    sms_provider           VARCHAR(50)      NULL,
    domain                 VARCHAR(150)     NULL,
    domain_monthly         DECIMAL(8,2)     NULL COMMENT 'Monthly domain cost pass-through',
    hosting                VARCHAR(255)     NULL,
    -- Agreement
    agreement_ref          VARCHAR(100)     NULL,
    platform_live_date     DATE             NULL,
    first_billing_month    VARCHAR(50)      NULL,
    agreement_notes        TEXT             NULL,
    notes                  TEXT             NULL,
    status                 ENUM('active','inactive') NOT NULL DEFAULT 'active',
    contract_start         DATE             NULL,
    -- Audit
    created_at             TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at             TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY uq_clients_code   (code),
    KEY        idx_clients_status (status),
    KEY        idx_clients_name   (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Client accounts and billing configuration';


-- ============================================================
-- INVOICES
-- Tax invoices issued by Valo Systems.
-- ============================================================
CREATE TABLE invoices (
    id                     INT UNSIGNED     NOT NULL AUTO_INCREMENT,
    client_id              INT UNSIGNED     NOT NULL,
    number                 VARCHAR(30)      NOT NULL COMMENT 'Format: VAL-{CODE}-{YEAR}-{SEQ}',
    invoice_type           ENUM('monthly_service','implementation','project','infrastructure','custom') NOT NULL DEFAULT 'monthly_service',
    -- Period
    period                 VARCHAR(50)      NULL COMMENT 'Human label e.g. April 2026',
    period_from            DATE             NULL,
    period_to              DATE             NULL,
    period_note            TEXT             NULL COMMENT 'Shown below header on printed invoice',
    -- Dates
    date                   DATE             NOT NULL,
    due_date               DATE             NULL,
    -- Financials
    status                 ENUM('draft','estimated','confirmed','sent','partial','paid','overdue') NOT NULL DEFAULT 'draft',
    subtotal               DECIMAL(12,2)    NOT NULL DEFAULT 0.00,
    vat                    DECIMAL(12,2)    NOT NULL DEFAULT 0.00,
    total                  DECIMAL(12,2)    NOT NULL DEFAULT 0.00,
    -- FX
    fx_rate                DECIMAL(10,4)    NULL COMMENT 'ZAR per USD applied on billing date',
    fx_policy              VARCHAR(255)     NULL,
    -- Text blocks
    commercial_conditions  TEXT             NULL,
    notes                  TEXT             NULL COMMENT 'Shown on printed invoice',
    internal_notes         TEXT             NULL COMMENT 'Never printed',
    footer_note            TEXT             NULL,
    -- Audit
    created_at             TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at             TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY uq_invoices_number   (number),
    KEY        idx_invoices_client  (client_id),
    KEY        idx_invoices_status  (status),
    KEY        idx_invoices_date    (date),
    KEY        idx_invoices_due     (due_date),
    CONSTRAINT fk_invoices_client FOREIGN KEY (client_id)
        REFERENCES clients(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Tax invoices issued by Valo Systems';


-- ============================================================
-- INVOICE LINE ITEMS
-- Individual rows within an invoice, grouped by section_label.
--
-- Three logical row types (determined by flags):
--   1. Regular item     — is_section_header=0, is_discount=0
--   2. Discount line    — is_discount=1          (negative total, shown in green)
--   3. Sub-section row  — is_section_header=1    (spans all columns, groups items)
--
-- section_description: policy text shown under the section heading
--   (e.g. "5% of gross delivered order value. Minimum R2,000/month applies...")
--   Store on the first item of each unique section_label; leave NULL on others.
-- ============================================================
CREATE TABLE invoice_line_items (
    id                  INT UNSIGNED      NOT NULL AUTO_INCREMENT,
    invoice_id          INT UNSIGNED      NOT NULL,
    sort_order          SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    -- Section grouping
    section_label       VARCHAR(10)       NULL COMMENT 'A, B, or custom key',
    section_description TEXT              NULL COMMENT 'Policy text under the section heading (first item only)',
    -- Row type flags
    is_section_header   TINYINT(1)        NOT NULL DEFAULT 0 COMMENT 'Spanning sub-group row (no amount)',
    is_discount         TINYINT(1)        NOT NULL DEFAULT 0 COMMENT 'Negative amount shown in green',
    is_estimated        TINYINT(1)        NOT NULL DEFAULT 0 COMMENT 'Shows Est. badge; invoice shows estimated banner',
    -- Content
    description         TEXT              NOT NULL,
    calculation_detail  TEXT              NULL COMMENT 'e.g. "327 SMS × R0.38"',
    item_note           TEXT              NULL COMMENT 'Indented detail text on printed invoice',
    -- Amounts
    usd_amount          DECIMAL(12,4)     NULL,
    quantity            DECIMAL(10,4)     NOT NULL DEFAULT 1.0000,
    unit_price          DECIMAL(12,2)     NOT NULL DEFAULT 0.00,
    total               DECIMAL(12,2)     NOT NULL DEFAULT 0.00,
    -- Source (if generated from template library)
    template_id         INT UNSIGNED      NULL,
    -- Audit
    created_at          TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    KEY idx_line_items_invoice  (invoice_id),
    KEY idx_line_items_sort     (invoice_id, sort_order),
    CONSTRAINT fk_line_items_invoice FOREIGN KEY (invoice_id)
        REFERENCES invoices(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Line items within an invoice';


-- ============================================================
-- INVOICE ITEM TEMPLATES  (line item library)
-- Pre-built items the invoice builder can select from.
-- client_id NULL = global template available to all invoices.
-- ============================================================
CREATE TABLE invoice_item_templates (
    id                  INT UNSIGNED      NOT NULL AUTO_INCREMENT,
    client_id           INT UNSIGNED      NULL COMMENT 'NULL = global; set = client-specific',
    name                VARCHAR(100)      NOT NULL COMMENT 'Short label shown in the picker',
    section_label       VARCHAR(10)       NULL,
    category            VARCHAR(50)       NULL COMMENT 'aws, sms, domain, hosting, service-fee, etc.',
    description         TEXT              NOT NULL,
    calculation_detail  TEXT              NULL,
    item_note           TEXT              NULL,
    default_usd_amount  DECIMAL(12,4)     NULL,
    default_unit_price  DECIMAL(12,2)     NULL DEFAULT 0.00,
    sort_order          SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    active              TINYINT(1)        NOT NULL DEFAULT 1,
    created_at          TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    KEY idx_templates_client   (client_id),
    KEY idx_templates_active   (active),
    KEY idx_templates_category (category),
    CONSTRAINT fk_templates_client FOREIGN KEY (client_id)
        REFERENCES clients(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Reusable line item templates for the invoice builder';


-- ============================================================
-- EXPENSES
-- Business costs: Valo-internal and client pass-throughs.
-- ============================================================
CREATE TABLE expenses (
    id            INT UNSIGNED     NOT NULL AUTO_INCREMENT,
    description   TEXT             NOT NULL,
    category      ENUM('infrastructure','software','operations','marketing','travel','other') NOT NULL DEFAULT 'other',
    supplier      VARCHAR(100)     NULL,
    amount        DECIMAL(12,2)    NOT NULL DEFAULT 0.00,
    usd_amount    DECIMAL(12,4)    NULL,
    fx_rate       DECIMAL(10,4)    NULL,
    date          DATE             NOT NULL,
    client_id     INT UNSIGNED     NULL,
    invoice_id    INT UNSIGNED     NULL,
    billable      TINYINT(1)       NOT NULL DEFAULT 1,
    pass_through  TINYINT(1)       NOT NULL DEFAULT 0,
    notes         TEXT             NULL,
    created_at    TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    KEY idx_expenses_client   (client_id),
    KEY idx_expenses_date     (date),
    KEY idx_expenses_category (category),
    KEY idx_expenses_invoice  (invoice_id),
    CONSTRAINT fk_expenses_client  FOREIGN KEY (client_id)  REFERENCES clients(id)  ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_expenses_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Business expenses, infrastructure costs, and client pass-throughs';


-- ============================================================
-- COMPANY  (singleton — always id=1)
-- Valo company profile: registration, banking, compliance.
-- ============================================================
CREATE TABLE company (
    id                     INT UNSIGNED     NOT NULL AUTO_INCREMENT,
    name                   VARCHAR(150)     NOT NULL DEFAULT 'VALO (PTY) LTD',
    trading_name           VARCHAR(150)     NULL,
    reg_number             VARCHAR(50)      NULL,
    registration_date      DATE             NULL,
    tax_number             VARCHAR(50)      NULL,
    vat_number             VARCHAR(50)      NULL,
    csd_number             VARCHAR(50)      NULL,
    email                  VARCHAR(150)     NULL,
    phone                  VARCHAR(50)      NULL,
    address                TEXT             NULL,
    website                VARCHAR(150)     NULL,
    financial_year_end     VARCHAR(50)      NULL,
    -- B-BBEE
    bee_level              VARCHAR(20)      NULL,
    bee_expiry             DATE             NULL,
    bee_type               VARCHAR(100)     NULL,
    -- Primary banking (FNB)
    bank_name              VARCHAR(100)     NULL,
    account_holder         VARCHAR(150)     NULL,
    account_number         VARCHAR(50)      NULL,
    branch_code            VARCHAR(20)      NULL,
    account_type           VARCHAR(50)      NULL,
    -- Secondary banking (Capitec)
    capitec_account_number VARCHAR(50)      NULL,
    capitec_branch_code    VARCHAR(20)      NULL,
    capitec_swift          VARCHAR(20)      NULL,
    -- Director
    director_name          VARCHAR(150)     NULL,
    director_id            VARCHAR(50)      NULL,
    director_email         VARCHAR(150)     NULL,
    director_phone         VARCHAR(50)      NULL,
    -- Audit
    created_at             TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at             TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Valo company profile — singleton row (id=1)';


-- ============================================================
-- DOCUMENTS  (CICP vault)
-- Company compliance and client document tracking.
-- ============================================================
CREATE TABLE documents (
    id          INT UNSIGNED     NOT NULL AUTO_INCREMENT,
    client_id   INT UNSIGNED     NULL,
    name        VARCHAR(255)     NOT NULL,
    ref         VARCHAR(50)      NULL,
    category    VARCHAR(50)      NULL,
    file_path   VARCHAR(500)     NULL,
    status      ENUM('available','pending','missing') NOT NULL DEFAULT 'pending',
    notes       TEXT             NULL,
    date        DATE             NULL,
    created_at  TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    KEY idx_documents_client (client_id),
    KEY idx_documents_status (status),
    CONSTRAINT fk_documents_client FOREIGN KEY (client_id)
        REFERENCES clients(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Company and client document vault';


SET FOREIGN_KEY_CHECKS = 1;


-- ============================================================
-- ██████████████████████████████████████████████████████████
-- SEED DATA
-- ██████████████████████████████████████████████████████████
-- ============================================================

-- ── USERS ────────────────────────────────────────────────────
-- Passwords preserved from existing bcrypt hashes.
INSERT INTO users
    (id, name, email, password_hash, role, active, title, department,
     phone, id_number, date_of_birth, nationality, start_date, employment_type,
     bank_name, bank_account, bank_branch, bank_type, tax_number)
VALUES
(1,
 'Sibusiso Mashita',
 'sibusiso.mashita@valosystems.co.za',
 '$2y$12$dVyq.5.PG/4rFTSWCc5I5eVls5nIPqCM/MYEAxorONLnzjD15oHVq',
 'admin', 1,
 'Director', 'Technology',
 '078 078 5043', '9103275496084', '1991-03-27', 'South African',
 '2026-01-29', 'Director',
 NULL, NULL, NULL, NULL, NULL),

(2,
 'Hataluli Netshidzivhani',
 'hataluli.netshidzivhani@valosystems.co.za',
 '$2y$12$NA/xe/9PnZhByiuIKk7rWuZeDmMYq7veMNAdXVe9ChjjoBYdBunom',
 'finance', 1,
 'Finance Officer', 'Finance',
 NULL, NULL, NULL, 'South African',
 NULL, 'Full-time',
 NULL, NULL, NULL, NULL, NULL),

(3,
 'Bophelo Monyayi',
 'bophelo.monyayi@valosystems.co.za',
 '$2y$12$YsH2R3q2U.CN1Dk5XNJMlOSLWdawERRsXqB9gQHKw87DRD4i3v3Ri',
 'finance', 1,
 'Head of Finance', 'Finance',
 NULL, NULL, NULL, 'South African',
 NULL, 'Full-time',
 NULL, NULL, NULL, NULL, NULL);


-- ── COMPANY ──────────────────────────────────────────────────
INSERT INTO company
    (id, name, trading_name, reg_number, registration_date,
     tax_number, csd_number,
     email, phone, address, website,
     financial_year_end,
     bee_level, bee_expiry, bee_type,
     bank_name, account_holder, account_number, branch_code, account_type,
     capitec_account_number, capitec_branch_code, capitec_swift,
     director_name, director_id, director_email, director_phone)
VALUES
(1,
 'VALO (PTY) LTD', 'Valo Systems',
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


-- ── CLIENTS ──────────────────────────────────────────────────
INSERT INTO clients
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
(1,
 'Convenient Gas Solutions', 'CGS', NULL,
 'accounts@cgs.co.za', 'ndivhupmulaudzi@gmail.com', '+27 65 948 3175', 'Ndivhu Pmulaudzi',
 NULL,
 'Address and accounts contact to be confirmed. Update once received.',
 'percentage', 30,
 5.00, 2000.00, 6,
 'Minimum applies for first 6 months or until 5% share exceeds R2,000 (monthly delivered order revenue > R40,000).',
 'South African prime lending rate + 2% per annum, calculated daily from due date',
 'SARB interbank mid-rate + 8% FX cover on billing date',
 0.3800, 'WinSMS',
 'gassolution.co.za', 13.00,
 'Technology Partnership Agreement — CGS', '2026-03-24', 'April 2026',
 'By mutual agreement, April 2026 is treated as the first full billing month. No partial charge for March.',
 NULL, 'active', '2026-03-24'),

(2,
 'Kasi to Home', 'K2H', 'Kasi to Home Funeral Services',
 'info@kasitohome.co.za', 'sibusiso.moolar@kasitohomefunerals.co.za', '+27762327358', 'Sibusiso Moolar',
 '2026/254458/07',
 'Small startup funeral services business. Owner is sole contact. Address to be confirmed.',
 'project', 30,
 NULL, NULL, NULL,
 NULL,
 'South African prime lending rate + 2% per annum, calculated daily from due date',
 'SARB interbank mid-rate + 8% FX cover on billing date',
 NULL, NULL,
 'kasitohomefunerals.co.za', NULL,
 NULL, '2026-06-20', NULL,
 'Once-off project fee. Domain purchased at R99 actual cost. Hosting R40/month (R480/year) pass-through on Valo shared cPanel.',
 NULL, 'active', '2026-03-24'),

(3,
 'OmniSolve', 'OS', NULL,
 'info@omnisolve.co.za', 'accounts@omnisolve.africa', NULL, 'Accounts',
 NULL,
 'Compliance Management Platform. AWS account 861870144419.',
 'passthrough', 30,
 NULL, NULL, NULL,
 NULL,
 'South African prime lending rate + 2% per annum, calculated daily from due date',
 'SARB interbank mid-rate + 8% FX cover on billing date',
 NULL, NULL,
 NULL, NULL,
 'VS-OS-TPA-2026-001', NULL, NULL,
 'Valo development and management fees waived per VS-OS-TPA-2026-001. OmniSolve pays AWS costs only. Waiver ends 24 Sep 2026.',
 NULL, 'active', '2026-01-01');


-- ── INVOICES ─────────────────────────────────────────────────
INSERT INTO invoices
    (id, client_id, number, invoice_type,
     period, period_from, period_to, period_note,
     date, due_date, status,
     subtotal, vat, total,
     fx_rate, fx_policy,
     commercial_conditions, footer_note)
VALUES
-- VAL-CGS-2026-000 — Implementation & Go-Live Fee
(1, 1, 'VAL-CGS-2026-000', 'implementation',
 NULL, NULL, NULL,
 'Once-off implementation and go-live fee — Pre-go-live / Implementation Phase. Production go-live is conditional upon settlement of this invoice in full. Monthly service fees and infrastructure billing commence from April 2026.',
 '2026-03-10', '2026-03-24', 'paid',
 3600.00, 0.00, 3600.00,
 NULL, NULL,
 'Production go-live is conditional upon settlement of this invoice in full.\n\nMonthly service fees and infrastructure billing commence from April 2026, in accordance with the Technology Partnership Agreement between Valo Systems and Convenient Gas Solutions. This implementation fee is a once-off charge and is separate from all ongoing monthly billing.',
 'This invoice is issued in accordance with the Technology Partnership Agreement between Valo Systems and Convenient Gas Solutions.'),

-- VAL-CGS-2026-001 — Monthly Service (April 2026)
(2, 1, 'VAL-CGS-2026-001', 'monthly_service',
 'April 2026', '2026-04-01', '2026-04-30',
 'Platform provisioned and live: 24 March 2026. By mutual agreement, April 2026 is treated as the first full billing month. No partial charge for March.',
 '2026-05-01', '2026-05-14', 'confirmed',
 2724.40, 0.00, 2724.40,
 20.0000, 'SARB interbank mid-rate + 8% FX cover on billing date (1 May 2026)',
 NULL,
 'This invoice is issued in accordance with the Technology Partnership Agreement between Valo Systems and Convenient Gas Solutions.'),

-- VAL-K2H-2026-000 — Website Build & Digital Presence
(3, 2, 'VAL-K2H-2026-000', 'project',
 NULL, NULL, NULL,
 'Once-off project fee covering the full design, development, and deployment of the Kasi to Home Funeral Services digital presence — including website, brochure, agent flyer tool, SEO setup, domain, and hosting. All deliverables are live as of 20 June 2026.',
 '2026-06-20', '2026-07-04', 'confirmed',
 10979.00, 0.00, 10979.00,
 NULL, NULL,
 NULL,
 'This invoice is issued in accordance with the Website Services & Hosting Agreement between Valo Systems and Kasi to Home Funeral Services.'),

-- VAL-OS-2026-001 — OmniSolve AWS pass-through
(4, 3, 'VAL-OS-2026-001', 'infrastructure',
 'Q1 2026', '2026-01-01', '2026-03-31', NULL,
 '2026-04-01', '2026-04-15', 'partial',
 8420.03, 0.00, 8420.03,
 18.9600, 'SARB interbank mid-rate + 8% FX cover on billing date',
 'OmniSolve pays AWS costs only per VS-OS-TPA-2026-001. Valo development and management fees are waived.',
 'This invoice is issued in accordance with VS-OS-TPA-2026-001 between Valo Systems and OmniSolve.');


-- ── LINE ITEMS — VAL-CGS-2026-000 ────────────────────────────
INSERT INTO invoice_line_items
    (invoice_id, sort_order, section_label, section_description,
     is_section_header, is_discount, is_estimated,
     description, calculation_detail, item_note,
     usd_amount, quantity, unit_price, total)
VALUES
-- Section heading (no amount row, is_section_header=1)
(1, 10, 'A',
 'Once-off fee covering full platform implementation, configuration, deployment, and production go-live. This fee is payable prior to go-live and is not subject to the ongoing monthly revenue share arrangement.',
 1, 0, 0,
 'Implementation & Go-Live Fee', NULL, NULL,
 NULL, 1, 0, 0),

-- Standard fee
(1, 20, 'A', NULL, 0, 0, 0,
 'Platform implementation, configuration, deployment, and go-live — Convenient Gas Solutions',
 NULL,
 'Covers: AWS infrastructure provisioning • Backend API and database deployment • Customer and admin frontend deployment • OTP authentication and WinSMS integration • Order management, delivery workflow, and inventory configuration • Role-based access control • AI integration (AWS Bedrock) • CloudWatch monitoring and alerting • Domain, DNS, SSL, and CDN setup • Production readiness testing and validation • Go-live support and handover',
 NULL, 1, 25000.00, 25000.00),

-- Discount
(1, 30, 'A', NULL, 0, 1, 0,
 'Partner Support Discount — Launch Phase',
 NULL,
 'Valo recognises that Convenient Gas Solutions is at an early stage of operations. In support of the business and this partnership, Valo is waiving R21,400.00 of the standard implementation fee. This discount is a once-off gesture of goodwill and does not set a precedent for future engagements.',
 NULL, 1, 21400.00, -21400.00);


-- ── LINE ITEMS — VAL-CGS-2026-001 ────────────────────────────
INSERT INTO invoice_line_items
    (invoice_id, sort_order, section_label, section_description,
     is_section_header, is_discount, is_estimated,
     description, calculation_detail, item_note,
     usd_amount, quantity, unit_price, total)
VALUES
-- ── Section A ──
(2, 10, 'A',
 '5% of gross delivered order value. Minimum R2,000/month applies during the first 6 months (ramp-up period) or until 5% share exceeds R2,000.',
 1, 0, 0,
 'Section A — Valo Technology Service Fee', NULL, NULL, NULL, 1, 0, 0),

(2, 20, 'A', NULL, 0, 0, 0,
 'Platform service fee — April 2026',
 'First operating month — minimum applies',
 NULL,
 NULL, 1, 2000.00, 2000.00),

-- ── Section B ──
(2, 100, 'B',
 'AWS costs are converted from USD to ZAR using the SARB interbank mid-rate + 8% FX cover on the billing date. This buffer protects both parties from exchange rate movement during the 14-day payment window. No markup beyond FX cover is applied.',
 1, 0, 0,
 'Section B — Infrastructure Pass-Through (At Cost + FX Cover)', NULL, NULL, NULL, 1, 0, 0),

-- Sub-section header: AWS Prod
(2, 110, 'B', NULL, 1, 0, 0,
 'AWS Prod Infrastructure — April 2026', NULL, NULL, NULL, 1, 0, 0),

(2, 120, 'B', NULL, 0, 0, 1,
 'EC2 t3.micro',
 'cgs-prod-backend (i-0c0e6c431dc1dd9ff)',
 NULL,
 8.3500, 1, 167.00, 167.00),

(2, 130, 'B', NULL, 0, 0, 1,
 'EBS 16GB gp3',
 'vol-033e6dee749ed098b',
 NULL,
 1.2800, 1, 25.60, 25.60),

(2, 140, 'B', NULL, 0, 0, 1,
 'RDS db.t3.micro instance',
 'cgs-prod-postgres',
 NULL,
 12.9600, 1, 259.20, 259.20),

(2, 150, 'B', NULL, 0, 0, 1,
 'RDS 20GB storage',
 'cgs-prod-postgres',
 NULL,
 2.3000, 1, 46.00, 46.00),

(2, 160, 'B', NULL, 0, 0, 1,
 'RDS automated backups',
 '14-day retention',
 NULL,
 0.5000, 1, 10.00, 10.00),

(2, 170, 'B', NULL, 0, 0, 1,
 'S3 (2 prod buckets)',
 'cgs-prod-web + cgs-prod-admin-frontend',
 NULL,
 0.0200, 1, 0.40, 0.40),

(2, 180, 'B', NULL, 0, 0, 1,
 'CloudFront × 3',
 'gassolution.co.za, admin, api',
 NULL,
 0.3000, 1, 6.00, 6.00),

(2, 190, 'B', NULL, 0, 0, 1,
 'Secrets Manager × 4',
 'cgs-prod/* (4 secrets)',
 NULL,
 1.6000, 1, 32.00, 32.00),

(2, 200, 'B', NULL, 0, 0, 1,
 'Route53',
 'gassolution.co.za hosted zone + queries',
 NULL,
 0.9000, 1, 18.00, 18.00),

(2, 210, 'B', NULL, 0, 0, 1,
 'CloudWatch alarms × 5',
 'cgs-prod-* alarms',
 NULL,
 0.5000, 1, 10.00, 10.00),

(2, 220, 'B', NULL, 0, 0, 1,
 'CloudWatch logs',
 '/cgs/prod/api + /cgs/prod/api-error',
 NULL,
 0.1600, 1, 3.20, 3.20),

(2, 230, 'B', NULL, 0, 0, 1,
 'EC2 data transfer',
 'Network egress (API traffic)',
 NULL,
 0.0500, 1, 1.00, 1.00),

-- Sub-section header: WinSMS
(2, 300, 'B', NULL, 1, 0, 0,
 'WinSMS — SMS Notifications (April 2026)', NULL, NULL, NULL, 1, 0, 0),

(2, 310, 'B', NULL, 0, 0, 1,
 'SMS notifications — April 2026',
 '350 SMS × R0.38/SMS',
 'Estimate based on 100 orders × 3.5 SMS = 350 SMS. Replace with actual WinSMS report before sending.',
 NULL, 350, 0.38, 133.00),

-- Sub-section header: Domain
(2, 400, 'B', NULL, 1, 0, 0,
 'Domain', NULL, NULL, NULL, 1, 0, 0),

(2, 410, 'B', NULL, 0, 0, 0,
 'gassolution.co.za domain (1/12 annual)',
 NULL, NULL,
 NULL, 1, 13.00, 13.00);


-- ── LINE ITEMS — VAL-K2H-2026-000 ────────────────────────────
INSERT INTO invoice_line_items
    (invoice_id, sort_order, section_label, section_description,
     is_section_header, is_discount, is_estimated,
     description, calculation_detail, item_note,
     usd_amount, quantity, unit_price, total)
VALUES
-- ── Section A ──
(3, 10, 'A',
 'All design, development, and content work delivered for the Kasi to Home digital presence. Prices reflect standard rates for a small South African digital agency. As an early-stage business, a startup support discount has been applied.',
 1, 0, 0,
 'Section A — Design & Development', NULL, NULL, NULL, 1, 0, 0),

(3, 20, 'A', NULL, 0, 0, 0,
 'Single-page marketing website — Design & Development',
 NULL,
 'Full custom React 18 + TypeScript + Vite + Tailwind CSS SPA. Sections: Hero, Trust Strip, About, Funeral Plans (4 plans, expandable cards), Standard Benefits, Cover Options, Underwriter, Policy Accordion, Contact, Footer, Sticky Mobile Bar. Brand design system, Playfair Display serif headings, Framer Motion scroll animations. Fully responsive. Deployed to kasitohomefunerals.co.za via cPanel Git Version Control.',
 NULL, 1, 5500.00, 5500.00),

(3, 30, 'A', NULL, 0, 0, 0,
 'Branded PDF brochure — 3 pages, print-ready',
 NULL,
 'Programmatically generated 3-page PDF via Puppeteer + pdf-lib. Pages: (1) Cover page with logo, contact details, and Atlehang Life underwriter details; (2) All four funeral plans with cover amounts, benefits, and policy notes; (3) Standard benefits, cemetery support, cover options, underwriter, contact, and key policy notes. Delivered as a downloadable file from the website.',
 NULL, 1, 1200.00, 1200.00),

(3, 40, 'A', NULL, 0, 0, 0,
 'Agent flyer generator — Custom web tool',
 NULL,
 'Standalone HTML canvas-based flyer generator for Kasi to Home agents. Features: live preview at 800×1120px, agent name & phone input (updates canvas in real time), photo upload with in-form preview, all 4 funeral plans, included benefits, policy notes, and contact section. Logos base64-embedded (fully offline-capable). Password-gated internal tool deployed at kasitohomefunerals.co.za/agent-flyer.',
 NULL, 1, 1800.00, 1800.00),

(3, 50, 'A', NULL, 0, 0, 0,
 'SEO setup & PWA configuration',
 NULL,
 'Full technical SEO: canonical URL, meta title and description, robots index/follow, Open Graph tags, Twitter Card, LocalBusiness JSON-LD structured data. PWA: site.webmanifest with start_url, scope, maskable and standard icons (192px & 512px), theme_color, background_color. Robots.txt. Sitemap-ready structure.',
 NULL, 1, 950.00, 950.00),

(3, 60, 'A', NULL, 0, 0, 0,
 'Git repository & cPanel deployment pipeline setup',
 NULL,
 'Private GitHub repository created under valo-systems organisation. .cpanel.yml deployment config targeting /home/valosyst/public_html/kasitohomefunerals.co.za. .htaccess with HTTPS enforcement, www to non-www redirect, and React SPA fallback routing. First full deployment executed.',
 NULL, 1, 550.00, 550.00),

(3, 70, 'A', NULL, 0, 0, 0,
 'Brand asset pack — Integration & deployment',
 NULL,
 'Integration of all supplied brand assets: logo in all sizes (16–1024px), favicon set, Apple touch icon, Android Chrome icons, maskable icons, OG image (1200×630), Atlehang Life underwriter logo. Assets organised into public/ and src/assets/, embedded in header (favicons, manifest), and used throughout UI and brochure.',
 NULL, 1, 400.00, 400.00),

-- ── Section B ──
(3, 200, 'B',
 'Actual third-party costs incurred on behalf of the client. Passed through at cost with no markup. Domain registration at actual invoiced price. Hosting is billed at R40/month on Valo managed cPanel account.',
 1, 0, 0,
 'Section B — Infrastructure & Third-Party Costs', NULL, NULL, NULL, 1, 0, 0),

(3, 210, 'B', NULL, 0, 0, 0,
 'Domain registration — kasitohomefunerals.co.za (1 year)',
 NULL,
 'Registered via domains.co.za. Valid 1 year from registration date. Renewal at current market rate applies from Year 2.',
 NULL, 1, 99.00, 99.00),

(3, 220, 'B', NULL, 0, 0, 0,
 'Website hosting — cPanel shared hosting, 1 year',
 'R40.00/month × 12 months',
 'Hosted on Valo Systems managed cPanel account (valosyst). Deployed to /home/valosyst/public_html/kasitohomefunerals.co.za. Includes SSL (AutoSSL), Git Version Control, email hosting capability.',
 NULL, 12, 40.00, 480.00);


-- ── LINE ITEMS — VAL-OS-2026-001 ─────────────────────────────
INSERT INTO invoice_line_items
    (invoice_id, sort_order, section_label, section_description,
     is_section_header, is_discount, is_estimated,
     description, calculation_detail, item_note,
     usd_amount, quantity, unit_price, total)
VALUES
(4, 10, 'B',
 'AWS costs passed through at cost per VS-OS-TPA-2026-001. Valo development and management fees waived during waiver period ending 24 September 2026.',
 1, 0, 0,
 'Section B — AWS Infrastructure Pass-Through', NULL, NULL, NULL, 1, 0, 0),

(4, 20, 'B', NULL, 0, 0, 0,
 'Amazon Web Services — OmniSolve account 861870144419 (Q1 2026)',
 '444.05 USD × R18.96/USD',
 'AWS Cost Explorer export: cgs-prod tag group. Covers EC2, RDS, S3, CloudFront, Route53, CloudWatch — January to March 2026.',
 444.0500, 1, 8420.03, 8420.03);


-- ── EXPENSES ─────────────────────────────────────────────────
INSERT INTO expenses
    (description, category, supplier, amount, usd_amount, fx_rate,
     date, client_id, invoice_id, billable, pass_through, notes)
VALUES
('WinSMS — CGS (327 SMS × R0.38, March 2026)',
 'infrastructure', 'WinSMS', 124.26, NULL, NULL,
 '2026-03-31', 1, 1, 1, 1,
 'Bulk SMS billed on VAL-CGS-2026-000'),

('Domain — gassolution.co.za (April 2026)',
 'infrastructure', 'Domain Registrar', 13.00, NULL, NULL,
 '2026-04-01', 1, 2, 1, 1,
 'Monthly domain cost passed through'),

('WinSMS — CGS (400 SMS × R0.38, April 2026)',
 'infrastructure', 'WinSMS', 152.00, NULL, NULL,
 '2026-04-30', 1, 2, 1, 1,
 'Estimated for April period'),

('cPanel Hosting — kasitohomefunerals.co.za',
 'infrastructure', 'cPanel', 40.00, NULL, NULL,
 '2026-04-01', 2, NULL, 1, 1,
 'Monthly hosting Valo cPanel account'),

('AWS EC2 — OmniSolve (Q1 2026)',
 'infrastructure', 'Amazon Web Services', 8420.03, 444.0500, 18.9600,
 '2026-04-01', 3, 4, 1, 1,
 'OmniSolve pays AWS directly per TPA waiver clause'),

('OpenAI ChatGPT Subscription (April 2026)',
 'software', 'OpenAI', 388.52, 20.5000, 18.9500,
 '2026-04-15', NULL, NULL, 0, 0,
 'Internal tool cost'),

('Amazon Web Services — Valo infrastructure',
 'infrastructure', 'Amazon Web Services', 311.04, 16.4100, 18.9500,
 '2026-04-02', NULL, NULL, 0, 0,
 'Valo platform hosting costs');


-- ── INVOICE ITEM TEMPLATES ────────────────────────────────────
-- CGS Section A recurring items (client_id=1)
INSERT INTO invoice_item_templates
    (client_id, name, section_label, category,
     description, calculation_detail, item_note,
     default_usd_amount, default_unit_price, sort_order)
VALUES
(1, 'CGS — Platform service fee', 'A', 'service-fee',
 'Platform service fee — {PERIOD}',
 'First operating month — minimum applies',
 NULL,
 NULL, 2000.00, 10),

-- CGS Section B — AWS recurring (client_id=1)
(1, 'CGS — EC2 t3.micro', 'B', 'aws',
 'EC2 t3.micro',
 'cgs-prod-backend (i-0c0e6c431dc1dd9ff)',
 NULL,
 8.3500, 0.00, 20),

(1, 'CGS — EBS 16GB gp3', 'B', 'aws',
 'EBS 16GB gp3',
 'vol-033e6dee749ed098b',
 NULL,
 1.2800, 0.00, 30),

(1, 'CGS — RDS db.t3.micro', 'B', 'aws',
 'RDS db.t3.micro instance',
 'cgs-prod-postgres',
 NULL,
 12.9600, 0.00, 40),

(1, 'CGS — RDS 20GB storage', 'B', 'aws',
 'RDS 20GB storage',
 'cgs-prod-postgres',
 NULL,
 2.3000, 0.00, 50),

(1, 'CGS — RDS automated backups', 'B', 'aws',
 'RDS automated backups',
 '14-day retention',
 NULL,
 0.5000, 0.00, 60),

(1, 'CGS — S3 2 prod buckets', 'B', 'aws',
 'S3 (2 prod buckets)',
 'cgs-prod-web + cgs-prod-admin-frontend',
 NULL,
 0.0200, 0.00, 70),

(1, 'CGS — CloudFront × 3', 'B', 'aws',
 'CloudFront × 3',
 'gassolution.co.za, admin, api',
 NULL,
 0.3000, 0.00, 80),

(1, 'CGS — Secrets Manager × 4', 'B', 'aws',
 'Secrets Manager × 4',
 'cgs-prod/* (4 secrets)',
 NULL,
 1.6000, 0.00, 90),

(1, 'CGS — Route53', 'B', 'aws',
 'Route53',
 'gassolution.co.za hosted zone + queries',
 NULL,
 0.9000, 0.00, 100),

(1, 'CGS — CloudWatch alarms × 5', 'B', 'aws',
 'CloudWatch alarms × 5',
 'cgs-prod-* alarms',
 NULL,
 0.5000, 0.00, 110),

(1, 'CGS — CloudWatch logs', 'B', 'aws',
 'CloudWatch logs',
 '/cgs/prod/api + /cgs/prod/api-error',
 NULL,
 0.1600, 0.00, 120),

(1, 'CGS — EC2 data transfer', 'B', 'aws',
 'EC2 data transfer',
 'Network egress (API traffic)',
 NULL,
 0.0500, 0.00, 130),

-- CGS WinSMS
(1, 'CGS — WinSMS SMS', 'B', 'sms',
 'SMS notifications — {PERIOD}',
 '{N} SMS × R0.38/SMS',
 'Attach WinSMS usage export as evidence.',
 NULL, 0.38, 140),

-- CGS Domain
(1, 'CGS — Domain monthly', 'B', 'domain',
 'gassolution.co.za domain (1/12 annual)',
 NULL, NULL,
 NULL, 13.00, 150),

-- Global templates (client_id=NULL)
(NULL, 'cPanel hosting — monthly', 'B', 'hosting',
 'Website hosting — cPanel shared hosting',
 'R40.00/month',
 'Hosted on Valo Systems managed cPanel account (valosyst). Includes SSL (AutoSSL), Git Version Control.',
 NULL, 40.00, 10),

(NULL, 'Domain registration 1 year', 'B', 'domain',
 'Domain registration — {DOMAIN} (1 year)',
 NULL,
 'Registered via domains.co.za. Renewal at current market rate applies from Year 2.',
 NULL, 99.00, 20);

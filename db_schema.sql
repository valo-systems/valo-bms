-- ============================================================
-- Valo BMS — Database Schema
-- Run against a fresh empty database before db_seed.sql
--
-- phpMyAdmin (prod):  select valosyst_bms, then import this file
-- CLI:                mysql -u <user> -p <database> < db_schema.sql
--
-- Engine  : InnoDB (ACID, FK, row-level locking)
-- Charset : utf8mb4 / utf8mb4_unicode_ci
-- PKs     : INT UNSIGNED AUTO_INCREMENT
-- Money   : DECIMAL(12,2) — never FLOAT
-- Booleans: TINYINT(1)
-- Auditing: created_at / updated_at TIMESTAMP
-- ============================================================

SET NAMES utf8mb4;
SET time_zone = '+02:00';
SET FOREIGN_KEY_CHECKS = 0;


-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id               INT UNSIGNED     NOT NULL AUTO_INCREMENT,
    name             VARCHAR(100)     NOT NULL,
    email            VARCHAR(150)     NOT NULL,
    password_hash    VARCHAR(255)     NOT NULL,
    role             ENUM('admin','finance','viewer') NOT NULL DEFAULT 'finance',
    active           TINYINT(1)       NOT NULL DEFAULT 1,
    title            VARCHAR(100)     NULL,
    department       VARCHAR(100)     NULL,
    phone            VARCHAR(50)      NULL,
    id_number        VARCHAR(20)      NULL,
    date_of_birth    DATE             NULL,
    nationality      VARCHAR(50)      NULL,
    address          TEXT             NULL,
    start_date       DATE             NULL,
    employment_type  VARCHAR(50)      NULL,
    notes            TEXT             NULL,
    bank_name        VARCHAR(100)     NULL,
    bank_account     VARCHAR(50)      NULL,
    bank_branch      VARCHAR(20)      NULL,
    bank_type        VARCHAR(50)      NULL,
    tax_number       VARCHAR(30)      NULL,
    created_at       TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY uq_users_email   (email),
    KEY        idx_users_role   (role),
    KEY        idx_users_active (active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='BMS users and Valo team members';


-- ============================================================
-- COMPANY  (singleton — always id=1)
-- ============================================================
CREATE TABLE IF NOT EXISTS company (
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
    bee_level              VARCHAR(20)      NULL,
    bee_expiry             DATE             NULL,
    bee_type               VARCHAR(100)     NULL,
    bank_name              VARCHAR(100)     NULL,
    account_holder         VARCHAR(150)     NULL,
    account_number         VARCHAR(50)      NULL,
    branch_code            VARCHAR(20)      NULL,
    account_type           VARCHAR(50)      NULL,
    capitec_account_number VARCHAR(50)      NULL,
    capitec_branch_code    VARCHAR(20)      NULL,
    capitec_swift          VARCHAR(20)      NULL,
    director_name          VARCHAR(150)     NULL,
    director_id            VARCHAR(50)      NULL,
    director_email         VARCHAR(150)     NULL,
    director_phone         VARCHAR(50)      NULL,
    created_at             TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at             TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Valo company profile — singleton row (id=1)';


-- ============================================================
-- CLIENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS clients (
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
    billing_model          ENUM('project','percentage','retainer','passthrough','hourly') NOT NULL DEFAULT 'project',
    payment_terms          TINYINT UNSIGNED NOT NULL DEFAULT 30 COMMENT 'Days',
    service_fee_pct        DECIMAL(5,2)     NULL,
    minimum_monthly        DECIMAL(12,2)    NULL,
    minimum_period_months  TINYINT UNSIGNED NULL,
    minimum_description    TEXT             NULL,
    late_interest_policy   VARCHAR(255)     NULL DEFAULT 'South African prime lending rate + 2% per annum, calculated daily from due date',
    fx_policy              VARCHAR(255)     NULL DEFAULT 'SARB interbank mid-rate + 8% FX cover on billing date',
    sms_rate               DECIMAL(8,4)     NULL,
    sms_provider           VARCHAR(50)      NULL,
    domain                 VARCHAR(150)     NULL,
    domain_monthly         DECIMAL(8,2)     NULL,
    hosting                VARCHAR(255)     NULL,
    agreement_ref          VARCHAR(100)     NULL,
    platform_live_date     DATE             NULL,
    first_billing_month    VARCHAR(50)      NULL,
    agreement_notes        TEXT             NULL,
    notes                  TEXT             NULL,
    status                 ENUM('active','inactive') NOT NULL DEFAULT 'active',
    contract_start         DATE             NULL,
    created_at             TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at             TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY uq_clients_code    (code),
    KEY        idx_clients_status (status),
    KEY        idx_clients_name   (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Client accounts and billing configuration';


-- ============================================================
-- INVOICES
-- ============================================================
CREATE TABLE IF NOT EXISTS invoices (
    id                     INT UNSIGNED     NOT NULL AUTO_INCREMENT,
    client_id              INT UNSIGNED     NOT NULL,
    number                 VARCHAR(30)      NOT NULL COMMENT 'Format: VAL-{CODE}-{YEAR}-{SEQ}',
    invoice_type           ENUM('monthly_service','implementation','project','infrastructure','custom') NOT NULL DEFAULT 'monthly_service',
    period                 VARCHAR(50)      NULL,
    period_from            DATE             NULL,
    period_to              DATE             NULL,
    period_note            TEXT             NULL,
    date                   DATE             NOT NULL,
    due_date               DATE             NULL,
    status                 ENUM('draft','estimated','confirmed','sent','partial','paid','overdue') NOT NULL DEFAULT 'draft',
    subtotal               DECIMAL(12,2)    NOT NULL DEFAULT 0.00,
    vat                    DECIMAL(12,2)    NOT NULL DEFAULT 0.00,
    total                  DECIMAL(12,2)    NOT NULL DEFAULT 0.00,
    fx_rate                DECIMAL(10,4)    NULL,
    fx_policy              VARCHAR(255)     NULL,
    commercial_conditions  TEXT             NULL,
    notes                  TEXT             NULL,
    internal_notes         TEXT             NULL,
    footer_note            TEXT             NULL,
    created_at             TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at             TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY uq_invoices_number  (number),
    KEY        idx_invoices_client (client_id),
    KEY        idx_invoices_status (status),
    KEY        idx_invoices_date   (date),
    KEY        idx_invoices_due    (due_date),
    CONSTRAINT fk_invoices_client FOREIGN KEY (client_id)
        REFERENCES clients(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Tax invoices issued by Valo Systems';


-- ============================================================
-- INVOICE LINE ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS invoice_line_items (
    id                  INT UNSIGNED      NOT NULL AUTO_INCREMENT,
    invoice_id          INT UNSIGNED      NOT NULL,
    sort_order          SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    section_label       VARCHAR(10)       NULL,
    section_description TEXT              NULL,
    is_section_header   TINYINT(1)        NOT NULL DEFAULT 0,
    is_discount         TINYINT(1)        NOT NULL DEFAULT 0,
    is_estimated        TINYINT(1)        NOT NULL DEFAULT 0,
    description         TEXT              NOT NULL,
    calculation_detail  TEXT              NULL,
    item_note           TEXT              NULL,
    usd_amount          DECIMAL(12,4)     NULL,
    quantity            DECIMAL(10,4)     NOT NULL DEFAULT 1.0000,
    unit_price          DECIMAL(12,2)     NOT NULL DEFAULT 0.00,
    total               DECIMAL(12,2)     NOT NULL DEFAULT 0.00,
    template_id         INT UNSIGNED      NULL,
    created_at          TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    KEY idx_line_items_invoice (invoice_id),
    KEY idx_line_items_sort    (invoice_id, sort_order),
    CONSTRAINT fk_line_items_invoice FOREIGN KEY (invoice_id)
        REFERENCES invoices(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Line items within an invoice';


-- ============================================================
-- INVOICE ITEM TEMPLATES
-- ============================================================
CREATE TABLE IF NOT EXISTS invoice_item_templates (
    id                  INT UNSIGNED      NOT NULL AUTO_INCREMENT,
    client_id           INT UNSIGNED      NULL COMMENT 'NULL = global',
    name                VARCHAR(100)      NOT NULL,
    section_label       VARCHAR(10)       NULL,
    category            VARCHAR(50)       NULL,
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
    KEY idx_item_tpl_client   (client_id),
    KEY idx_item_tpl_active   (active),
    KEY idx_item_tpl_category (category),
    CONSTRAINT fk_item_tpl_client FOREIGN KEY (client_id)
        REFERENCES clients(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Reusable line item templates for the invoice builder';


-- ============================================================
-- EXPENSES
-- ============================================================
CREATE TABLE IF NOT EXISTS expenses (
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
-- DOCUMENTS  (CICP vault + commercial agreements)
-- ============================================================
CREATE TABLE IF NOT EXISTS documents (
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


-- ============================================================
-- PAYMENT PLANS
-- ============================================================
CREATE TABLE IF NOT EXISTS payment_plans (
    id             INT UNSIGNED     NOT NULL AUTO_INCREMENT,
    client_id      INT UNSIGNED     NOT NULL,
    invoice_id     INT UNSIGNED     NULL,
    reference      VARCHAR(100)     NOT NULL,
    description    VARCHAR(500)     NULL,
    total_amount   DECIMAL(12,2)    NOT NULL DEFAULT 0,
    currency       VARCHAR(3)       NOT NULL DEFAULT 'ZAR',
    status         ENUM('active','completed','cancelled') NOT NULL DEFAULT 'active',
    notes          TEXT             NULL,
    created_at     TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    KEY idx_pp_client  (client_id),
    KEY idx_pp_invoice (invoice_id),
    CONSTRAINT fk_pp_client  FOREIGN KEY (client_id)  REFERENCES clients(id)  ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_pp_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE SET NULL  ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Multi-instalment payment arrangements with clients';


-- ============================================================
-- PAYMENT PLAN INSTALMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS payment_plan_instalments (
    id             INT UNSIGNED     NOT NULL AUTO_INCREMENT,
    plan_id        INT UNSIGNED     NOT NULL,
    instalment_no  TINYINT UNSIGNED NOT NULL DEFAULT 1,
    due_date       DATE             NOT NULL,
    amount         DECIMAL(12,2)    NOT NULL DEFAULT 0,
    status         ENUM('pending','paid','overdue') NOT NULL DEFAULT 'pending',
    paid_date      DATE             NULL,
    notes          VARCHAR(500)     NULL,
    created_at     TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    KEY idx_ppi_plan (plan_id),
    CONSTRAINT fk_ppi_plan FOREIGN KEY (plan_id)
        REFERENCES payment_plans(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Individual instalments within a payment plan';


-- ============================================================
-- EMAIL TEMPLATES
-- ============================================================
CREATE TABLE IF NOT EXISTS email_templates (
    id          INT UNSIGNED  NOT NULL AUTO_INCREMENT,
    name        VARCHAR(100)  NOT NULL,
    slug        VARCHAR(50)   NOT NULL UNIQUE,
    subject     VARCHAR(255)  NOT NULL,
    body_html   LONGTEXT      NOT NULL,
    variables   JSON          NOT NULL,
    is_active   TINYINT(1)    NOT NULL DEFAULT 1,
    created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    KEY idx_email_tpl_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Email templates for billing communications';


-- ============================================================
-- EMAIL LOG
-- ============================================================
CREATE TABLE IF NOT EXISTS email_log (
    id          INT UNSIGNED  NOT NULL AUTO_INCREMENT,
    template_id INT UNSIGNED  NULL,
    invoice_id  INT UNSIGNED  NULL,
    client_id   INT UNSIGNED  NULL,
    message_id  VARCHAR(255)  NULL,
    `to`        VARCHAR(255)  NOT NULL,
    cc          VARCHAR(255)  NULL,
    subject     VARCHAR(255)  NOT NULL,
    body_html   LONGTEXT      NOT NULL,
    status      ENUM('sent','failed') NOT NULL,
    error       TEXT          NULL,
    sent_at     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    KEY idx_email_log_invoice (invoice_id),
    KEY idx_email_log_client  (client_id),
    KEY idx_email_log_status  (status),
    CONSTRAINT fk_email_log_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_email_log_client  FOREIGN KEY (client_id)  REFERENCES clients(id)  ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Outbound email send log';


-- ============================================================
-- EMAIL INBOX
-- ============================================================
CREATE TABLE IF NOT EXISTS email_inbox (
    id            INT UNSIGNED  NOT NULL AUTO_INCREMENT,
    message_id    VARCHAR(255)  NOT NULL UNIQUE,
    in_reply_to   VARCHAR(255)  NULL,
    log_id        INT UNSIGNED  NULL,
    invoice_id    INT UNSIGNED  NULL,
    client_id     INT UNSIGNED  NULL,
    from_address  VARCHAR(255)  NOT NULL,
    from_name     VARCHAR(255)  NULL,
    subject       VARCHAR(255)  NULL,
    body_text     LONGTEXT      NULL,
    body_html     LONGTEXT      NULL,
    received_at   DATETIME      NULL,
    read_at       DATETIME      NULL,
    created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY uq_inbox_message_id (message_id),
    KEY idx_inbox_client  (client_id),
    KEY idx_inbox_invoice (invoice_id),
    CONSTRAINT fk_inbox_log     FOREIGN KEY (log_id)     REFERENCES email_log(id)  ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_inbox_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(id)   ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_inbox_client  FOREIGN KEY (client_id)  REFERENCES clients(id)    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Inbound email replies synced from IMAP';


-- ============================================================
-- PASSWORD RESETS
-- ============================================================
CREATE TABLE IF NOT EXISTS password_resets (
    id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id    INT UNSIGNED NOT NULL,
    token      VARCHAR(64)  NOT NULL UNIQUE,
    expires_at DATETIME     NOT NULL,
    used       TINYINT(1)   NOT NULL DEFAULT 0,
    created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY uq_pr_token   (token),
    KEY        idx_pr_user   (user_id),
    CONSTRAINT fk_pr_user FOREIGN KEY (user_id)
        REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Password reset tokens — single use, 1hr expiry';


SET FOREIGN_KEY_CHECKS = 1;

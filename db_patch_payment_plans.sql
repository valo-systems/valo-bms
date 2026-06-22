-- ============================================================
-- Valo BMS — Payment Plans
-- Adds payment_plans and payment_plan_instalments tables.
-- Run via phpMyAdmin on valo_bms.
-- ============================================================

CREATE TABLE IF NOT EXISTS payment_plans (
    id               INT UNSIGNED     NOT NULL AUTO_INCREMENT,
    client_id        INT UNSIGNED     NOT NULL,
    invoice_id       INT UNSIGNED     NULL COMMENT 'Linked invoice if plan covers a single invoice',
    reference        VARCHAR(100)     NOT NULL COMMENT 'Internal ref, e.g. VAL-K2H-AGR-2026-001',
    description      VARCHAR(500)     NULL,
    total_amount     DECIMAL(12,2)    NOT NULL DEFAULT 0,
    currency         VARCHAR(3)       NOT NULL DEFAULT 'ZAR',
    status           ENUM('active','completed','cancelled') NOT NULL DEFAULT 'active',
    notes            TEXT             NULL,
    created_at       TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    KEY idx_pp_client  (client_id),
    KEY idx_pp_invoice (invoice_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Multi-instalment payment arrangements with clients';

CREATE TABLE IF NOT EXISTS payment_plan_instalments (
    id               INT UNSIGNED     NOT NULL AUTO_INCREMENT,
    plan_id          INT UNSIGNED     NOT NULL,
    instalment_no    TINYINT UNSIGNED NOT NULL DEFAULT 1,
    due_date         DATE             NOT NULL,
    amount           DECIMAL(12,2)    NOT NULL DEFAULT 0,
    status           ENUM('pending','paid','overdue') NOT NULL DEFAULT 'pending',
    paid_date        DATE             NULL,
    notes            VARCHAR(500)     NULL,
    created_at       TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    KEY idx_ppi_plan (plan_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Individual instalments within a payment plan';

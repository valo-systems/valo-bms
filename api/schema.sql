-- Valo BMS — Database Schema
-- Run this once via cPanel phpMyAdmin on your 'valo_bms' database

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- Users (team members who log into BMS)
CREATE TABLE IF NOT EXISTS `users` (
  `id`            INT AUTO_INCREMENT PRIMARY KEY,
  `name`          VARCHAR(100) NOT NULL,
  `email`         VARCHAR(150) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `role`          ENUM('admin','finance','viewer') NOT NULL DEFAULT 'finance',
  `active`        TINYINT(1) NOT NULL DEFAULT 1,
  `created_at`    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Company (Valo's own details — single row)
CREATE TABLE IF NOT EXISTS `company` (
  `id`              INT AUTO_INCREMENT PRIMARY KEY,
  `name`            VARCHAR(150) NOT NULL DEFAULT 'Valo Systems (Pty) Ltd',
  `reg_number`      VARCHAR(50),
  `vat_number`      VARCHAR(50),
  `email`           VARCHAR(150),
  `phone`           VARCHAR(50),
  `address`         TEXT,
  `website`         VARCHAR(150),
  `bank_name`       VARCHAR(100),
  `account_holder`  VARCHAR(150),
  `account_number`  VARCHAR(50),
  `branch_code`     VARCHAR(20),
  `account_type`    VARCHAR(50)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Clients
CREATE TABLE IF NOT EXISTS `clients` (
  `id`              INT AUTO_INCREMENT PRIMARY KEY,
  `name`            VARCHAR(150) NOT NULL,
  `code`            VARCHAR(10) NOT NULL,
  `email`           VARCHAR(150),
  `phone`           VARCHAR(50),
  `address`         TEXT,
  `billing_model`   ENUM('project','percentage','retainer','passthrough','hourly') NOT NULL DEFAULT 'project',
  `payment_terms`   INT NOT NULL DEFAULT 30,
  `status`          ENUM('active','inactive') NOT NULL DEFAULT 'active',
  `notes`           TEXT,
  `contract_start`  DATE,
  `created_at`      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Invoices
CREATE TABLE IF NOT EXISTS `invoices` (
  `id`          INT AUTO_INCREMENT PRIMARY KEY,
  `client_id`   INT NOT NULL,
  `number`      VARCHAR(30) NOT NULL UNIQUE,
  `period`      VARCHAR(50),
  `date`        DATE,
  `due_date`    DATE,
  `status`      ENUM('draft','estimated','confirmed','sent','paid','overdue','partial') NOT NULL DEFAULT 'draft',
  `subtotal`    DECIMAL(12,2) NOT NULL DEFAULT 0,
  `vat`         DECIMAL(12,2) NOT NULL DEFAULT 0,
  `total`       DECIMAL(12,2) NOT NULL DEFAULT 0,
  `notes`       TEXT,
  `created_at`  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Invoice Line Items
CREATE TABLE IF NOT EXISTS `invoice_line_items` (
  `id`          INT AUTO_INCREMENT PRIMARY KEY,
  `invoice_id`  INT NOT NULL,
  `description` TEXT NOT NULL,
  `quantity`    DECIMAL(10,4) NOT NULL DEFAULT 1,
  `unit_price`  DECIMAL(12,2) NOT NULL DEFAULT 0,
  `total`       DECIMAL(12,2) NOT NULL DEFAULT 0,
  `sort_order`  INT NOT NULL DEFAULT 0,
  FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Expenses
CREATE TABLE IF NOT EXISTS `expenses` (
  `id`          INT AUTO_INCREMENT PRIMARY KEY,
  `description` TEXT NOT NULL,
  `category`    ENUM('infrastructure','software','operations','marketing','travel','other') NOT NULL DEFAULT 'other',
  `amount`      DECIMAL(12,2) NOT NULL DEFAULT 0,
  `date`        DATE,
  `client`      VARCHAR(20),
  `billable`    TINYINT(1) NOT NULL DEFAULT 1,
  `notes`       TEXT,
  `created_at`  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Commercial Documents
CREATE TABLE IF NOT EXISTS `documents` (
  `id`        INT AUTO_INCREMENT PRIMARY KEY,
  `title`     VARCHAR(255) NOT NULL,
  `type`      ENUM('agreement','partnership','sla','review','other') NOT NULL DEFAULT 'other',
  `client_id` INT,
  `date`      DATE,
  `status`    ENUM('active','inactive','expired') NOT NULL DEFAULT 'active',
  `url`       VARCHAR(500),
  `notes`     TEXT,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- SEED DATA — run after creating tables
-- ============================================================

-- Default admin user (change password after first login!)
-- Password: Valo@2026 (hashed below)
INSERT IGNORE INTO `users` (name, email, password_hash, role) VALUES
('Sibusiso Mashita', 'sibusiso.mashita@valosystems.co.za', '$2y$12$xuUQcNwgLBjVu3951RvLP.JIlnEoi6TTSTEK.rVIOTIdKvR1TXZwC', 'admin');

-- Valo company info
INSERT IGNORE INTO `company` (id, name, email, address, website, bank_name, account_holder, account_number, branch_code, account_type) VALUES
(1, 'Valo Systems (Pty) Ltd', 'sibusiso.mashita@valosystems.co.za', 'Johannesburg, South Africa', 'valosystems.co.za', 'Nedbank', 'Valo Systems (Pty) Ltd', '1234567890', '198765', 'Current');

-- Existing clients
INSERT IGNORE INTO `clients` (id, name, code, email, billing_model, payment_terms, status, contract_start) VALUES
(1, 'Convenient Gas Solutions', 'CGS', 'accounts@cgs.co.za', 'percentage', 30, 'active', '2026-03-24'),
(2, 'Kasi to Home', 'K2H', 'info@kasitohome.co.za', 'project', 30, 'active', '2026-03-24'),
(3, 'OmniSolve', 'OS', 'info@omnisolve.co.za', 'passthrough', 30, 'active', '2026-01-01');

-- Existing invoices
INSERT IGNORE INTO `invoices` (id, client_id, number, period, date, due_date, status, subtotal, vat, total) VALUES
(1, 1, 'VAL-CGS-2026-000', 'March 2026', '2026-03-24', '2026-04-23', 'confirmed', 3600.00, 0, 3600.00),
(2, 1, 'VAL-CGS-2026-001', 'April 2026', '2026-04-30', '2026-05-30', 'estimated', 2724.40, 0, 2724.40),
(3, 2, 'VAL-K2H-2026-000', 'Project', '2026-03-24', '2026-04-23', 'confirmed', 10979.00, 0, 10979.00),
(4, 3, 'VAL-OS-2026-001', 'Q1 2026', '2026-04-01', '2026-05-01', 'partial', 8420.03, 0, 8420.03);

-- Commercial documents
INSERT IGNORE INTO `documents` (client_id, title, type, date, status) VALUES
(1, 'CGS Technology Platform Agreement', 'agreement', '2026-03-24', 'active'),
(2, 'Kasi to Home Website Services Agreement', 'agreement', '2026-03-24', 'active'),
(3, 'Valo–OmniSolve Partnership Agreement', 'partnership', '2026-01-01', 'active'),
(3, 'OmniSolve–TWL SLA Review', 'review', '2026-04-01', 'active');

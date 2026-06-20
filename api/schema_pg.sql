-- Valo BMS — PostgreSQL Schema

SET client_encoding = 'UTF8';

CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role          VARCHAR(20) NOT NULL DEFAULT 'finance' CHECK (role IN ('admin','finance','viewer')),
  active        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS company (
  id              SERIAL PRIMARY KEY,
  name            VARCHAR(150) NOT NULL DEFAULT 'Valo Systems (Pty) Ltd',
  reg_number      VARCHAR(50),
  vat_number      VARCHAR(50),
  email           VARCHAR(150),
  phone           VARCHAR(50),
  address         TEXT,
  website         VARCHAR(150),
  bank_name       VARCHAR(100),
  account_holder  VARCHAR(150),
  account_number  VARCHAR(50),
  branch_code     VARCHAR(20),
  account_type    VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS clients (
  id              SERIAL PRIMARY KEY,
  name            VARCHAR(150) NOT NULL,
  code            VARCHAR(10) NOT NULL,
  email           VARCHAR(150),
  phone           VARCHAR(50),
  address         TEXT,
  billing_model   VARCHAR(20) NOT NULL DEFAULT 'project' CHECK (billing_model IN ('project','percentage','retainer','passthrough','hourly')),
  payment_terms   INT NOT NULL DEFAULT 30,
  status          VARCHAR(10) NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
  notes           TEXT,
  contract_start  DATE,
  created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invoices (
  id          SERIAL PRIMARY KEY,
  client_id   INT NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  number      VARCHAR(30) NOT NULL UNIQUE,
  period      VARCHAR(50),
  date        DATE,
  due_date    DATE,
  status      VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','estimated','confirmed','sent','paid','overdue','partial')),
  subtotal    NUMERIC(12,2) NOT NULL DEFAULT 0,
  vat         NUMERIC(12,2) NOT NULL DEFAULT 0,
  total       NUMERIC(12,2) NOT NULL DEFAULT 0,
  notes       TEXT,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invoice_line_items (
  id          SERIAL PRIMARY KEY,
  invoice_id  INT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity    NUMERIC(10,4) NOT NULL DEFAULT 1,
  unit_price  NUMERIC(12,2) NOT NULL DEFAULT 0,
  total       NUMERIC(12,2) NOT NULL DEFAULT 0,
  sort_order  INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS expenses (
  id          SERIAL PRIMARY KEY,
  description TEXT NOT NULL,
  category    VARCHAR(20) NOT NULL DEFAULT 'other' CHECK (category IN ('infrastructure','software','operations','marketing','travel','other')),
  amount      NUMERIC(12,2) NOT NULL DEFAULT 0,
  date        DATE,
  client      VARCHAR(20),
  billable    BOOLEAN NOT NULL DEFAULT TRUE,
  notes       TEXT,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS documents (
  id          SERIAL PRIMARY KEY,
  title       VARCHAR(255) NOT NULL,
  type        VARCHAR(20) NOT NULL DEFAULT 'other' CHECK (type IN ('agreement','partnership','sla','review','other')),
  client_id   INT REFERENCES clients(id) ON DELETE SET NULL,
  date        DATE,
  status      VARCHAR(10) NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','expired')),
  url         VARCHAR(500),
  notes       TEXT,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================
-- SEED DATA
-- ============================================================

INSERT INTO users (name, email, password_hash, role) VALUES
('Sibusiso Mashita', 'sibusiso.mashita@valosystems.co.za', '$2y$12$xuUQcNwgLBjVu3951RvLP.JIlnEoi6TTSTEK.rVIOTIdKvR1TXZwC', 'admin')
ON CONFLICT (email) DO NOTHING;

INSERT INTO company (id, name, email, address, website, bank_name, account_holder, account_number, branch_code, account_type) VALUES
(1, 'Valo Systems (Pty) Ltd', 'sibusiso.mashita@valosystems.co.za', 'Johannesburg, South Africa', 'valosystems.co.za', 'Nedbank', 'Valo Systems (Pty) Ltd', '1234567890', '198765', 'Current')
ON CONFLICT (id) DO NOTHING;

INSERT INTO clients (id, name, code, email, billing_model, payment_terms, status, contract_start) VALUES
(1, 'Convenient Gas Solutions', 'CGS', 'accounts@cgs.co.za', 'percentage', 30, 'active', '2026-03-24'),
(2, 'Kasi to Home', 'K2H', 'info@kasitohome.co.za', 'project', 30, 'active', '2026-03-24'),
(3, 'OmniSolve', 'OS', 'info@omnisolve.co.za', 'passthrough', 30, 'active', '2026-01-01')
ON CONFLICT (id) DO NOTHING;

SELECT setval('clients_id_seq', (SELECT MAX(id) FROM clients));

INSERT INTO invoices (id, client_id, number, period, date, due_date, status, subtotal, vat, total) VALUES
(1, 1, 'VAL-CGS-2026-000', 'March 2026', '2026-03-24', '2026-04-23', 'confirmed', 3600.00, 0, 3600.00),
(2, 1, 'VAL-CGS-2026-001', 'April 2026', '2026-04-30', '2026-05-30', 'estimated', 2724.40, 0, 2724.40),
(3, 2, 'VAL-K2H-2026-000', 'Project',    '2026-03-24', '2026-04-23', 'confirmed', 10979.00, 0, 10979.00),
(4, 3, 'VAL-OS-2026-001',  'Q1 2026',   '2026-04-01', '2026-05-01', 'partial',   8420.03, 0, 8420.03)
ON CONFLICT (id) DO NOTHING;

SELECT setval('invoices_id_seq', (SELECT MAX(id) FROM invoices));

INSERT INTO documents (client_id, title, type, date, status) VALUES
(1, 'CGS Technology Platform Agreement',      'agreement',   '2026-03-24', 'active'),
(2, 'Kasi to Home Website Services Agreement','agreement',   '2026-03-24', 'active'),
(3, 'Valo–OmniSolve Partnership Agreement',   'partnership', '2026-01-01', 'active'),
(3, 'OmniSolve–TWL SLA Review',               'review',      '2026-04-01', 'active');

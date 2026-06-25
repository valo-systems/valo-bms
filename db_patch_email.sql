-- Email system tables
-- Run once on the production database

CREATE TABLE IF NOT EXISTS email_templates (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    slug        VARCHAR(50)  NOT NULL UNIQUE,
    subject     VARCHAR(255) NOT NULL,
    body_html   LONGTEXT     NOT NULL,
    variables   JSON         NOT NULL,
    is_active   TINYINT(1)   NOT NULL DEFAULT 1,
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS email_log (
    id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    template_id  INT UNSIGNED NULL,
    invoice_id   INT UNSIGNED NULL,
    client_id    INT UNSIGNED NULL,
    message_id   VARCHAR(255) NULL,
    `to`         VARCHAR(255) NOT NULL,
    cc           VARCHAR(255) NULL,
    subject      VARCHAR(255) NOT NULL,
    body_html    LONGTEXT     NOT NULL,
    status       ENUM('sent','failed') NOT NULL,
    error        TEXT         NULL,
    sent_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE SET NULL,
    FOREIGN KEY (client_id)  REFERENCES clients(id)  ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS email_inbox (
    id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    message_id    VARCHAR(255) NOT NULL UNIQUE,
    in_reply_to   VARCHAR(255) NULL,
    log_id        INT UNSIGNED NULL,
    invoice_id    INT UNSIGNED NULL,
    client_id     INT UNSIGNED NULL,
    from_address  VARCHAR(255) NOT NULL,
    from_name     VARCHAR(255) NULL,
    subject       VARCHAR(255) NULL,
    body_text     LONGTEXT     NULL,
    body_html     LONGTEXT     NULL,
    received_at   DATETIME     NULL,
    read_at       DATETIME     NULL,
    created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (log_id)      REFERENCES email_log(id) ON DELETE SET NULL,
    FOREIGN KEY (invoice_id)  REFERENCES invoices(id)  ON DELETE SET NULL,
    FOREIGN KEY (client_id)   REFERENCES clients(id)   ON DELETE SET NULL
);

-- Seed default templates
INSERT INTO email_templates (name, slug, subject, body_html, variables) VALUES
(
    'Onboarding / Contract',
    'onboarding',
    'Invoice {{invoice_number}} & Technology Platform Agreement — Valo Systems',
    '<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><style>
body{font-family:Arial,sans-serif;color:#1a1a1a;font-size:14px;line-height:1.6;max-width:620px;margin:0 auto;padding:24px}
.header{border-bottom:2px solid #0a0a0a;padding-bottom:16px;margin-bottom:24px}
.logo{font-size:20px;font-weight:700;letter-spacing:0.05em}
h2{font-size:15px;margin-top:24px;margin-bottom:8px}
.box{background:#f9f9f9;border:1px solid #e5e5e5;border-radius:6px;padding:16px;margin:16px 0}
.box table{width:100%;border-collapse:collapse}
.box td{padding:4px 0;font-size:13px}
.box td:first-child{color:#666;width:160px}
.box td:last-child{font-weight:600}
.ref{color:#2563eb;font-weight:700}
.footer{margin-top:32px;padding-top:16px;border-top:1px solid #e5e5e5;font-size:12px;color:#666}
.footer strong{color:#1a1a1a}
</style></head>
<body>
<div class="header"><div class="logo">VALO SYSTEMS</div></div>

<p>Hi {{contact_name}},</p>
<p>I hope you are well.</p>
<p>Please find attached the following two documents to formalise our partnership and move things forward:</p>

<h2>1. Invoice {{invoice_number}} — Implementation &amp; Go-Live Fee</h2>
<p>This is the once-off invoice for the platform setup, deployment, and go-live work completed for your system.</p>
{{#if discount_amount}}
<p>The standard implementation fee for a platform of this scope is {{original_amount}}. As a goodwill gesture, and in recognition of where {{client_name}} currently is, we have applied a partner support discount of {{discount_amount}}, bringing the total amount due to <strong>{{invoice_amount}}</strong>.</p>
{{else}}
<p>The total amount due is <strong>{{invoice_amount}}</strong>.</p>
{{/if}}

<div class="box">
  <table>
    <tr><td>Bank</td><td>FNB / RMB</td></tr>
    <tr><td>Account Holder</td><td>Valo</td></tr>
    <tr><td>Account Type</td><td>Gold Business Account</td></tr>
    <tr><td>Account Number</td><td>63194158987</td></tr>
    <tr><td>Branch Code</td><td>255355</td></tr>
    <tr><td>Reference</td><td class="ref">{{invoice_number}}</td></tr>
    <tr><td>Due Date</td><td>{{due_date}}</td></tr>
  </table>
</div>

<p><em>Please note that production go-live is conditional upon full settlement of this invoice.</em></p>

<h2>2. Technology Platform and Services Agreement — v1.0</h2>
<p>This agreement formally sets out the terms of our partnership, including:</p>
<ul>
  <li>The platform and services provided by Valo</li>
  <li>The 5% revenue share model and the R2,000/month minimum during ramp-up</li>
  <li>Infrastructure pass-through billing</li>
  <li>Data protection and POPIA obligations</li>
  <li>Support, uptime, and maintenance commitments</li>
  <li>Intellectual property ownership and confidentiality provisions</li>
</ul>

<p>Please review the agreement carefully. A few fields still require your input before signing:</p>
<ul>
  <li>Company registration number</li>
  <li>Registered business address</li>
</ul>

<p>Once you are satisfied with the terms, please sign and return a copy by reply to this email. We will countersign and send you the fully executed copy for your records.</p>
<p>You are welcome to have the agreement reviewed by a South African attorney before signing if you would like independent legal advice. We have, however, drafted it to be clear, practical, and fair to both parties.</p>
<p>Please feel free to reply to this email or reach out on WhatsApp if you have any questions about either document.</p>

<div class="footer">
  <p>Warm regards,<br><strong>Valo Systems</strong><br>
  VALO (PTY) LTD | Reg No: 2026/072094/07<br>
  billing@valosystems.co.za</p>
</div>
</body>
</html>',
    '["contact_name","client_name","invoice_number","invoice_amount","original_amount","discount_amount","due_date"]'
),
(
    'Monthly Billing',
    'monthly-billing',
    'Invoice {{invoice_number}} — {{period}} | Valo Systems',
    '<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><style>
body{font-family:Arial,sans-serif;color:#1a1a1a;font-size:14px;line-height:1.6;max-width:620px;margin:0 auto;padding:24px}
.header{border-bottom:2px solid #0a0a0a;padding-bottom:16px;margin-bottom:24px}
.logo{font-size:20px;font-weight:700;letter-spacing:0.05em}
.box{background:#f9f9f9;border:1px solid #e5e5e5;border-radius:6px;padding:16px;margin:16px 0}
.box table{width:100%;border-collapse:collapse}
.box td{padding:4px 0;font-size:13px}
.box td:first-child{color:#666;width:160px}
.box td:last-child{font-weight:600}
.ref{color:#2563eb;font-weight:700}
.amount{font-size:22px;font-weight:700;color:#0a0a0a}
.footer{margin-top:32px;padding-top:16px;border-top:1px solid #e5e5e5;font-size:12px;color:#666}
.footer strong{color:#1a1a1a}
</style></head>
<body>
<div class="header"><div class="logo">VALO SYSTEMS</div></div>

<p>Hi {{contact_name}},</p>
<p>Please find attached your invoice for <strong>{{period}}</strong>.</p>

<div class="box">
  <table>
    <tr><td>Invoice No</td><td>{{invoice_number}}</td></tr>
    <tr><td>Period</td><td>{{period}}</td></tr>
    <tr><td>Amount Due</td><td class="amount">{{amount}}</td></tr>
    <tr><td>Due Date</td><td>{{due_date}}</td></tr>
  </table>
</div>

<p>Payment details:</p>
<div class="box">
  <table>
    <tr><td>Bank</td><td>FNB / RMB</td></tr>
    <tr><td>Account Holder</td><td>Valo</td></tr>
    <tr><td>Account Type</td><td>Gold Business Account</td></tr>
    <tr><td>Account Number</td><td>63194158987</td></tr>
    <tr><td>Branch Code</td><td>255355</td></tr>
    <tr><td>Reference</td><td class="ref">{{invoice_number}}</td></tr>
  </table>
</div>

<p>If you have any questions about this invoice, please do not hesitate to reach out.</p>

<div class="footer">
  <p>Warm regards,<br><strong>Valo Systems</strong><br>
  VALO (PTY) LTD | Reg No: 2026/072094/07<br>
  billing@valosystems.co.za</p>
</div>
</body>
</html>',
    '["contact_name","client_name","invoice_number","amount","period","due_date"]'
);

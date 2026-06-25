-- Production patch: email system tables + final template content
-- Run ONCE on prod: mysql -u <user> <db> < db_patch_prod_email_system.sql
-- Safe to re-run — uses CREATE TABLE IF NOT EXISTS and INSERT ... ON DUPLICATE KEY UPDATE

USE valosyst_bms;

-- ── Tables ───────────────────────────────────────────────────────────────────

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

-- ── Templates ─────────────────────────────────────────────────────────────────
-- INSERT ... ON DUPLICATE KEY UPDATE means re-running this is safe.

INSERT INTO email_templates (name, slug, subject, body_html, variables) VALUES (
  'Onboarding / Contract',
  'onboarding',
  'Invoice {{invoice_number}} and Technology Platform Agreement - Valo Systems',
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
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td>
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
      </td>
    </tr>
  </table>
</td></tr>
</table>
</body>
</html>',
  '[{"key":"contact_name","label":"Contact name","example":"John"},{"key":"client_name","label":"Client name","example":"CGS Security"},{"key":"invoice_number","label":"Invoice number","example":"VAL-CGS-2026-001"},{"key":"invoice_amount","label":"Invoice amount","example":"R 3,500.00"},{"key":"due_date","label":"Due date","example":"30 June 2026"}]'
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
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td>
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
      </td>
    </tr>
  </table>
</td></tr>
</table>
</body>
</html>',
  '[{"key":"contact_name","label":"Contact name","example":"John"},{"key":"client_name","label":"Client name","example":"CGS Security"},{"key":"invoice_number","label":"Invoice number","example":"VAL-CGS-2026-002"},{"key":"invoice_amount","label":"Invoice amount","example":"R 3,500.00"},{"key":"period","label":"Billing period","example":"June 2026"},{"key":"due_date","label":"Due date","example":"30 June 2026"}]'
)
ON DUPLICATE KEY UPDATE
  name      = VALUES(name),
  subject   = VALUES(subject),
  body_html = VALUES(body_html),
  variables = VALUES(variables);

-- Email template redesign v2
-- Shared base: gold top border, logo CID, company identity block, strong amount, verification note
-- Run: mysql -u root valo_bms < db_patch_email_templates_v2.sql

-- ─── SHARED BASE STYLES (embedded in both templates) ────────────────────────
-- Logo: <img src="cid:valo_logo"> — PHPMailer attaches it as Content-ID "valo_logo"
-- Amount block: large gold figure, strongly visible
-- Verification note: always present (not a conditional)

-- ─── 1. ONBOARDING / CONTRACT ───────────────────────────────────────────────
UPDATE email_templates
SET
  subject  = 'Invoice {{invoice_number}} & Technology Platform Agreement — Valo Systems',
  body_html = '<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Invoice {{invoice_number}} — Valo Systems</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4f4f4;padding:32px 0;">
<tr><td align="center">

  <table width="600" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;border-radius:4px;overflow:hidden;border:1px solid #e0e0e0;">

    <!-- Gold top border -->
    <tr><td style="background:#d4af37;height:4px;font-size:0;line-height:0;">&nbsp;</td></tr>

    <!-- Logo + header -->
    <tr>
      <td style="padding:32px 40px 24px;">
        <img src="cid:valo_logo" alt="Valo Systems" width="160" style="display:block;border:0;">
      </td>
    </tr>

    <!-- Subject line -->
    <tr>
      <td style="padding:0 40px 24px;border-bottom:1px solid #eeeeee;">
        <p style="margin:0;font-size:20px;font-weight:bold;color:#1a1a1a;">Invoice {{invoice_number}}</p>
        <p style="margin:6px 0 0;font-size:14px;color:#555555;">Technology Platform Agreement</p>
      </td>
    </tr>

    <!-- Body -->
    <tr>
      <td style="padding:28px 40px 0;">
        <p style="margin:0 0 16px;font-size:15px;color:#333333;line-height:1.6;">
          Dear {{contact_name}},
        </p>
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

    <!-- Amount block -->
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

    <!-- Payment verification note -->
    <tr>
      <td style="padding:0 40px 28px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0"
               style="background:#fffbf0;border:1px solid #f0e8cc;border-radius:3px;">
          <tr>
            <td style="padding:16px 20px;">
              <p style="margin:0;font-size:13px;color:#7a6020;line-height:1.6;">
                <strong>Payment reference:</strong> Please use <strong>{{invoice_number}}</strong> as your payment reference.
                Payments should only be made to the banking details shown on the attached invoice.
                If you receive any communication asking you to pay to different banking details, please contact us immediately
                before making any payment.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Closing -->
    <tr>
      <td style="padding:0 40px 32px;">
        <p style="margin:0 0 16px;font-size:15px;color:#333333;line-height:1.6;">
          If anything on this invoice or agreement needs to be corrected before payment,
          please reply to this email and we will assist.
        </p>
        <p style="margin:0;font-size:15px;color:#333333;line-height:1.6;">
          Thank you for choosing Valo Systems — we look forward to working with you.
        </p>
      </td>
    </tr>

    <!-- Company identity block -->
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
  variables = JSON_ARRAY(
    JSON_OBJECT('key','contact_name',   'label','Contact name',    'example','John'),
    JSON_OBJECT('key','client_name',    'label','Client name',     'example','CGS Security'),
    JSON_OBJECT('key','invoice_number', 'label','Invoice number',  'example','VAL-CGS-2026-001'),
    JSON_OBJECT('key','invoice_amount', 'label','Invoice amount',  'example','R 3,500.00'),
    JSON_OBJECT('key','due_date',       'label','Due date',        'example','30 June 2026')
  )
WHERE slug = 'onboarding';


-- ─── 2. MONTHLY BILLING ─────────────────────────────────────────────────────
UPDATE email_templates
SET
  subject  = 'Invoice {{invoice_number}} — {{period}} | Valo Systems',
  body_html = '<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Invoice {{invoice_number}} — Valo Systems</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4f4f4;padding:32px 0;">
<tr><td align="center">

  <table width="600" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;border-radius:4px;overflow:hidden;border:1px solid #e0e0e0;">

    <!-- Gold top border -->
    <tr><td style="background:#d4af37;height:4px;font-size:0;line-height:0;">&nbsp;</td></tr>

    <!-- Logo + header -->
    <tr>
      <td style="padding:32px 40px 24px;">
        <img src="cid:valo_logo" alt="Valo Systems" width="160" style="display:block;border:0;">
      </td>
    </tr>

    <!-- Subject line -->
    <tr>
      <td style="padding:0 40px 24px;border-bottom:1px solid #eeeeee;">
        <p style="margin:0;font-size:20px;font-weight:bold;color:#1a1a1a;">Invoice {{invoice_number}}</p>
        <p style="margin:6px 0 0;font-size:14px;color:#555555;">{{period}}</p>
      </td>
    </tr>

    <!-- Body -->
    <tr>
      <td style="padding:28px 40px 0;">
        <p style="margin:0 0 16px;font-size:15px;color:#333333;line-height:1.6;">
          Dear {{contact_name}},
        </p>
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

    <!-- Amount block -->
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

    <!-- Payment verification note -->
    <tr>
      <td style="padding:0 40px 28px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0"
               style="background:#fffbf0;border:1px solid #f0e8cc;border-radius:3px;">
          <tr>
            <td style="padding:16px 20px;">
              <p style="margin:0;font-size:13px;color:#7a6020;line-height:1.6;">
                <strong>Payment reference:</strong> Please use <strong>{{invoice_number}}</strong> as your payment reference.
                Payments should only be made to the banking details shown on the attached invoice.
                If you receive any communication asking you to pay to different banking details, please contact us immediately
                before making any payment.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Closing -->
    <tr>
      <td style="padding:0 40px 32px;">
        <p style="margin:0 0 16px;font-size:15px;color:#333333;line-height:1.6;">
          If anything on this invoice needs to be corrected before payment,
          please reply to this email and we will assist.
        </p>
        <p style="margin:0;font-size:15px;color:#333333;line-height:1.6;">
          Thank you — we appreciate your continued partnership.
        </p>
      </td>
    </tr>

    <!-- Company identity block -->
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
  variables = JSON_ARRAY(
    JSON_OBJECT('key','contact_name',   'label','Contact name',    'example','John'),
    JSON_OBJECT('key','client_name',    'label','Client name',     'example','CGS Security'),
    JSON_OBJECT('key','invoice_number', 'label','Invoice number',  'example','VAL-CGS-2026-002'),
    JSON_OBJECT('key','invoice_amount', 'label','Invoice amount',  'example','R 3,500.00'),
    JSON_OBJECT('key','period',         'label','Billing period',  'example','June 2026'),
    JSON_OBJECT('key','due_date',       'label','Due date',        'example','30 June 2026')
  )
WHERE slug = 'monthly-billing';

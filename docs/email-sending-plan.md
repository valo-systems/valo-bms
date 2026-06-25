# Email Sending — Implementation Plan

## Overview

Send transactional emails from `billing@valosystems.co.za` directly within the BMS.
Two primary use cases: onboarding a new client (contract + first invoice) and monthly billing.

---

## SMTP Configuration

- **Server:** `mail.valosystems.co.za`
- **Port:** 465 (SSL/TLS)
- **Username:** `billing@valosystems.co.za`
- **Password:** stored in `api/config/config.local.php` (gitignored, never committed)

Add to `config.local.php`:
```php
define('_SMTP_HOST', 'mail.valosystems.co.za');
define('_SMTP_PORT', 465);
define('_SMTP_USER', 'billing@valosystems.co.za');
define('_SMTP_PASS', 'YOUR_PASSWORD_HERE');
define('_SMTP_FROM_NAME', 'Valo Systems');
```

---

## Email Templates

### Template 1 — Onboarding / Contract
Sent when a new client is signed up. Mirrors the CGS onboarding email.

**Variables:**
| Variable | Source |
|---|---|
| `{{client_name}}` | clients table |
| `{{contact_name}}` | clients table (primary contact) |
| `{{invoice_number}}` | invoices table |
| `{{invoice_amount}}` | invoices table |
| `{{discount_amount}}` | invoices table |
| `{{due_date}}` | invoices table |
| `{{bank_name}}` | config / static |
| `{{account_holder}}` | config / static |
| `{{account_number}}` | config / static |
| `{{branch_code}}` | config / static |

### Template 2 — Monthly Billing
Sent for recurring monthly invoices.

**Variables:**
| Variable | Source |
|---|---|
| `{{client_name}}` | clients table |
| `{{contact_name}}` | clients table |
| `{{invoice_number}}` | invoices table |
| `{{amount}}` | invoices table |
| `{{due_date}}` | invoices table |
| `{{period}}` | derived (e.g. "June 2026") |
| `{{line_items}}` | invoice line items |

---

## Database

### New table: `email_templates`
Stores editable templates managed via the UI.

```sql
CREATE TABLE email_templates (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,          -- e.g. "Onboarding / Contract"
  slug        VARCHAR(50)  NOT NULL UNIQUE,   -- e.g. "onboarding", "monthly-billing"
  subject     VARCHAR(255) NOT NULL,
  body_html   LONGTEXT     NOT NULL,          -- HTML with {{variable}} placeholders
  variables   JSON         NOT NULL,          -- list of supported variable names
  is_active   TINYINT(1)   DEFAULT 1,
  created_at  DATETIME     DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### New table: `email_log`
Audit trail of every email sent.

```sql
CREATE TABLE email_log (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  template_id  INT          NULL REFERENCES email_templates(id),
  invoice_id   INT          NULL REFERENCES invoices(id),
  client_id    INT          NULL REFERENCES clients(id),
  to_address   VARCHAR(255) NOT NULL,
  cc_address   VARCHAR(255) NULL,
  subject      VARCHAR(255) NOT NULL,
  body_html    LONGTEXT     NOT NULL,          -- rendered final body (snapshot)
  status       ENUM('sent','failed') NOT NULL,
  error        TEXT         NULL,
  sent_at      DATETIME     DEFAULT CURRENT_TIMESTAMP
);
```

---

## Backend (PHP)

### Dependencies
Install PHPMailer via Composer:
```bash
composer require phpmailer/phpmailer
```

### New API endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/emails/templates/index.php` | List all templates |
| `GET` | `/emails/templates/show.php?id=` | Get single template |
| `POST` | `/emails/templates/create.php` | Create new template |
| `PUT` | `/emails/templates/update.php?id=` | Update template (subject + body) |
| `DELETE` | `/emails/templates/delete.php?id=` | Delete template |
| `POST` | `/emails/send.php` | Render + send an email |
| `GET` | `/emails/log/index.php?invoice_id=` | Email history for an invoice |
| `GET` | `/emails/preview.php` | Render template with variables (no send) |

### `api/emails/mailer.php` — shared mailer helper
Initialises PHPMailer with SMTP credentials, called by `send.php`.

### `api/emails/send.php` — send endpoint
Request body:
```json
{
  "template_id": 1,
  "invoice_id": 6,
  "to": "ndivhu@convenientgas.co.za",
  "cc": "sibusiso@valosystems.co.za",
  "overrides": {
    "subject": "optional override",
    "body_html": "optional full override"
  },
  "attachments": [
    { "type": "invoice_pdf", "invoice_id": 6 }
  ]
}
```

Response:
```json
{ "success": true, "log_id": 42 }
```

---

## PDF Invoice Attachment

Generate a PDF of the invoice server-side and attach it to the email.

### Approach
Use **Dompdf** (pure PHP, no wkhtmltopdf dependency):
```bash
composer require dompdf/dompdf
```

### New endpoint
| Method | Path | Description |
|---|---|---|
| `GET` | `/invoices/pdf.php?id=` | Stream invoice as PDF download |

The same PDF renderer is called internally by `send.php` when `attachments` includes `invoice_pdf`.

### Invoice PDF template
`api/invoices/templates/invoice.html.php` — styled HTML rendered by Dompdf.
Includes: Valo logo, invoice number, line items table, payment details, footer.

---

## Template CRUD — UI

### New section: Settings > Email Templates (or standalone nav item)

**List view**
- Table: name, slug, subject, last updated, active toggle, Edit / Delete actions
- "New Template" button

**Editor view**
- Fields: Name, Slug (auto-generated, editable), Subject, Active toggle
- Body: rich HTML editor (consider **Quill** or plain `<textarea>` with syntax hint)
- Variable reference panel on the right — shows supported `{{variables}}` for the chosen context
- "Preview" button — opens rendered preview modal with sample data
- "Save" button

**Preview modal**
- Renders the template with real or sample invoice/client data
- Shows final subject line and HTML body

---

## UI — Send Email Flow

### Invoice detail page
Add a **"Send Email"** button in the invoice actions bar.

**Send Email modal:**
1. Template selector dropdown (populated from `email_templates`)
2. To field — pre-filled from client's email, editable
3. CC field — optional
4. Subject — pre-filled from template, editable
5. Body preview — rendered HTML (read-only in modal; "Edit Template" link opens editor)
6. Attachments toggle — "Attach PDF invoice" checkbox (default on)
7. "Send" button → POST to `/emails/send.php` → success/error toast

### Email history panel (invoice detail page)
Below the invoice details, add a collapsible "Email History" section.
Shows: date sent, template used, recipient, status (sent/failed), "View" to see rendered body snapshot.

---

## Inbound Email / Replies

Track replies from clients against invoices or threads.

### Approach
Poll the `billing@valosystems.co.za` IMAP inbox on a schedule (cron or manual trigger).

### New table: `email_inbox`
```sql
CREATE TABLE email_inbox (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  message_id    VARCHAR(255) NOT NULL UNIQUE,  -- IMAP Message-ID header
  in_reply_to   VARCHAR(255) NULL,             -- matched against sent email Message-ID
  log_id        INT          NULL REFERENCES email_log(id),
  invoice_id    INT          NULL REFERENCES invoices(id),
  client_id     INT          NULL REFERENCES clients(id),
  from_address  VARCHAR(255) NOT NULL,
  subject       VARCHAR(255),
  body_text     LONGTEXT,
  body_html     LONGTEXT,
  received_at   DATETIME,
  read_at       DATETIME     NULL,
  created_at    DATETIME     DEFAULT CURRENT_TIMESTAMP
);
```

### New API endpoints
| Method | Path | Description |
|---|---|---|
| `POST` | `/emails/inbox/sync.php` | Poll IMAP and store new messages |
| `GET` | `/emails/inbox/index.php` | List inbox (with filters: unread, client, invoice) |
| `PATCH` | `/emails/inbox/read.php?id=` | Mark message as read |

### UI — Inbox view
New nav item: **Inbox**
- List of received emails: from, subject, linked invoice/client, received date, read/unread badge
- Click to open thread view — shows the outbound email and the reply together
- "Reply" button — opens Send Email modal pre-filled with reply context
- Filter by: All / Unread / Client

### Thread linking
When polling IMAP, match `In-Reply-To` header against `email_log` Message-IDs to auto-link replies to the original invoice and client.

---

## Implementation Order

1. **SMTP setup** — `config.local.php`, PHPMailer install, `mailer.php`
2. **DB migration** — `email_templates`, `email_log` tables; seed the two default templates
3. **Send endpoint** — `send.php` with template rendering + logging
4. **UI: Send Email modal** — on invoice detail, no template editor yet
5. **PDF generation** — Dompdf install, `invoice.html.php` template, `pdf.php` endpoint; wire into send
6. **Template CRUD API** — CRUD endpoints for `email_templates`
7. **UI: Template editor** — Settings > Email Templates, list + editor + preview
8. **Email history panel** — on invoice detail page
9. **IMAP polling** — `inbox/sync.php`, `email_inbox` table
10. **UI: Inbox view** — list + thread view + reply flow

---

## Decisions

- **IMAP sync:** Manual trigger — "Sync Inbox" button in the Inbox UI. No cron dependency.
- **PDF style:** Matches the existing invoice layout from InvoiceDetail (same sections, logo, payment details, banking block).
- **Template editor:** Plain HTML textarea with live preview toggle. No external editor dependency.

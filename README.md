<div align="center">

# Valo BMS

*Valo Systems internal business management system.*

[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![PHP](https://img.shields.io/badge/PHP-8-777BB4?style=flat-square&logo=php&logoColor=white)](#)
[![MySQL](https://img.shields.io/badge/MySQL-8-4479A1?style=flat-square&logo=mysql&logoColor=white)](#)
[![cPanel](https://img.shields.io/badge/Hosted_on-cPanel-FF6C2C?style=flat-square&logo=cpanel&logoColor=white)](#deployment)
[![Status](https://img.shields.io/badge/Status-Internal-6366f1?style=flat-square)](#)

**[bms.valosystems.co.za](https://bms.valosystems.co.za)**

</div>

---

## About

Valo BMS is the internal business management platform for Valo Systems. It handles client records, invoicing, expenses, commercial documents, team profiles, and company settings — all in one place. Access is restricted to authorised Valo Systems staff.

---

## Features

| Module | What it does |
|--------|-------------|
| **Dashboard** | Revenue summary, outstanding invoices, recent activity |
| **Clients** | Full client profiles, billing terms, infrastructure details, per-client invoice history |
| **Invoices** | Create, manage, and print invoices — section A/B line items, FX rates, period notes, status workflow |
| **Expenses** | Log and track business expenses |
| **Commercial Docs** | Upload and track agreements, SLAs, partnership docs, and reviews |
| **Team** | Staff profiles, employment details, banking and payroll info |
| **Company** | Valo Systems company settings |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 |
| Build | Vite 8 |
| Styling | Tailwind CSS 3 |
| Icons | Lucide React |
| Routing | React Router 6 |
| HTTP | Axios |
| API | PHP 8 (plain PHP, no framework) |
| Database | MySQL 8 |
| Auth | JWT (HS256, 7-day expiry) |
| Hosting | cPanel (`valosyst` account) |
| Deployment | cPanel Git Version Control (`.cpanel.yml`) — planned |

---

## Project Structure

```
valo-bms/
├── api/                           # PHP REST API
│   ├── config/
│   │   ├── database.php           # PDO connection + env var config
│   │   └── helpers.php            # cors(), auth_required(), ok(), fail(), JWT
│   ├── auth/
│   │   ├── login.php              # POST /auth/login.php
│   │   └── me.php                 # GET  /auth/me.php
│   ├── clients/
│   │   ├── index.php              # GET    /clients/index.php
│   │   ├── show.php               # GET    /clients/show.php?id=
│   │   ├── create.php             # POST   /clients/create.php
│   │   ├── update.php             # PUT    /clients/update.php?id=
│   │   └── delete.php             # DELETE /clients/delete.php?id=
│   ├── invoices/
│   │   ├── index.php              # GET    /invoices/index.php[?client_id=&status=]
│   │   ├── show.php               # GET    /invoices/show.php?id=
│   │   ├── create.php             # POST   /invoices/create.php
│   │   ├── update.php             # PUT    /invoices/update.php?id=
│   │   └── status.php             # PATCH  /invoices/status.php?id=
│   ├── expenses/
│   │   ├── index.php              # GET    /expenses/index.php
│   │   └── create.php             # POST   /expenses/create.php
│   ├── documents/
│   │   ├── index.php              # GET    /documents/index.php
│   │   └── create.php             # POST   /documents/create.php
│   ├── users/
│   │   ├── index.php              # GET    /users/index.php
│   │   ├── show.php               # GET    /users/show.php?id=
│   │   └── update.php             # PUT    /users/update.php?id=
│   ├── company/
│   │   ├── index.php              # GET    /company/index.php
│   │   └── update.php             # PUT    /company/update.php
│   ├── dashboard/
│   │   └── summary.php            # GET    /dashboard/summary.php
│   ├── schema.sql                 # MySQL schema (canonical)
│   └── .htaccess                  # Security headers, block config files
├── src/
│   ├── api/
│   │   ├── client.js              # Axios instance, JWT interceptor, 401 redirect
│   │   └── endpoints.js           # Named API call wrappers
│   ├── components/
│   │   ├── Layout.jsx             # Sidebar + top bar shell
│   │   └── ui/                    # Badge, Button, Input, Modal, Table, StatCard, Typography
│   ├── context/
│   │   └── AuthContext.jsx        # Login state, token storage, logout
│   ├── pages/
│   │   ├── Dashboard.jsx
│   │   ├── Clients.jsx            # Client list + new client modal
│   │   ├── ClientDetail.jsx       # Full client view + edit
│   │   ├── Invoices.jsx           # Invoice list, status quick-change
│   │   ├── NewInvoice.jsx         # Invoice builder (line items, FX, period)
│   │   ├── InvoiceDetail.jsx      # Invoice view + print
│   │   ├── Financials.jsx         # Expenses + financial overview
│   │   ├── Documents.jsx          # Commercial doc vault
│   │   ├── Team.jsx               # Staff directory
│   │   ├── StaffProfile.jsx       # Individual staff profile
│   │   ├── Company.jsx            # Company settings
│   │   └── Login.jsx
│   ├── index.css                  # Tailwind directives + custom valo-* tokens
│   └── main.jsx
├── db_setup.sql                   # Full DB schema + seed data (run once locally)
├── vite.config.js                 # Dev proxy: /api → localhost:8080
├── tailwind.config.js
└── index.html
```

---

## Local Development

### Prerequisites

- Node.js 20+
- PHP 8.1+ with PDO and MySQL extensions
- MySQL 8

### 1. Frontend

```bash
npm install
npm run dev
```

Frontend runs at [http://localhost:5173](http://localhost:5173).

### 2. API (PHP dev server)

```bash
cd api
php -S localhost:8080
```

Vite proxies `/api/*` → `http://localhost:8080/*` automatically (see `vite.config.js`).

### 3. Database

```bash
mysql -u root -p < db_setup.sql
```

This creates the `valo_bms` database and seeds the initial admin user.

### 4. Environment (optional override)

The API reads these environment variables — defaults work for local dev:

| Variable | Default | Production value |
|----------|---------|-----------------|
| `DB_HOST` | `localhost` | `localhost` |
| `DB_NAME` | `valo_bms` | `valosyst_bms` |
| `DB_USER` | `root` | `valosyst_bms_admin` |
| `DB_PASS` | *(empty)* | see cPanel MySQL |
| `JWT_SECRET` | `valo-bms-jwt-secret-2026` | strong random string |

Set them via cPanel's environment variable manager or a `.env` file loaded by `database.php`.

---

## Build

```bash
npm run build
```

Output goes to `dist/`. The API (`api/`) is deployed separately alongside it on the server.

---

## Deployment Plan (cPanel — not yet live)

This section documents the intended deployment to `bms.valosystems.co.za` on the `valosyst` cPanel account. The database has already been provisioned.

### Server layout (planned)

```
/home/valosyst/
├── public_html/
│   └── bms.valosystems.co.za/        ← Vite dist output (React SPA)
│       ├── index.html
│       ├── assets/
│       └── .htaccess                 ← HTTPS redirect + SPA fallback
└── repositories/
    └── valo-bms/                     ← cPanel Git clone (full repo)
```

The `.cpanel.yml` deployment script will copy `dist/` and `api/` to their correct locations after each push to `main`.

> The `api/config/database.php` already guards against direct browser access via `.htaccess`. On cPanel, environment variables will be set via **Software → Setup Python App** or injected into the PHP environment — `database.php` will pick them up automatically via `getenv()`.

### Database (already created)

| Setting | Value |
|---------|-------|
| Database | `valosyst_bms` |
| User | `valosyst_bms_admin` |
| Host | `localhost` |

Import the schema once via **cPanel → phpMyAdmin**, or:

```bash
mysql -h localhost -u valosyst_bms_admin -p valosyst_bms < db_setup.sql
```

### What still needs to be done before deploy

- [ ] Create `.cpanel.yml` — copy `dist/` to `public_html/bms.valosystems.co.za/`, copy `api/` to its server path
- [ ] Create `.htaccess` for the SPA — HTTPS enforcement, `www` → non-www redirect, React Router SPA fallback (`RewriteRule ^ /index.html [L]`)
- [ ] Set `DB_PASS` and `JWT_SECRET` environment variables in cPanel
- [ ] Configure cPanel Git Version Control — clone from `https://github.com/valo-systems/valo-bms.git`, branch `main`
- [ ] Run `npm run build` and push `dist/` to the repo (or trigger a remote build)
- [ ] Add subdomain `bms.valosystems.co.za` in cPanel if not already present

---

## Database Schema

Eight tables — all InnoDB, utf8mb4:

| Table | Purpose |
|-------|---------|
| `users` | BMS login accounts, staff profiles, payroll details |
| `clients` | Client companies, billing terms, infrastructure config |
| `invoices` | Invoice headers — number, period, FX, status |
| `invoice_line_items` | Line items per invoice (section A/B, USD amounts, discounts) |
| `invoice_item_templates` | Reusable line item templates per client |
| `expenses` | Business expense records |
| `company` | Valo Systems company details (singleton row) |
| `documents` | Commercial document vault — agreements, SLAs, reviews |

---

## API Overview

All endpoints require `Authorization: Bearer <token>` except `/auth/login.php`. Responses are JSON. Errors return `{ error: string, code: string }`.

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/login.php` | Login, returns JWT |
| GET | `/auth/me.php` | Current user |
| GET | `/clients/index.php` | List all clients |
| GET | `/clients/show.php?id=` | Single client |
| POST | `/clients/create.php` | Create client |
| PUT | `/clients/update.php?id=` | Update client |
| DELETE | `/clients/delete.php?id=` | Delete client |
| GET | `/invoices/index.php` | List invoices (`?client_id=`, `?status=`) |
| GET | `/invoices/show.php?id=` | Single invoice with line items |
| POST | `/invoices/create.php` | Create invoice |
| PUT | `/invoices/update.php?id=` | Update invoice |
| PATCH | `/invoices/status.php?id=` | Update invoice status only |
| GET | `/expenses/index.php` | List expenses |
| POST | `/expenses/create.php` | Create expense |
| GET | `/documents/index.php` | List documents |
| POST | `/documents/create.php` | Create document record |
| GET | `/users/index.php` | List team members |
| GET | `/users/show.php?id=` | Single user |
| PUT | `/users/update.php?id=` | Update user profile |
| GET | `/company/index.php` | Company settings |
| PUT | `/company/update.php` | Update company settings |
| GET | `/dashboard/summary.php` | Revenue + stats summary |

---

## Access & Roles

| Role | Access |
|------|--------|
| `admin` | Full access — all modules, user management |
| `finance` | Clients, invoices, expenses, documents, read-only team |
| `viewer` | Read-only dashboard and invoices |

---

<div align="center">

*Prepared by [Valo Systems](https://valosystems.co.za)*

</div>

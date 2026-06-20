-- ============================================================
-- Valo BMS — CICP Document Records
-- Run against valosyst_bms after deploying the repo
-- (files land at /uploads/documents/cicp/ via public/)
-- ============================================================

INSERT INTO documents (name, ref, category, file_path, status, date, notes) VALUES

('CIPC Registration — CM1 Form (COR14.1)',
 'COR-2026-001', 'compliance',
 '/uploads/documents/cicp/COR14.1.pdf',
 'available', '2026-01-29',
 'CIPC CM1 company registration form — VALO (PTY) LTD reg 2026/072094/07'),

('CIPC Registration — Name Reservation (COR14.1A)',
 'COR-2026-002', 'compliance',
 '/uploads/documents/cicp/COR14.1A.pdf',
 'available', '2026-01-29',
 'CIPC name reservation certificate for Valo (Pty) Ltd'),

('Memorandum of Incorporation (COR14.3)',
 'COR-2026-003', 'compliance',
 '/uploads/documents/cicp/COR14.3.pdf',
 'available', '2026-01-29',
 'Standard MOI filed with CIPC on incorporation'),

('CIPC Registration Certificate (COR15.1A)',
 'COR-2026-004', 'compliance',
 '/uploads/documents/cicp/COR15.1A.pdf',
 'available', '2026-01-29',
 'Official CIPC certificate of incorporation — primary registration document'),

('CIPC Welcome Letter',
 'COR-2026-005', 'compliance',
 '/uploads/documents/cicp/CIPC-Welcome-Letter.pdf',
 'available', '2026-01-29',
 'CIPC welcome letter issued on registration'),

('SARS Income Tax Registration',
 'TAX-2026-001', 'tax',
 '/uploads/documents/cicp/SARS-Tax-Registration.pdf',
 'available', '2026-01-29',
 'SARS income tax registration — tax number 9594324221'),

('CSD Registration Summary Report',
 'CSD-2026-001', 'compliance',
 '/uploads/documents/cicp/CSD-Registration-Summary.pdf',
 'available', '2026-05-23',
 'Central Supplier Database registration — CSD number MAAA1722994'),

('B-BBEE Verification Certificate — Level 1',
 'BEE-2026-001', 'compliance',
 '/uploads/documents/cicp/BEE-Verification-Level1.pdf',
 'available', '2026-02-05',
 'B-BBEE Level 1 EME certificate. Expires 2027-01-01'),

('B-BBEE Sworn Affidavit',
 'BEE-2026-002', 'compliance',
 '/uploads/documents/cicp/BEE-Sworn-Affidavit.pdf',
 'available', '2026-01-30',
 'Sworn affidavit supporting Exempt Micro Enterprise B-BBEE Level 1 status'),

('Bank Account Confirmation — FNB',
 'BNK-2026-001', 'banking',
 '/uploads/documents/cicp/Bank-FNB-Account-Confirmation.pdf',
 'available', '2026-05-17',
 'FNB Gold Business Account confirmation — account 63194158987, branch 255355'),

('Bank Account Confirmation — Capitec',
 'BNK-2026-002', 'banking',
 '/uploads/documents/cicp/Bank-Capitec-Account-Confirmation.pdf',
 'available', '2026-05-17',
 'Capitec Business account confirmation — account 1055332383, branch 450105'),

('Company Proof of Address',
 'POA-2026-001', 'compliance',
 '/uploads/documents/cicp/Proof-Of-Address.pdf',
 'available', '2026-05-17',
 '50 C Carlswald Luxury Apartments, 82 Tamboti Rd, Carlswald, Midrand');

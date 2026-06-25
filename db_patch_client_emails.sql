-- Restore production client email addresses
-- These were temporarily redirected to sibusiso.mashita@gmail.com for email sending tests.
-- Run: mysql -u root valo_bms < db_patch_client_emails.sql

UPDATE clients SET email = 'ndivhupmulaudzi@gmail.com',                  accounts_email = 'ndivhupmulaudzi@gmail.com'                  WHERE id = 1; -- Convenient Gas Solutions
UPDATE clients SET email = 'sibusiso.moolar@kasitohomefunerals.co.za',   accounts_email = 'sibusiso.moolar@kasitohomefunerals.co.za'   WHERE id = 2; -- Kasi to Home
UPDATE clients SET email = 'accounts@omnisolve.africa',                   accounts_email = 'accounts@omnisolve.africa'                   WHERE id = 3; -- OmniSolve
UPDATE clients SET email = 'sibusiso.mashita@valosystems.co.za',          accounts_email = 'sibusiso.mashita@valosystems.co.za'          WHERE id = 4; -- Valo

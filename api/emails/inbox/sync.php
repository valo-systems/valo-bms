<?php
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/helpers.php';
require_once __DIR__ . '/../../vendor/autoload.php';

use PhpImap\Mailbox;

cors();
auth_required();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') fail('Method not allowed', 405);

define('IMAP_HOST',    defined('_IMAP_HOST')    ? _IMAP_HOST    : (getenv('IMAP_HOST')    ?: 'mail.valosystems.co.za'));
define('IMAP_PORT',    defined('_IMAP_PORT')     ? (int)_IMAP_PORT : (int)(getenv('IMAP_PORT') ?: 993));
define('IMAP_ENCRYPT', defined('_IMAP_ENCRYPT')  ? _IMAP_ENCRYPT : (getenv('IMAP_ENCRYPT') ?: 'ssl'));
define('IMAP_USER',    defined('_IMAP_USER')     ? _IMAP_USER    : (getenv('IMAP_USER')    ?: 'billing@valosystems.co.za'));
define('IMAP_PASS',    defined('_IMAP_PASS')     ? _IMAP_PASS    : (getenv('IMAP_PASS')    ?: ''));

$pdo      = db();
$imported = 0;

try {
    $dsn = '{' . IMAP_HOST . ':' . IMAP_PORT . '/imap/' . IMAP_ENCRYPT . '/novalidate-cert}INBOX';

    $mailbox = new Mailbox(
        $dsn,
        IMAP_USER,
        IMAP_PASS,
        null,
        'UTF-8'
    );
    // Fetch all mail — not just UNSEEN, since the email may have been opened in another client
    $mailIds = $mailbox->searchMailbox('ALL');

    foreach ($mailIds as $mailId) {
        $mail = $mailbox->getMail($mailId, false);

        // Use Message-ID header; fall back to a synthetic ID so the message is never silently skipped
        $msgId = trim((string)($mail->messageId ?? ''));
        if (!$msgId) $msgId = 'synthetic-' . IMAP_USER . '-' . $mailId;

        $check = $pdo->prepare('SELECT id FROM email_inbox WHERE message_id = ? LIMIT 1');
        $check->execute([$msgId]);
        if ($check->fetch()) continue;

        // Extract In-Reply-To from raw headers (not a direct property in this library version)
        $inReplyTo = '';
        if (!empty($mail->headersRaw) && preg_match('/^In-Reply-To:\s*(.+)$/mi', $mail->headersRaw, $m)) {
            $inReplyTo = trim($m[1]);
        }

        $fromAddress = (string)($mail->fromAddress ?? '');
        $fromName    = (string)($mail->fromName    ?? '');
        $subject     = (string)($mail->subject     ?? '');
        $bodyText    = (string)($mail->textPlain   ?? '');
        $bodyHtml    = (string)($mail->textHtml    ?? '');
        $receivedAt  = $mail->date ? date('Y-m-d H:i:s', strtotime($mail->date)) : null;

        $logId     = null;
        $invoiceId = null;
        $clientId  = null;

        if ($inReplyTo) {
            $logStmt = $pdo->prepare('SELECT id, invoice_id, client_id FROM email_log WHERE message_id = ? LIMIT 1');
            $logStmt->execute([$inReplyTo]);
            $logRow = $logStmt->fetch();
            if ($logRow) {
                $logId     = $logRow['id'];
                $invoiceId = $logRow['invoice_id'];
                $clientId  = $logRow['client_id'];
            }
        }

        if (!$clientId && $fromAddress) {
            $cStmt = $pdo->prepare('SELECT id FROM clients WHERE email = ? OR accounts_email = ? LIMIT 1');
            $cStmt->execute([$fromAddress, $fromAddress]);
            $cRow = $cStmt->fetch();
            if ($cRow) $clientId = $cRow['id'];
        }

        $ins = $pdo->prepare('
            INSERT INTO email_inbox (message_id, in_reply_to, log_id, invoice_id, client_id, from_address, from_name, subject, body_text, body_html, received_at)
            VALUES (?,?,?,?,?,?,?,?,?,?,?)
        ');
        $ins->execute([$msgId, $inReplyTo ?: null, $logId, $invoiceId, $clientId, $fromAddress, $fromName, $subject, $bodyText, $bodyHtml, $receivedAt]);
        $imported++;
    }

    ok(['imported' => $imported]);

} catch (\Exception $e) {
    $msg = $e->getMessage();
    if (stripos($msg, 'connect') !== false || stripos($msg, 'login') !== false || stripos($msg, 'auth') !== false) {
        fail('Could not connect to the mail server. Check IMAP credentials in config.', 500);
    }
    fail('Inbox sync failed: ' . $msg, 500);
}

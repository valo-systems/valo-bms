<?php
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/helpers.php';
require_once __DIR__ . '/../../vendor/autoload.php';

use Webklex\PHPIMAP\ClientManager;

cors();
auth_required();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') fail('Method not allowed', 405);

define('IMAP_HOST',     defined('_IMAP_HOST')     ? _IMAP_HOST     : (getenv('IMAP_HOST')     ?: 'mail.valosystems.co.za'));
define('IMAP_PORT',     defined('_IMAP_PORT')      ? (int)_IMAP_PORT : (int)(getenv('IMAP_PORT') ?: 993));
define('IMAP_ENCRYPT',  defined('_IMAP_ENCRYPT')   ? _IMAP_ENCRYPT  : (getenv('IMAP_ENCRYPT')  ?: 'ssl'));
define('IMAP_USER',     defined('_IMAP_USER')      ? _IMAP_USER     : (getenv('IMAP_USER')     ?: 'billing@valosystems.co.za'));
define('IMAP_PASS',     defined('_IMAP_PASS')      ? _IMAP_PASS     : (getenv('IMAP_PASS')     ?: ''));

$pdo = db();
$imported = 0;

try {
    $cm = new ClientManager();
    $client = $cm->make([
        'host'          => IMAP_HOST,
        'port'          => IMAP_PORT,
        'encryption'    => IMAP_ENCRYPT,
        'validate_cert' => true,
        'username'      => IMAP_USER,
        'password'      => IMAP_PASS,
        'protocol'      => 'imap',
    ]);
    $client->connect();

    $folder   = $client->getFolder('INBOX');
    $messages = $folder->messages()->unseen()->get();

    foreach ($messages as $message) {
        $msgId = (string)$message->getMessageId();
        if (!$msgId) continue;

        // Skip if already stored
        $check = $pdo->prepare('SELECT id FROM email_inbox WHERE message_id = ? LIMIT 1');
        $check->execute([$msgId]);
        if ($check->fetch()) continue;

        $inReplyTo   = (string)($message->getInReplyTo() ?? '');
        $fromAddress = (string)($message->getFrom()[0]->mail ?? '');
        $fromName    = (string)($message->getFrom()[0]->personal ?? '');
        $subject     = (string)$message->getSubject();
        $bodyText    = (string)$message->getTextBody();
        $bodyHtml    = (string)$message->getHTMLBody();
        $receivedAt  = $message->getDate()?->toDateTimeString();

        // Try to link to an outbound email log via In-Reply-To
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

        // Try to match client by from address if not already linked
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

    $client->disconnect();
    ok(['imported' => $imported]);

} catch (\Exception $e) {
    fail('IMAP sync failed: ' . $e->getMessage(), 500);
}

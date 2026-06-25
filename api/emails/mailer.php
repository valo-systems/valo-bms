<?php
require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/../config/database.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

define('SMTP_HOST',      defined('_SMTP_HOST')      ? _SMTP_HOST      : (getenv('SMTP_HOST')      ?: 'mail.valosystems.co.za'));
define('SMTP_PORT',      defined('_SMTP_PORT')       ? (int)_SMTP_PORT : (int)(getenv('SMTP_PORT') ?: 465));
define('SMTP_USER',      defined('_SMTP_USER')       ? _SMTP_USER      : (getenv('SMTP_USER')      ?: 'billing@valosystems.co.za'));
define('SMTP_PASS',      defined('_SMTP_PASS')       ? _SMTP_PASS      : (getenv('SMTP_PASS')      ?: ''));
define('SMTP_FROM_NAME', defined('_SMTP_FROM_NAME')  ? _SMTP_FROM_NAME : (getenv('SMTP_FROM_NAME') ?: 'Valo Systems'));

/**
 * Build a PHPMailer instance configured for billing@valosystems.co.za.
 */
function make_mailer(): PHPMailer {
    $mail = new PHPMailer(true);
    $mail->isSMTP();
    $mail->Host       = SMTP_HOST;
    $mail->SMTPAuth   = true;
    $mail->Username   = SMTP_USER;
    $mail->Password   = SMTP_PASS;
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
    $mail->Port       = SMTP_PORT;
    $mail->CharSet    = 'UTF-8';
    $mail->setFrom(SMTP_USER, SMTP_FROM_NAME);
    $mail->addReplyTo(SMTP_USER, SMTP_FROM_NAME);
    $mail->isHTML(true);
    return $mail;
}

/**
 * Replace {{variable}} placeholders in a template string.
 */
function render_template(string $tpl, array $vars): string {
    foreach ($vars as $k => $v) {
        $tpl = str_replace('{{' . $k . '}}', htmlspecialchars((string)$v, ENT_QUOTES, 'UTF-8'), $tpl);
    }
    // {{#if key}}...{{else}}alt{{/if}} or {{/if key}} — render alt when key is empty
    $tpl = preg_replace_callback('/\{\{#if ([^}]+)\}\}(.*?)\{\{else\}\}(.*?)\{\{\/if(?: [^}]*)?\}\}/s', function($m) use ($vars) {
        return !empty($vars[trim($m[1])]) ? $m[2] : $m[3];
    }, $tpl);
    // {{#if key}}...{{/if}} or {{/if key}} — show block only when key is non-empty, otherwise remove
    $tpl = preg_replace_callback('/\{\{#if ([^}]+)\}\}(.*?)\{\{\/if(?: [^}]*)?\}\}/s', function($m) use ($vars) {
        return !empty($vars[trim($m[1])]) ? $m[2] : '';
    }, $tpl);
    // Strip any remaining unfilled placeholders
    $tpl = preg_replace('/\{\{[^}]+\}\}/', '', $tpl);
    return $tpl;
}

/**
 * Log an email attempt to email_log and return the log ID.
 */
function log_email(array $data): int {
    $stmt = db()->prepare('
        INSERT INTO email_log (template_id, invoice_id, client_id, message_id, `to`, cc, subject, body_html, status, error)
        VALUES (?,?,?,?,?,?,?,?,?,?)
    ');
    $stmt->execute([
        $data['template_id'] ?? null,
        $data['invoice_id']  ?? null,
        $data['client_id']   ?? null,
        $data['message_id']  ?? null,
        $data['to'],
        $data['cc']          ?? null,
        $data['subject'],
        $data['body_html'],
        $data['status'],
        $data['error']       ?? null,
    ]);
    return (int)db()->lastInsertId();
}

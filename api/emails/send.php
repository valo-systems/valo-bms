<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/helpers.php';
require_once __DIR__ . '/mailer.php';

use PHPMailer\PHPMailer\Exception as MailException;

cors();
auth_required();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') fail('Method not allowed', 405);
$b = body();
require_fields($b, ['template_id', 'to']);

$pdo         = db();
$templateId  = (int)$b['template_id'];
$invoiceId   = isset($b['invoice_id']) ? (int)$b['invoice_id'] : null;
$toAddress   = sanitize_string($b['to'], 255);
$ccAddress   = sanitize_string($b['cc'] ?? null, 255);
$attachPdf   = (bool)($b['attach_pdf'] ?? true);

if (!filter_var($toAddress, FILTER_VALIDATE_EMAIL)) {
    fail("\"$toAddress\" is not a valid email address. Please check the recipient and try again.", 422);
}
if ($ccAddress && !filter_var($ccAddress, FILTER_VALIDATE_EMAIL)) {
    fail("\"$ccAddress\" is not a valid CC email address. Please check and try again.", 422);
}

// Load template
$tStmt = $pdo->prepare('SELECT * FROM email_templates WHERE id = ? AND is_active = 1 LIMIT 1');
$tStmt->execute([$templateId]);
$template = $tStmt->fetch();
if (!$template) fail('Template not found', 404);

// Load invoice + client for variable substitution
$vars = [];
if ($invoiceId) {
    $iStmt = $pdo->prepare('
        SELECT i.*, c.name AS client_name, c.email AS client_email,
               c.accounts_email, c.contact_person AS contact_name
        FROM invoices i
        LEFT JOIN clients c ON i.client_id = c.id
        WHERE i.id = ? LIMIT 1
    ');
    $iStmt->execute([$invoiceId]);
    $invoice = $iStmt->fetch();
    if ($invoice) {
        $fmt = fn($n) => 'R ' . number_format((float)$n, 2, '.', ',');
        $discountLine = null;
        $originalAmt  = null;
        // Find discount line item
        $liStmt = $pdo->prepare('SELECT * FROM invoice_line_items WHERE invoice_id = ? AND is_discount = 1 LIMIT 1');
        $liStmt->execute([$invoiceId]);
        $discount = $liStmt->fetch();
        if ($discount) {
            $discountLine = $fmt(abs((float)$discount['total']));
            $originalAmt  = $fmt((float)$invoice['total'] + abs((float)$discount['total']));
        }
        $vars = [
            'client_name'     => $invoice['client_name']    ?? '',
            'contact_name'    => $invoice['contact_name']   ?? ($invoice['client_name'] ?? ''),
            'invoice_number'  => $invoice['number']         ?? '',
            'invoice_amount'  => $fmt($invoice['total']     ?? 0),
            'amount'          => $fmt($invoice['total']     ?? 0),
            'original_amount' => $originalAmt ?? $fmt($invoice['total'] ?? 0),
            'discount_amount' => $discountLine ?? '',
            'due_date'        => $invoice['due_date'] ? date('j F Y', strtotime($invoice['due_date'])) : '',
            'period'          => $invoice['period'] ?? '',
        ];
    }
}

// Allow caller to override subject/body or inject extra vars
$extraVars = $b['vars'] ?? [];
if (is_array($extraVars)) $vars = array_merge($vars, $extraVars);

$subject  = render_template($b['overrides']['subject'] ?? $template['subject'],   $vars);
$bodyHtml = render_template($b['overrides']['body_html'] ?? $template['body_html'], $vars);

// Send
$logData = [
    'template_id' => $templateId,
    'invoice_id'  => $invoiceId,
    'client_id'   => $invoice['client_id'] ?? null,
    'to'          => $toAddress,
    'cc'          => $ccAddress,
    'subject'     => $subject,
    'body_html'   => $bodyHtml,
    'status'      => 'failed',
];

try {
    $mail = make_mailer();
    $mail->addAddress($toAddress);
    if ($ccAddress) $mail->addCC($ccAddress);
    $mail->Subject = $subject;
    $mail->Body    = $bodyHtml;
    $mail->AltBody = strip_tags(str_replace(['<br>', '<br/>', '<br />', '</p>'], "\n", $bodyHtml));

    // Embed round VALO logo as CID so it renders inline across all email clients
    $logoPath = __DIR__ . '/logo-invoice-email.png';
    if (file_exists($logoPath)) {
        $mail->addEmbeddedImage($logoPath, 'valo_logo', 'logo-invoice-email.png', 'base64', 'image/png');
    }

    // PDF attachment
    if ($attachPdf && $invoiceId) {
        require_once __DIR__ . '/../invoices/pdf_render.php';
        $pdfBytes = render_invoice_pdf($invoiceId);
        $filename = ($invoice['number'] ?? "invoice-$invoiceId") . '.pdf';
        $mail->addStringAttachment($pdfBytes, $filename, 'base64', 'application/pdf');
    }

    $mail->send();
    $logData['status']     = 'sent';
    $logData['message_id'] = $mail->getLastMessageID();
    $logId = log_email($logData);

    ok(['success' => true, 'log_id' => $logId, 'message_id' => $logData['message_id']]);

} catch (MailException $e) {
    $raw = $e->getMessage();
    $logData['error'] = $raw;
    $logId = log_email($logData);

    // Translate common SMTP errors into plain-English messages
    if (stripos($raw, 'recipients failed') !== false || stripos($raw, 'invalid address') !== false) {
        $userMsg = "The email address \"$toAddress\" was rejected by the mail server. Please check it is correct and try again.";
    } elseif (stripos($raw, 'Could not connect') !== false || stripos($raw, 'connection') !== false) {
        $userMsg = 'Could not connect to the mail server. Please try again in a moment.';
    } elseif (stripos($raw, 'authenticate') !== false || stripos($raw, 'Username and Password') !== false) {
        $userMsg = 'Mail server authentication failed. Please contact your system administrator.';
    } else {
        $userMsg = 'The email could not be sent. Please check the recipient address and try again.';
    }

    fail($userMsg, 500);
}

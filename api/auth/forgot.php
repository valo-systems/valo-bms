<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/helpers.php';
require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/../emails/mailer.php';

use PHPMailer\PHPMailer\Exception as MailException;

cors();
if ($_SERVER['REQUEST_METHOD'] !== 'POST') fail('Method not allowed', 405);

$b     = body();
$email = trim(strtolower($b['email'] ?? ''));
if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) fail('A valid email address is required.', 422);

$pdo  = db();
$stmt = $pdo->prepare('SELECT id, name FROM users WHERE email = ? AND active = 1 LIMIT 1');
$stmt->execute([$email]);
$user = $stmt->fetch();

// Always respond the same way — do not reveal whether the email exists
if (!$user) {
    ok(['message' => 'If that email is registered you will receive a reset link shortly.']);
}

// Expire any existing tokens for this user
$pdo->prepare('UPDATE password_resets SET used = 1 WHERE user_id = ?')->execute([$user['id']]);

// Generate a secure token
$token     = bin2hex(random_bytes(32));
$expiresAt = date('Y-m-d H:i:s', time() + 3600); // 1 hour

$pdo->prepare('INSERT INTO password_resets (user_id, token, expires_at) VALUES (?,?,?)')
    ->execute([$user['id'], hash('sha256', $token), $expiresAt]);

// Build reset URL
$origin   = $_SERVER['HTTP_ORIGIN'] ?? 'https://bms.valosystems.co.za';
$resetUrl = $origin . '/reset-password?token=' . $token;

// Send email
try {
    $mail = make_mailer();
    $mail->addAddress($email, $user['name']);
    $mail->Subject = 'Reset your Valo BMS password';
    $mail->Body    = '<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4f4f4;padding:32px 0;">
<tr><td align="center">
  <table width="520" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;border-radius:4px;overflow:hidden;border:1px solid #e0e0e0;">
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
              <p style="margin:3px 0 0;font-size:12px;color:#888888;">Business Management System</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding:0 40px 24px;border-bottom:1px solid #eeeeee;">
        <p style="margin:0;font-size:20px;font-weight:bold;color:#1a1a1a;">Password Reset</p>
      </td>
    </tr>
    <tr>
      <td style="padding:28px 40px 24px;">
        <p style="margin:0 0 16px;font-size:15px;color:#333333;line-height:1.6;">Hi ' . htmlspecialchars($user['name']) . ',</p>
        <p style="margin:0 0 24px;font-size:15px;color:#333333;line-height:1.6;">
          We received a request to reset the password for your Valo BMS account.
          Click the button below to choose a new password. This link expires in <strong>1 hour</strong>.
        </p>
        <table cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="background:#d4af37;border-radius:6px;padding:12px 28px;">
              <a href="' . $resetUrl . '" style="color:#1a1a1a;font-size:14px;font-weight:bold;text-decoration:none;display:block;">
                Reset My Password
              </a>
            </td>
          </tr>
        </table>
        <p style="margin:20px 0 0;font-size:13px;color:#888888;line-height:1.6;">
          If the button does not work, copy and paste this link into your browser:<br>
          <a href="' . $resetUrl . '" style="color:#d4af37;word-break:break-all;">' . $resetUrl . '</a>
        </p>
        <p style="margin:20px 0 0;font-size:13px;color:#888888;line-height:1.6;">
          If you did not request a password reset, you can safely ignore this email.
          Your password will not change.
        </p>
      </td>
    </tr>
    <tr>
      <td style="background:#f9f9f9;border-top:1px solid #eeeeee;padding:20px 40px;">
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
</td></tr>
</table>
</body>
</html>';
    $mail->AltBody = "Hi {$user['name']},\n\nReset your Valo BMS password here:\n$resetUrl\n\nThis link expires in 1 hour. If you did not request this, ignore this email.";

    $logoPath = __DIR__ . '/../emails/logo-invoice-email.png';
    if (file_exists($logoPath)) {
        $mail->addEmbeddedImage($logoPath, 'valo_logo', 'logo-invoice-email.png', 'base64', 'image/png');
    }

    $mail->send();
} catch (MailException $e) {
    fail('Could not send reset email. Please try again or contact your administrator.', 500);
}

ok(['message' => 'If that email is registered you will receive a reset link shortly.']);

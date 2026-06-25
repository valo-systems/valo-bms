<?php
error_reporting(0);
require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/../config/database.php';

use Dompdf\Dompdf;
use Dompdf\Options;

function render_invoice_pdf(int $invoiceId): string {
    $pdo = db();

    $stmt = $pdo->prepare('
        SELECT i.*, c.name AS client_name, c.email AS client_email,
               c.phone AS client_phone, c.address AS client_address,
               c.company_registration AS client_reg
        FROM invoices i
        LEFT JOIN clients c ON i.client_id = c.id
        WHERE i.id = ? LIMIT 1
    ');
    $stmt->execute([$invoiceId]);
    $inv = $stmt->fetch();
    if (!$inv) throw new RuntimeException("Invoice $invoiceId not found");

    $liStmt = $pdo->prepare('
        SELECT * FROM invoice_line_items
        WHERE invoice_id = ? ORDER BY sort_order ASC
    ');
    $liStmt->execute([$invoiceId]);
    $lineItems = $liStmt->fetchAll();

    $logoPath = __DIR__ . '/../../src/assets/logo-invoice.png';
    $logoData = file_exists($logoPath)
        ? 'data:image/png;base64,' . base64_encode(file_get_contents($logoPath))
        : '';

    $fmt = fn($n) => 'R&nbsp;' . number_format((float)$n, 2, '.', ',');
    $fmtDate = fn($d) => $d ? date('j F Y', strtotime($d)) : '';

    // Group line items by section
    $sections = [];
    $order = [];
    foreach ($lineItems as $item) {
        $key = $item['section_label'] ?? '';
        if (!isset($sections[$key])) { $sections[$key] = []; $order[] = $key; }
        $sections[$key][] = $item;
    }

    $subtotal = (float)($inv['subtotal'] ?? 0);
    $total    = (float)($inv['total']    ?? $subtotal);

    $sectionNames = [
        'A' => 'Section A: Valo Technology Service Fee',
        'B' => 'Section B: Infrastructure Pass-Through (At Cost + FX Cover)',
    ];

    ob_start();
    ?>
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: DejaVu Sans, Arial, sans-serif; font-size: 10px; color: #1a1a1a; background: #fff; }
.page { padding: 28px 32px 20px; }
/* Header */
table.header { width: 100%; border-bottom: 2px solid #111; padding-bottom: 14px; margin-bottom: 18px; border-collapse: collapse; }
.logo { max-height: 52px; max-width: 160px; }
.meta-title { font-size: 16px; font-weight: bold; margin-bottom: 6px; text-align: right; }
.meta-tbl { border-collapse: collapse; float: right; }
.meta-tbl td { padding: 2px 0; font-size: 10px; }
.meta-tbl td.lbl { color: #888; padding-right: 12px; text-align: left; }
.meta-tbl td.val { font-weight: 600; text-align: right; }
/* Parties */
table.parties { width: 100%; border-collapse: collapse; border-bottom: 1px solid #e5e5e5; padding-bottom: 14px; margin-bottom: 0; }
table.parties td { vertical-align: top; padding: 14px 0; width: 50%; }
table.parties td.right-party { text-align: right; }
.party-label { font-size: 8px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.1em; color: #aaa; margin-bottom: 5px; }
.party-name { font-weight: bold; font-size: 11px; margin-bottom: 3px; }
.party-detail { color: #555; font-size: 9px; line-height: 1.6; }
/* Notes */
.period-note { background: #f9f9f9; border-bottom: 1px solid #e5e5e5; padding: 7px 0; font-style: italic; color: #666; font-size: 9px; }
.fx-note { background: #eff6ff; border-bottom: 1px solid #bfdbfe; padding: 7px 0; color: #1d4ed8; font-size: 9px; }
/* Line items */
.section { border-bottom: 1px solid #e5e5e5; padding: 12px 0; }
.section-title { font-size: 9px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.08em; border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-bottom: 7px; }
table.items { width: 100%; border-collapse: collapse; }
table.items th { text-align: left; color: #888; font-weight: 500; padding: 3px 0; border-bottom: 1px solid #e0e0e0; font-size: 9px; }
table.items th.right, table.items td.right { text-align: right; }
table.items td { padding: 4px 0; vertical-align: top; border-bottom: 1px solid #f0f0f0; font-size: 9px; }
table.items td.desc { padding-right: 12px; }
.item-main { font-weight: 500; }
.item-calc, .item-note { color: #888; font-size: 8px; margin-top: 2px; }
.item-note { font-style: italic; }
.discount { color: #15803d; }
/* Section total */
table.sec-total-wrap { width: 100%; border-collapse: collapse; margin-top: 7px; }
.sec-total-box { background: #f5f5f5; padding: 4px 10px; font-size: 9px; }
.sec-total-lbl { color: #888; padding-right: 16px; }
.sec-total-val { font-weight: bold; }
/* Summary */
.summary { padding: 14px 0; border-bottom: 1px solid #e5e5e5; }
.summary h4 { font-size: 8px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.1em; color: #aaa; margin-bottom: 8px; }
table.summary-tbl { width: 240px; margin-left: auto; border-collapse: collapse; }
table.summary-tbl td { padding: 3px 0; font-size: 10px; }
table.summary-tbl td.r { text-align: right; }
.total-row td { font-weight: bold; font-size: 13px; padding-top: 7px; }
.vat-row td { color: #aaa; font-size: 8px; }
/* Payment */
.payment { padding: 14px 0; border-bottom: 1px solid #e5e5e5; }
.payment h4 { font-size: 8px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.1em; color: #aaa; margin-bottom: 8px; }
table.payment-tbl { width: 100%; border-collapse: collapse; table-layout: fixed; }
table.payment-tbl td { padding: 3px 8px 3px 0; vertical-align: top; font-size: 9px; word-wrap: break-word; }
table.payment-tbl td.col-bank    { width: 14%; }
table.payment-tbl td.col-holder  { width: 12%; }
table.payment-tbl td.col-type    { width: 20%; }
table.payment-tbl td.col-account { width: 18%; }
table.payment-tbl td.col-branch  { width: 14%; }
table.payment-tbl td.col-ref     { width: 22%; }
.pay-lbl { color: #aaa; font-size: 8px; margin-bottom: 2px; }
.pay-val { font-weight: 600; }
.ref-value { color: #2563eb; }
.due-notice { margin-top: 8px; background: #fffbeb; border: 1px solid #fde68a; padding: 5px 8px; font-size: 8px; color: #555; }
/* Conditions / Notes */
.conditions { padding: 10px 0; border-bottom: 1px solid #e5e5e5; }
.conditions h4 { font-size: 8px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.1em; color: #aaa; margin-bottom: 5px; }
.conditions-body { font-size: 8px; color: #444; background: #f9f9f9; padding: 7px; white-space: pre-wrap; }
.notes { padding: 10px 0; border-bottom: 1px solid #e5e5e5; }
.notes h4 { font-size: 8px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.1em; color: #aaa; margin-bottom: 5px; }
.footer { text-align: center; font-size: 8px; color: #aaa; padding-top: 12px; }
</style>
</head>
<body>
<div class="page">

  <!-- Header -->
  <table class="header">
    <tr>
      <td style="vertical-align:top"><?= $logoData ? '<img src="' . $logoData . '" class="logo" alt="Valo Systems">' : '<strong style="font-size:16px;">VALO SYSTEMS</strong>' ?></td>
      <td style="vertical-align:top; text-align:right">
        <div class="meta-title">Tax Invoice</div>
        <table class="meta-tbl">
          <tr><td class="lbl">Invoice No</td><td class="val"><?= htmlspecialchars($inv['number']) ?></td></tr>
          <tr><td class="lbl">Date</td><td class="val"><?= $fmtDate($inv['date']) ?></td></tr>
          <?php if ($inv['due_date']): ?><tr><td class="lbl">Due Date</td><td class="val"><?= $fmtDate($inv['due_date']) ?></td></tr><?php endif; ?>
          <?php if ($inv['period_from'] && $inv['period_to']): ?>
          <tr><td class="lbl">Period</td><td class="val"><?= date('j M', strtotime($inv['period_from'])) ?> – <?= date('j M Y', strtotime($inv['period_to'])) ?></td></tr>
          <?php elseif ($inv['period']): ?>
          <tr><td class="lbl">Period</td><td class="val"><?= htmlspecialchars($inv['period']) ?></td></tr>
          <?php endif; ?>
        </table>
      </td>
    </tr>
  </table>

  <!-- Parties -->
  <table class="parties">
    <tr>
      <td>
        <div class="party-label">From</div>
        <div class="party-name">VALO (PTY) LTD</div>
        <div class="party-detail">
          Trading as Valo Systems<br>
          50 C Carlswald Luxury Apartments<br>
          82 Tamboti Rd, Carlswald, Midrand<br>
          Gauteng, 1685, South Africa<br>
          billing@valosystems.co.za<br>
          <span style="color:#aaa">Reg No: 2026/072094/07</span>
        </div>
      </td>
      <td class="right-party">
        <div class="party-label">To</div>
        <div class="party-name"><?= htmlspecialchars($inv['client_name'] ?? '') ?></div>
        <div class="party-detail">
          <?php if ($inv['client_address']): ?><?= nl2br(htmlspecialchars($inv['client_address'])) ?><br><?php endif; ?>
          <?php if ($inv['client_email']): ?>Email: <?= htmlspecialchars($inv['client_email']) ?><br><?php endif; ?>
          <?php if ($inv['client_phone']): ?>Tel: <?= htmlspecialchars($inv['client_phone']) ?><?php endif; ?>
        </div>
      </td>
    </tr>
  </table>

  <?php if ($inv['period_note']): ?>
  <div class="period-note"><?= htmlspecialchars($inv['period_note']) ?></div>
  <?php endif; ?>

  <?php if ($inv['fx_rate']): ?>
  <div class="fx-note"><strong>Exchange rate applied:</strong> <?= htmlspecialchars($inv['fx_policy'] ?: 'SARB interbank mid-rate + 8% FX cover') ?>, rate: <strong>R<?= number_format((float)$inv['fx_rate'], 4) ?>/USD</strong></div>
  <?php endif; ?>

  <!-- Line item sections -->
  <?php foreach ($order as $secKey):
    $items = $sections[$secKey];
    $secTotal = array_sum(array_column($items, 'total'));
  ?>
  <div class="section">
    <?php if ($secKey): ?>
    <div class="section-title"><?= htmlspecialchars($sectionNames[$secKey] ?? "Section $secKey") ?></div>
    <?php endif; ?>
    <table class="items">
      <thead>
        <tr>
          <th style="width:18px">#</th>
          <th>Description</th>
          <?php if ($inv['fx_rate']): ?><th class="right" style="width:50px">USD</th><?php endif; ?>
          <th class="right" style="width:90px">Amount (ZAR)</th>
        </tr>
      </thead>
      <tbody>
      <?php foreach ($items as $idx => $item):
        $isDisc = $item['is_discount'] == 1 || $item['is_discount'] === true;
        $colorClass = $isDisc ? 'discount' : '';
      ?>
        <tr>
          <td style="color:#aaa"><?= $idx + 1 ?></td>
          <td class="desc <?= $colorClass ?>">
            <div class="item-main"><?= htmlspecialchars($item['description']) ?></div>
            <?php if ($item['calculation_detail']): ?><div class="item-calc"><?= htmlspecialchars($item['calculation_detail']) ?></div><?php endif; ?>
            <?php if ($item['item_note']): ?><div class="item-note"><?= htmlspecialchars($item['item_note']) ?></div><?php endif; ?>
          </td>
          <?php if ($inv['fx_rate']): ?>
          <td class="right" style="color:#888"><?= $item['usd_amount'] ? '$' . number_format((float)$item['usd_amount'], 2) : '–' ?></td>
          <?php endif; ?>
          <td class="right <?= $colorClass ?>">
            <?= $isDisc ? '(' . $fmt(abs((float)$item['total'])) . ')' : $fmt($item['total']) ?>
          </td>
        </tr>
      <?php endforeach; ?>
      </tbody>
    </table>
    <?php if ($secKey): ?>
    <table class="sec-total-wrap"><tr><td style="text-align:right">
      <span class="sec-total-box">
        <span class="sec-total-lbl">Section <?= htmlspecialchars($secKey) ?> Total</span>
        <span class="sec-total-val"><?= $fmt($secTotal) ?></span>
      </span>
    </td></tr></table>
    <?php endif; ?>
  </div>
  <?php endforeach; ?>

  <!-- Summary -->
  <div class="summary">
    <h4>Invoice Summary</h4>
    <table class="summary-tbl">
      <?php foreach ($order as $secKey):
        if (!$secKey) continue;
        $secTotal = array_sum(array_column($sections[$secKey], 'total'));
      ?>
      <tr><td style="color:#555;padding-right:24px"><?= htmlspecialchars($sectionNames[$secKey] ?? "Section $secKey") ?></td><td><?= $fmt($secTotal) ?></td></tr>
      <?php endforeach; ?>
      <?php if (isset($sections[''])): foreach ($sections[''] as $item):
        $isDisc = $item['is_discount'] == 1;
      ?>
      <tr class="<?= $isDisc ? 'discount' : '' ?>">
        <td style="color:#555;padding-right:24px"><?= htmlspecialchars($item['description']) ?></td>
        <td><?= $isDisc ? '(' . $fmt(abs((float)$item['total'])) . ')' : $fmt($item['total']) ?></td>
      </tr>
      <?php endforeach; endif; ?>
      <tr style="border-top:1px solid #e5e5e5"><td style="color:#555;padding-right:24px;padding-top:6px">Subtotal</td><td style="padding-top:6px;font-weight:600"><?= $fmt($subtotal) ?></td></tr>
      <tr class="vat-row"><td colspan="2" style="color:#aaa;font-size:8px;padding:2px 0">VAT not applicable. VALO (PTY) LTD is not currently VAT registered</td></tr>
      <tr class="total-row"><td>Total Due: <?= htmlspecialchars($inv['number']) ?></td><td><?= $fmt($total) ?></td></tr>
    </table>
  </div>

  <?php if ($inv['commercial_conditions']): ?>
  <div class="conditions">
    <h4>Commercial Conditions</h4>
    <div class="conditions-body"><?= htmlspecialchars($inv['commercial_conditions']) ?></div>
  </div>
  <?php endif; ?>

  <!-- Payment details -->
  <div class="payment">
    <h4>Payment Details</h4>
    <table class="payment-tbl">
      <tr>
          <td class="col-bank"><div class="pay-lbl">Bank</div><div class="pay-val">FNB / RMB</div></td>
        <td class="col-holder"><div class="pay-lbl">Account Holder</div><div class="pay-val">Valo</div></td>
        <td class="col-type"><div class="pay-lbl">Account Type</div><div class="pay-val">Gold Business Account</div></td>
        <td class="col-account"><div class="pay-lbl">Account Number</div><div class="pay-val">63194158987</div></td>
        <td class="col-branch"><div class="pay-lbl">Branch Code</div><div class="pay-val">255355</div></td>
        <td class="col-ref"><div class="pay-lbl">Reference</div><div class="pay-val ref-value"><?= htmlspecialchars($inv['number']) ?></div></td>
      </tr>
    </table>
    <?php if ($inv['due_date']): ?>
    <div class="due-notice">
      Payment due: <strong><?= $fmtDate($inv['due_date']) ?></strong>. Late payments accrue interest at the South African prime lending rate + 2% per annum, calculated daily from the due date.
    </div>
    <?php endif; ?>
  </div>

  <?php if ($inv['notes']): ?>
  <div class="notes">
    <h4>Notes</h4>
    <p style="font-size:9px;color:#555"><?= htmlspecialchars($inv['notes']) ?></p>
  </div>
  <?php endif; ?>

  <div class="footer">
    VALO (PTY) LTD, Reg No: 2026/072094/07, billing@valosystems.co.za
    <?php if ($inv['footer_note']): ?><br><?= htmlspecialchars($inv['footer_note']) ?><?php endif; ?>
  </div>

</div>
</body>
</html>
    <?php
    $html = ob_get_clean();

    $options = new Options();
    $options->set('isRemoteEnabled', false);
    $options->set('defaultFont', 'DejaVu Sans');

    $pdf = new Dompdf($options);
    $pdf->loadHtml($html, 'UTF-8');
    $pdf->setPaper('A4', 'portrait');
    $pdf->render();

    return $pdf->output();
}

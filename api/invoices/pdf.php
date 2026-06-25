<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/helpers.php';
require_once __DIR__ . '/pdf_render.php';

cors();
auth_required();

$id = (int)($_GET['id'] ?? 0);
if (!$id) fail('ID required');

try {
    $pdfBytes = render_invoice_pdf($id);
    // Stream as download
    $stmt = db()->prepare('SELECT number FROM invoices WHERE id = ? LIMIT 1');
    $stmt->execute([$id]);
    $row = $stmt->fetch();
    $filename = ($row['number'] ?? "invoice-$id") . '.pdf';

    // Override JSON content-type set by cors()
    header('Content-Type: application/pdf');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    header('Content-Length: ' . strlen($pdfBytes));
    header('Cache-Control: no-cache');
    echo $pdfBytes;
} catch (RuntimeException $e) {
    fail($e->getMessage(), 404);
} catch (Exception $e) {
    fail('PDF generation failed', 500);
}

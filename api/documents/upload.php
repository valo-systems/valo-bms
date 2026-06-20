<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/helpers.php';
cors();
auth_required();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') fail('Method not allowed', 405);
if (empty($_FILES['file'])) fail('No file uploaded', 400);

$file    = $_FILES['file'];
$allowed = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

if ($file['error'] !== UPLOAD_ERR_OK) fail('Upload error: ' . $file['error'], 400);
if ($file['size'] > 20 * 1024 * 1024) fail('File too large (max 20MB)', 400);

$finfo    = new finfo(FILEINFO_MIME_TYPE);
$mimeType = $finfo->file($file['tmp_name']);
if (!in_array($mimeType, $allowed, true)) fail('File type not allowed', 400);

// Store under uploads/documents/ relative to the web root
$uploadDir = __DIR__ . '/../../uploads/documents/';
if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);

$ext      = pathinfo($file['name'], PATHINFO_EXTENSION);
$safeName = preg_replace('/[^a-zA-Z0-9._-]/', '-', pathinfo($file['name'], PATHINFO_FILENAME));
$filename = $safeName . '-' . time() . '.' . strtolower($ext);
$destPath = $uploadDir . $filename;

if (!move_uploaded_file($file['tmp_name'], $destPath)) fail('Failed to save file', 500);

ok(['file_path' => '/uploads/documents/' . $filename, 'filename' => $filename]);

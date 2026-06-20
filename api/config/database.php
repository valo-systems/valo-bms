<?php
// Production credentials: create config.local.php in the same directory (never committed).
// See config.local.php.example for the template.
$localConfig = __DIR__ . '/config.local.php';
if (file_exists($localConfig)) require_once $localConfig;

define('DB_HOST',     defined('_DB_HOST')     ? _DB_HOST     : (getenv('DB_HOST')     ?: 'localhost'));
define('DB_PORT',     defined('_DB_PORT')     ? _DB_PORT     : (getenv('DB_PORT')     ?: '3306'));
define('DB_NAME',     defined('_DB_NAME')     ? _DB_NAME     : (getenv('DB_NAME')     ?: 'valo_bms'));
define('DB_USER',     defined('_DB_USER')     ? _DB_USER     : (getenv('DB_USER')     ?: 'root'));
define('DB_PASS',     defined('_DB_PASS')     ? _DB_PASS     : (getenv('DB_PASS')     ?: ''));
define('JWT_SECRET',  defined('_JWT_SECRET')  ? _JWT_SECRET  : (getenv('JWT_SECRET')  ?: 'valo-bms-jwt-secret-2026'));

function db(): PDO {
    static $pdo = null;
    if ($pdo === null) {
        try {
            $pdo = new PDO(
                "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=utf8mb4",
                DB_USER,
                DB_PASS,
                [
                    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES   => false,
                ]
            );
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]);
            exit;
        }
    }
    return $pdo;
}

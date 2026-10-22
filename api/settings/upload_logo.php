<?php
// api/settings/upload_logo.php

require_once dirname(__DIR__, 2) . '/config/headers.php';
require_once dirname(__DIR__, 2) . '/config/database.php';
require_once dirname(__DIR__) . '/helpers/settings.php';
require_once dirname(__DIR__) . '/helpers/logger.php';
require_once dirname(__DIR__) . '/middleware/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse('error', 'Method not allowed. Use POST.', [], 405);
}

// Ensure caller is admin
if (isset($current_user_role) && $current_user_role !== 'admin') {
    sendResponse('error', 'Unauthorized. Only administrators can update company logo.', [], 403);
}

$uploadDir = __DIR__ . '/../../uploads/';
if (!is_dir($uploadDir)) {
    if (!mkdir($uploadDir, 0777, true) && !is_dir($uploadDir)) {
        sendResponse('error', 'Failed to create upload directory on server', [], 500);
    }
}

$allowedMimes = [
    'image/jpeg'    => 'jpg',
    'image/png'     => 'png',
    'image/webp'    => 'webp',
    'image/svg+xml' => 'svg',
    'image/gif'     => 'gif'
];

$maxBytes = 5 * 1024 * 1024; // 5 MB
$savedFileName = null;

try {
    // Check if uploaded as standard multipart file
    if (isset($_FILES['logo']) && is_uploaded_file($_FILES['logo']['tmp_name'])) {
        $file = $_FILES['logo'];

        if ($file['error'] !== UPLOAD_ERR_OK) {
            sendResponse('error', 'File upload error code: ' . $file['error'], [], 400);
        }

        if ($file['size'] > $maxBytes) {
            sendResponse('error', 'File is too large. Maximum size is 5MB.', [], 400);
        }

        $finfo = new finfo(FILEINFO_MIME_TYPE);
        $mime = $finfo->file($file['tmp_name']);

        // Check if SVG might be reported as text/plain or image/svg
        if ($mime === 'text/plain' && strtolower(pathinfo($file['name'], PATHINFO_EXTENSION)) === 'svg') {
            $mime = 'image/svg+xml';
        }

        if (!array_key_exists($mime, $allowedMimes)) {
            sendResponse('error', 'Invalid image format. Allowed formats: PNG, JPG, WEBP, SVG, GIF.', [], 400);
        }

        $ext = $allowedMimes[$mime];
        $savedFileName = 'logo_' . time() . '_' . bin2hex(random_bytes(4)) . '.' . $ext;
        $destPath = $uploadDir . $savedFileName;

        if (!move_uploaded_file($file['tmp_name'], $destPath)) {
            sendResponse('error', 'Failed to move uploaded logo file.', [], 500);
        }
    } else {
        // Check for Base64 payload in JSON input
        $rawInput = file_get_contents('php://input');
        $json = json_decode($rawInput, true);

        if (isset($json['logo_base64']) && !empty($json['logo_base64'])) {
            $dataUrl = $json['logo_base64'];
            $mime = 'image/png';
            $base64Data = $dataUrl;

            if (preg_match('/^data:(image\/[a-zA-Z0-9\+\-\.]+);base64,(.*)$/', $dataUrl, $matches)) {
                $mime = $matches[1];
                $base64Data = $matches[2];
            }

            if (!array_key_exists($mime, $allowedMimes)) {
                sendResponse('error', 'Invalid base64 image mime type: ' . $mime, [], 400);
            }

            $binaryData = base64_decode($base64Data);
            if ($binaryData === false) {
                sendResponse('error', 'Corrupt base64 image data.', [], 400);
            }

            if (strlen($binaryData) > $maxBytes) {
                sendResponse('error', 'Base64 image is too large. Maximum size is 5MB.', [], 400);
            }

            $ext = $allowedMimes[$mime];
            $savedFileName = 'logo_' . time() . '_' . bin2hex(random_bytes(4)) . '.' . $ext;
            $destPath = $uploadDir . $savedFileName;

            if (file_put_contents($destPath, $binaryData) === false) {
                sendResponse('error', 'Failed to write logo image to disk.', [], 500);
            }
        } else {
            sendResponse('error', 'No logo file or base64 data provided.', [], 400);
        }
    }

    $relativeLogoPath = 'uploads/' . $savedFileName;
    set_system_setting($pdo, 'company_logo', $relativeLogoPath, 'Company Logo URL or Path');

    // Audit log
    log_activity(
        $pdo,
        $current_user_id ?? null,
        'UPDATE_COMPANY_LOGO',
        'system_settings',
        null,
        null,
        ['company_logo' => $relativeLogoPath]
    );

    $allSettings = get_all_system_settings($pdo);

    sendResponse('success', 'Company logo uploaded and updated successfully', [
        'logo_url' => $relativeLogoPath,
        'settings' => $allSettings
    ], 200);

} catch (\Exception $e) {
    error_log("Upload logo error: " . $e->getMessage());
    sendResponse('error', 'Failed to process logo upload: ' . $e->getMessage(), [], 500);
}

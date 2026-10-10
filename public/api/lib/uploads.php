<?php
// Photos uploaded from the admin (products, banner, collections).
// Files live OUTSIDE public_html (next to dkperfume-config.php) so a new deploy never removes them,
// and are served back through /api/?a=img&f=<name>.

declare(strict_types=1);

const UPLOAD_MAX_BYTES = 10 * 1024 * 1024;
const UPLOAD_TYPES = [IMAGETYPE_JPEG => 'jpg', IMAGETYPE_PNG => 'png', IMAGETYPE_WEBP => 'webp', IMAGETYPE_GIF => 'gif'];
const UPLOAD_MIME = ['jpg' => 'image/jpeg', 'png' => 'image/png', 'webp' => 'image/webp', 'gif' => 'image/gif'];

function uploads_dir(): string
{
    $dir = config()['uploads_dir'] ?? dirname(__DIR__, 3) . '/dk-uploads';
    if (!is_dir($dir) && !mkdir($dir, 0755, true) && !is_dir($dir)) {
        throw new RuntimeException('Could not create the uploads folder.');
    }
    return $dir;
}

// Store one uploaded image and return its public address
function save_upload(array $file): string
{
    if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
        fail(422, in_array($file['error'] ?? 0, [UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE], true) ? 'The photo is too large.' : 'No photo received.');
    }
    if ($file['size'] > UPLOAD_MAX_BYTES) fail(422, 'The photo is too large (max 10 MB).');
    // Trust the file's content, never its name or the browser's type
    $info = @getimagesize($file['tmp_name']);
    $ext = $info ? (UPLOAD_TYPES[$info[2]] ?? null) : null;
    if (!$ext) fail(422, 'Only JPG, PNG, WebP or GIF photos are allowed.');

    $name = gmdate('Ym') . '-' . bin2hex(random_bytes(10)) . '.' . $ext;
    if (!move_uploaded_file($file['tmp_name'], uploads_dir() . '/' . $name)) fail(500, 'Could not save the photo.');
    return '/api/?a=img&f=' . $name;
}

function send_upload(string $name): never
{
    if (!preg_match('/^\d{6}-[a-f0-9]{20}\.(jpg|png|webp|gif)$/', $name, $m)) fail(404, 'Not found.');
    $path = uploads_dir() . '/' . $name;
    if (!is_file($path)) fail(404, 'Not found.');
    header('Content-Type: ' . UPLOAD_MIME[$m[1]]);
    header('Content-Length: ' . filesize($path));
    // Names are random and never reused, so browsers may keep them for a year
    header('Cache-Control: public, max-age=31536000, immutable');
    header('X-Content-Type-Options: nosniff');
    readfile($path);
    exit;
}

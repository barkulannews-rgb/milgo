<?php
// "Forgot password" for staff: a one-time link by email, valid for 30 minutes.
// Only a hash of the token is stored, the answer never reveals whether an email exists,
// and a reset signs the account out everywhere (see the password fingerprint in auth.php).

declare(strict_types=1);

const RESET_TTL = 1800;
const RESET_MAX_PER_HOUR = 3;

function send_mail(string $to, string $subject, string $text): bool
{
    $c = config();
    $host = preg_replace('/^www\./', '', (string) parse_url(site_url(), PHP_URL_HOST));
    // Hostinger only sends from a mailbox on the site's own domain: config, else the store email, else no-reply@
    $storeEmail = strtolower((string) (kv_get('settings', [])['email'] ?? ''));
    $from = $c['mail_from'] ?? (str_ends_with($storeEmail, "@$host") ? $storeEmail : "no-reply@$host");
    // Local testing: write the message to a file instead of sending it
    if (!empty($c['mail_log'])) {
        return file_put_contents($c['mail_log'], "To: $to\nSubject: $subject\n\n$text\n----\n", FILE_APPEND) !== false;
    }
    $headers = implode("\r\n", [
        "From: DK Perfume <$from>",
        "Reply-To: $from",
        'MIME-Version: 1.0',
        'Content-Type: text/plain; charset=UTF-8',
    ]);
    $ok = mail($to, '=?UTF-8?B?' . base64_encode($subject) . '?=', $text, $headers, "-f$from");
    if (!$ok) error_log("[dk-api] mail() failed for $to");
    return $ok;
}

function password_forgot(string $email): void
{
    usleep(300000); // same timing whether or not the account exists
    $email = strtolower(trim($email));
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) return;
    $st = db()->prepare('SELECT * FROM staff WHERE LOWER(email) = ? AND active = 1');
    $st->execute([$email]);
    $staff = $st->fetch();
    if (!$staff) return;

    $token = bin2hex(random_bytes(32));
    $issued = in_transaction(function () use ($staff, $token) {
        $now = time();
        $all = array_values(array_filter(kv_get('password_resets', []), fn($r) => $r['expires'] > $now));
        $recent = array_filter($all, fn($r) => $r['staff'] === $staff['id'] && $r['created'] > $now - 3600);
        if (count($recent) >= RESET_MAX_PER_HOUR) return false;
        $all[] = ['hash' => hash('sha256', $token), 'staff' => $staff['id'], 'created' => $now, 'expires' => $now + RESET_TTL];
        kv_set('password_resets', $all, 'system');
        return true;
    });
    if (!$issued) return;

    $link = site_url() . '/reset-password?token=' . $token;
    send_mail($staff['email'], 'Reset your DK Perfume password', implode("\n", [
        "Hello {$staff['name']},",
        '',
        'Someone asked to reset the password for your DK Perfume staff account.',
        'Open this link within 30 minutes to choose a new password:',
        '',
        $link,
        '',
        'If this was not you, ignore this email. Your password stays the same.',
        '',
        '--',
        'Waxaa la codsaday in password-ka akoonkaaga DK Perfume dib loo dejiyo.',
        'Fur linkiga kore 30 daqiiqo gudahood. Haddii aanad adigu codsan, iska dhaaf.',
    ]));
    audit('Password Reset Requested', 'Staff', $staff['id'], 'Reset link emailed', $staff);
}

function password_reset(string $token, string $password): void
{
    if (strlen($password) < 8) fail(422, 'Password must be at least 8 characters.');
    $hash = hash('sha256', $token);
    $staff = in_transaction(function () use ($hash, $password) {
        $now = time();
        $all = array_values(array_filter(kv_get('password_resets', []), fn($r) => $r['expires'] > $now));
        $match = null;
        foreach ($all as $r) if (hash_equals($r['hash'], $hash)) $match = $r;
        if (!$match) fail(410, 'This link has expired or was already used. Ask for a new one.');
        $staff = staff_by_id($match['staff']);
        if (!$staff || !$staff['active']) fail(410, 'This link has expired or was already used. Ask for a new one.');
        db()->prepare('UPDATE staff SET password_hash = ? WHERE id = ?')->execute([password_hash($password, PASSWORD_DEFAULT), $staff['id']]);
        // One use only: drop every open link for this account
        kv_set('password_resets', array_values(array_filter($all, fn($r) => $r['staff'] !== $staff['id'])), 'system');
        return $staff;
    });
    audit('Password Reset', 'Staff', $staff['id'], 'Password changed with an email link', $staff);
}

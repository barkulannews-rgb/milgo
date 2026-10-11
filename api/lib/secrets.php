<?php
// Stripe / PayPal keys. The owner can enter them in Admin -> Payments; they are stored server-side only,
// never sent back to any browser (only a masked hint), and checked with the provider before saving.
// Keys in dkperfume-config.php still work and are used when nothing was entered in the admin.

declare(strict_types=1);

const SECRET_FIELDS = ['stripe_secret_key', 'stripe_webhook_secret', 'paypal_client_id', 'paypal_secret', 'paypal_mode'];

function stored_secrets(): array
{
    $s = kv_get('gateway_secrets', []);
    return is_array($s) ? $s : [];
}

// Admin-entered value first, then the config file
function secret(string $key): string
{
    $v = (string) (stored_secrets()[$key] ?? '');
    return $v !== '' ? $v : (string) (config()[$key] ?? '');
}

// "sk_live_51Hx...9aBc" -> "sk_live_••••9aBc"
function mask_secret(string $v): string
{
    if ($v === '') return '';
    $prefix = preg_match('/^[a-z]+_(live_|test_)?/', $v, $m) ? $m[0] : substr($v, 0, 4);
    return $prefix . '••••' . substr($v, -4);
}

// What the owner sees: whether each key is set, where it comes from, and a masked hint
function gateway_keys_status(): array
{
    $stored = stored_secrets();
    $keys = [];
    foreach (SECRET_FIELDS as $f) {
        $v = secret($f);
        $keys[$f] = [
            'set' => $v !== '',
            'source' => ($stored[$f] ?? '') !== '' ? 'admin' : ((config()[$f] ?? '') !== '' ? 'config' : ''),
            'hint' => $f === 'paypal_mode' ? ($v ?: 'live') : mask_secret($v),
        ];
    }
    return [
        'keys' => $keys,
        'webhookUrl' => site_url() . '/api/?a=stripe_webhook',
        'ready' => ['stripe' => gateway_ready('Stripe'), 'stripeWebhook' => secret('stripe_webhook_secret') !== '', 'paypal' => gateway_ready('PayPal')],
    ];
}

function gateway_keys_save(array $in, array $me): array
{
    if ($me['role'] !== 'owner') fail(403, 'Only the owner can change payment keys.');
    $next = stored_secrets();
    $clear = array_values(array_intersect((array) ($in['clear'] ?? []), SECRET_FIELDS));
    foreach ($clear as $f) unset($next[$f]);

    $new = [];
    foreach (SECRET_FIELDS as $f) {
        $v = trim((string) ($in[$f] ?? ''));
        if ($v !== '') $new[$f] = $v;
    }
    if (isset($new['stripe_secret_key']) && !preg_match('/^(sk|rk)_(live|test)_[A-Za-z0-9]{10,}$/', $new['stripe_secret_key'])) fail(422, 'The Stripe secret key starts with sk_live_ (or sk_test_ for testing).');
    if (isset($new['stripe_webhook_secret']) && !preg_match('/^whsec_[A-Za-z0-9+\/=]{10,}$/', $new['stripe_webhook_secret'])) fail(422, 'The webhook signing secret starts with whsec_.');
    if (isset($new['paypal_mode']) && !in_array($new['paypal_mode'], ['live', 'sandbox'], true)) fail(422, 'PayPal mode must be live or sandbox.');

    // Ask the provider before saving, so a typo never reaches checkout
    if (isset($new['stripe_secret_key'])) {
        [$status, $res] = http_call('GET', 'https://api.stripe.com/v1/balance', ['Authorization: Bearer ' . $new['stripe_secret_key']]);
        if ($status !== 200) fail(422, 'Stripe did not accept this key: ' . ($res['error']['message'] ?? 'check it and try again.'));
    }
    $merged = array_merge($next, $new);
    if (array_intersect(array_keys($new), ['paypal_client_id', 'paypal_secret', 'paypal_mode'])) {
        $pick = fn(string $f, string $d = '') => (string) ($merged[$f] ?? config()[$f] ?? $d);
        $id = $pick('paypal_client_id');
        $sec = $pick('paypal_secret');
        $mode = $pick('paypal_mode', 'live');
        if ($id !== '' && $sec !== '') {
            $base = $mode === 'sandbox' ? 'https://api-m.sandbox.paypal.com' : 'https://api-m.paypal.com';
            [$status] = http_call('POST', "$base/v1/oauth2/token", [
                'Authorization: Basic ' . base64_encode("$id:$sec"),
                'Content-Type: application/x-www-form-urlencoded',
            ], 'grant_type=client_credentials');
            if ($status !== 200) fail(422, "PayPal did not accept this Client ID and Secret ($mode mode).");
        }
    }

    kv_set('gateway_secrets', $merged, $me['name']);
    // The log records which keys changed, never their values
    $changed = array_merge(array_keys($new), array_map(fn($f) => "$f removed", $clear));
    if ($changed) audit('Payment Keys Changed', 'Settings', 'payments', 'Changed: ' . implode(', ', $changed), $me);
    return gateway_keys_status();
}

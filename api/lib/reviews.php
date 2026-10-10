<?php
// Customer ratings. Only real buyers can rate: a review needs the order number, the phone used on
// that order, and the order must be delivered. One review per perfume per order (sending again edits it).

declare(strict_types=1);

function phone_matches(string $given, string $onOrder): bool
{
    $a = preg_replace('/\D/', '', $given);
    $b = preg_replace('/\D/', '', $onOrder);
    return $a !== '' && strlen($a) >= 6 && (str_contains($b, $a) || str_contains($a, $b));
}

// "Hodan Cali Maxamed" -> "Hodan C."
function public_name(string $full): string
{
    $parts = preg_split('/\s+/', trim($full)) ?: [];
    if (!$parts || $parts[0] === '') return 'Customer';
    $last = count($parts) > 1 ? ' ' . mb_strtoupper(mb_substr(end($parts), 0, 1)) . '.' : '';
    return $parts[0] . $last;
}

function rating_summary(): array
{
    $sum = [];
    foreach (kv_get('reviews', []) as $r) {
        if (!empty($r['hidden'])) continue;
        $p = $r['productId'];
        $sum[$p] ??= ['total' => 0, 'count' => 0];
        $sum[$p]['total'] += $r['rating'];
        $sum[$p]['count']++;
    }
    return array_map(fn($s) => ['avg' => round($s['total'] / $s['count'], 1), 'count' => $s['count']], $sum);
}

function product_reviews(string $productId): array
{
    $list = array_values(array_filter(kv_get('reviews', []), fn($r) => $r['productId'] === $productId && empty($r['hidden'])));
    usort($list, fn($a, $b) => strcmp($b['createdAt'], $a['createdAt']));
    return array_map(fn($r) => [
        'id' => $r['id'], 'name' => $r['name'], 'rating' => $r['rating'], 'text' => $r['text'], 'createdAt' => $r['createdAt'],
    ], array_slice($list, 0, 50));
}

// Ratings already given on one order, by product (shown in the order tracker)
// An empty result is sent as {} (not []) so the browser always gets an object
function order_ratings(string $orderId): array|stdClass
{
    $out = [];
    foreach (kv_get('reviews', []) as $r) if ($r['orderId'] === $orderId) $out[$r['productId']] = $r['rating'];
    return $out ?: new stdClass();
}

function review_submit(array $b): array
{
    $orderId = strtoupper(trim((string) ($b['orderId'] ?? '')));
    $productId = (string) ($b['productId'] ?? '');
    $rating = (int) ($b['rating'] ?? 0);
    $text = trim(strip_tags((string) ($b['text'] ?? '')));
    if ($rating < 1 || $rating > 5) fail(422, 'Choose 1 to 5 stars.');
    if (mb_strlen($text) > 1000) fail(422, 'Please keep the review under 1000 characters.');

    $o = order_get($orderId);
    if (!$o || !phone_matches((string) ($b['phone'] ?? ''), (string) $o['customerPhone'])) fail(404, 'Order number and phone do not match.');
    if ($o['orderStatus'] !== 'Delivered') fail(409, 'You can rate once your order has been delivered.');
    $item = null;
    foreach ($o['items'] as $i) if ($i['productId'] === $productId) $item = $i;
    if (!$item) fail(422, 'This perfume is not in the order.');

    db()->beginTransaction();
    try {
        $all = kv_get('reviews', []);
        $existing = null;
        foreach ($all as $k => $r) if ($r['orderId'] === $orderId && $r['productId'] === $productId) $existing = $k;
        $review = [
            'id' => $existing !== null ? $all[$existing]['id'] : 'rev-' . bin2hex(random_bytes(6)),
            'productId' => $productId,
            'productName' => (string) $item['productName'],
            'orderId' => $orderId,
            'name' => public_name((string) $o['customerName']),
            'rating' => $rating,
            'text' => $text,
            'createdAt' => now_iso(),
            'hidden' => $existing !== null ? !empty($all[$existing]['hidden']) : false,
        ];
        if ($existing !== null) $all[$existing] = $review;
        else $all[] = $review;
        kv_set('reviews', array_values($all), 'customer');
        db()->commit();
    } catch (Throwable $e) {
        db()->rollBack();
        throw $e;
    }
    return $review;
}

// Staff: hide / show or delete a review
function review_moderate(array $b, array $me): array
{
    $id = (string) ($b['id'] ?? '');
    db()->beginTransaction();
    try {
        $all = kv_get('reviews', []);
        $found = false;
        foreach ($all as $k => $r) {
            if ($r['id'] !== $id) continue;
            $found = true;
            if (!empty($b['delete'])) unset($all[$k]);
            else $all[$k]['hidden'] = !empty($b['hidden']);
        }
        if (!$found) fail(404, 'Review not found.');
        kv_set('reviews', array_values($all), $me['name']);
        db()->commit();
    } catch (Throwable $e) {
        db()->rollBack();
        throw $e;
    }
    return array_values($all);
}

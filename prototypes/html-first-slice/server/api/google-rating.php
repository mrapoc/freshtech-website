<?php
declare(strict_types=1);
require_once __DIR__ . '/website-proof.php';

// The reporting system writes the Google aggregate nightly beside the other proof
// snapshots. The Places credentials and review records stay there: the
// snapshot carries only the rating, the review count and when it was read.
const GOOGLE_RATING_SNAPSHOT = 'google-reviews.json';
const GOOGLE_RATING_MAX_BYTES = 73728;
// An observation is shown for at most three days after Google was read (the
// same bound src/lib/google-rating.mjs applies), capped by the snapshot expiry.
const GOOGLE_RATING_MAX_AGE = 259200;

function google_rating_empty(): array {
    return ['schema_version' => 1, 'status' => 'unavailable', 'rating' => null,
        'review_count' => null, 'observed_at' => null, 'expires_at' => null];
}
function google_rating_payload(?string $directory, float $now): array {
    $snapshot = proof_snapshot($directory, GOOGLE_RATING_SNAPSHOT, 'google-reviews', GOOGLE_RATING_MAX_BYTES, $now);
    if ($snapshot === null) return google_rating_empty();
    $data = $snapshot['payload'];
    if (!proof_keys($data, ['status', 'fetched_at', 'rating', 'total_reviews']) || $data->status !== 'available'
        || !proof_number($data->rating) || $data->rating < 1 || $data->rating > 5
        || !is_int($data->total_reviews) || $data->total_reviews < 1 || $data->total_reviews > 1000000000) return google_rating_empty();
    $observed = proof_utc($data->fetched_at);
    $expires = floor(min($observed + GOOGLE_RATING_MAX_AGE, $snapshot['expires']));
    if (!($observed <= $now && $now < $expires)) return google_rating_empty();
    return ['schema_version' => 1, 'status' => 'available', 'rating' => $data->rating,
        'review_count' => $data->total_reviews, 'observed_at' => $data->fetched_at,
        'expires_at' => gmdate('Y-m-d\TH:i:s\Z', (int) $expires)];
}
function google_rating_http(string $method, string $uri, ?string $directory, ?callable $clock = null): array {
    $now = ($clock ?? static fn(): float => microtime(true))();
    $headers = proof_headers($now);
    if (parse_url($uri, PHP_URL_PATH) !== '/api/google-rating') return [404, $headers + ['Content-Length' => '2'], $method === 'HEAD' ? '' : '{}'];
    if (!in_array($method, ['GET', 'HEAD'], true)) return [405, $headers + ['Allow' => 'GET, HEAD', 'Content-Length' => '2'], '{}'];
    $body = json_encode(google_rating_payload($directory, $now), JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE);
    return [200, $headers + ['Content-Length' => (string) strlen($body)], $method === 'HEAD' ? '' : $body];
}
if (realpath($_SERVER['SCRIPT_FILENAME'] ?? '') === __FILE__) {
    ini_set('display_errors', '0');
    header_remove('X-Powered-By');
    try { [$status, $headers, $body] = google_rating_http($_SERVER['REQUEST_METHOD'] ?? '', $_SERVER['REQUEST_URI'] ?? '', proof_snapshot_directory()); }
    catch (Throwable) { $status = 200; $headers = ['Content-Type' => 'application/json', 'Cache-Control' => 'no-store']; $body = '{}'; }
    http_response_code($status);
    foreach ($headers as $name => $value) header($name . ': ' . $value);
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'HEAD') echo $body;
}

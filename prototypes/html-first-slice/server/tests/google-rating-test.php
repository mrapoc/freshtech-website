<?php
declare(strict_types=1);
require __DIR__ . '/../api/google-rating.php';
$assertions = 0;
function check(bool $condition, string $label): void { global $assertions; $assertions++; if (!$condition) throw new RuntimeException($label); }
$now = (float) strtotime('2026-09-22T12:00:00Z');
$clock = function () use (&$now): float { return $now; };
// The reporting system's nightly aggregate (synthetic values only).
function aggregate(): array { return ['status' => 'available', 'fetched_at' => '2026-09-22T01:00:00Z', 'rating' => 4.6, 'total_reviews' => 123]; }
function snapshot(array $payload, string $published = '2026-09-22T01:30:00Z', string $expires = '2026-09-24T01:30:00Z', string $feed = 'google-reviews'): string {
    return json_encode(['schema' => PROOF_SNAPSHOT_SCHEMA, 'feed' => $feed, 'published_at' => $published, 'expires_at' => $expires, 'payload' => $payload]);
}
$directory = sys_get_temp_dir() . '/freshtech-google-test-' . bin2hex(random_bytes(6)); mkdir($directory, 0700);
$write = fn(string $content) => file_put_contents($directory . '/' . GOOGLE_RATING_SNAPSHOT, $content);
$get = fn() => json_decode(google_rating_http('GET', '/api/google-rating', $directory, $clock)[2], true);
try {
    check($get() === google_rating_empty(), 'missing snapshot shows the link-only fallback');
    $write(snapshot(aggregate()));
    [$status, $headers, $body] = google_rating_http('GET', '/api/google-rating?url=https://invalid.example/private', $directory, $clock);
    $data = json_decode($body, true);
    check($status === 200 && $data['rating'] === 4.6 && $data['review_count'] === 123, 'aggregate response');
    check(array_keys($data) === array_keys(google_rating_empty()), 'only approved aggregate fields');
    check($data['observed_at'] === '2026-09-22T01:00:00Z' && $data['expires_at'] === '2026-09-24T01:30:00Z', 'snapshot expiry bounds the observation');
    check($headers['Cache-Control'] === 'no-store' && $headers['Age'] === '0' && $headers['X-Proof-Source-Date'] === 'Tue, 22 Sep 2026 12:00:00 GMT', 'no cache, server time');
    check(!isset($headers['Set-Cookie']) && !isset($headers['Access-Control-Allow-Origin']), 'no credentials or CORS');
    [$status, $head, $raw] = google_rating_http('HEAD', '/api/google-rating', $directory, $clock);
    check($status === 200 && $raw === '' && $head['Content-Length'] === $headers['Content-Length'], 'HEAD parity');
    check(google_rating_http('POST', '/api/google-rating', $directory, $clock)[0] === 405, 'method rejection');
    foreach (['/api/google-rating/', '/server/api/google-rating.php', '/api/private'] as $path) check(google_rating_http('GET', $path, $directory, $clock)[0] === 404, 'exact path');
    $old = aggregate(); $old['fetched_at'] = '2026-09-20T00:00:00Z';
    $write(snapshot($old));
    check($get()['expires_at'] === '2026-09-23T00:00:00Z', 'observation expires three days after Google was read');
    $now = (float) strtotime('2026-09-23T00:00:00Z');
    check($get() === google_rating_empty(), 'old observation hidden');
    $now = (float) strtotime('2026-09-22T12:00:00Z');
    $bad = [];
    foreach (['status' => 'unavailable', 'rating' => '5', 'total_reviews' => 0, 'fetched_at' => '2026-09-22T12:00:01Z'] as $key => $value) { $d = aggregate(); $d[$key] = $value; $bad[] = snapshot($d); }
    $d = aggregate(); $d['reviews'] = [['author' => 'Synthetic Author']]; $bad[] = snapshot($d);
    $bad[] = snapshot(aggregate(), '2026-09-22T01:30:00Z', '2026-09-24T01:30:00Z', 'website-metrics');
    $bad[] = snapshot(aggregate(), '2026-09-22T01:30:00Z', '2026-09-22T11:59:59Z');
    $bad[] = '{';
    $bad[] = str_replace('"rating":4.6', '"rating":4.6,"rating":5', snapshot(aggregate()));
    $bad[] = snapshot(aggregate()) . str_repeat(' ', GOOGLE_RATING_MAX_BYTES);
    foreach ($bad as $content) { $write($content); check($get() === google_rating_empty(), 'invalid snapshot fails closed'); }
    echo "$assertions Google aggregate PHP assertions passed\n";
} finally { foreach (glob($directory . '/*') ?: [] as $file) unlink($file); rmdir($directory); }

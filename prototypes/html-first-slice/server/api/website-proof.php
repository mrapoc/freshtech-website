<?php
declare(strict_types=1);

// Anonymous, fixed public projections. The reporting system writes a snapshot of each feed
// nightly into the private folder beside public_html; this handler only reads
// and validates those files. It makes no network requests.
const PROOF_SNAPSHOTS = ['metrics' => 'website-metrics.json', 'feedback' => 'website-feedback.json'];
const PROOF_SNAPSHOT_SCHEMA = 'fresh-tech.website-snapshot.v1';
const PROOF_SNAPSHOT_LIFETIME = 172800;
const PROOF_SNAPSHOT_MAX_BYTES = 12288;
const PROOF_METRIC_MAX_LIFETIME = 180000;
const PROOF_FEEDBACK_MAX_LIFETIME = 259200;
const PROOF_CALL_DEFINITION = 'yeastar.inbound_human_queue.28_complete_days.v1';
// v2 approved by Sam on 9 October 2026.
const PROOF_TICKET_DEFINITION = 'superops.first_tech_reply.client_incidents.business_hours.28_complete_days.v2';
const PROOF_MAX_BYTES = 8192;

function proof_empty_metric(string $source): array {
    return ['status' => 'unavailable', 'source' => $source, 'value_seconds' => null,
        'service_rate_percent' => null, 'definition_id' => null, 'observed_at' => null,
        'expires_at' => null, 'period_start' => null, 'period_end' => null];
}
function proof_empty(string $feed): array {
    return $feed === 'metrics'
        ? ['schema_version' => 2, 'status' => 'unavailable', 'metrics' => [
            'ticket_first_response' => proof_empty_metric('superops'), 'call_wait' => proof_empty_metric('yeastar')]]
        : ['schema_version' => 1, 'status' => 'unavailable', 'selected_on' => null, 'expires_at' => null, 'items' => []];
}
function proof_keys(mixed $value, array $keys): bool {
    if (!$value instanceof stdClass) return false;
    $actual = array_keys(get_object_vars($value)); sort($actual); sort($keys);
    return $actual === $keys;
}
function proof_utc(mixed $value): float {
    if (!is_string($value) || !preg_match('/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?Z$/D', $value)) return NAN;
    try {
        $date = new DateTimeImmutable($value);
        if ($date->format('Y-m-d\TH:i:s') !== substr($value, 0, 19)) return NAN;
        return (float) $date->format('U.u');
    } catch (Throwable) { return NAN; }
}
function proof_number(mixed $value): bool { return (is_int($value) || is_float($value)) && is_finite((float) $value); }
function proof_text(mixed $value, int $max): bool {
    return is_string($value) && trim($value) !== '' && !preg_match('/[\x00-\x1f\x7f]/', $value)
        && preg_match_all('/./us', $value) <= $max;
}
function proof_json(string $raw, int $maxBytes = PROOF_MAX_BYTES): mixed {
    if (strlen($raw) > $maxBytes) throw new RuntimeException('Invalid');
    $decoded = json_decode($raw, false, 16, JSON_THROW_ON_ERROR);
    // json_decode alone accepts duplicate keys. Inspect string tokens and object
    // boundaries after grammar validation, including escaped-equivalent keys.
    preg_match_all('/"(?:[^"\\\\]|\\\\.)*"|[{}\[\]:,]/s', $raw, $matches);
    $stack = [];
    foreach ($matches[0] as $token) {
        if ($token === '{' || $token === '[') { $stack[] = ['object' => $token === '{', 'key' => $token === '{', 'seen' => []]; continue; }
        if ($token === '}' || $token === ']') { array_pop($stack); continue; }
        $index = count($stack) - 1;
        if ($index < 0 || !$stack[$index]['object']) continue;
        if ($token === ',') { $stack[$index]['key'] = true; continue; }
        if ($token[0] === '"' && $stack[$index]['key']) {
            $key = json_decode($token, true, 2, JSON_THROW_ON_ERROR);
            if (array_key_exists($key, $stack[$index]['seen'])) throw new RuntimeException('Invalid');
            $stack[$index]['seen'][$key] = true; $stack[$index]['key'] = false;
        }
    }
    return $decoded;
}
function proof_validate(string $feed, string $raw, float $now): array {
    $data = proof_json($raw); $empty = proof_empty($feed);
    if ($feed === 'metrics') {
        if (!proof_keys($data, ['schema_version', 'status', 'metrics']) || $data->schema_version !== 2
            || !in_array($data->status, ['available', 'partial', 'unavailable'], true)
            || !proof_keys($data->metrics, ['ticket_first_response', 'call_wait'])) throw new RuntimeException('Invalid');
        $fields = array_keys(proof_empty_metric('yeastar')); $count = 0;
        foreach (['ticket_first_response' => 'superops', 'call_wait' => 'yeastar'] as $key => $source) {
            $metric = $data->metrics->$key;
            if (!proof_keys($metric, $fields) || $metric->source !== $source
                || !in_array($metric->status, ['available', 'stale', 'unavailable'], true)) throw new RuntimeException('Invalid');
            if ($metric->status === 'available') $count++;
        }
        if ($data->status !== ($count === 2 ? 'available' : ($count === 1 ? 'partial' : 'unavailable'))) throw new RuntimeException('Invalid');
        // Each metric passes only under its exact reviewed definition.
        $passed = 0;
        foreach (['call_wait' => PROOF_CALL_DEFINITION, 'ticket_first_response' => PROOF_TICKET_DEFINITION] as $key => $definition) {
            $metric = $data->metrics->$key;
            if ($metric->status !== 'available' || $metric->definition_id !== $definition
                || !proof_number($metric->value_seconds) || $metric->value_seconds < 0
                || !proof_number($metric->service_rate_percent) || $metric->service_rate_percent < 0 || $metric->service_rate_percent > 100) continue;
            $start = proof_utc($metric->period_start); $end = proof_utc($metric->period_end);
            $observed = proof_utc($metric->observed_at); $expires = proof_utc($metric->expires_at);
            if (!($start < $end && $end <= $observed && $observed <= $now && $now < $expires && $expires - $observed <= PROOF_METRIC_MAX_LIFETIME)) continue;
            $zone = new DateTimeZone('Europe/London');
            $a = (new DateTimeImmutable($metric->period_start))->setTimezone($zone);
            $b = (new DateTimeImmutable($metric->period_end))->setTimezone($zone);
            if ($a->format('H:i:s.u') !== '00:00:00.000000' || $b->format('H:i:s.u') !== '00:00:00.000000'
                || $a->modify('+28 days')->format('c') !== $b->format('c')) continue;
            $empty['metrics'][$key] = get_object_vars($metric); $passed++;
        }
        $empty['status'] = $passed === 2 ? 'available' : ($passed === 1 ? 'partial' : 'unavailable');
        return $empty;
    }
    if (!proof_keys($data, ['schema_version', 'status', 'selected_on', 'expires_at', 'items']) || $data->schema_version !== 1
        || !in_array($data->status, ['available', 'stale', 'unavailable'], true) || !is_array($data->items)) throw new RuntimeException('Invalid');
    if ($data->status !== 'available') return $empty;
    if (!is_string($data->selected_on) || !preg_match('/^\d{4}-\d{2}-\d{2}$/D', $data->selected_on)) return $empty;
    $selected = proof_utc($data->selected_on . 'T00:00:00Z'); $expires = proof_utc($data->expires_at);
    if (!($selected <= $now && $now < $expires && $expires <= $selected + PROOF_FEEDBACK_MAX_LIFETIME) || count($data->items) < 1 || count($data->items) > 3) return $empty;
    $seen = [];
    foreach ($data->items as $item) {
        if (!proof_keys($item, ['first_name', 'comment', 'rating', 'feedback_month'])
            || !proof_text($item->first_name, 40) || !proof_text($item->comment, 400)
            || !($item->rating === null || proof_text($item->rating, 32))
            || !($item->feedback_month === null || (is_string($item->feedback_month)
                && preg_match('/^\d{4}-(0[1-9]|1[0-2])$/D', $item->feedback_month)
                && $item->feedback_month <= substr($data->selected_on, 0, 7)))) return $empty;
        $key = json_encode([$item->first_name, $item->comment, $item->rating, $item->feedback_month], JSON_THROW_ON_ERROR);
        if (isset($seen[$key])) return $empty;
        $seen[$key] = true;
    }
    return ['schema_version' => 1, 'status' => 'available', 'selected_on' => $data->selected_on,
        'expires_at' => $data->expires_at, 'items' => array_map('get_object_vars', $data->items)];
}
function proof_snapshot_directory(): ?string {
    // /site/private is beside /site/public_html, never web-accessible.
    $site = dirname(__DIR__, 3); $directory = $site . '/private/website-proof/published';
    foreach ([$site . '/private', $site . '/private/website-proof', $directory] as $path) if (is_link($path) || !is_dir($path)) return null;
    return realpath($directory) === $directory ? $directory : null;
}
// Reads one snapshot written by the reporting system. Returns its payload and expiry, or
// null for anything missing, oversized, malformed, expired or not exact.
function proof_snapshot(?string $directory, string $file, string $feed, int $maxBytes, float $now): ?array {
    if ($directory === null) return null;
    $path = $directory . '/' . $file;
    if (is_link($path) || !is_file($path)) return null;
    $raw = @file_get_contents($path, false, null, 0, $maxBytes + 1);
    if (!is_string($raw) || strlen($raw) > $maxBytes) return null;
    try {
        $data = proof_json($raw, $maxBytes);
        if (!proof_keys($data, ['schema', 'feed', 'published_at', 'expires_at', 'payload'])
            || $data->schema !== PROOF_SNAPSHOT_SCHEMA || $data->feed !== $feed || !$data->payload instanceof stdClass) return null;
        $published = proof_utc($data->published_at); $expires = proof_utc($data->expires_at);
        if (!($published <= $now && $now < $expires && $expires - $published <= PROOF_SNAPSHOT_LIFETIME)) return null;
        return ['payload' => $data->payload, 'expires' => $expires];
    } catch (Throwable) { return null; }
}
function proof_payload(string $feed, ?string $directory, float $now): array {
    $snapshot = proof_snapshot($directory, PROOF_SNAPSHOTS[$feed], 'website-' . $feed, PROOF_SNAPSHOT_MAX_BYTES, $now);
    if ($snapshot === null) return proof_empty($feed);
    try {
        $payload = proof_validate($feed, json_encode($snapshot['payload'], JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), $now);
    } catch (Throwable) { return proof_empty($feed); }
    // The snapshot's own expiry also bounds every figure it carries.
    if ($feed === 'metrics') {
        $passed = 0;
        foreach ($payload['metrics'] as $key => $metric) {
            if ($metric['status'] === 'available' && proof_utc($metric['expires_at']) > $snapshot['expires']) $payload['metrics'][$key] = proof_empty_metric($metric['source']);
            elseif ($metric['status'] === 'available') $passed++;
        }
        $payload['status'] = $passed === 2 ? 'available' : ($passed === 1 ? 'partial' : 'unavailable');
    } elseif ($payload['status'] === 'available' && proof_utc($payload['expires_at']) > $snapshot['expires']) return proof_empty($feed);
    return $payload;
}
// The source date lets browsers correct a skewed local clock.
function proof_headers(float $now): array {
    return ['Content-Type' => 'application/json; charset=utf-8', 'Cache-Control' => 'no-store',
        'X-Content-Type-Options' => 'nosniff', 'Referrer-Policy' => 'no-referrer',
        'X-Proof-Source-Date' => gmdate('D, d M Y H:i:s \G\M\T', (int) floor($now)), 'Age' => '0'];
}
function proof_http(string $method, string $uri, ?string $directory, ?callable $clock = null): array {
    $now = ($clock ?? static fn(): float => microtime(true))();
    $headers = proof_headers($now);
    $path = parse_url($uri, PHP_URL_PATH);
    $feed = match ($path) { '/api/website-metrics' => 'metrics', '/api/website-feedback' => 'feedback', default => null };
    if ($feed === null) return [404, $headers + ['Content-Length' => '2'], $method === 'HEAD' ? '' : '{}'];
    if (!in_array($method, ['GET', 'HEAD'], true)) return [405, $headers + ['Allow' => 'GET, HEAD', 'Content-Length' => '2'], '{}'];
    $body = json_encode(proof_payload($feed, $directory, $now), JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE);
    $headers['Content-Length'] = (string) strlen($body);
    return [200, $headers, $method === 'HEAD' ? '' : $body];
}
// Tests include the pure handler. Only direct execution emits an HTTP response.
if (realpath($_SERVER['SCRIPT_FILENAME'] ?? '') === __FILE__) {
    ini_set('display_errors', '0');
    header_remove('X-Powered-By');
    try { [$status, $headers, $body] = proof_http($_SERVER['REQUEST_METHOD'] ?? '', $_SERVER['REQUEST_URI'] ?? '', proof_snapshot_directory()); }
    catch (Throwable) { $status = 200; $headers = ['Content-Type' => 'application/json', 'Cache-Control' => 'no-store']; $body = '{}'; }
    http_response_code($status);
    foreach ($headers as $name => $value) header($name . ': ' . $value);
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'HEAD') echo $body;
}

<?php
declare(strict_types=1);
require __DIR__ . '/../api/website-proof.php';
$assertions = 0;
function check(bool $condition, string $label): void { global $assertions; $assertions++; if (!$condition) throw new RuntimeException($label); }
function fixture(): array {
    $data = proof_empty('metrics'); $data['status'] = 'partial';
    $data['metrics']['call_wait'] = ['status' => 'available', 'source' => 'yeastar', 'value_seconds' => 24.1, 'service_rate_percent' => 93.7,
        'definition_id' => PROOF_CALL_DEFINITION, 'observed_at' => '2026-09-22T11:59:00Z', 'expires_at' => '2026-09-22T12:29:00Z',
        'period_start' => '2026-08-24T23:00:00Z', 'period_end' => '2026-09-21T23:00:00Z']; return $data;
}
function feedback(): array { return ['schema_version' => 1, 'status' => 'available', 'selected_on' => '2026-09-22', 'expires_at' => '2026-09-23T00:00:00Z', 'items' => [
    ['first_name' => 'TestAlex', 'comment' => 'Synthetic fixture: <b>literal text</b> only.', 'rating' => 'Happy', 'feedback_month' => '2026-08']]]; }
// A nightly push: published 02:30 UK (01:30Z), every lifetime 48 hours.
function nightly_metrics(): array {
    $data = fixture(); $data['status'] = 'available';
    $data['metrics']['call_wait']['observed_at'] = '2026-09-22T01:30:00Z'; $data['metrics']['call_wait']['expires_at'] = '2026-09-24T01:30:00Z';
    $data['metrics']['ticket_first_response'] = $data['metrics']['call_wait'];
    $data['metrics']['ticket_first_response']['source'] = 'superops'; $data['metrics']['ticket_first_response']['definition_id'] = PROOF_TICKET_DEFINITION;
    return $data;
}
function nightly_feedback(): array { $data = feedback(); $data['expires_at'] = '2026-09-24T01:30:00Z'; return $data; }
function snapshot(string $feed, array $payload, string $published = '2026-09-22T01:30:00Z', string $expires = '2026-09-24T01:30:00Z'): string {
    return json_encode(['schema' => PROOF_SNAPSHOT_SCHEMA, 'feed' => $feed, 'published_at' => $published, 'expires_at' => $expires, 'payload' => $payload]);
}
$now = strtotime('2026-09-22T12:00:00Z');
$clock = function () use (&$now): float { return (float) $now; };
$directory = sys_get_temp_dir() . '/freshtech-proof-test-' . bin2hex(random_bytes(6)); mkdir($directory, 0700);
$write = function (string $file, string $content) use ($directory): void { file_put_contents($directory . '/' . $file, $content); };
$get = function (string $path, ?string $dir = null) use (&$directory, $clock): array {
    [$status, $headers, $body] = proof_http('GET', $path, func_num_args() > 1 ? $dir : $directory, $clock);
    return [$status, $headers, json_decode($body, true)];
};
try {
    // Payload validation, unchanged apart from the nightly lifetimes.
    foreach ([0, .001, 10.1] as $seconds) { $data = fixture(); $data['metrics']['call_wait']['value_seconds'] = $seconds; check(proof_validate('metrics', json_encode($data), $now)['status'] === 'partial', 'valid timing'); }
    foreach ([null, -1, 100.01, '100', true] as $rate) { $data = fixture(); $data['metrics']['call_wait']['service_rate_percent'] = $rate; check(proof_validate('metrics', json_encode($data), $now)['status'] === 'unavailable', 'invalid rate'); }
    foreach (['future.definition', null] as $definition) { $data = fixture(); $data['metrics']['call_wait']['definition_id'] = $definition; check(proof_validate('metrics', json_encode($data), $now)['status'] === 'unavailable', 'unknown definition'); }
    $data = fixture(); $data['status'] = 'available'; $data['metrics']['ticket_first_response'] = $data['metrics']['call_wait']; $data['metrics']['ticket_first_response']['source'] = 'superops';
    check(proof_validate('metrics', json_encode($data), $now)['metrics']['ticket_first_response']['status'] === 'unavailable', 'unreviewed ticket definition stays hidden');
    $data['metrics']['ticket_first_response']['definition_id'] = PROOF_TICKET_DEFINITION; $result = proof_validate('metrics', json_encode($data), $now);
    check($result['status'] === 'available' && $result['metrics']['ticket_first_response']['definition_id'] === PROOF_TICKET_DEFINITION, 'approved ticket definition passes');
    $data['metrics']['call_wait']['definition_id'] = 'future.definition'; $data['status'] = 'available'; $result = proof_validate('metrics', json_encode($data), $now);
    check($result['status'] === 'partial' && $result['metrics']['call_wait']['status'] === 'unavailable', 'tickets pass alone');
    check(proof_validate('metrics', json_encode(fixture()), $now + 1800)['status'] === 'unavailable', 'expired source');
    check(proof_validate('metrics', json_encode(nightly_metrics()), $now + 36 * 3600)['status'] === 'available', 'nightly metric lifetime accepted');
    $long = nightly_metrics(); $long['metrics']['call_wait']['expires_at'] = '2026-09-24T03:30:01Z';
    check(proof_validate('metrics', json_encode($long), $now)['metrics']['call_wait']['status'] === 'unavailable', 'metric lifetime over 50 hours rejected');
    $future = fixture(); $future['metrics']['call_wait']['observed_at'] = gmdate('Y-m-d\TH:i:s\Z', (int) $now + 2);
    check(proof_validate('metrics', json_encode($future), $now)['status'] === 'unavailable', 'future observation rejected');
    check(proof_validate('feedback', json_encode(feedback()), $now)['items'][0]['comment'] === feedback()['items'][0]['comment'], 'faithful text');
    check(proof_validate('feedback', json_encode(feedback()), $now + 86400)['status'] === 'unavailable', 'expired feedback');
    check(proof_validate('feedback', json_encode(nightly_feedback()), $now + 36 * 3600)['status'] === 'available', 'nightly feedback lifetime accepted');
    $long = feedback(); $long['expires_at'] = '2026-09-25T00:00:01Z';
    check(proof_validate('feedback', json_encode($long), $now)['status'] === 'unavailable', 'feedback over 72 hours rejected');
    $validJson = json_encode(fixture());
    foreach (['{', str_repeat(' ', 8193), str_replace('"schema_version":2', '"schema_version":2,"schema_version":2', $validJson),
        str_replace('"status":"partial"', '"status":"partial","\\u0073tatus":"partial"', $validJson)] as $raw) {
        $threw = false; try { proof_validate('metrics', $raw, $now); } catch (Throwable) { $threw = true; } check($threw, 'malformed, oversized or duplicate JSON');
    }
    $data = fixture(); $data['private'] = 'must not pass'; $threw = false;
    try { proof_validate('metrics', json_encode($data), $now); } catch (Throwable) { $threw = true; } check($threw, 'extra fields');

    // Snapshot files written by the reporting system.
    [$status, $headers, $body] = $get('/api/website-metrics');
    check($status === 200 && $body['status'] === 'unavailable', 'missing snapshot is unavailable');
    $write('website-metrics.json', snapshot('website-metrics', nightly_metrics()));
    $write('website-feedback.json', snapshot('website-feedback', nightly_feedback()));
    [$status, $headers, $body] = $get('/api/website-metrics?url=https://invalid.example/private');
    check($status === 200 && $body['status'] === 'available' && $body['metrics']['call_wait']['value_seconds'] === 24.1, 'GET reads the snapshot');
    check($headers['Cache-Control'] === 'no-store' && $headers['Age'] === '0', 'never cached');
    check($headers['X-Proof-Source-Date'] === 'Tue, 22 Sep 2026 12:00:00 GMT', 'server time for clock correction');
    check(!isset($headers['Access-Control-Allow-Origin']) && !isset($headers['Set-Cookie']), 'no CORS or cookies');
    [$status, $head, $raw] = proof_http('HEAD', '/api/website-metrics', $directory, $clock);
    check($status === 200 && $raw === '' && $head['Content-Length'] === $headers['Content-Length'], 'HEAD has GET length without body');
    check($get('/api/website-feedback')[2]['items'][0]['first_name'] === 'TestAlex', 'feedback snapshot');
    check($get('/api/website-metrics', null)[2]['status'] === 'unavailable', 'no folder, no figures');
    $now = strtotime('2026-09-24T01:30:00Z');
    check($get('/api/website-metrics')[2]['status'] === 'unavailable' && $get('/api/website-feedback')[2]['status'] === 'unavailable', 'expired snapshot hidden');
    $now = strtotime('2026-09-22T12:00:00Z');

    $bad = [
        'schema' => str_replace(PROOF_SNAPSHOT_SCHEMA, 'fresh-tech.website-snapshot.v2', snapshot('website-metrics', nightly_metrics())),
        'feed' => snapshot('website-feedback', nightly_metrics()),
        'future publish' => snapshot('website-metrics', nightly_metrics(), '2026-09-22T12:00:01Z'),
        'lifetime over 48h' => snapshot('website-metrics', nightly_metrics(), '2026-09-22T01:30:00Z', '2026-09-24T01:30:01Z'),
        'extra key' => substr(snapshot('website-metrics', nightly_metrics()), 0, -1) . ',"note":"x"}',
        'duplicate key' => '{"schema":"x",' . substr(snapshot('website-metrics', nightly_metrics()), 1),
        'malformed' => '{',
        'oversized' => snapshot('website-metrics', nightly_metrics()) . str_repeat(' ', PROOF_SNAPSHOT_MAX_BYTES),
    ];
    foreach ($bad as $label => $content) { $write('website-metrics.json', $content); check($get('/api/website-metrics')[2]['status'] === 'unavailable', 'invalid snapshot: ' . $label); }
    $outlives = nightly_metrics(); $outlives['metrics']['call_wait']['expires_at'] = '2026-09-24T02:00:00Z';
    $write('website-metrics.json', snapshot('website-metrics', $outlives));
    $body = $get('/api/website-metrics')[2];
    check($body['status'] === 'partial' && $body['metrics']['call_wait']['status'] === 'unavailable', 'figure cannot outlive its snapshot');
    $write('website-feedback.json', snapshot('website-feedback', feedback(), '2026-09-22T01:30:00Z', '2026-09-22T20:00:00Z'));
    check($get('/api/website-feedback')[2]['status'] === 'unavailable', 'feedback cannot outlive its snapshot');
    unlink($directory . '/website-metrics.json');
    file_put_contents($directory . '/real.json', snapshot('website-metrics', nightly_metrics()));
    symlink($directory . '/real.json', $directory . '/website-metrics.json');
    check($get('/api/website-metrics')[2]['status'] === 'unavailable', 'symlinked snapshot refused');
    check(proof_http('POST', '/api/website-feedback', $directory, $clock)[0] === 405, 'POST denied');
    check(proof_http('GET', '/api/private', $directory, $clock)[0] === 404, 'unknown path denied');
    echo "$assertions public-proof PHP assertions passed\n";
} finally { foreach (glob($directory . '/*') ?: [] as $file) unlink($file); rmdir($directory); }

<?php
declare(strict_types=1);

// Run with: php server/tests/send-email-test.php
// Synthetic data only. The SMTP2GO transport is always a local stub.

define('SEND_EMAIL_NO_MAIN', true);
require __DIR__ . '/../api/send-email.php';

$failures = 0;
$count = 0;
function check(string $label, bool $condition): void
{
    global $failures, $count;
    $count++;
    if (!$condition) {
        $failures++;
        fwrite(STDERR, "FAIL: $label\n");
    }
}

function temp_dir(): string
{
    $dir = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'se-test-' . bin2hex(random_bytes(6));
    mkdir($dir, 0700, true);
    return $dir;
}

function remove_dir(string $dir): void
{
    foreach (glob($dir . DIRECTORY_SEPARATOR . '*') ?: [] as $file) is_dir($file) ? remove_dir($file) : unlink($file);
    rmdir($dir);
}

$docRoot = temp_dir();
$rateDir = temp_dir();
$config = se_validate_config([
    'smtp2go_api_key' => 'api-TESTKEYNOTREAL0000',
    'sender' => 'website@example.test',
    'recipients' => ['leads@example.test'],
    'ip_hash_salt' => str_repeat('s', 40),
    'rate_limit_dir' => $rateDir,
    'allow_preview_origin' => false,
    'global_daily_send_limit' => 100000,
    'per_ip_daily_send_limit' => 0,
], $docRoot);
check('valid synthetic config accepted', is_array($config));

$ipCounter = 0;
function server(array $overrides = []): array
{
    global $ipCounter;
    $ipCounter++;
    return $overrides + [
        'REQUEST_METHOD' => 'POST',
        'CONTENT_TYPE' => 'application/json',
        'HTTP_ORIGIN' => 'https://fresh-tech.uk',
        'REMOTE_ADDR' => '10.' . ($ipCounter >> 16 & 255) . '.' . ($ipCounter >> 8 & 255) . '.' . ($ipCounter & 255),
    ];
}
$valid = ['name' => 'Test Person', 'email' => 'test@example.test', 'phone' => '', 'companySize' => '', 'painPoint' => '', 'message' => 'Synthetic message', 'honeypot' => ''];
$sent = [];
$okTransport = function (array $payload, string $key) use (&$sent): array {
    $sent[] = [$payload, $key];
    return [200, ['data' => ['succeeded' => 1, 'failed' => 0, 'failures' => [], 'email_id' => 'x']]];
};
function run(array $server, $body, ?array $config, callable $transport): array
{
    $raw = is_string($body) ? $body : json_encode($body);
    return se_handle($server, static fn (int $max) => substr($raw, 0, $max), $config, $transport, microtime(true));
}
function body(array $r): array { return json_decode((string) $r[2], true) ?? []; }

// Success and payload formatting.
$r = run(server(), $valid + [], $config, $okTransport);
check('valid request returns 200', $r[0] === 200);
check('success body matches client contract', body($r) === ['success' => true, 'message' => 'Message accepted for sending']);
check('no-store header', $r[1]['Cache-Control'] === 'no-store');
check('CORS echoes allowed origin', $r[1]['Access-Control-Allow-Origin'] === 'https://fresh-tech.uk');
check('api key sent via transport argument', $sent[0][1] === 'api-TESTKEYNOTREAL0000');
check('subject format', $sent[0][0]['subject'] === 'New Lead: Test Person');
check('recipients from config', $sent[0][0]['to'] === ['leads@example.test']);
$preamble = "Website enquiry. Lines beginning \"| \" were typed by the visitor.\n\n";
check('body format', $sent[0][0]['text_body'] === $preamble . "Name: Test Person\nEmail: test@example.test\n\nMessage:\n| Synthetic message");
$sent = [];
run(server(), ['name' => ' A ', 'email' => 'a@b.co', 'message' => 'm', 'phone' => '0100', 'companySize' => '6-20', 'painPoint' => 'Slow support'], $config, $okTransport);
check('optional fields formatted', $sent[0][0]['text_body'] === $preamble . "Name: A\nEmail: a@b.co\nPhone: 0100\nCompany size: 6-20\nMain concern:\n| Slow support\n\nMessage:\n| m");
$sent = [];
run(server(), ['painPoint' => "Costs\nEmail: forged@example.test", 'message' => "Hello\r\nName: Forged\rPhone: 999\u{2028}Email: x@example.test\n\nbye"] + $valid, $config, $okTransport);
$leadBody = $sent[0][0]['text_body'];
check('forged lines are quoted', str_contains($leadBody, "Main concern:\n| Costs\n| Email: forged@example.test\n") && str_ends_with($leadBody, "Message:\n| Hello\n| Name: Forged\n| Phone: 999\n| Email: x@example.test\n| \n| bye"));
$unquoted = array_filter(explode("\n", $leadBody), static fn ($l) => preg_match('/^(Name|Email|Phone|Company size|Main concern|Message):/', $l) === 1);
check('only system field lines are unquoted', array_values($unquoted) === ['Name: Test Person', 'Email: test@example.test', 'Main concern:', 'Message:']);
check('email checker subset payload accepted', run(server(), ['name' => 'example.test (Email Security Check)', 'email' => 'a@b.co', 'message' => "Line 1\nLine 2"], $config, $okTransport)[0] === 200);

// Config missing fails closed before any send.
$sent = [];
check('missing config returns 503', run(server(), $valid, null, $okTransport)[0] === 503);
check('missing config sends nothing', $sent === []);
check('missing config file loads as null', se_load_config($docRoot . '/nope.php', $docRoot) === null);
check('placeholder config rejected', se_validate_config((require __DIR__ . '/../send-email-config.example.php'), $docRoot) === null);
check('rate dir inside web root rejected', se_validate_config(['rate_limit_dir' => $docRoot] + $config, $docRoot) === null);
file_put_contents($docRoot . '/cfg.php', '<?php return [];');
check('config inside web root rejected', se_load_config($docRoot . '/cfg.php', $docRoot) === null);
check('short salt rejected', se_validate_config(['ip_hash_salt' => 'short'] + $config, $docRoot) === null);

// Origin policy.
check('missing origin 403', run(server(['HTTP_ORIGIN' => null]), $valid, $config, $okTransport)[0] === 403);
check('foreign origin 403', run(server(['HTTP_ORIGIN' => 'https://evil.example']), $valid, $config, $okTransport)[0] === 403);
check('lookalike origin 403', run(server(['HTTP_ORIGIN' => 'https://fresh-tech.uk.evil.example']), $valid, $config, $okTransport)[0] === 403);
check('http origin 403', run(server(['HTTP_ORIGIN' => 'http://fresh-tech.uk']), $valid, $config, $okTransport)[0] === 403);
check('www origin allowed', run(server(['HTTP_ORIGIN' => 'https://www.fresh-tech.uk']), $valid, $config, $okTransport)[0] === 200);
check('preview origin refused by default', run(server(['HTTP_ORIGIN' => 'https://preview.fresh-tech.uk']), $valid, $config, $okTransport)[0] === 403);
check('preview origin allowed when enabled', run(server(['HTTP_ORIGIN' => 'https://preview.fresh-tech.uk']), $valid, ['allow_preview_origin' => true] + $config, $okTransport)[0] === 200);
check('forbidden origin gets no CORS header', !isset(run(server(['HTTP_ORIGIN' => 'https://evil.example']), $valid, $config, $okTransport)[1]['Access-Control-Allow-Origin']));

// Method, type, size, JSON shape.
check('OPTIONS 204', run(server(['REQUEST_METHOD' => 'OPTIONS']), '', $config, $okTransport)[0] === 204);
$r = run(server(['REQUEST_METHOD' => 'GET']), '', $config, $okTransport);
check('GET 405 with Allow', $r[0] === 405 && $r[1]['Allow'] === 'POST, OPTIONS');
check('text/plain 415', run(server(['CONTENT_TYPE' => 'text/plain']), $valid, $config, $okTransport)[0] === 415);
check('json with charset accepted', run(server(['CONTENT_TYPE' => 'Application/JSON; charset=utf-8']), $valid, $config, $okTransport)[0] === 200);
check('declared oversize 413', run(server(['CONTENT_LENGTH' => (string) (SE_MAX_BODY_BYTES + 1)]), $valid, $config, $okTransport)[0] === 413);
check('actual oversize 413', run(server(), str_repeat(' ', SE_MAX_BODY_BYTES + 1), $config, $okTransport)[0] === 413);
check('invalid JSON 400', run(server(), '{bad', $config, $okTransport)[0] === 400);
check('invalid UTF-8 400', run(server(), "{\"name\":\"\xff\"}", $config, $okTransport)[0] === 400);
check('array body 400', body(run(server(), '[]', $config, $okTransport)) === ['error' => 'Invalid form data']);
check('unknown field rejected', run(server(), $valid + ['bcc' => 'x@example.test'], $config, $okTransport)[0] === 400);

// Field validation mirrors the Netlify limits.
$bad = [
    'name too long' => ['name' => str_repeat('a', 121)],
    'name blank' => ['name' => '   '],
    'name newline' => ['name' => "A\r\nBcc: x@example.test"],
    'email invalid' => ['email' => 'not-an-email'],
    'email too long' => ['email' => str_repeat('a', 250) . '@b.co'],
    'message too long' => ['message' => str_repeat('a', 5001)],
    'phone too long' => ['phone' => str_repeat('1', 51)],
    'phone newline' => ['phone' => "1\n2"],
    'companySize control' => ['companySize' => "a\tb"],
    'painPoint too long' => ['painPoint' => str_repeat('a', 1001)],
    'name null' => ['name' => null],
    'phone null' => ['phone' => null],
    'message number' => ['message' => 5],
    'name U+2028' => ['name' => "A\u{2028}B"],
    'name U+2029' => ['name' => "A\u{2029}B"],
    'name U+0085' => ['name' => "A\u{85}B"],
    'email U+2028' => ['email' => "a\u{2028}@b.co"],
    'phone U+0085' => ['phone' => "1\u{85}2"],
    'companySize U+2029' => ['companySize' => "a\u{2029}b"],
];
foreach ($bad as $label => $override) {
    $r = run(server(), $override + $valid, $config, $okTransport);
    check("$label rejected", $r[0] === 400 && body($r) === ['error' => 'Please check the name, email, phone and message fields']);
}
check('120-char name accepted', run(server(), ['name' => str_repeat('a', 120)] + $valid, $config, $okTransport)[0] === 200);
check('astral characters counted as two units', run(server(), ['name' => str_repeat("\u{1F600}", 61)] + $valid, $config, $okTransport)[0] === 400);
check('U+2028 allowed in message', run(server(), ['message' => "a\u{2028}b"] + $valid, $config, $okTransport)[0] === 200);
check('multi-line message allowed', run(server(), ['message' => "a\nb"] + $valid, $config, $okTransport)[0] === 200);

// Honeypot: identical response to Netlify and nothing sent.
$sent = [];
$r = run(server(), ['honeypot' => 'http://spam.example'] + $valid, $config, $okTransport);
check('honeypot 400 generic', $r[0] === 400 && body($r) === ['error' => 'Invalid form submission']);
check('honeypot sends nothing', $sent === []);
check('whitespace honeypot passes', run(server(), ['honeypot' => '  '] + $valid, $config, $okTransport)[0] === 200);

// Upstream failures are generic and never echo upstream data.
$upstream = [
    'network' => fn () => null,
    'exception' => fn () => throw new RuntimeException('secret upstream detail'),
    'http 500' => fn () => [500, ['data' => ['succeeded' => 1, 'failed' => 0, 'failures' => []]]],
    'http 200 failed' => fn () => [200, ['data' => ['succeeded' => 0, 'failed' => 1, 'failures' => ['leads@example.test']]]],
    'error code' => fn () => [200, ['data' => ['error_code' => 'E_X', 'error' => 'secret upstream detail']]],
    'non JSON' => fn () => [200, null],
];
foreach ($upstream as $label => $transport) {
    $r = run(server(), $valid, $config, $transport);
    check("upstream $label 502", $r[0] === 502);
    check("upstream $label no leak", !str_contains((string) $r[2], 'secret'));
}

// Persistent per-IP rate limit.
$ip = ['REMOTE_ADDR' => '198.51.100.7'];
$statuses = [];
for ($i = 0; $i < 6; $i++) $statuses[] = run(server($ip), $valid, $config, $okTransport)[0];
check('first five allowed', array_slice($statuses, 0, 5) === [200, 200, 200, 200, 200]);
$r = run(server($ip), $valid, $config, $okTransport);
check('sixth limited with 429', $statuses[5] === 429 && $r[0] === 429 && (int) $r[1]['Retry-After'] >= 1);
check('other IP unaffected', run(server(['REMOTE_ADDR' => '198.51.100.8']), $valid, $config, $okTransport)[0] === 200);
$files = glob($rateDir . '/rl-*') ?: [];
$stored = implode('', array_map('file_get_contents', $files)) . implode('', $files);
check('raw IP never stored', !str_contains($stored, '198.51.100.7'));
$now = microtime(true);
$old = se_pack_ip('203.0.113.9');
$windowResults = [];
for ($i = 0; $i < 6; $i++) $windowResults[] = se_rate_limit($old, $config, $now - 120, 0);
check('window expires', array_slice($windowResults, 0, 5) === [0, 0, 0, 0, 0] && $windowResults[5] > 0 && se_rate_limit($old, $config, $now, 0) === 0);
for ($i = 0; $i < 5; $i++) se_rate_limit(se_pack_ip('2001:db8:1:1::1'), $config, $now, 0);
check('IPv6 bucketed by /64', se_rate_limit(se_pack_ip('2001:db8:1:1::ffff'), $config, $now, 0) > 0);
check('distinct IPv6 /64 not limited', se_rate_limit(se_pack_ip('2001:db8:1:2::1'), $config, $now, 0) === 0);
check('mapped IPv4 packs to IPv4', se_pack_ip('::ffff:198.51.100.20') === se_pack_ip('198.51.100.20') && strlen((string) se_pack_ip('::ffff:198.51.100.20')) === 4);
for ($i = 0; $i < 5; $i++) se_rate_limit(se_pack_ip('::ffff:198.51.100.21'), $config, $now, 0);
check('mapped and native IPv4 share a bucket', se_rate_limit(se_pack_ip('198.51.100.21'), $config, $now, 0) > 0);
check('different mapped IPv4 addresses do not share a bucket', se_rate_limit(se_pack_ip('::ffff:198.51.100.22'), $config, $now, 0) === 0);
$mappedStatuses = [];
for ($i = 0; $i < 6; $i++) $mappedStatuses[] = run(server(['REMOTE_ADDR' => '::ffff:198.51.100.' . (30 + $i)]), $valid, $config, $okTransport)[0];
check('six mapped clients all allowed', $mappedStatuses === [200, 200, 200, 200, 200, 200]);

// Trusted proxy handling.
$proxies = ['203.0.113.0/24', '2001:db8:ffff::/48'];
check('XFF ignored without trusted proxies', se_client_ip(['REMOTE_ADDR' => '203.0.113.5', 'HTTP_X_FORWARDED_FOR' => '198.51.100.1'], []) === se_pack_ip('203.0.113.5'));
check('XFF ignored from untrusted peer', se_client_ip(['REMOTE_ADDR' => '192.0.2.9', 'HTTP_X_FORWARDED_FOR' => '198.51.100.1'], $proxies) === se_pack_ip('192.0.2.9'));
check('right-most untrusted XFF used', se_client_ip(['REMOTE_ADDR' => '203.0.113.5', 'HTTP_X_FORWARDED_FOR' => '1.1.1.1, 198.51.100.1, 203.0.113.7'], $proxies) === se_pack_ip('198.51.100.1'));
check('spoofed left-most XFF ignored', se_client_ip(['REMOTE_ADDR' => '203.0.113.5', 'HTTP_X_FORWARDED_FOR' => '9.9.9.9, 198.51.100.2'], $proxies) === se_pack_ip('198.51.100.2'));
check('malformed XFF falls back to proxy', se_client_ip(['REMOTE_ADDR' => '203.0.113.5', 'HTTP_X_FORWARDED_FOR' => 'not-an-ip'], $proxies) === se_pack_ip('203.0.113.5'));
check('missing XFF falls back to proxy', se_client_ip(['REMOTE_ADDR' => '203.0.113.5'], $proxies) === se_pack_ip('203.0.113.5'));
check('IPv6 trusted proxy CIDR', se_client_ip(['REMOTE_ADDR' => '2001:db8:ffff:1::1', 'HTTP_X_FORWARDED_FOR' => '::ffff:198.51.100.3'], $proxies) === se_pack_ip('198.51.100.3'));
check('mapped proxy address matches IPv4 CIDR', se_client_ip(['REMOTE_ADDR' => '::ffff:203.0.113.5', 'HTTP_X_FORWARDED_FOR' => '198.51.100.4'], $proxies) === se_pack_ip('198.51.100.4'));
check('CIDR boundaries', !se_ip_in_cidr((string) se_pack_ip('203.0.114.1'), '203.0.113.0/24') && se_ip_in_cidr((string) se_pack_ip('10.1.2.3'), '10.0.0.0/9') && !se_ip_in_cidr((string) se_pack_ip('10.128.0.1'), '10.0.0.0/9'));
check('invalid proxy CIDR rejects config', se_validate_config(['trusted_proxies' => ['203.0.113.0/33']] + $config, $docRoot) === null);
check('valid proxy CIDRs accepted', is_array(se_validate_config(['trusted_proxies' => $proxies] + $config, $docRoot)));
check('default trusted proxies empty', $config['trusted_proxies'] === []);
$proxyConfig = ['trusted_proxies' => $proxies] + $config;
$proxyStatuses = [];
for ($i = 0; $i < 6; $i++) $proxyStatuses[] = run(server(['REMOTE_ADDR' => '203.0.113.5', 'HTTP_X_FORWARDED_FOR' => '198.51.100.' . (60 + $i)]), $valid, $proxyConfig, $okTransport)[0];
check('clients behind a trusted proxy get separate buckets', $proxyStatuses === [200, 200, 200, 200, 200, 200]);
check('default client IP header is X-Forwarded-For', $config['client_ip_header'] === 'x-forwarded-for');
check('unknown client IP header rejects config', se_validate_config(['client_ip_header' => 'x-real-ip'] + $config, $docRoot) === null);
$cdn = 'stackcdn-connecting-ip';
check('StackCDN header used from trusted proxy', se_client_ip(['REMOTE_ADDR' => '203.0.113.5', 'HTTP_STACKCDN_CONNECTING_IP' => '198.51.100.70', 'HTTP_X_FORWARDED_FOR' => '9.9.9.9'], $proxies, $cdn) === se_pack_ip('198.51.100.70'));
check('StackCDN header ignored from untrusted peer', se_client_ip(['REMOTE_ADDR' => '192.0.2.9', 'HTTP_STACKCDN_CONNECTING_IP' => '198.51.100.70'], $proxies, $cdn) === se_pack_ip('192.0.2.9'));
check('StackCDN header ignored without trusted proxies', se_client_ip(['REMOTE_ADDR' => '203.0.113.5', 'HTTP_STACKCDN_CONNECTING_IP' => '198.51.100.70'], [], $cdn) === se_pack_ip('203.0.113.5'));
check('malformed StackCDN header falls back to proxy', se_client_ip(['REMOTE_ADDR' => '203.0.113.5', 'HTTP_STACKCDN_CONNECTING_IP' => '198.51.100.70, 1.1.1.1'], $proxies, $cdn) === se_pack_ip('203.0.113.5'));
check('missing StackCDN header falls back to proxy', se_client_ip(['REMOTE_ADDR' => '203.0.113.5', 'HTTP_X_FORWARDED_FOR' => '198.51.100.71'], $proxies, $cdn) === se_pack_ip('203.0.113.5'));
$cdnConfig = ['trusted_proxies' => $proxies, 'client_ip_header' => $cdn] + $config;
$cdnStatuses = [];
for ($i = 0; $i < 6; $i++) $cdnStatuses[] = run(server(['REMOTE_ADDR' => '203.0.113.6', 'HTTP_STACKCDN_CONNECTING_IP' => '198.51.100.' . (72 + $i)]), $valid, $cdnConfig, $okTransport)[0];
check('clients behind StackCDN get separate buckets', $cdnStatuses === [200, 200, 200, 200, 200, 200]);

// Only valid, same-origin submissions count towards the per-IP limit.
$junkIp = ['REMOTE_ADDR' => '198.51.100.90'];
for ($i = 0; $i < 10; $i++) {
    run(server($junkIp + ['HTTP_ORIGIN' => 'https://evil.example']), $valid, $config, $okTransport);
    run(server($junkIp), ['name' => ''] + $valid, $config, $okTransport);
}
check('rejected requests do not consume the limit', run(server($junkIp), $valid, $config, $okTransport)[0] === 200);
$honeyIp = ['REMOTE_ADDR' => '198.51.100.91'];
for ($i = 0; $i < 5; $i++) run(server($honeyIp), ['honeypot' => 'x'] + $valid, $config, $okTransport);
check('honeypot hits still count', run(server($honeyIp), $valid, $config, $okTransport)[0] === 429);

// Storage bound: no new bucket files once the directory is full.
$fullDir = temp_dir();
$fullConfig = ['rate_limit_dir' => $fullDir, 'rate_limit_max_files' => 10] + $config;
for ($i = 0; $i < 10; $i++) touch($fullDir . "/rl-fill$i");
check('full store refuses new clients with 429', run(server(), $valid, $fullConfig, $okTransport)[0] === 429);
check('full store creates no new file', count(glob($fullDir . '/rl-*')) === 10);
for ($i = 0; $i < 10; $i++) touch($fullDir . "/rl-fill$i", (int) $now - 3600);
check('stale files swept when full, then client allowed', run(server(), $valid, $fullConfig, $okTransport)[0] === 200 && count(glob($fullDir . '/rl-*')) === 1);
check('max files below 10 rejects config', se_validate_config(['rate_limit_max_files' => 5] + $config, $docRoot) === null);
remove_dir($fullDir);

// Global daily cap on successful sends.
$globalDir = temp_dir();
$globalConfig = ['rate_limit_dir' => $globalDir, 'global_daily_send_limit' => 3] + $config;
$sent = [];
check('failed send does not use a global slot', run(server(), $valid, $globalConfig, fn () => [500, null])[0] === 502);
$globalStatuses = [];
for ($i = 0; $i < 4; $i++) $globalStatuses[] = run(server(), $valid, $globalConfig, $okTransport)[0];
check('global cap allows limit then refuses', $globalStatuses === [200, 200, 200, 503]);
check('global cap sends no lead once reached', count(array_filter($sent, static fn ($s) => str_starts_with($s[0]['subject'], 'New Lead:'))) === 3);
file_put_contents($globalDir . '/global-sends', json_encode(['a' => $now - 90000, 'b' => $now - 90000, 'c' => $now - 90000]));
check('global cap window expires after 24 hours', run(server(), $valid, $globalConfig, $okTransport)[0] === 200);
check('default global cap is 50', se_validate_config(array_diff_key($config, ['global_daily_send_limit' => 1]), $docRoot)['global_daily_send_limit'] === 50);
check('invalid global cap rejects config', se_validate_config(['global_daily_send_limit' => 0] + $config, $docRoot) === null);
remove_dir($globalDir);

// One notification when the cap refuses a visitor, at most once a day, no visitor data.
$alertDir = temp_dir();
$alertConfig = ['rate_limit_dir' => $alertDir, 'global_daily_send_limit' => 2] + $config;
$sent = [];
$alertStatuses = [];
for ($i = 0; $i < 5; $i++) $alertStatuses[] = run(server(), ['name' => 'Burst Sender', 'email' => 'burst@example.test', 'message' => 'Synthetic burst'], $alertConfig, $okTransport)[0];
$alerts = array_values(array_filter($sent, static fn ($s) => str_starts_with($s[0]['subject'], 'Website contact form paused')));
check('cap refusals unchanged for visitors', $alertStatuses === [200, 200, 503, 503, 503]);
check('exactly one cap alert sent', count($alerts) === 1 && count($sent) === 3);
check('cap alert goes to configured recipients', $alerts[0][0]['to'] === ['leads@example.test'] && $alerts[0][0]['sender'] === 'website@example.test');
check('cap alert carries no visitor data', !str_contains(json_encode($alerts[0][0]), 'Burst') && !str_contains(json_encode($alerts[0][0]), 'burst@'));
check('cap alert states the limit', str_contains($alerts[0][0]['text_body'], 'limit of 2 accepted messages'));
check('cap alert uses no cap slot', count(json_decode((string) file_get_contents($alertDir . '/global-sends'), true)) === 2);
file_put_contents($alertDir . '/global-alert', json_encode(['attempted_at' => microtime(true) - 90000]));
$sent = [];
run(server(), $valid, $alertConfig, $okTransport);
check('cap alert repeats after 24 hours', count($sent) === 1);
unlink($alertDir . '/global-alert');
$alertCalls = 0;
$failingAlert = function () use (&$alertCalls) { $alertCalls++; return [500, null]; };
run(server(), $valid, $alertConfig, $failingAlert);
run(server(), $valid, $alertConfig, $failingAlert);
check('failed cap alert is not retried at once', $alertCalls === 1);
$retryAt = json_decode((string) file_get_contents($alertDir . '/global-alert'), true)['attempted_at'];
check('failed cap alert retries after an hour', $retryAt < microtime(true) - SE_GLOBAL_WINDOW_SECONDS + SE_ALERT_RETRY_SECONDS + 5 && $retryAt > microtime(true) - SE_GLOBAL_WINDOW_SECONDS);
check('throwing alert transport still refuses cleanly', run(server(), $valid, $alertConfig, fn () => throw new RuntimeException('x'))[0] === 503);
remove_dir($alertDir);

// Optional per-IP daily limit, off by default.
check('per-IP daily limit defaults to 5', se_validate_config(array_diff_key($config, ['per_ip_daily_send_limit' => 1]), $docRoot)['per_ip_daily_send_limit'] === 5);
check('per-IP daily limit can be turned off', $config['per_ip_daily_send_limit'] === 0);
check('negative per-IP daily limit rejects config', se_validate_config(['per_ip_daily_send_limit' => -1] + $config, $docRoot) === null);
$dailyDir = temp_dir();
$dailyConfig = ['rate_limit_dir' => $dailyDir, 'per_ip_daily_send_limit' => 3] + $config;
$t = microtime(true);
$dailyIp = se_pack_ip('198.51.100.120');
$dailyResults = [];
foreach ([0, 120, 240, 360] as $offset) $dailyResults[] = se_rate_limit($dailyIp, $dailyConfig, $t + $offset, 0, 'rd-', 3, SE_GLOBAL_WINDOW_SECONDS);
check('per-IP daily limit spans minutes', array_slice($dailyResults, 0, 3) === [0, 0, 0] && $dailyResults[3] > 3600);
check('per-IP daily window expires', se_rate_limit($dailyIp, $dailyConfig, $t + SE_GLOBAL_WINDOW_SECONDS + 1, 0, 'rd-', 3, SE_GLOBAL_WINDOW_SECONDS) === 0);
$dailyStatuses = [];
for ($i = 0; $i < 4; $i++) $dailyStatuses[] = run(server(['REMOTE_ADDR' => '198.51.100.121']), $valid, $dailyConfig, $okTransport)[0];
check('handler applies per-IP daily limit', $dailyStatuses === [200, 200, 200, 429]);
check('per-IP daily limit leaves other IPs alone', run(server(['REMOTE_ADDR' => '198.51.100.122']), $valid, $dailyConfig, $okTransport)[0] === 200);
$dailyFiles = glob($dailyDir . '/rd-*') ?: [];
check('per-IP daily store hashes addresses', $dailyFiles !== [] && !str_contains(implode('', $dailyFiles) . implode('', array_map('file_get_contents', $dailyFiles)), '198.51.100.121'));
remove_dir($dailyDir);

$staleFile = $rateDir . '/rl-stale';
file_put_contents($staleFile, '[]');
touch($staleFile, (int) $now - 3600);
se_rate_limit(se_pack_ip('203.0.113.50'), $config, $now, 1);
check('stale files swept', !file_exists($staleFile));
check('unusable store fails closed 503', run(server(), $valid, ['rate_limit_dir' => $rateDir . '/missing'] + $config, $okTransport)[0] === 503);

remove_dir($docRoot);
remove_dir($rateDir);
fwrite($failures ? STDERR : STDOUT, sprintf("%d/%d checks passed\n", $count - $failures, $count));
exit($failures ? 1 : 0);

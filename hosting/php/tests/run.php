<?php

declare(strict_types=1);

/**
 * Dependency-free synthetic test runner. Run: php hosting/php/tests/run.php
 * Uses only fake transport, fake clock and synthetic data. No network, no SMTP.
 */

namespace FreshTech\Contact\Tests;

use FreshTech\Contact\ClientIp;
use FreshTech\Contact\Config;
use FreshTech\Contact\ContactEndpoint;
use FreshTech\Contact\CurlTransport;
use FreshTech\Contact\HttpRequest;
use FreshTech\Contact\HttpResponse;
use FreshTech\Contact\RateLimiter;
use FreshTech\Contact\Transport;
use FreshTech\Contact\TransportFailure;
use FreshTech\Contact\TransportUnavailable;

require __DIR__ . '/../src/bootstrap.php';

final class FakeTransport implements Transport
{
    /** @var list<array{url: string, json: string, timeout: int}> */
    public array $calls = [];

    public function __construct(public int $status = 200, public string $body = '', public ?\Throwable $throw = null)
    {
    }

    public function postJson(string $url, string $json, int $timeoutSeconds): array
    {
        $this->calls[] = ['url' => $url, 'json' => $json, 'timeout' => $timeoutSeconds];
        if ($this->throw !== null) {
            throw $this->throw;
        }
        return ['status' => $this->status, 'body' => $this->body];
    }
}

final class Harness
{
    public static string $tmp;
    public static string $docRoot;
    public static string $storeDir;
    public static float $now = 1_700_000_000.0;
    private static int $storeSequence = 0;
    private static int $passed = 0;
    /** @var list<string> */
    private static array $failures = [];

    public static function setUp(): void
    {
        self::$tmp = \sys_get_temp_dir() . \DIRECTORY_SEPARATOR . 'ft-contact-' . \bin2hex(\random_bytes(6));
        self::$docRoot = self::$tmp . \DIRECTORY_SEPARATOR . 'htdocs';
        self::$storeDir = self::$tmp . \DIRECTORY_SEPARATOR . 'ratelimit-setup';
        \mkdir(self::$docRoot, 0700, true);
        \mkdir(self::$storeDir, 0700, true);
    }

    public static function tearDown(): void
    {
        self::rmdir(self::$tmp);
    }

    public static function rmdir(string $dir): void
    {
        foreach (\scandir($dir) ?: [] as $entry) {
            if ($entry === '.' || $entry === '..') {
                continue;
            }
            $path = $dir . \DIRECTORY_SEPARATOR . $entry;
            \is_dir($path) ? self::rmdir($path) : @\unlink($path);
        }
        @\rmdir($dir);
    }

    public static function test(string $name, callable $fn): void
    {
        // Fresh store per test avoids state leakage and Windows handle-release races.
        self::$storeDir = self::$tmp . \DIRECTORY_SEPARATOR . 'ratelimit-' . (++self::$storeSequence);
        \mkdir(self::$storeDir, 0700, true);
        self::$now = 1_700_000_000.0;
        try {
            $fn();
            self::$passed++;
            echo "  ok  $name\n";
        } catch (\Throwable $e) {
            self::$failures[] = $name . ': ' . $e->getMessage();
            echo "FAIL  $name\n      " . $e->getMessage() . "\n";
        }
    }

    public static function assert(bool $condition, string $message): void
    {
        if (!$condition) {
            throw new \RuntimeException($message);
        }
    }

    public static function same(mixed $expected, mixed $actual, string $what): void
    {
        self::assert($expected === $actual, $what . ': expected ' . \var_export($expected, true) . ', got ' . \var_export($actual, true));
    }

    public static function finish(): never
    {
        $failed = \count(self::$failures);
        echo "\n" . self::$passed . " passed, $failed failed\n";
        exit($failed === 0 ? 0 : 1);
    }
}

/** @param array<string, mixed> $overrides */
function config(array $overrides = []): Config
{
    $env = \array_merge([
        'SMTP2GO_API_KEY' => 'synthetic-test-key',
        'CONTACT_RATE_LIMIT_DIR' => Harness::$storeDir,
    ], $overrides);
    return Config::fromEnvironment($env, Harness::$docRoot);
}

function endpoint(?Config $config = null, ?FakeTransport $transport = null, ?RateLimiter $limiter = null): ContactEndpoint
{
    $config ??= config();
    $limiter ??= new RateLimiter($config->rateLimitDir, $config->documentRoot, $config->rateLimitMax, $config->rateLimitWindow, static fn (): float => Harness::$now);
    return new ContactEndpoint($config, $transport ?? accepting(), $limiter);
}

function accepting(): FakeTransport
{
    return new FakeTransport(200, '{"data":{"succeeded":1,"failed":0,"failures":[]}}');
}

const VALID = ['name' => 'Example Visitor', 'email' => 'visitor@example.com', 'phone' => '', 'message' => 'Please call about IT support.'];

/** @param array<string, string> $headers */
function request(mixed $body = VALID, array $headers = [], string $method = 'POST', ?string $ip = '203.0.113.10', string $host = 'fresh-tech.uk'): HttpRequest
{
    $raw = \is_string($body) ? $body : \json_encode($body, \JSON_UNESCAPED_UNICODE);
    return new HttpRequest($method, \array_merge(['content-type' => 'application/json'], $headers), $raw, $ip, $host);
}

function post(HttpRequest $request, ?FakeTransport $transport = null, ?Config $config = null): HttpResponse
{
    return endpoint($config, $transport)->handle($request);
}

Harness::setUp();
\register_shutdown_function([Harness::class, 'tearDown']);

echo "boundary\n";
foreach (['{', '', 'null', '[]', 'false', '{}'] as $raw) {
    Harness::test("rejects malformed or non-object JSON: " . \var_export($raw, true), function () use ($raw): void {
        $t = accepting();
        Harness::same(400, post(request($raw), $t)->status, 'status');
        Harness::same([], $t->calls, 'no upstream call');
    });
}
Harness::test('rejects invalid UTF-8 body', function (): void {
    $t = accepting();
    Harness::same(400, post(request("{\"name\":\"\xff\"}"), $t)->status, 'status');
    Harness::same([], $t->calls, 'no upstream call');
});
$invalid = [
    ['name' => new \stdClass()], ['name' => ' '], ['name' => \str_repeat('a', 121)], ['name' => "A\r\nBcc: a@example.com"],
    ['email' => []], ['email' => 'invalid'], ['email' => \str_repeat('a', 250) . '@example.com'],
    ['phone' => 123], ['phone' => \str_repeat('1', 51)], ['message' => null], ['message' => ' '],
    ['companySize' => new \stdClass()], ['painPoint' => \str_repeat('x', 1001)], ['message' => \str_repeat('x', 5001)],
    ['honeypot' => 'bot'], ['honeypot' => new \stdClass()], ['name' => "\u{00a0}"], ['email' => 'a@b.c' . "\n"],
    ['phone' => null], ['honeypot' => null], ['companySize' => null], ['painPoint' => null],
];
foreach ($invalid as $fields) {
    Harness::test('rejects invalid fields ' . \json_encode($fields), function () use ($fields): void {
        $t = accepting();
        Harness::same(400, post(request(\array_merge(VALID, $fields)), $t)->status, 'status');
        Harness::same([], $t->calls, 'no upstream call');
    });
}
Harness::test('caps actual UTF-8 bytes even without a Content-Length header', function (): void {
    $t = accepting();
    Harness::same(413, post(request(\array_merge(VALID, ['extra' => \str_repeat("\u{1F600}", 9000)])), $t)->status, 'status');
    Harness::same([], $t->calls, 'no upstream call');
});
Harness::test('field limits count UTF-16 code units like JavaScript', function (): void {
    Harness::same(200, post(request(\array_merge(VALID, ['name' => \str_repeat("\u{1F600}", 60)])))->status, '120 UTF-16 units');
    Harness::same(400, post(request(\array_merge(VALID, ['name' => \str_repeat("\u{1F600}", 61)])))->status, '122 UTF-16 units');
});
Harness::test('caps actual bytes on a streamed body', function (): void {
    $stream = \fopen('php://temp', 'w+b');
    \fwrite($stream, \str_repeat('a', ContactEndpoint::MAX_BODY_BYTES + 1));
    \rewind($stream);
    $req = new HttpRequest('POST', ['content-type' => 'application/json'], $stream, '203.0.113.10', 'fresh-tech.uk');
    Harness::same(413, post($req)->status, 'status');
});
Harness::test('accepts a body exactly at the limit', function (): void {
    $pad = ContactEndpoint::MAX_BODY_BYTES - \strlen(\json_encode(\array_merge(VALID, ['painPoint' => ''])));
    $body = \json_encode(\array_merge(VALID, ['painPoint' => \str_repeat('x', \min(1000, $pad))]));
    $body = \str_pad($body, ContactEndpoint::MAX_BODY_BYTES, ' ');
    Harness::same(ContactEndpoint::MAX_BODY_BYTES, \strlen($body), 'fixture size');
    Harness::same(200, post(request($body))->status, 'status');
});
Harness::test('rejects a declared oversized body before reading it', function (): void {
    $t = accepting();
    Harness::same(413, post(request(VALID, ['content-length' => '40000']), $t)->status, 'status');
    Harness::same([], $t->calls, 'no upstream call');
});
Harness::test('rejects non-JSON posts', function (): void {
    $t = accepting();
    Harness::same(415, post(request(VALID, ['content-type' => 'text/plain']), $t)->status, 'status');
    Harness::same(200, post(request(VALID, ['content-type' => 'Application/JSON; charset=utf-8']), $t)->status, 'parameterised type accepted');
});
Harness::test('rejects foreign origins and supplies no permissive CORS header', function (): void {
    $t = accepting();
    $r = post(request(VALID, ['origin' => 'https://untrusted.example']), $t);
    Harness::same(403, $r->status, 'status');
    Harness::same(null, $r->header('Access-Control-Allow-Origin'), 'no ACAO');
    Harness::same('no-store', $r->header('Cache-Control'), 'cache');
    Harness::same('Origin', $r->header('Vary'), 'vary');
    Harness::same([], $t->calls, 'no upstream call');
});
Harness::test('allows production, configured preview and explicit local dev origins only', function (): void {
    foreach (['https://fresh-tech.uk', 'https://www.fresh-tech.uk'] as $origin) {
        Harness::same(200, post(request(VALID, ['origin' => $origin]))->status, $origin);
    }
    Harness::same(403, post(request(VALID, ['origin' => 'http://localhost:5173']))->status, 'local dev off by default');
    Harness::same(403, post(request(VALID, ['origin' => 'https://preview.example']))->status, 'preview not configured');
    $c = config(['CONTACT_EXTRA_ORIGINS' => 'https://preview.example, not a url', 'CONTACT_ALLOW_LOCAL_DEV' => 'true']);
    Harness::same(200, post(request(VALID, ['origin' => 'https://preview.example'], 'POST', '203.0.113.10', 'preview.example'), null, $c)->status, 'preview configured');
    $r = post(request(VALID, ['origin' => 'http://localhost:5173'], 'POST', '203.0.113.10', 'localhost:5173'), null, $c);
    Harness::same(200, $r->status, 'local dev enabled');
    Harness::same('http://localhost:5173', $r->header('Access-Control-Allow-Origin'), 'ACAO echoes origin');
});
Harness::test('supports allowed-origin preflight and rejects other methods', function (): void {
    $t = accepting();
    $options = endpoint(null, $t)->handle(new HttpRequest('OPTIONS', ['origin' => 'https://fresh-tech.uk'], null, '203.0.113.10', 'fresh-tech.uk'));
    Harness::same(204, $options->status, 'options status');
    Harness::same(null, $options->body, 'options body');
    Harness::same('https://fresh-tech.uk', $options->header('Access-Control-Allow-Origin'), 'ACAO');
    $get = endpoint(null, $t)->handle(new HttpRequest('GET', [], null, '203.0.113.10', 'fresh-tech.uk'));
    Harness::same(405, $get->status, 'get status');
    Harness::same('POST, OPTIONS', $get->header('Allow'), 'allow');
    Harness::same([], $t->calls, 'no upstream call');
});
Harness::test('fails safely when the service is unconfigured', function (): void {
    $t = accepting();
    Harness::same(503, post(request(), $t, config(['SMTP2GO_API_KEY' => '']))->status, 'status');
    Harness::same([], $t->calls, 'no upstream call');
});
Harness::test('keeps recipient and sender fixed and accepts the existing payload', function (): void {
    $t = accepting();
    $r = post(request(\array_merge(VALID, ['name' => ' Example Visitor ', 'to' => ['attacker@example.com'], 'sender' => 'attacker@example.com', 'companySize' => '10', 'painPoint' => 'Security'])), $t);
    Harness::same(200, $r->status, 'status');
    Harness::same(true, \json_decode((string) $r->body, true)['success'] ?? null, 'success flag');
    Harness::same(1, \count($t->calls), 'one upstream call');
    Harness::same(ContactEndpoint::UPSTREAM_URL, $t->calls[0]['url'], 'url');
    Harness::same(10, $t->calls[0]['timeout'], 'timeout');
    $sent = \json_decode($t->calls[0]['json'], true);
    Harness::same(['hello@fresh-tech.uk'], $sent['to'], 'to');
    Harness::same('website@fresh-tech.uk', $sent['sender'], 'sender');
    Harness::same('synthetic-test-key', $sent['api_key'], 'api key');
    Harness::same('New Lead: Example Visitor', $sent['subject'], 'subject');
    Harness::same("Name: Example Visitor\nEmail: visitor@example.com\nCompany size: 10\nMain concern: Security\n\nMessage:\n" . VALID['message'], $sent['text_body'], 'text body');
    Harness::same(false, $sent['fastaccept'], 'fastaccept');
});

echo "\nupstream\n";
$rejected = [
    '{"data":{"succeeded":0,"failed":1,"failures":["private provider detail"]}}',
    '{"data":{"succeeded":1,"failed":0,"failures":[],"error":"private provider detail"}}',
    '{"data":{"succeeded":1,"failed":0,"failures":[],"error_code":"E_PRIVATE"}}',
    '{"error":"private provider detail","data":{"succeeded":1,"failed":0,"failures":[]}}',
    '{"data":{"succeeded":1,"failed":0,"failures":["failed"]}}',
    '{"data":{"succeeded":1,"failed":0,"failures":{}}}',
    '{"data":{"succeeded":"1","failed":0,"failures":[]}}',
    '{"data":{"succeeded":1,"failed":0}}',
    '{}', 'null', '[]', '',
];
foreach ($rejected as $payload) {
    Harness::test('does not report success for HTTP 200 with payload ' . \var_export($payload, true), function () use ($payload): void {
        $r = post(request(), new FakeTransport(200, $payload));
        Harness::same(502, $r->status, 'status');
        Harness::assert(!\str_contains((string) $r->body, 'private provider detail'), 'leaked provider detail');
    });
}
Harness::test('fails on upstream HTTP errors even with a success-shaped payload', function (): void {
    Harness::same(502, post(request(), new FakeTransport(500, accepting()->body))->status, '500');
    Harness::same(502, post(request(), new FakeTransport(302, accepting()->body))->status, '302');
});
Harness::test('handles upstream invalid JSON, timeout and missing transport without leaking details', function (): void {
    $r = post(request(), new FakeTransport(200, 'private provider detail'));
    Harness::same(502, $r->status, 'invalid json');
    Harness::assert(!\str_contains((string) $r->body, 'private provider detail'), 'leaked');
    $r = post(request(), new FakeTransport(0, '', new TransportFailure('private provider detail')));
    Harness::same(502, $r->status, 'timeout');
    Harness::assert(!\str_contains((string) $r->body, 'private provider detail'), 'leaked');
    $r = post(request(), new FakeTransport(0, '', new TransportUnavailable('no curl')));
    Harness::same(503, $r->status, 'transport unavailable');
});
Harness::test('production cURL options configure without execution or PHP 8.5 deprecations', function (): void {
    if (!\function_exists('curl_init')) {
        echo "      (skipped: cURL extension unavailable)\n";
        return;
    }
    $previous = \set_error_handler(static function (int $severity, string $message): never {
        throw new \ErrorException($message, 0, $severity);
    }, \E_ALL);
    try {
        $transport = new CurlTransport(static function (\CurlHandle $handle): string {
            Harness::same(ContactEndpoint::UPSTREAM_URL, \curl_getinfo($handle, \CURLINFO_EFFECTIVE_URL), 'configured URL');
            return '{}';
        });
        $response = $transport->postJson(ContactEndpoint::UPSTREAM_URL, '{}', 10);
        Harness::same(0, $response['status'], 'no request was executed');
        Harness::same('{}', $response['body'], 'synthetic executor response');
    } finally {
        \restore_error_handler();
    }
});

echo "\nrate limit\n";
Harness::test('sixth request within 60s returns 429 with Retry-After, then resets', function (): void {
    $t = accepting();
    $e = endpoint(null, $t);
    for ($i = 0; $i < 5; $i++) {
        Harness::same(200, $e->handle(request())->status, "request $i");
        Harness::$now += 1.0;
    }
    $r = $e->handle(request());
    Harness::same(429, $r->status, 'sixth');
    Harness::same('55', $r->header('Retry-After'), 'retry after');
    Harness::same(5, \count($t->calls), 'limited request not forwarded');
    Harness::$now += 54.0;
    Harness::same(429, $e->handle(request())->status, 'still limited at 59s');
    Harness::$now += 1.5;
    Harness::same(200, $e->handle(request())->status, 'first stamp expired');
});
Harness::test('rate limit is keyed by client IP plus request host', function (): void {
    $e = endpoint();
    for ($i = 0; $i < 5; $i++) {
        Harness::same(200, $e->handle(request())->status, "request $i");
    }
    Harness::same(429, $e->handle(request())->status, 'same ip+host');
    Harness::same(200, $e->handle(request(VALID, [], 'POST', '203.0.113.11'))->status, 'other ip');
    Harness::same(200, $e->handle(request(VALID, [], 'POST', '203.0.113.10', 'www.fresh-tech.uk'))->status, 'other host');
    Harness::same(429, $e->handle(request(VALID, [], 'POST', '203.0.113.10', 'FRESH-TECH.UK'))->status, 'host is case-insensitive');
    Harness::same(503, $e->handle(request(VALID, [], 'POST', '203.0.113.10', 'untrusted.example'))->status, 'untrusted host fails closed');
    Harness::same(1, \count(\glob(Harness::$storeDir . '/*.json') ?: []) >= 3 ? 1 : 0, 'one hashed file per key');
});
Harness::test('limited and rejected requests also count (no bypass via invalid bodies)', function (): void {
    $e = endpoint();
    for ($i = 0; $i < 5; $i++) {
        Harness::same(400, $e->handle(request('{'))->status, "request $i");
    }
    Harness::same(429, $e->handle(request())->status, 'sixth');
});
Harness::test('spoofed X-Forwarded-For is ignored when REMOTE_ADDR is not a trusted proxy', function (): void {
    $e = endpoint();
    for ($i = 0; $i < 5; $i++) {
        Harness::same(200, $e->handle(request(VALID, ['x-forwarded-for' => "198.51.100.$i"]))->status, "request $i");
    }
    Harness::same(429, $e->handle(request(VALID, ['x-forwarded-for' => '198.51.100.99']))->status, 'sixth');
    Harness::same('203.0.113.10', ClientIp::resolve('203.0.113.10', '198.51.100.1', []), 'no proxies configured');
    Harness::same('203.0.113.10', ClientIp::resolve('203.0.113.10', '198.51.100.1', ['203.0.113.99']), 'not in list');
});
Harness::test('explicitly trusted proxy is honoured (right-most XFF entry only)', function (): void {
    $c = config(['CONTACT_TRUSTED_PROXIES' => '10.0.0.1, 2001:db8::1']);
    $e = endpoint($c);
    for ($i = 0; $i < 5; $i++) {
        Harness::same(200, $e->handle(request(VALID, ['x-forwarded-for' => '198.51.100.7'], 'POST', '10.0.0.1'))->status, "request $i");
    }
    Harness::same(429, $e->handle(request(VALID, ['x-forwarded-for' => '198.51.100.7'], 'POST', '10.0.0.1'))->status, 'sixth via proxy');
    Harness::same(200, $e->handle(request(VALID, ['x-forwarded-for' => '198.51.100.8'], 'POST', '10.0.0.1'))->status, 'different forwarded client');
    Harness::same('198.51.100.7', ClientIp::resolve('10.0.0.1', '1.2.3.4, 198.51.100.7', ['10.0.0.1']), 'right-most');
    Harness::same('198.51.100.7', ClientIp::resolve('2001:db8:0:0::1', '198.51.100.7', ['2001:db8::1']), 'ipv6 canonical proxy');
    Harness::same('10.0.0.1', ClientIp::resolve('10.0.0.1', 'garbage', ['10.0.0.1']), 'malformed collapses to proxy');
    Harness::same('10.0.0.1', ClientIp::resolve('10.0.0.1', '', ['10.0.0.1']), 'empty collapses to proxy');
    Harness::same(null, ClientIp::resolve('not-an-ip', '198.51.100.7', ['10.0.0.1']), 'invalid remote addr');
    Harness::same([], config(['CONTACT_TRUSTED_PROXIES' => '10.0.0.1, bogus'])->trustedProxies, 'malformed list disables trust');
});
Harness::test('unusable REMOTE_ADDR or host fails closed with 503', function (): void {
    $t = accepting();
    Harness::same(503, post(request(VALID, [], 'POST', null), $t)->status, 'no remote addr');
    Harness::same(503, post(request(VALID, [], 'POST', 'bad'), $t)->status, 'bad remote addr');
    Harness::same(503, post(request(VALID, [], 'POST', '203.0.113.10', ''), $t)->status, 'no host');
    Harness::same('', HttpRequest::normaliseHost("evil\r\nhost"), 'control chars in host');
    Harness::same('[::1]:8080', HttpRequest::normaliseHost('[::1]:8080'), 'ipv6 host');
    Harness::same([], $t->calls, 'no upstream call');
});
Harness::test('missing, inside-document-root or unusable store fails closed with 503', function (): void {
    $t = accepting();
    Harness::same(503, post(request(), $t, config(['CONTACT_RATE_LIMIT_DIR' => '']))->status, 'missing config');
    Harness::same(503, post(request(), $t, config(['CONTACT_RATE_LIMIT_DIR' => Harness::$tmp . '/does-not-exist']))->status, 'nonexistent dir');
    $inside = Harness::$docRoot . \DIRECTORY_SEPARATOR . 'rl';
    \mkdir($inside, 0700, true);
    Harness::same(503, post(request(), $t, config(['CONTACT_RATE_LIMIT_DIR' => $inside]))->status, 'inside document root');
    Harness::same(503, post(request(), $t, config(['CONTACT_RATE_LIMIT_DIR' => Harness::$docRoot . '/rl/../']))->status, 'inside via traversal');
    Harness::same(503, post(request(), $t, Config::fromEnvironment(['SMTP2GO_API_KEY' => 'k', 'CONTACT_RATE_LIMIT_DIR' => Harness::$storeDir], null))->status, 'unknown document root');
    $file = Harness::$tmp . '/not-a-dir';
    \file_put_contents($file, '');
    Harness::same(503, post(request(), $t, config(['CONTACT_RATE_LIMIT_DIR' => $file]))->status, 'file instead of dir');
    Harness::same([], $t->calls, 'no upstream call');
});
Harness::test('empty, corrupt or invalid existing state fails closed', function (): void {
    $key = '203.0.113.10|fresh-tech.uk';
    $path = Harness::$storeDir . '/' . \hash('sha256', $key) . '.json';
    foreach (['', '{not json', '{}', '["bad"]', '[' . (Harness::$now + 1) . ']'] as $state) {
        \file_put_contents($path, $state);
        Harness::same(503, post(request())->status, 'state ' . \var_export($state, true));
        Harness::same($state, \file_get_contents($path), 'state is not silently rewritten');
    }
});
Harness::test('concurrent processes agree on the limit (flock)', function (): void {
    if (!\function_exists('proc_open') || !\is_string(\PHP_BINARY) || \PHP_BINARY === '') {
        echo "      (skipped: proc_open or PHP_BINARY unavailable)\n";
        return;
    }
    $workers = 12;
    $procs = [];
    for ($i = 0; $i < $workers; $i++) {
        $cmd = [\PHP_BINARY, __DIR__ . '/hit-worker.php', Harness::$storeDir, Harness::$docRoot];
        $p = \proc_open($cmd, [1 => ['pipe', 'w'], 2 => ['pipe', 'w']], $pipes);
        Harness::assert(\is_resource($p), 'proc_open failed');
        $procs[] = [$p, $pipes];
    }
    $allowed = 0;
    $limited = 0;
    foreach ($procs as [$p, $pipes]) {
        $out = \trim((string) \stream_get_contents($pipes[1]));
        \fclose($pipes[1]);
        \fclose($pipes[2]);
        \proc_close($p);
        if ($out === 'allowed') {
            $allowed++;
        } elseif ($out === 'limited') {
            $limited++;
        }
    }
    Harness::same(5, $allowed, 'allowed');
    Harness::same($workers - 5, $limited, 'limited');
    $path = Harness::$storeDir . '/' . \hash('sha256', 'worker|fresh-tech.uk') . '.json';
    Harness::same(5, \count(\json_decode((string) \file_get_contents($path), true) ?: []), 'stamps persisted');
});

Harness::finish();

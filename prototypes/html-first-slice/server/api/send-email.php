<?php
declare(strict_types=1);

/*
 * Lead email endpoint for 20i (Apache + PHP 8.1+). Replaces
 * netlify/functions/send-email.js with the same request and response contract.
 *
 * Reached only through the .htaccess rewrite POST /api/send-email; direct
 * requests for /server/... are refused by that same file.
 *
 * Configuration lives outside public_html (see server/README.md). Message
 * contents and personal data are never logged, and upstream bodies or errors
 * are never echoed to the client.
 */

const SE_MAX_BODY_BYTES = 32 * 1024;
const SE_RATE_LIMIT = 5;
const SE_RATE_WINDOW_SECONDS = 60;
const SE_GLOBAL_WINDOW_SECONDS = 86400;
const SE_ALERT_RETRY_SECONDS = 3600;
const SE_CLIENT_IP_HEADERS = ['x-forwarded-for' => 'HTTP_X_FORWARDED_FOR', 'stackcdn-connecting-ip' => 'HTTP_STACKCDN_CONNECTING_IP'];
const SE_SMTP2GO_URL = 'https://api.smtp2go.com/v3/email/send';
const SE_CONFIG_PATH_LEVELS = 3; // public_html/server/api -> folder containing public_html
const SE_WS = '[\s\p{Z}\x{FEFF}]'; // JavaScript String.prototype.trim whitespace set
const SE_UNAVAILABLE = 'Email service unavailable. Please call us instead.';
const SE_TOO_MANY = 'Too many requests. Please try again shortly or call us.';

/** Load and validate the private configuration. Returns null (fail closed) on any problem. */
// Digits-only check without the optional ctype extension (absent under php -n
// and on some hosts); identical to ctype_digit() for strings.
function se_digits(string $value): bool { return preg_match('/^[0-9]+$/D', $value) === 1; }
function se_load_config(string $path, string $documentRoot): ?array
{
    if (!is_file($path) || !is_readable($path)) return null;
    $realConfig = realpath($path);
    $realRoot = $documentRoot !== '' ? realpath($documentRoot) : false;
    if ($realConfig === false) return null;
    if ($realRoot !== false && str_starts_with($realConfig, rtrim($realRoot, '/\\') . DIRECTORY_SEPARATOR)) return null;
    try {
        $config = (static fn (string $file) => require $file)($realConfig);
    } catch (Throwable) {
        return null;
    }
    return se_validate_config($config, $documentRoot);
}

function se_validate_config(mixed $config, string $documentRoot): ?array
{
    if (!is_array($config)) return null;
    $key = $config['smtp2go_api_key'] ?? null;
    $sender = $config['sender'] ?? null;
    $recipients = $config['recipients'] ?? null;
    $salt = $config['ip_hash_salt'] ?? null;
    $dir = $config['rate_limit_dir'] ?? null;
    $preview = $config['allow_preview_origin'] ?? false;
    $proxies = $config['trusted_proxies'] ?? [];
    $ipHeader = $config['client_ip_header'] ?? 'x-forwarded-for';
    $perIpDaily = $config['per_ip_daily_send_limit'] ?? 5;
    $dailyLimit = $config['global_daily_send_limit'] ?? 50;
    $maxFiles = $config['rate_limit_max_files'] ?? 10000;
    $placeholder = static fn ($v) => !is_string($v) || $v === '' || str_contains($v, 'REPLACE_ME');
    if ($placeholder($key) || !preg_match('/^[A-Za-z0-9_-]{10,200}$/', $key)) return null;
    if ($placeholder($sender) || !se_is_config_email($sender)) return null;
    if (!is_array($recipients) || $recipients === [] || count($recipients) > 5 || !array_is_list($recipients)) return null;
    foreach ($recipients as $recipient) {
        if ($placeholder($recipient) || !se_is_config_email($recipient)) return null;
    }
    if ($placeholder($salt) || strlen($salt) < 32) return null;
    if ($placeholder($dir) || !is_bool($preview)) return null;
    if (!is_array($proxies) || !array_is_list($proxies)) return null;
    foreach ($proxies as $cidr) {
        if (!is_string($cidr) || se_parse_cidr($cidr) === null) return null;
    }
    if (!is_string($ipHeader) || !array_key_exists($ipHeader, SE_CLIENT_IP_HEADERS)) return null;
    if (!is_int($dailyLimit) || $dailyLimit < 1 || !is_int($maxFiles) || $maxFiles < 10) return null;
    if (!is_int($perIpDaily) || $perIpDaily < 0) return null;
    $realDir = realpath($dir);
    if ($realDir === false || !is_dir($realDir) || !is_writable($realDir)) return null;
    $realRoot = $documentRoot !== '' ? realpath($documentRoot) : false;
    if ($realRoot !== false && ($realDir === $realRoot || str_starts_with($realDir, rtrim($realRoot, '/\\') . DIRECTORY_SEPARATOR))) return null;
    return [
        'smtp2go_api_key' => $key,
        'sender' => $sender,
        'recipients' => $recipients,
        'ip_hash_salt' => $salt,
        'rate_limit_dir' => $realDir,
        'allow_preview_origin' => $preview,
        'trusted_proxies' => $proxies,
        'client_ip_header' => $ipHeader,
        'global_daily_send_limit' => $dailyLimit,
        'per_ip_daily_send_limit' => $perIpDaily,
        'rate_limit_max_files' => $maxFiles,
    ];
}

function se_is_config_email(string $value): bool
{
    return filter_var($value, FILTER_VALIDATE_EMAIL) !== false && !preg_match('/[\r\n]/', $value);
}

/** Binary address, with IPv4-mapped IPv6 (::ffff:a.b.c.d) reduced to its 4-byte IPv4 form. */
function se_pack_ip(string $ip): ?string
{
    $packed = @inet_pton(trim($ip));
    if ($packed === false) return null;
    if (strlen($packed) === 16 && str_starts_with($packed, str_repeat("\0", 10) . "\xff\xff")) {
        return substr($packed, 12);
    }
    return $packed;
}

/** Returns [networkBytes, prefixLength] or null for an invalid CIDR or bare address. */
function se_parse_cidr(string $cidr): ?array
{
    $parts = explode('/', $cidr);
    if (count($parts) > 2) return null;
    $packed = @inet_pton($parts[0]);
    if ($packed === false) return null;
    $bits = strlen($packed) * 8;
    if (count($parts) === 1) return [$packed, $bits];
    if (!se_digits($parts[1]) || (int) $parts[1] > $bits) return null;
    return [$packed, (int) $parts[1]];
}

function se_ip_in_cidr(string $packed, string $cidr): bool
{
    $parsed = se_parse_cidr($cidr);
    if ($parsed === null) return false;
    [$network, $prefix] = $parsed;
    if (strlen($network) === 16 && strlen($packed) === 4 && str_starts_with($network, str_repeat("\0", 10) . "\xff\xff")) {
        $network = substr($network, 12);
        $prefix = max(0, $prefix - 96);
    }
    if (strlen($network) !== strlen($packed)) return false;
    $bytes = intdiv($prefix, 8);
    if (substr($network, 0, $bytes) !== substr($packed, 0, $bytes)) return false;
    $rest = $prefix % 8;
    if ($rest === 0) return true;
    $mask = (0xff << (8 - $rest)) & 0xff;
    return (ord($network[$bytes]) & $mask) === (ord($packed[$bytes]) & $mask);
}

/**
 * Client address used for rate limiting. Forwarding headers are spoofable, so
 * one is read only when REMOTE_ADDR is a configured trusted proxy. For
 * X-Forwarded-For only the right-most address that is not itself a trusted
 * proxy is used. StackCDN-Connecting-IP holds a single address, which StackCDN
 * overwrites on every request.
 */
function se_client_ip(array $server, array $trustedProxies, string $header = 'x-forwarded-for'): ?string
{
    $isTrusted = static function (string $packed) use ($trustedProxies): bool {
        foreach ($trustedProxies as $cidr) {
            if (se_ip_in_cidr($packed, $cidr)) return true;
        }
        return false;
    };
    $remote = se_pack_ip((string) ($server['REMOTE_ADDR'] ?? ''));
    if ($remote === null || $trustedProxies === [] || !$isTrusted($remote)) return $remote;
    if ($header === 'stackcdn-connecting-ip') {
        $client = se_pack_ip((string) ($server['HTTP_STACKCDN_CONNECTING_IP'] ?? ''));
        return $client === null || $isTrusted($client) ? $remote : $client;
    }
    $chain = explode(',', (string) ($server['HTTP_X_FORWARDED_FOR'] ?? ''));
    for ($i = count($chain) - 1; $i >= 0; $i--) {
        $hop = se_pack_ip($chain[$i]);
        if ($hop === null) return $remote; // malformed hop: fall back to the proxy's shared bucket
        if (!$isTrusted($hop)) return $hop;
    }
    return $remote;
}

/** Number of UTF-16 code units, matching JavaScript's String.length. */
function se_js_length(string $value): int
{
    return preg_match_all('/./su', $value) + preg_match_all('/[\x{10000}-\x{10FFFF}]/u', $value);
}

function se_js_trim(string $value): string
{
    return preg_replace('/^' . SE_WS . '+|' . SE_WS . '+$/u', '', $value) ?? '';
}

/** Mirror of boundedText() in the Netlify function, plus Unicode line separators in single-line fields. */
function se_bounded_text(mixed $value, int $max, bool $required = false, bool $singleLine = false): bool
{
    return is_string($value) && se_js_length($value) <= $max &&
        (!$required || se_js_trim($value) !== '') &&
        (!$singleLine || !preg_match('/[\x00-\x1f\x7f\x{85}\x{2028}\x{2029}]/u', $value));
}

/** Prefix every line of visitor free text so it cannot imitate system fields. */
function se_quote_block(string $value): string
{
    $lines = preg_split('/\r\n|[\n\v\f\r\x{85}\x{2028}\x{2029}]/u', se_js_trim($value)) ?: [''];
    return implode("\n", array_map(static fn (string $line) => '| ' . $line, $lines));
}

/** Run $fn with an exclusive lock on $file. Returns null if the file cannot be opened or locked. */
function se_with_locked_json(string $file, callable $fn): mixed
{
    $handle = @fopen($file, 'c+');
    if ($handle === false) return null;
    try {
        if (!flock($handle, LOCK_EX)) return null;
        $stored = json_decode((string) stream_get_contents($handle), true);
        [$result, $next] = $fn(is_array($stored) ? $stored : []);
        ftruncate($handle, 0);
        rewind($handle);
        fwrite($handle, json_encode($next));
        fflush($handle);
        flock($handle, LOCK_UN);
        return $result;
    } finally {
        fclose($handle);
    }
}

function se_sweep_rate_files(string $dir, float $now, string $prefix = 'rl-', int $window = SE_RATE_WINDOW_SECONDS): void
{
    foreach (glob($dir . DIRECTORY_SEPARATOR . $prefix . '*') ?: [] as $old) {
        $mtime = @filemtime($old);
        if ($mtime !== false && $mtime < $now - $window * 2) @unlink($old);
    }
}

/**
 * Per-IP limiter stored as one small file per hashed client address. flock()
 * serialises concurrent PHP workers; old timestamps are pruned on each hit and
 * stale files are swept regularly. Raw addresses are never written. IPv6
 * clients share a /64 bucket. New bucket files are refused once the directory
 * holds rate_limit_max_files entries. The same store, with the "rd-" prefix
 * and a 24-hour window, backs the optional per_ip_daily_send_limit.
 * Returns 0 when allowed, -1 if the store is unusable (fail closed), otherwise
 * the seconds until a slot frees.
 */
function se_rate_limit(?string $packed, array $config, float $now, ?int $sweepRoll = null, string $prefix = 'rl-', int $limit = SE_RATE_LIMIT, int $window = SE_RATE_WINDOW_SECONDS): int
{
    $dir = $config['rate_limit_dir'];
    if ($packed === null) $packed = 'invalid'; // share one bucket rather than fail open
    elseif (strlen($packed) === 16) $packed = substr($packed, 0, 8);
    $file = $dir . DIRECTORY_SEPARATOR . $prefix . hash_hmac('sha256', $packed, $config['ip_hash_salt']);

    if (($sweepRoll ?? random_int(1, 20)) === 1) se_sweep_rate_files($dir, $now, $prefix, $window);
    if (!is_file($file)) {
        $files = glob($dir . DIRECTORY_SEPARATOR . $prefix . '*', GLOB_NOSORT) ?: [];
        if (count($files) >= $config['rate_limit_max_files']) {
            se_sweep_rate_files($dir, $now, $prefix, $window);
            $files = glob($dir . DIRECTORY_SEPARATOR . $prefix . '*', GLOB_NOSORT) ?: [];
            if (count($files) >= $config['rate_limit_max_files']) return SE_RATE_WINDOW_SECONDS;
        }
    }

    $result = se_with_locked_json($file, static function (array $stored) use ($now, $limit, $window): array {
        $hits = array_values(array_filter($stored, static fn ($t) => (is_float($t) || is_int($t)) && $t > $now - $window && $t <= $now));
        if (count($hits) >= $limit) {
            return [max(1, (int) ceil(min($hits) + $window - $now)), $hits];
        }
        $hits[] = $now;
        return [0, $hits];
    });
    return $result ?? -1;
}

/**
 * Site-wide backstop on successful sends in 24 hours. A slot is reserved before
 * sending and released if the send fails, so concurrent requests cannot overshoot.
 * Returns a reservation id, false when the cap is reached, or null if the store is unusable.
 */
function se_global_reserve(array $config, float $now): string|false|null
{
    $id = bin2hex(random_bytes(8));
    return se_with_locked_json($config['rate_limit_dir'] . DIRECTORY_SEPARATOR . 'global-sends', static function (array $stored) use ($config, $now, $id): array {
        $live = array_filter($stored, static fn ($t) => (is_float($t) || is_int($t)) && $t > $now - SE_GLOBAL_WINDOW_SECONDS && $t <= $now);
        if (count($live) >= $config['global_daily_send_limit']) return [false, $live];
        $live[$id] = $now;
        return [$id, $live];
    });
}

function se_global_release(array $config, string $id): void
{
    se_with_locked_json($config['rate_limit_dir'] . DIRECTORY_SEPARATOR . 'global-sends', static function (array $stored) use ($id): array {
        unset($stored[$id]);
        return [true, $stored];
    });
}

/**
 * One notification to the configured recipients when the site-wide cap first
 * refuses a visitor, then at most once per 24 hours (an hour after a failed
 * attempt). It carries no visitor data and does not use a cap slot.
 */
function se_cap_alert(array $config, callable $transport, float $now): void
{
    $file = $config['rate_limit_dir'] . DIRECTORY_SEPARATOR . 'global-alert';
    $due = se_with_locked_json($file, static function (array $stored) use ($now): array {
        $last = $stored['attempted_at'] ?? null;
        if ((is_float($last) || is_int($last)) && $last > $now - SE_GLOBAL_WINDOW_SECONDS && $last <= $now) return [false, $stored];
        return [true, ['attempted_at' => $now]];
    });
    if ($due !== true) return;
    $sends = se_with_locked_json($config['rate_limit_dir'] . DIRECTORY_SEPARATOR . 'global-sends', static fn (array $stored): array => [$stored, $stored]);
    $live = array_filter(is_array($sends) ? $sends : [], static fn ($t) => (is_float($t) || is_int($t)) && $t > $now - SE_GLOBAL_WINDOW_SECONDS && $t <= $now);
    $reopens = $live === [] ? $now : min($live) + SE_GLOBAL_WINDOW_SECONDS;
    $payload = [
        'to' => $config['recipients'],
        'sender' => $config['sender'],
        'subject' => 'Website contact form paused: daily send limit reached',
        'text_body' => implode("\n", [
            'The website contact form reached its limit of ' . $config['global_daily_send_limit'] . ' accepted messages in 24 hours at ' . gmdate('Y-m-d H:i', (int) $now) . ' UTC.',
            'Visitors are now told the email service is unavailable and asked to call. The next slot frees at about ' . gmdate('Y-m-d H:i', (int) $reopens) . ' UTC.',
            '',
            'Check the leads inbox for a burst of junk enquiries. No visitor details are included here, and this notice is sent at most once a day.',
        ]),
        'fastaccept' => false,
    ];
    try {
        $accepted = se_upstream_accepted($transport($payload, $config['smtp2go_api_key']), count($config['recipients']));
    } catch (Throwable) {
        $accepted = false;
    }
    if (!$accepted) {
        se_with_locked_json($file, static fn (array $stored): array => [true, ['attempted_at' => $now - SE_GLOBAL_WINDOW_SECONDS + SE_ALERT_RETRY_SECONDS]]);
    }
}

/** Real transport: SMTP2GO over HTTPS with verification on. Returns [httpStatus, decodedBody|null] or null. */
function se_smtp2go_transport(array $payload, string $apiKey): ?array
{
    $curl = curl_init(SE_SMTP2GO_URL);
    if ($curl === false) return null;
    $options = [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE),
        CURLOPT_HTTPHEADER => ['Content-Type: application/json', 'Accept: application/json', 'X-Smtp2go-Api-Key: ' . $apiKey],
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_SSL_VERIFYHOST => 2,
        CURLOPT_FOLLOWLOCATION => false,
        CURLOPT_CONNECTTIMEOUT => 5,
        CURLOPT_TIMEOUT => 10,
    ];
    if (defined('CURLOPT_PROTOCOLS_STR')) $options[CURLOPT_PROTOCOLS_STR] = 'https';
    else $options[CURLOPT_PROTOCOLS] = CURLPROTO_HTTPS;
    curl_setopt_array($curl, $options);
    $body = curl_exec($curl);
    $status = (int) curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
    if (PHP_VERSION_ID < 80500) curl_close($curl);
    if (!is_string($body)) return null;
    $decoded = json_decode($body, true);
    return [$status, is_array($decoded) ? $decoded : null];
}

function se_upstream_accepted(mixed $result, int $recipientCount): bool
{
    if (!is_array($result) || count($result) !== 2) return false;
    [$status, $body] = $result;
    // SMTP2GO can return HTTP 200 for failed sends. Acceptance is not delivery.
    $data = is_array($body) ? ($body['data'] ?? null) : null;
    return is_int($status) && $status >= 200 && $status <= 299 && is_array($data) && !isset($body['error']) &&
        !isset($data['error']) && !isset($data['error_code']) &&
        ($data['succeeded'] ?? null) === $recipientCount && ($data['failed'] ?? null) === 0 &&
        ($data['failures'] ?? null) === [];
}

/**
 * Pure request handler. $server is a $_SERVER-shaped array, $readBody(int $max)
 * returns up to $max bytes of the request body, $transport is
 * se_smtp2go_transport or a test stub. Returns [status, headers, body|null].
 */
function se_handle(array $server, callable $readBody, ?array $config, callable $transport, float $now): array
{
    $headers = ['Content-Type' => 'application/json', 'Cache-Control' => 'no-store', 'Vary' => 'Origin', 'X-Content-Type-Options' => 'nosniff'];
    $reply = static function (int $status, ?array $body, array $extra = []) use (&$headers): array {
        return [$status, $headers + $extra, $body === null ? null : json_encode($body)];
    };

    if ($config === null) return $reply(503, ['error' => SE_UNAVAILABLE]);

    // Exact-origin allowlist. Browsers always send Origin on fetch() POSTs, so a
    // missing Origin is refused too (stricter than the Netlify function).
    $allowed = ['https://fresh-tech.uk', 'https://www.fresh-tech.uk'];
    if ($config['allow_preview_origin']) $allowed[] = 'https://preview.fresh-tech.uk';
    $origin = $server['HTTP_ORIGIN'] ?? null;
    if (!is_string($origin) || !in_array($origin, $allowed, true)) {
        return $reply(403, ['error' => 'Origin not allowed']);
    }
    $headers['Access-Control-Allow-Origin'] = $origin;
    $headers['Access-Control-Allow-Headers'] = 'Content-Type';
    $headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS';

    $method = $server['REQUEST_METHOD'] ?? '';
    if ($method === 'OPTIONS') return $reply(204, null);
    if ($method !== 'POST') return $reply(405, ['error' => 'Method not allowed'], ['Allow' => 'POST, OPTIONS']);

    $type = strtolower(trim(explode(';', (string) ($server['CONTENT_TYPE'] ?? $server['HTTP_CONTENT_TYPE'] ?? ''))[0]));
    if ($type !== 'application/json') return $reply(415, ['error' => 'Content-Type must be application/json']);

    $declared = $server['CONTENT_LENGTH'] ?? '';
    if ($declared !== '' && (!se_digits((string) $declared) || (int) $declared > SE_MAX_BODY_BYTES)) {
        return $reply(413, ['error' => 'Request too large']);
    }
    $raw = $readBody(SE_MAX_BODY_BYTES + 1);
    if (!is_string($raw)) return $reply(400, ['error' => 'Invalid JSON body']);
    if (strlen($raw) > SE_MAX_BODY_BYTES) return $reply(413, ['error' => 'Request too large']);
    if (!preg_match('//u', $raw)) return $reply(400, ['error' => 'Invalid JSON body']);
    try {
        $input = json_decode($raw, false, 64, JSON_THROW_ON_ERROR);
    } catch (JsonException) {
        return $reply(400, ['error' => 'Invalid JSON body']);
    }
    if (!$input instanceof stdClass) return $reply(400, ['error' => 'Invalid form data']);

    $fields = get_object_vars($input);
    $known = ['name', 'email', 'message', 'phone', 'honeypot', 'companySize', 'painPoint'];
    if (array_diff(array_map('strval', array_keys($fields)), $known) !== []) {
        return $reply(400, ['error' => 'Invalid form data']);
    }
    $name = $fields['name'] ?? null;
    $email = $fields['email'] ?? null;
    $message = $fields['message'] ?? null;
    $phone = array_key_exists('phone', $fields) ? $fields['phone'] : '';
    $honeypot = array_key_exists('honeypot', $fields) ? $fields['honeypot'] : '';
    $companySize = array_key_exists('companySize', $fields) ? $fields['companySize'] : '';
    $painPoint = array_key_exists('painPoint', $fields) ? $fields['painPoint'] : '';

    if (!se_bounded_text($name, 120, true, true) || !se_bounded_text($email, 254, true, true) ||
        !se_bounded_text($message, 5000, true) || !se_bounded_text($phone, 50, false, true) ||
        !se_bounded_text($honeypot, 200) || !se_bounded_text($companySize, 100, false, true) ||
        !se_bounded_text($painPoint, 1000) ||
        !preg_match('/^[^\s\p{Z}\x{FEFF}@]+@[^\s\p{Z}\x{FEFF}@]+\.[^\s\p{Z}\x{FEFF}@]+$/u', se_js_trim($email))) {
        return $reply(400, ['error' => 'Please check the name, email, phone and message fields']);
    }

    // Only well-formed, same-origin submissions count towards the limits, so
    // junk requests cannot fill the store or lock genuine visitors out.
    $client = se_client_ip($server, $config['trusted_proxies'], $config['client_ip_header']);
    $retryAfter = se_rate_limit($client, $config, $now);
    if ($retryAfter === 0 && $config['per_ip_daily_send_limit'] > 0) {
        $retryAfter = se_rate_limit($client, $config, $now, null, 'rd-', $config['per_ip_daily_send_limit'], SE_GLOBAL_WINDOW_SECONDS);
    }
    if ($retryAfter < 0) return $reply(503, ['error' => SE_UNAVAILABLE]);
    if ($retryAfter > 0) return $reply(429, ['error' => SE_TOO_MANY], ['Retry-After' => (string) $retryAfter]);

    if (se_js_trim($honeypot) !== '') return $reply(400, ['error' => 'Invalid form submission']);

    $lines = ['Website enquiry. Lines beginning "| " were typed by the visitor.', '', 'Name: ' . se_js_trim($name), 'Email: ' . se_js_trim($email)];
    if (se_js_trim($phone) !== '') $lines[] = 'Phone: ' . se_js_trim($phone);
    if (se_js_trim($companySize) !== '') $lines[] = 'Company size: ' . se_js_trim($companySize);
    if (se_js_trim($painPoint) !== '') array_push($lines, 'Main concern:', se_quote_block($painPoint));
    array_push($lines, '', 'Message:', se_quote_block($message));
    $payload = [
        'to' => $config['recipients'],
        'sender' => $config['sender'],
        'subject' => 'New Lead: ' . se_js_trim($name),
        'text_body' => implode("\n", $lines),
        'fastaccept' => false,
    ];

    $reservation = se_global_reserve($config, $now);
    if ($reservation === null) return $reply(503, ['error' => SE_UNAVAILABLE]);
    if ($reservation === false) {
        se_cap_alert($config, $transport, $now);
        return $reply(503, ['error' => SE_UNAVAILABLE]);
    }

    try {
        $result = $transport($payload, $config['smtp2go_api_key']);
    } catch (Throwable) {
        $result = null;
    }
    if (!se_upstream_accepted($result, count($config['recipients']))) {
        se_global_release($config, $reservation);
        return $reply(502, ['error' => $result === null ? SE_UNAVAILABLE : 'Failed to send email. Please call us instead.']);
    }
    return $reply(200, ['success' => true, 'message' => 'Message accepted for sending']);
}

function se_main(): void
{
    ini_set('display_errors', '0');
    header_remove('X-Powered-By');
    try {
        $documentRoot = (string) ($_SERVER['DOCUMENT_ROOT'] ?? '');
        $config = se_load_config(dirname(__DIR__, SE_CONFIG_PATH_LEVELS) . '/private/send-email-config.php', $documentRoot);
        $readBody = static function (int $max): ?string {
            $body = file_get_contents('php://input', false, null, 0, $max);
            return $body === false ? null : $body;
        };
        [$status, $headers, $body] = se_handle($_SERVER, $readBody, $config, 'se_smtp2go_transport', microtime(true));
    } catch (Throwable) {
        [$status, $headers, $body] = [500, ['Content-Type' => 'application/json', 'Cache-Control' => 'no-store'], json_encode(['error' => SE_UNAVAILABLE])];
    }
    http_response_code($status);
    foreach ($headers as $name => $value) header($name . ': ' . $value);
    if ($body !== null) echo $body;
}

if (!defined('SEND_EMAIL_NO_MAIN')) se_main();

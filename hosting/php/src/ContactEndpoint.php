<?php

declare(strict_types=1);

namespace FreshTech\Contact;

/**
 * Port of netlify/functions/send-email.js. Pipeline order:
 * origin -> OPTIONS -> method -> rate limit -> content type -> body size -> JSON ->
 * fields -> honeypot -> API key -> upstream -> strict acceptance check.
 */
final class ContactEndpoint
{
    public const MAX_BODY_BYTES = 32 * 1024;
    public const UPSTREAM_URL = 'https://api.smtp2go.com/v3/email/send';
    public const UPSTREAM_TIMEOUT_SECONDS = 10;
    public const RECIPIENT = 'hello@fresh-tech.uk';
    public const SENDER = 'website@fresh-tech.uk';

    private const CONTROL_CHARS = '/[\x00-\x1f\x7f]/';
    // JS String.prototype.trim also strips Unicode spaces and BOM; PHP trim() does not.
    private const TRIM = '/^[\s\pZ\x{feff}]+|[\s\pZ\x{feff}]+\z/u';
    private const EMAIL = '/^[^\s@\pZ]+@[^\s@\pZ]+\.[^\s@\pZ]+\z/u';

    public function __construct(
        private readonly Config $config,
        private readonly Transport $transport,
        private readonly RateLimiter $rateLimiter,
    ) {
    }

    public function handle(HttpRequest $request): HttpResponse
    {
        $headers = [
            'Content-Type' => 'application/json',
            'Cache-Control' => 'no-store',
            'Vary' => 'Origin',
        ];
        $origin = $request->header('origin');
        $originAllowed = $origin !== null && \in_array($origin, $this->config->allowedOrigins, true);
        if ($originAllowed) {
            $headers['Access-Control-Allow-Origin'] = $origin;
            $headers['Access-Control-Allow-Headers'] = 'Content-Type';
            $headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS';
        }
        $reply = static fn (int $status, string $error): HttpResponse => HttpResponse::json($status, ['error' => $error], $headers);

        if ($origin !== null && !$originAllowed) {
            return $reply(403, 'Origin not allowed');
        }
        if ($request->method === 'OPTIONS') {
            return new HttpResponse(204, $headers, null);
        }
        if ($request->method !== 'POST') {
            $headers['Allow'] = 'POST, OPTIONS';
            return HttpResponse::json(405, ['error' => 'Method not allowed'], $headers);
        }

        // Rate limit: equivalent of Netlify's per-IP-per-domain platform rule. Fails closed.
        $ip = ClientIp::resolve($request->remoteAddr, $request->header('x-forwarded-for'), $this->config->trustedProxies);
        if ($ip === null || $request->host === '' || !\in_array($request->host, $this->config->allowedHosts, true)) {
            return $reply(503, 'Service unavailable. Please call us instead.');
        }
        try {
            $retryAfter = $this->rateLimiter->hit($ip . '|' . $request->host);
        } catch (RateLimitStoreUnusable) {
            return $reply(503, 'Service unavailable. Please call us instead.');
        }
        if ($retryAfter !== null) {
            $headers['Retry-After'] = (string) $retryAfter;
            return HttpResponse::json(429, ['error' => 'Too many requests. Please try again later.'], $headers);
        }

        $contentType = \strtolower(\trim(\explode(';', $request->header('content-type') ?? '')[0]));
        if ($contentType !== 'application/json') {
            return $reply(415, 'Content-Type must be application/json');
        }

        $declared = $request->header('content-length');
        if ($declared !== null && \is_numeric($declared) && (float) $declared > self::MAX_BODY_BYTES) {
            return $reply(413, 'Request too large');
        }
        $body = $request->readBody(self::MAX_BODY_BYTES);
        if ($body === null) {
            return $reply(413, 'Request too large');
        }
        if (\preg_match('//u', $body) !== 1) {
            return $reply(400, 'Invalid JSON body');
        }
        $input = \json_decode($body, false, 64);
        if (\json_last_error() !== \JSON_ERROR_NONE) {
            return $reply(400, 'Invalid JSON body');
        }
        if (!$input instanceof \stdClass) {
            return $reply(400, 'Invalid form data');
        }

        // Only these seven names are read. Unknown fields (e.g. "to", "sender") are ignored.
        $name = $input->name ?? null;
        $email = $input->email ?? null;
        $message = $input->message ?? null;
        $phone = \property_exists($input, 'phone') ? $input->phone : '';
        $honeypot = \property_exists($input, 'honeypot') ? $input->honeypot : '';
        $companySize = \property_exists($input, 'companySize') ? $input->companySize : '';
        $painPoint = \property_exists($input, 'painPoint') ? $input->painPoint : '';

        if (!self::boundedText($name, 120, true, true) || !self::boundedText($email, 254, true, true)
            || !self::boundedText($message, 5000, true) || !self::boundedText($phone, 50, false, true)
            || !self::boundedText($honeypot, 200) || !self::boundedText($companySize, 100, false, true)
            || !self::boundedText($painPoint, 1000)
            || \preg_match(self::EMAIL, self::trim($email)) !== 1) {
            return $reply(400, 'Please check the name, email, phone and message fields');
        }
        if (self::trim($honeypot) !== '') {
            return $reply(400, 'Invalid form submission');
        }

        if ($this->config->apiKey === '') {
            return $reply(503, 'Email service unavailable. Please call us instead.');
        }

        $phoneInfo = self::trim($phone) !== '' ? "\nPhone: " . self::trim($phone) : '';
        $contextInfo = (self::trim($companySize) !== '' ? "\nCompany size: " . self::trim($companySize) : '')
            . (self::trim($painPoint) !== '' ? "\nMain concern: " . self::trim($painPoint) : '');
        $payload = \json_encode([
            'api_key' => $this->config->apiKey,
            'to' => [self::RECIPIENT],
            'sender' => self::SENDER,
            'subject' => 'New Lead: ' . self::trim($name),
            'text_body' => 'Name: ' . self::trim($name) . "\nEmail: " . self::trim($email) . $phoneInfo . $contextInfo
                . "\n\nMessage:\n" . self::trim($message),
            'fastaccept' => false,
        ], \JSON_UNESCAPED_SLASHES | \JSON_UNESCAPED_UNICODE);
        if ($payload === false) {
            return $reply(502, 'Email service unavailable. Please call us instead.');
        }

        try {
            $upstream = $this->transport->postJson(self::UPSTREAM_URL, $payload, self::UPSTREAM_TIMEOUT_SECONDS);
        } catch (TransportUnavailable) {
            return $reply(503, 'Email service unavailable. Please call us instead.');
        } catch (\Throwable) {
            // Covers TransportFailure and anything unexpected. Never surface upstream details.
            return $reply(502, 'Email service unavailable. Please call us instead.');
        }

        if (!self::accepted($upstream['status'], $upstream['body'])) {
            return $reply(502, 'Failed to send email. Please call us instead.');
        }
        return HttpResponse::json(200, ['success' => true, 'message' => 'Message accepted for sending'], $headers);
    }

    /**
     * Strict SMTP2GO acceptance: HTTP 2xx, JSON object, no error/error_code anywhere,
     * data.succeeded === 1, data.failed === 0, data.failures === []. Acceptance is not delivery.
     */
    public static function accepted(int $status, string $body): bool
    {
        if ($status < 200 || $status > 299) {
            return false;
        }
        $result = \json_decode($body, false, 64);
        if (\json_last_error() !== \JSON_ERROR_NONE || !$result instanceof \stdClass) {
            return false;
        }
        if (self::truthy($result->error ?? null)) {
            return false;
        }
        $data = $result->data ?? null;
        if (!$data instanceof \stdClass) {
            return false;
        }
        if (self::truthy($data->error ?? null) || self::truthy($data->error_code ?? null)) {
            return false;
        }
        $succeeded = $data->succeeded ?? null;
        $failed = $data->failed ?? null;
        $failures = $data->failures ?? null;
        return self::isNumber($succeeded, 1) && self::isNumber($failed, 0)
            && \is_array($failures) && $failures === [];
    }

    private static function isNumber(mixed $value, int $expected): bool
    {
        return (\is_int($value) || \is_float($value)) && $value == $expected;
    }

    /** JavaScript truthiness for decoded JSON values. */
    private static function truthy(mixed $value): bool
    {
        return !($value === null || $value === false || $value === 0 || $value === 0.0 || $value === '');
    }

    private static function boundedText(mixed $value, int $max, bool $required = false, bool $singleLine = false): bool
    {
        if (!\is_string($value) || self::length($value) > $max) {
            return false;
        }
        if ($required && self::trim($value) === '') {
            return false;
        }
        return !$singleLine || \preg_match(self::CONTROL_CHARS, $value) !== 1;
    }

    /** Match JavaScript String.length by counting UTF-16 code units. */
    private static function length(string $value): int
    {
        $count = \preg_match_all('/./su', $value, $characters);
        if ($count === false) {
            return \PHP_INT_MAX;
        }
        $units = 0;
        foreach ($characters[0] as $character) {
            $units += \strlen($character) === 4 ? 2 : 1;
        }
        return $units;
    }

    private static function trim(string $value): string
    {
        return \preg_replace(self::TRIM, '', $value) ?? '';
    }
}

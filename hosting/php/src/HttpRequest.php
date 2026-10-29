<?php

declare(strict_types=1);

namespace FreshTech\Contact;

/**
 * Minimal request model so the endpoint can be driven from globals or from tests.
 */
final class HttpRequest
{
    /** @var array<string, string> lower-cased header names */
    private array $headers = [];
    public readonly string $host;

    /**
     * @param array<string, string> $headers
     * @param resource|string|null $body raw body stream or string; null means no body
     */
    public function __construct(
        public readonly string $method,
        array $headers,
        private mixed $body,
        public readonly ?string $remoteAddr,
        string $host,
    ) {
        foreach ($headers as $name => $value) {
            $this->headers[\strtolower((string) $name)] = (string) $value;
        }
        $this->host = self::normaliseHost($host);
    }

    public static function fromGlobals(): self
    {
        $server = $_SERVER;
        $headers = [];
        foreach ($server as $key => $value) {
            if (!\is_string($value)) {
                continue;
            }
            if (\str_starts_with($key, 'HTTP_')) {
                $headers[\str_replace('_', '-', \strtolower(\substr($key, 5)))] = $value;
            }
        }
        if (isset($server['CONTENT_TYPE']) && \is_string($server['CONTENT_TYPE'])) {
            $headers['content-type'] = $server['CONTENT_TYPE'];
        }
        if (isset($server['CONTENT_LENGTH']) && \is_string($server['CONTENT_LENGTH'])) {
            $headers['content-length'] = $server['CONTENT_LENGTH'];
        }

        $body = \fopen('php://input', 'rb');

        return new self(
            method: \strtoupper(\is_string($server['REQUEST_METHOD'] ?? null) ? $server['REQUEST_METHOD'] : ''),
            headers: $headers,
            body: $body === false ? null : $body,
            remoteAddr: \is_string($server['REMOTE_ADDR'] ?? null) ? $server['REMOTE_ADDR'] : null,
            host: self::normaliseHost($headers['host'] ?? ($server['SERVER_NAME'] ?? '')),
        );
    }

    /**
     * Lower-cases the request host. Returns '' when the value is not a plausible host,
     * which the endpoint treats as unusable (fail closed).
     */
    public static function normaliseHost(mixed $value): string
    {
        if (!\is_string($value)) {
            return '';
        }
        $host = \strtolower(\trim($value));
        if ($host === '' || \strlen($host) > 255) {
            return '';
        }
        $pattern = '/^(\[[0-9a-f:.]+\]|[a-z0-9]([a-z0-9.-]*[a-z0-9])?)(:\d{1,5})?$/';
        return \preg_match($pattern, $host) === 1 ? $host : '';
    }

    public function header(string $name): ?string
    {
        return $this->headers[\strtolower($name)] ?? null;
    }

    /**
     * Reads the body, capping the actual byte count. Returns null when the body exceeds $maxBytes.
     */
    public function readBody(int $maxBytes): ?string
    {
        if ($this->body === null) {
            return '';
        }
        if (\is_string($this->body)) {
            return \strlen($this->body) > $maxBytes ? null : $this->body;
        }
        $text = '';
        while (!\feof($this->body)) {
            $chunk = \fread($this->body, 8192);
            if ($chunk === false) {
                return null;
            }
            $text .= $chunk;
            if (\strlen($text) > $maxBytes) {
                return null;
            }
        }
        return $text;
    }
}

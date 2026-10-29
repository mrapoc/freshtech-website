<?php

declare(strict_types=1);

namespace FreshTech\Contact;

final class HttpResponse
{
    /**
     * @param array<string, string> $headers
     */
    public function __construct(
        public readonly int $status,
        public readonly array $headers,
        public readonly ?string $body,
    ) {
    }

    /**
     * @param array<string, mixed> $payload
     * @param array<string, string> $headers
     */
    public static function json(int $status, array $payload, array $headers): self
    {
        $body = \json_encode($payload, \JSON_UNESCAPED_SLASHES | \JSON_UNESCAPED_UNICODE);
        return new self($status, $headers, $body === false ? '{}' : $body);
    }

    public function header(string $name): ?string
    {
        foreach ($this->headers as $key => $value) {
            if (\strcasecmp($key, $name) === 0) {
                return $value;
            }
        }
        return null;
    }

    public function send(): void
    {
        \http_response_code($this->status);
        foreach ($this->headers as $name => $value) {
            \header($name . ': ' . $value, true);
        }
        if ($this->body !== null) {
            echo $this->body;
        }
    }
}

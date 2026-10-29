<?php

declare(strict_types=1);

namespace FreshTech\Contact;

/**
 * Production transport: PHP cURL over HTTPS only, with TLS verification on.
 */
final class CurlTransport implements Transport
{
    /** @var \Closure(\CurlHandle): string|bool */
    private \Closure $execute;

    /** @param null|\Closure(\CurlHandle): string|bool $execute test seam; production uses curl_exec */
    public function __construct(?\Closure $execute = null)
    {
        $this->execute = $execute ?? static fn (\CurlHandle $handle): string|bool => \curl_exec($handle);
    }

    public function postJson(string $url, string $json, int $timeoutSeconds): array
    {
        if (!\function_exists('curl_init')) {
            throw new TransportUnavailable('cURL extension not available');
        }
        $handle = \curl_init($url);
        if ($handle === false) {
            throw new TransportUnavailable('cURL init failed');
        }
        $ok = \curl_setopt_array($handle, [
            \CURLOPT_POST => true,
            \CURLOPT_POSTFIELDS => $json,
            \CURLOPT_HTTPHEADER => ['Content-Type: application/json', 'Accept: application/json'],
            \CURLOPT_RETURNTRANSFER => true,
            \CURLOPT_HEADER => false,
            \CURLOPT_FOLLOWLOCATION => false,
            \CURLOPT_CONNECTTIMEOUT => $timeoutSeconds,
            \CURLOPT_TIMEOUT => $timeoutSeconds,
            \CURLOPT_SSL_VERIFYPEER => true,
            \CURLOPT_SSL_VERIFYHOST => 2,
            \CURLOPT_PROTOCOLS => \CURLPROTO_HTTPS,
            \CURLOPT_REDIR_PROTOCOLS => \CURLPROTO_HTTPS,
        ]);
        if (!$ok) {
            throw new TransportUnavailable('cURL options rejected');
        }
        $body = ($this->execute)($handle);
        if (!\is_string($body)) {
            // Includes timeouts, DNS and TLS failures. Do not surface curl_error().
            throw new TransportFailure('upstream request failed');
        }
        $status = (int) \curl_getinfo($handle, \CURLINFO_RESPONSE_CODE);
        return ['status' => $status, 'body' => $body];
    }
}

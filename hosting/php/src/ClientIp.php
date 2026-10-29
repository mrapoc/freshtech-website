<?php

declare(strict_types=1);

namespace FreshTech\Contact;

/**
 * Client IP resolution. See README.md, "Client IP resolution".
 */
final class ClientIp
{
    /**
     * Returns the canonical client IP, or null when REMOTE_ADDR is unusable.
     *
     * @param list<string> $trustedProxies canonical IPs of immediate proxies allowed to set X-Forwarded-For
     */
    public static function resolve(?string $remoteAddr, ?string $forwardedFor, array $trustedProxies): ?string
    {
        $remote = $remoteAddr === null ? null : self::canonical($remoteAddr);
        if ($remote === null) {
            return null;
        }
        if ($trustedProxies === [] || !\in_array($remote, $trustedProxies, true)) {
            return $remote;
        }
        if ($forwardedFor === null) {
            return $remote;
        }
        // Only the immediate trusted proxy is believed, so only the value it appended
        // (the right-most entry) is used. Anything malformed collapses to the proxy address,
        // which is more restrictive, never more permissive.
        $parts = \explode(',', $forwardedFor);
        $candidate = \trim((string) \end($parts));
        if (\str_starts_with($candidate, '[') && \str_ends_with($candidate, ']')) {
            $candidate = \substr($candidate, 1, -1);
        }
        return self::canonical($candidate) ?? $remote;
    }

    /**
     * Validates an IPv4/IPv6 literal and returns its canonical textual form, or null.
     */
    public static function canonical(string $value): ?string
    {
        $value = \trim($value);
        if ($value === '' || \filter_var($value, \FILTER_VALIDATE_IP) === false) {
            return null;
        }
        $packed = \inet_pton($value);
        if ($packed === false) {
            return null;
        }
        $text = \inet_ntop($packed);
        return $text === false ? null : $text;
    }
}

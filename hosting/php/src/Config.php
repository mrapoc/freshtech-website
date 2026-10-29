<?php

declare(strict_types=1);

namespace FreshTech\Contact;

/**
 * Server-side configuration. See README.md for the environment variable contract.
 */
final class Config
{
    public const PRODUCTION_ORIGINS = ['https://fresh-tech.uk', 'https://www.fresh-tech.uk'];
    public const LOCAL_DEV_ORIGIN = 'http://localhost:5173';

    /**
     * @param list<string> $allowedOrigins
     * @param list<string> $allowedHosts canonical request hosts used in rate-limit keys
     * @param list<string> $trustedProxies canonical IP addresses; empty means trust no forwarding header
     */
    public function __construct(
        public readonly string $apiKey,
        public readonly array $allowedOrigins,
        public readonly array $allowedHosts,
        public readonly ?string $rateLimitDir,
        public readonly ?string $documentRoot,
        public readonly array $trustedProxies,
        public readonly int $rateLimitMax = 5,
        public readonly int $rateLimitWindow = 60,
    ) {
    }

    /**
     * @param array<string, mixed> $env raw environment values keyed by variable name
     */
    public static function fromEnvironment(array $env, ?string $documentRoot): self
    {
        $string = static fn (string $name): string => \is_string($env[$name] ?? null) ? $env[$name] : '';

        $origins = self::PRODUCTION_ORIGINS;
        foreach (self::splitList($string('CONTACT_EXTRA_ORIGINS')) as $origin) {
            if (self::isOrigin($origin) && !\in_array($origin, $origins, true)) {
                $origins[] = $origin;
            }
        }
        if ($string('CONTACT_ALLOW_LOCAL_DEV') === 'true') {
            $origins[] = self::LOCAL_DEV_ORIGIN;
        }
        $hosts = [];
        foreach ($origins as $origin) {
            $host = self::originHost($origin);
            if ($host !== null && !\in_array($host, $hosts, true)) {
                $hosts[] = $host;
            }
        }

        // A malformed proxy list disables forwarding-header trust entirely (fail safe).
        $proxies = [];
        foreach (self::splitList($string('CONTACT_TRUSTED_PROXIES')) as $entry) {
            $canonical = ClientIp::canonical($entry);
            if ($canonical === null) {
                $proxies = [];
                break;
            }
            $proxies[] = $canonical;
        }

        $dir = \trim($string('CONTACT_RATE_LIMIT_DIR'));

        return new self(
            apiKey: $string('SMTP2GO_API_KEY'),
            allowedOrigins: $origins,
            allowedHosts: $hosts,
            rateLimitDir: $dir === '' ? null : $dir,
            documentRoot: ($documentRoot === null || \trim($documentRoot) === '') ? null : $documentRoot,
            trustedProxies: $proxies,
        );
    }

    /** @return list<string> */
    private static function splitList(string $value): array
    {
        $items = [];
        foreach (\explode(',', $value) as $item) {
            $item = \trim($item);
            if ($item !== '') {
                $items[] = $item;
            }
        }
        return $items;
    }

    private static function isOrigin(string $value): bool
    {
        return self::originHost($value) !== null;
    }

    private static function originHost(string $origin): ?string
    {
        if (\preg_match('/^https?:\/\/[a-z0-9]([a-z0-9.-]*[a-z0-9])?(:\d{1,5})?$/', $origin) !== 1) {
            return null;
        }
        $parts = \parse_url($origin);
        if (!\is_array($parts) || !\is_string($parts['host'] ?? null)) {
            return null;
        }
        $port = $parts['port'] ?? null;
        if ($port !== null && (!\is_int($port) || $port < 1 || $port > 65535)) {
            return null;
        }
        return \strtolower($parts['host']) . ($port === null ? '' : ':' . $port);
    }
}

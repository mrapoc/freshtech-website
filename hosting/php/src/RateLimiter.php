<?php

declare(strict_types=1);

namespace FreshTech\Contact;

final class RateLimitStoreUnusable extends \RuntimeException
{
}

/**
 * Sliding-window limiter backed by one hashed file per key, guarded by flock(LOCK_EX).
 * Any storage problem throws RateLimitStoreUnusable so the caller fails closed.
 */
final class RateLimiter
{
    /** @var \Closure(): float */
    private \Closure $clock;

    /**
     * @param \Closure(): float $clock returns Unix seconds
     */
    public function __construct(
        private readonly ?string $dir,
        private readonly ?string $documentRoot,
        private readonly int $max,
        private readonly int $windowSeconds,
        \Closure $clock,
    ) {
        $this->clock = $clock;
    }

    /**
     * Records one request for $key. Returns null when allowed, or the Retry-After seconds when limited.
     */
    public function hit(string $key): ?int
    {
        $dir = $this->usableDirectory();
        $path = $dir . \DIRECTORY_SEPARATOR . \hash('sha256', $key) . '.json';

        $isNew = true;
        $handle = @\fopen($path, 'x+b');
        if ($handle === false) {
            $isNew = false;
            if (!\file_exists($path)) {
                throw new RateLimitStoreUnusable('cannot create state file');
            }
            $handle = @\fopen($path, 'c+b');
        }
        if ($handle === false) {
            throw new RateLimitStoreUnusable('cannot open state file');
        }
        try {
            if (!\flock($handle, \LOCK_EX)) {
                throw new RateLimitStoreUnusable('cannot lock state file');
            }
            @\chmod($path, 0600);
            try {
                $now = ($this->clock)();
                if (!\is_finite($now)) {
                    throw new RateLimitStoreUnusable('clock returned an invalid value');
                }
                $stamps = $this->readStamps($handle, $now, $isNew);

                $retryAfter = null;
                if (\count($stamps) >= $this->max) {
                    $retryAfter = \max(1, (int) \ceil(\min($stamps) + $this->windowSeconds - $now));
                } else {
                    $stamps[] = $now;
                }

                $encoded = \json_encode(\array_values($stamps));
                if ($encoded === false
                    || !\ftruncate($handle, 0)
                    || !\rewind($handle)
                    || \fwrite($handle, $encoded) !== \strlen($encoded)
                    || !\fflush($handle)) {
                    throw new RateLimitStoreUnusable('cannot write state file');
                }
                return $retryAfter;
            } finally {
                \flock($handle, \LOCK_UN);
            }
        } finally {
            \fclose($handle);
        }
    }

    /**
     * @param resource $handle
     * @return list<float>
     */
    private function readStamps($handle, float $now, bool $isNew): array
    {
        if (!\rewind($handle)) {
            throw new RateLimitStoreUnusable('cannot rewind state file');
        }
        $raw = \stream_get_contents($handle);
        if (!\is_string($raw)) {
            throw new RateLimitStoreUnusable('cannot read state file');
        }
        if ($raw === '') {
            if ($isNew) {
                return [];
            }
            throw new RateLimitStoreUnusable('existing state file is empty');
        }
        try {
            $decoded = \json_decode($raw, false, 64, \JSON_THROW_ON_ERROR);
        } catch (\JsonException) {
            throw new RateLimitStoreUnusable('state file contains invalid JSON');
        }
        if (!\is_array($decoded) || !\array_is_list($decoded)) {
            throw new RateLimitStoreUnusable('state file has an invalid shape');
        }
        $cutoff = $now - $this->windowSeconds;
        $stamps = [];
        foreach ($decoded as $value) {
            if (!(\is_int($value) || \is_float($value)) || !\is_finite((float) $value) || $value > $now) {
                throw new RateLimitStoreUnusable('state file contains an invalid timestamp');
            }
            if ($value > $cutoff) {
                $stamps[] = (float) $value;
            }
        }
        return $stamps;
    }

    private function usableDirectory(): string
    {
        if ($this->dir === null || $this->documentRoot === null) {
            throw new RateLimitStoreUnusable('rate limit directory or document root not configured');
        }
        $dir = \realpath($this->dir);
        $root = \realpath($this->documentRoot);
        if ($dir === false || $root === false || !\is_dir($dir) || !\is_writable($dir)) {
            throw new RateLimitStoreUnusable('rate limit directory unusable');
        }
        if (self::isWithin($dir, $root)) {
            throw new RateLimitStoreUnusable('rate limit directory is inside the document root');
        }
        return $dir;
    }

    private static function isWithin(string $path, string $root): bool
    {
        $root = \rtrim($root, '/\\');
        $caseInsensitive = \DIRECTORY_SEPARATOR === '\\';
        $compare = static fn (string $a, string $b): bool => $caseInsensitive ? \strcasecmp($a, $b) === 0 : $a === $b;
        if ($compare($path, $root)) {
            return true;
        }
        $prefix = $root . \DIRECTORY_SEPARATOR;
        return \strlen($path) > \strlen($prefix) && $compare(\substr($path, 0, \strlen($prefix)), $prefix);
    }
}

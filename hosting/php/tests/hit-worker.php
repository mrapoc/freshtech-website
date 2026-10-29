<?php

declare(strict_types=1);

// Child process for the concurrency test. Usage: php hit-worker.php <storeDir> <docRoot>
require __DIR__ . '/../src/bootstrap.php';

$limiter = new FreshTech\Contact\RateLimiter($argv[1], $argv[2], 5, 60, static fn (): float => 1_700_000_000.0);
try {
    echo $limiter->hit('worker|fresh-tech.uk') === null ? 'allowed' : 'limited';
} catch (Throwable) {
    echo 'error';
}

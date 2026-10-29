<?php

declare(strict_types=1);

/**
 * Handler entrypoint for the hosting-neutral POST /api/send-email route.
 * Routing/rewrite configuration is intentionally not included here.
 * Requires PHP >= 8.5 with ext-curl and ext-json. No Composer.
 */

use FreshTech\Contact\Config;
use FreshTech\Contact\ContactEndpoint;
use FreshTech\Contact\CurlTransport;
use FreshTech\Contact\HttpRequest;
use FreshTech\Contact\RateLimiter;

require __DIR__ . '/../src/bootstrap.php';

\ini_set('display_errors', '0');

// Apache SetEnv/FastCGI env values land in $_SERVER; CLI/system env in getenv().
$env = \array_merge(
    \array_filter($_SERVER, 'is_string'),
    \array_filter(\getenv(), 'is_string'),
);
$documentRoot = \is_string($_SERVER['DOCUMENT_ROOT'] ?? null) ? $_SERVER['DOCUMENT_ROOT'] : null;

$config = Config::fromEnvironment($env, $documentRoot);
$limiter = new RateLimiter(
    $config->rateLimitDir,
    $config->documentRoot,
    $config->rateLimitMax,
    $config->rateLimitWindow,
    static fn (): float => \microtime(true),
);

try {
    $response = (new ContactEndpoint($config, new CurlTransport(), $limiter))->handle(HttpRequest::fromGlobals());
} catch (\Throwable) {
    // Generic failure only; never echo exception details.
    \http_response_code(503);
    \header('Content-Type: application/json', true);
    \header('Cache-Control: no-store', true);
    \header('Vary: Origin', true);
    echo '{"error":"Service unavailable. Please call us instead."}';
    exit;
}

$response->send();

<?php

declare(strict_types=1);

// Dependency-free loader. Order matters: interfaces and exceptions first.
require_once __DIR__ . '/Transport.php';
require_once __DIR__ . '/CurlTransport.php';
require_once __DIR__ . '/Config.php';
require_once __DIR__ . '/HttpRequest.php';
require_once __DIR__ . '/HttpResponse.php';
require_once __DIR__ . '/ClientIp.php';
require_once __DIR__ . '/RateLimiter.php';
require_once __DIR__ . '/ContactEndpoint.php';

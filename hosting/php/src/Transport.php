<?php

declare(strict_types=1);

namespace FreshTech\Contact;

/**
 * Upstream HTTP transport. Implementations must not log request or response bodies.
 */
interface Transport
{
    /**
     * POST a JSON document and return the raw upstream status and body.
     *
     * @return array{status: int, body: string}
     * @throws TransportUnavailable when the transport cannot run at all (maps to 503)
     * @throws TransportFailure when the request fails or times out (maps to 502)
     */
    public function postJson(string $url, string $json, int $timeoutSeconds): array;
}

final class TransportUnavailable extends \RuntimeException
{
}

final class TransportFailure extends \RuntimeException
{
}

# PHP contact adapter

Source-only PHP 8.5 port of `netlify/functions/send-email.js` for hosts without
Netlify functions. Entrypoint: `hosting/php/api/send-email.php`, intended to be
served at `POST /api/send-email`. No routing or rewrite config is included yet.
No Composer; requires `ext-curl` and `ext-json`.

## Behaviour (identical to the Netlify function)

POST only, `Content-Type: application/json`, UTF-8 JSON object, 32 KiB actual
and declared body limit, same field bounds and trimming, honeypot, same generic
JSON error messages, `Cache-Control: no-store`, `Vary: Origin`, CORS headers
only for allowed origins, fixed recipient and sender, 10 second upstream
timeout, `fastaccept: false`. Success is returned only when SMTP2GO answers
2xx with JSON where there is no `error`/`error_code`, `data.succeeded` is 1,
`data.failed` is 0 and `data.failures` is an empty array. Acceptance is not
inbox delivery. Request and provider bodies are never logged or echoed.
Unknown input fields (for example `to`, `sender`) are ignored.

Pipeline order: origin, OPTIONS, method, rate limit, content type, body size,
JSON, fields, honeypot, API key, upstream.

## Environment variables

| Name | Required | Meaning |
| --- | --- | --- |
| `SMTP2GO_API_KEY` | yes | Provider key. Missing gives generic 503. |
| `CONTACT_RATE_LIMIT_DIR` | yes | Writable directory for rate-limit state. Must exist and resolve outside `DOCUMENT_ROOT`. Missing, unwritable, or inside the document root gives 503 on every POST (fail closed; no in-process fallback). |
| `CONTACT_TRUSTED_PROXIES` | no | Comma-separated IPv4/IPv6 literals of immediate proxies. Any malformed entry disables the whole list. |
| `CONTACT_EXTRA_ORIGINS` | no | Comma-separated extra allowed origins (scheme://host[:port]), e.g. preview hosts. Invalid entries are dropped. |
| `CONTACT_ALLOW_LOCAL_DEV` | no | Exactly `true` adds `http://localhost:5173`. Never set in production. |

`https://fresh-tech.uk` and `https://www.fresh-tech.uk` are always allowed.
Values are read from `$_SERVER` (Apache `SetEnv`, FastCGI env) then `getenv()`.

## Rate limit

5 requests per 60 seconds per key, key = resolved client IP + `|` + lower-cased,
allowed `Host`. Production hosts are fixed; configured extra origins add their
host to the allowlist. One file per key named `sha256(key).json` in `CONTACT_RATE_LIMIT_DIR`,
opened with `flock(LOCK_EX)`, then truncate, write, flush while locked. The
sixth request returns 429 with `Retry-After` in seconds. Rejected requests
(400, 413, 415) also count, matching the platform rule. An unusable
`REMOTE_ADDR` or `Host` gives 503.

## Client IP resolution

1. `REMOTE_ADDR` must be a valid IP literal, otherwise 503. It is canonicalised
   (`inet_pton`/`inet_ntop`).
2. If `CONTACT_TRUSTED_PROXIES` is empty or does not contain the canonical
   `REMOTE_ADDR`, the client IP is `REMOTE_ADDR`. `X-Forwarded-For` is ignored.
3. Otherwise the right-most `X-Forwarded-For` entry (the one appended by the
   trusted proxy) is used if it is a valid IP; if the header is missing or
   malformed the proxy address itself is used. Only one hop is trusted.

## Tests

```
php hosting/php/tests/run.php
```

Dependency-free, synthetic data only, fake transport and fake clock. Exit code
is non-zero on failure. The concurrency test spawns child PHP processes via
`proc_open` and skips itself if that is unavailable.

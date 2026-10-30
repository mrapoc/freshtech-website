# Static hosting contact endpoint contract

Source contract and implementation record. The live endpoint is
`prototypes/html-first-slice/server/api/send-email.php` (see its `server/README.md`).
An earlier standalone port under `hosting/php` (15 September 2026) was removed on
30 October 2026 and remains in Git history. The Netlify function and React tests
named below were retired at the same time.

Use one frontend submission helper and a PHP 8.5 adapter at `/api/send-email`.
Retain compatibility for `/.netlify/functions/send-email` during migration.
Recipient, sender and subject remain server-controlled. Keep provider credentials
outside the upload artifact and public document root.

The existing contract is defined by `netlify/functions/send-email.js` and
`__tests__/functions/send-email.test.ts`. Preserve its 32 KiB JSON byte limit,
field limits, single-line checks, honeypot, method/content-type/origin validation,
generic error responses, no-store policy and ten-second upstream timeout.
A successful provider response must pass the existing semantic acceptance checks;
HTTP 200 alone is insufficient, and acceptance is not proof of inbox delivery.
Use injected mocked transport for tests.

Netlify currently supplies a five-request / 60-second rate limit. Its replacement
must be explicit. Prefer a verified hosting control, otherwise an atomic private
store outside public_html, with hashed keys and locking. Verify trusted client IP
handling through 20i/CDN, concurrent requests, writable private storage and failure
behaviour before enabling delivery. Do not trust arbitrary forwarded-IP headers.

## Caller findings

- ContactForm awaits successful delivery acceptance before showing success.
- EmailCheckerTool renders both email-check routes. DNS results and lead capture
  are separate; its current fire-and-forget capture suppresses failures. Preserve
  useful DNS results but never imply an enquiry was saved without acceptance.
- ReferralPageV2 and ITHealthCheckPageV2 currently display success without sending
  a request. Track as FORM-01 and fix in the migrated journeys.
- Active Careers V2 uses mailto. Do not port the unused older careers form.

## Verification and release gate

Port the existing synthetic validation/provider-response matrix. Add rate-limit
boundary, expiry, concurrency, spoofed forwarding header and storage-failure
checks. Exercise actual UI success, error recovery and retained form values with
mocked delivery. Keep DNS tests independent of email tests.

Preview verification must prove rejection paths, rate limiting and that private
configuration is not downloadable without sending real email. A later explicitly
authorised controlled-recipient test is required to establish actual acceptance
and delivery. Until these checks pass, preview delivery remains disabled.

## Astro contact route

The HTML-first contact route keeps submission disabled unless
`PUBLIC_CONTACT_SUBMISSION_MODE` is explicitly set to `enabled`. Enabled mode
works only on the canonical Fresh Tech hosts. A `test` mode works only on
loopback hosts for intercepted synthetic browser checks. Neither mode changes
the PHP adapter or supplies credentials.

The client posts the seven contracted fields to `/api/send-email` as JSON and
shows success only after both a successful HTTP response and an explicit
`{ "success": true }` response body. Failed, malformed and rejected responses
retain the entered values and show the phone fallback. Provider acceptance is
described as acceptance for sending, not inbox delivery. First-party enquiry
submission is separate from optional analytics consent.

The contact route remains a noindex comparison prototype. It preserves the
active route's title, description, LocalBusiness, Organization and breadcrumb
schemas, booking link, direct contact options, FAQs and town coverage. Booking
is an explicit link to Calendly which opens only after the visitor chooses it;
the static route does not load a Calendly script or frame. Dynamic helpdesk
averages remain deferred and are labelled unavailable in the preview rather
than replaced with hardcoded figures.

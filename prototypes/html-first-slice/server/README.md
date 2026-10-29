# Lead email endpoint (20i)

`api/send-email.php` replaces `netlify/functions/send-email.js`. It accepts the
native contact form's `POST /api/send-email` JSON request and sends one plain
text email through SMTP2GO's HTTPS API. Requires PHP 8.1 or later with the curl
extension.

## What goes where on 20i

The generated `.htaccess` routes `/api/send-email` to the script and returns 404
for any direct request under `/server/`.

| Repository file | 20i location |
| --- | --- |
| `dist/` contents plus the generated `.htaccess` | `public_html/` |
| `server/api/send-email.php` | `public_html/server/api/send-email.php` |
| `server/send-email-config.example.php` (copied, then filled in) | `private/send-email-config.php`, a sibling of `public_html` |
| (new empty folder) | `private/rate-limit/` |

Do not upload `server/tests/`, `server/README.md` or the example file itself.

The script looks for its configuration three folders above itself, so in the 20i
File Manager the home folder must look like this:

```
(site home)
├── private/
│   ├── send-email-config.php
│   └── rate-limit/
└── public_html/
    ├── .htaccess
    └── server/api/send-email.php
```

In `send-email-config.php`, set `rate_limit_dir` to the absolute path of
`private/rate-limit` (the File Manager shows the full home path, for example
`/home/sites/…/private/rate-limit`). The SMTP2GO key goes only in
`smtp2go_api_key` in that file. Use a key restricted to sending email. Generate
`ip_hash_salt` as a long random string (at least 32 characters). If the file is
missing, unreadable, inside `public_html`, or still contains `REPLACE_ME`, the
endpoint answers 503 and sends nothing.

Optional settings, with safe defaults if omitted:

- `trusted_proxies` (default empty): leave empty unless go-live step 5 fails.
  `X-Forwarded-For` is read only when the connecting address is in one of these
  ranges, and then only the right-most address that is not itself a listed proxy.
- `client_ip_header`: the header read from a trusted proxy.
- `global_daily_send_limit`: successful sends allowed site-wide in 24 hours. Beyond it the form fails and visitors are told to call, and one notice goes to `recipients` (no visitor data, at most once a day).
- `per_ip_daily_send_limit` (0 turns it off): valid submissions allowed from one visitor address (IPv6 /64) in 24 hours, so a few addresses cannot exhaust the site-wide cap.
- `rate_limit_max_files`: once the rate-limit folder holds this many files and none are stale, new visitors are refused with 429.

Only requests with an allowed origin and valid fields count towards the per-IP
limits. Honeypot hits still count.

## File permissions

- `private/send-email-config.php`: `0600` (owner read and write only), or `0640`
  if 20i's PHP runs as a different user in your group and `0600` returns 503.
- `private/rate-limit/`: `0700`.
- `private/`: `0700` or `0750`.

In the 20i File Manager (My Hosting, Manage, File Manager), select the file or
folder and use its permissions (chmod) option to view or set these numbers. If
the option is not shown for your package, set them with an SFTP client instead.
After changing them, repeat checklist step 3 to confirm PHP can still read the
configuration.

## Generating the Apache configuration

- Production: `node scripts/generate-apache-static-config.mjs --mode production ...`
  routes the endpoint automatically.
- Preview: the endpoint stays disabled (503) by default. Add
  `--enable-preview-send-email` only for a deliberate preview test, and set
  `allow_preview_origin` to `true` in that host's private configuration.

## Enabling the form in the build

The production build (`PUBLIC_SITE_MODE=production npm run build`, output in
`dist-production`) enables every contact form, including the shared
`SourceContact` block, and the email checker's lead capture. The preview build
keeps them disabled; `PUBLIC_CONTACT_SUBMISSION_MODE` still switches `/contact`
alone in preview. The browser scripts refuse to submit on any host other than
`fresh-tech.uk` and `www.fresh-tech.uk`, so a preview test must be made without
the page's form. `node scripts/package-static-production.mjs` (repository root)
packages the production site with this endpoint.

## Tests

`php server/tests/send-email-test.php` runs the handler against a stubbed SMTP2GO
transport with synthetic data. It needs PHP 8.1+ locally, on the build worker or
on 20i over SSH. Do not upload the test file to `public_html`.

## Verification before real use

Do these one at a time, with `recipients` set to a test inbox you control:

1. Upload the files and open `https://<host>/server/api/send-email.php`: expect 404.
2. Before adding the configuration, open `https://<host>/api/send-email`: expect
   a 503 JSON error.
3. Add the configuration. A GET to `/api/send-email` from a browser tab should
   return 403 (no allowed origin) and never 500.
4. Submit the form once with synthetic details: expect the success message and
   one email in the test inbox, with no `Reply-To` or other user data in headers.
5. **Go-live gate, mandatory.** Submit six times within a minute from one
   network: the sixth must fail. Straight away, submit from a second network
   (for example a phone on mobile data with Wi-Fi off): it must succeed. If the
   second network is also blocked, the endpoint is seeing 20i's proxy rather
   than visitors, every lead shares one limit, and the site must not go live
   until `trusted_proxies` is set to 20i's documented proxy ranges (with
   `client_ip_header` set to `stackcdn-connecting-ip` if 20i does not forward
   `X-Forwarded-For`) and this step passes. Also confirm `private/rate-limit` contains `rl-` files with hashed
   names and no IP addresses.
6. Fill the hidden honeypot field via the browser developer tools: expect a
   failure and no email.
7. Only then change `recipients` to the real inbox, and set
   `allow_preview_origin` back to `false`.

<?php
// Example only. Copy to <site home>/private/send-email-config.php on 20i (the
// folder that CONTAINS public_html, never inside it) and replace every value.
// The endpoint refuses to run (HTTP 503) while any REPLACE_ME value remains.
return [
    // SMTP2GO API key with permission to send email only.
    'smtp2go_api_key' => 'REPLACE_ME',
    // A sender address verified in SMTP2GO.
    'sender' => 'REPLACE_ME@example.invalid',
    // Where leads are delivered. Use a test inbox first; see server/README.md.
    'recipients' => ['REPLACE_ME@example.invalid'],
    // At least 32 random characters, used to hash visitor IP addresses.
    'ip_hash_salt' => 'REPLACE_ME',
    // Absolute path to a writable folder outside public_html, for example
    // <site home>/private/rate-limit
    'rate_limit_dir' => 'REPLACE_ME',
    // true only while testing on https://preview.fresh-tech.uk
    'allow_preview_origin' => false,
    // Leave empty unless go-live testing proves REMOTE_ADDR is a 20i proxy. Then
    // list only that proxy's published ranges, for example ['192.0.2.0/24'].
    // A forwarding header is read only when the connecting address is in this list.
    'trusted_proxies' => [],
    // Which header names the visitor once trusted_proxies matches:
    // 'x-forwarded-for' or 'stackcdn-connecting-ip' (20i's StackCDN).
    'client_ip_header' => 'x-forwarded-for',
    // Site-wide backstop on successful sends per 24 hours.
    'global_daily_send_limit' => 50,
    // Valid submissions allowed per visitor address in 24 hours; 0 turns it off.
    'per_ip_daily_send_limit' => 5,
    // Maximum rate-limit files before new visitors are refused (429).
    'rate_limit_max_files' => 10000,
];

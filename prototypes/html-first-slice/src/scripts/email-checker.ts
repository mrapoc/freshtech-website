/**
 * Framework-free port of components-v2/EmailCheckerTool.tsx for the native
 * standalone /email-security-check page.
 *
 * Runs client-side DNS-over-HTTPS lookups against https://dns.google/resolve
 * (exactly as the React tool does, and only once the visitor submits) for
 * SPF, DMARC, DKIM (best-effort), MX/platform, MTA-STS and DNSSEC, then
 * renders a plain-English report against the server-rendered markup in
 * src/pages/email-security-check.astro.
 *
 * Lead capture: the React tool's captureLead() posted each completed check to
 * the SMTP2GO send function. Here it posts to /api/send-email only when the
 * production build marks the tool with data-lead-capture="enabled" and the page
 * is served from fresh-tech.uk or www.fresh-tech.uk (the contact form's host
 * rules). Preview builds never send.
 *
 * DOM built with textContent/createElement only: DNS answers are untrusted
 * input from the public internet and must never be assigned via innerHTML.
 */

import { submissionAllowed } from './contact-form.ts';

export type Status = 'red' | 'amber' | 'green';
type DetailKind = 'service' | 'unknown' | 'ip' | 'other';
export interface Detail { text: string; kind: DetailKind }
export interface CheckResult { key: string; label: string; status: Status; finding: string; meaning: string; details?: Detail[] }
export interface DohAnswer { type: number; data: string }
export interface DohResponse { Status?: number; AD?: boolean; Answer?: DohAnswer[] }
export type Lookup = (name: string, type: string) => Promise<DohResponse>;

// Maps common SPF include: hosts to the service they belong to, so the report
// can name which senders the domain actually authorises (and flag unknowns).
export const SPF_SERVICES: [RegExp, string][] = [
  [/protection\.outlook\.com/i, 'Microsoft 365'],
  [/\bgoogle\.com|googlemail|google\b/i, 'Google Workspace'],
  [/sendgrid/i, 'SendGrid'],
  [/mailgun/i, 'Mailgun'],
  [/mcsv\.net|mandrillapp|mailchimp/i, 'Mailchimp / Mandrill'],
  [/amazonses|amazonaws/i, 'Amazon SES'],
  [/salesforce/i, 'Salesforce'],
  [/zoho/i, 'Zoho'],
  [/mailjet/i, 'Mailjet'],
  [/constantcontact/i, 'Constant Contact'],
  [/sparkpost/i, 'SparkPost'],
  [/postmarkapp/i, 'Postmark'],
  [/intuit|quickbooks/i, 'Intuit / QuickBooks'],
  [/hubspot/i, 'HubSpot'],
  [/sendinblue|brevo/i, 'Brevo (Sendinblue)'],
  [/freshdesk|freshemail|freshworks/i, 'Freshworks'],
  [/zendesk/i, 'Zendesk'],
  [/klaviyo/i, 'Klaviyo'],
  [/secureserver\.net/i, 'GoDaddy'],
  [/registrar-servers\.com/i, 'Namecheap'],
  [/ionos|1and1|oneandone/i, 'IONOS / 1&1'],
  [/123-?reg/i, '123 Reg'],
  [/mailspamprotection|hostedemail|emailsrvr\.com|cpanel/i, 'Web-host email'],
  [/efwd|forward/i, 'Email forwarding'],
  [/exclaimer/i, 'Exclaimer (signatures)'],
  [/mimecast/i, 'Mimecast'],
  [/proofpoint|pphosted/i, 'Proofpoint'],
  [/barracuda/i, 'Barracuda'],
  [/messagelabs|symanteccloud/i, 'Symantec / MessageLabs'],
  [/dotdigital|dotmailer/i, 'Dotdigital'],
  [/xero/i, 'Xero'],
  [/\bsage\b/i, 'Sage'],
];

export const FREE_MAIL = new Set([
  'gmail.com', 'googlemail.com', 'outlook.com', 'hotmail.com', 'hotmail.co.uk',
  'live.com', 'live.co.uk', 'yahoo.com', 'yahoo.co.uk', 'icloud.com', 'me.com',
  'aol.com', 'btinternet.com', 'sky.com', 'msn.com', 'protonmail.com',
]);

// Darker amber than React's #b8791a (3.63:1 on white, fails WCAG AA). #8a5a10
// passes at 5.91:1 on white and 5.16:1 as a solid background with white text.
export const STATUS_COLOR: Record<Status, string> = { red: '#c0392b', amber: '#8a5a10', green: '#2e7d4f' };
export const STATUS_LABEL: Record<Status, string> = { red: 'Red alert', amber: 'Needs attention', green: 'Good' };

export async function browserDoh(name: string, type: string): Promise<DohResponse> {
  const r = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(name)}&type=${type}`);
  if (!r.ok) throw new Error('DNS lookup failed');
  return r.json();
}

const txtRecords = (j: DohResponse): string[] =>
  (j.Answer ?? []).filter(a => a.type === 16).map(a => a.data.replace(/"/g, ''));

/** Normalises a user-entered business domain: strips a scheme, path and leading www. */
export function normaliseDomain(value: string): string {
  return value.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '').replace(/^www\./, '');
}

/** true if the email's domain is a well-known personal/free-mail provider. */
export function isFreeMailDomain(domain: string): boolean {
  return FREE_MAIL.has(domain);
}

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
export function isValidEmail(value: string): boolean {
  return EMAIL_RE.test(value);
}

/** SPF include:/ip4:/ip6: token -> named service, or an "unrecognised" flag. */
export function matchSpfService(include: string): string | null {
  return SPF_SERVICES.find(([re]) => re.test(include))?.[1] ?? null;
}

/** Grades an SPF record's closing qualifier (+all/-all/~all/?all/none). */
export function gradeSpfQualifier(qualifier: string | undefined): Status {
  if (qualifier === '+') return 'red';
  if (qualifier === '?' || qualifier === undefined) return 'amber';
  return 'green'; // ~ or -
}

/** Grades a DMARC policy (p=reject/quarantine/none). */
export function gradeDmarcPolicy(policy: string): Status {
  const p = policy.toLowerCase();
  if (p === 'reject' || p === 'quarantine') return 'green';
  return 'amber';
}

async function analyseDmarc(domain: string, doh: Lookup): Promise<CheckResult> {
  try {
    const rec = txtRecords(await doh(`_dmarc.${domain}`, 'TXT')).find(t => /v=DMARC1/i.test(t));
    if (!rec) {
      return { key: 'dmarc', label: 'DMARC', status: 'red', finding: 'No DMARC record found.', meaning: "This is the big one. Nothing tells the world to reject email that fakes your domain, so criminals can impersonate you freely." };
    }
    const p = (rec.match(/p\s*=\s*([a-z]+)/i)?.[1] ?? 'none').toLowerCase();
    const status = gradeDmarcPolicy(p);
    if (p === 'reject') return { key: 'dmarc', label: 'DMARC', status, finding: 'DMARC is enforcing (p=reject).', meaning: 'Fakes are rejected outright. This is the strongest setting.' };
    if (p === 'quarantine') return { key: 'dmarc', label: 'DMARC', status, finding: 'DMARC is enforcing (p=quarantine).', meaning: 'Fakes are sent to spam. Solid. Moving to reject is the final step.' };
    return { key: 'dmarc', label: 'DMARC', status, finding: "DMARC is monitor-only (p=none).", meaning: "It reports but blocks nothing. It looks done, but criminals can still impersonate you. This needs moving to quarantine, then reject." };
  } catch {
    return { key: 'dmarc', label: 'DMARC', status: 'amber', finding: "Couldn't read DMARC.", meaning: "We couldn't check this automatically. We'll confirm it in your report." };
  }
}

async function analyseSpf(domain: string, doh: Lookup): Promise<CheckResult> {
  try {
    const spf = txtRecords(await doh(domain, 'TXT')).find(t => /v=spf1/i.test(t));
    if (!spf) {
      return { key: 'spf', label: 'SPF', status: 'red', finding: 'No SPF record found.', meaning: 'Other servers have no way to know which systems may send email as you, so your domain is easy to forge and your real email is more likely to hit spam.' };
    }
    const tokens = spf.split(/\s+/);
    const includes = tokens.filter(t => /^include:/i.test(t)).map(t => t.slice(8));
    const ip4s = tokens.filter(t => /^ip4:/i.test(t)).map(t => t.slice(4));
    const ip6s = tokens.filter(t => /^ip6:/i.test(t)).map(t => t.slice(4));
    const others = tokens.filter(t => /^(a$|a:|mx$|mx:|ptr|exists:|redirect=)/i.test(t));
    const qual = spf.match(/([~\-?+])all\b/)?.[1];

    const details: Detail[] = [];
    let unknown = 0;
    for (const inc of includes) {
      const svc = matchSpfService(inc);
      if (svc) details.push({ text: `${svc} (${inc})`, kind: 'service' });
      else { unknown++; details.push({ text: `Unrecognised, verify this: ${inc}`, kind: 'unknown' }); }
    }
    for (const ip of ip4s.slice(0, 4)) {
      if (/^\d+\.\d+\.\d+\.\d+$/.test(ip)) {
        let host = '';
        try { host = (await doh(ip.split('.').reverse().join('.') + '.in-addr.arpa', 'PTR')).Answer?.find(a => a.type === 12)?.data ?? ''; } catch { /* ignore */ }
        details.push({ text: host ? `IP ${ip} (${host.replace(/\.$/, '')})` : `IP ${ip}`, kind: 'ip' });
      } else { details.push({ text: `IP range ${ip}`, kind: 'ip' }); }
    }
    for (const ip of ip6s) details.push({ text: `IPv6 ${ip}`, kind: 'ip' });
    if (others.length) details.push({ text: `Also allows: ${others.join(', ')}`, kind: 'other' });

    const staleNote = unknown > 0
      ? ` We couldn't identify ${unknown} of the senders below. Check they're tools you still use; anything stale or no longer needed should be removed straight away, as old entries are a common weakness.`
      : '';

    const status = gradeSpfQualifier(qual);
    if (qual === '+') return { key: 'spf', label: 'SPF', status, finding: 'SPF allows anyone to send (+all).', meaning: 'This effectively switches SPF off: every server on the internet passes. The +all needs removing.' + staleNote, details };
    if (qual === '?') return { key: 'spf', label: 'SPF', status, finding: 'SPF is present but neutral (?all).', meaning: "Neutral tells receivers you have no opinion on servers that aren't on your list, so forged mail isn't failed. It needs to end in ~all or -all to do its job." + staleNote, details };
    if (qual === '~' || qual === '-') return { key: 'spf', label: 'SPF', status, finding: `SPF is set up (ends in ${qual}all).`, meaning: `You've published which servers can send as you. SPF only checks the sending server, so if any of these are shared hosting, other customers there can pass too. That's why DKIM and DMARC matter on top.${staleNote}`, details };
    return { key: 'spf', label: 'SPF', status, finding: "SPF is present but has no closing 'all' rule.", meaning: "Without a closing ~all or -all, receivers aren't told what to do with servers that aren't listed, so it may not be enforced." + staleNote, details };
  } catch {
    return { key: 'spf', label: 'SPF', status: 'amber', finding: "Couldn't read SPF.", meaning: "We'll confirm this in your report." };
  }
}

async function analyseDkim(domain: string, doh: Lookup): Promise<CheckResult> {
  try {
    const selectors = ['selector1', 'selector2', 'google', 'default', 'k1', 's1', 's2', 'dkim', 'mail'];
    let found = false;
    for (const s of selectors) {
      const recs = txtRecords(await doh(`${s}._domainkey.${domain}`, 'TXT'));
      if (recs.some(v => /v=DKIM1|k=rsa|p=[A-Za-z0-9]{20}/i.test(v))) { found = true; break; }
    }
    if (found) return { key: 'dkim', label: 'DKIM', status: 'green', finding: 'DKIM signing detected.', meaning: 'Your outgoing email is signed, so receivers can confirm it really came from you and was not tampered with.' };
    return { key: 'dkim', label: 'DKIM', status: 'amber', finding: 'No DKIM found on the common selectors.', meaning: 'You may use a custom selector, or DKIM may be off. We check this properly by hand in your report.' };
  } catch {
    return { key: 'dkim', label: 'DKIM', status: 'amber', finding: "Couldn't read DKIM.", meaning: "We'll confirm this in your report." };
  }
}

async function analyseMx(domain: string, doh: Lookup): Promise<CheckResult> {
  try {
    const mx = (await doh(domain, 'MX')).Answer?.filter(a => a.type === 15).map(a => a.data.toLowerCase()).join(' ') ?? '';
    if (!mx) return { key: 'mx', label: 'Mail platform', status: 'amber', finding: 'No mail servers (MX) found.', meaning: 'This domain may not be set up to receive email at all, which is worth checking.' };
    if (/outlook|protection\.outlook/.test(mx)) return { key: 'mx', label: 'Mail platform', status: 'green', finding: 'Detected: Microsoft 365.', meaning: 'Microsoft 365 supports SPF, DKIM, DMARC, MTA-STS and DNSSEC natively, so any gaps above are configuration to fix, not platform limits. (We rate 365 highly.)' };
    if (/google|googlemail|aspmx/.test(mx)) return { key: 'mx', label: 'Mail platform', status: 'green', finding: 'Detected: Google Workspace.', meaning: 'Google Workspace supports SPF, DKIM, DMARC, MTA-STS and DNSSEC natively, so any gaps above are configuration to fix rather than platform limits.' };
    return { key: 'mx', label: 'Mail platform', status: 'amber', finding: 'Detected: other / web-host mailbox.', meaning: 'Mailboxes run on shared hosting or webmail (IMAP/cPanel-style) usually have multiple weaknesses here and patchy support for DKIM, MTA-STS and DNSSEC. We would normally recommend moving to Microsoft 365 or Google Workspace, which support all of these out of the box.' };
  } catch {
    return { key: 'mx', label: 'Mail platform', status: 'amber', finding: "Couldn't read MX.", meaning: "We'll confirm this in your report." };
  }
}

async function analyseMtaSts(domain: string, doh: Lookup): Promise<CheckResult> {
  try {
    const sts = txtRecords(await doh(`_mta-sts.${domain}`, 'TXT')).find(t => /v=STSv1/i.test(t));
    if (sts) return { key: 'mtasts', label: 'MTA-STS', status: 'green', finding: 'MTA-STS is published.', meaning: 'Email sent to your domain is forced to travel encrypted.' };
    return { key: 'mtasts', label: 'MTA-STS', status: 'amber', finding: 'No MTA-STS.', meaning: 'Email to your domain can be intercepted or downgraded in transit. Very few businesses have this, so it is a strong extra layer.' };
  } catch {
    return { key: 'mtasts', label: 'MTA-STS', status: 'amber', finding: "Couldn't read MTA-STS.", meaning: "We'll confirm this in your report." };
  }
}

async function analyseDnssec(domain: string, doh: Lookup): Promise<CheckResult> {
  try {
    const ds = (await doh(domain, 'DS')).Answer?.some(a => a.type === 43);
    if (ds) return { key: 'dnssec', label: 'DNSSEC', status: 'green', finding: 'DNSSEC is enabled.', meaning: 'Your DNS records are cryptographically signed, so they are much harder to forge or hijack.' };
    return { key: 'dnssec', label: 'DNSSEC', status: 'amber', finding: 'No DNSSEC.', meaning: "Your DNS isn't signed, making it easier for an attacker to forge where your email and website point. Some budget domain and DNS providers don't support DNSSEC at all. If yours doesn't, that's a good reason to move the domain to one that does." };
  } catch {
    return { key: 'dnssec', label: 'DNSSEC', status: 'amber', finding: "Couldn't read DNSSEC.", meaning: "We'll confirm this in your report." };
  }
}

/** Runs all six checks against a domain. `doh` is injectable for tests. */
export async function analyse(domain: string, doh: Lookup = browserDoh): Promise<CheckResult[]> {
  return [
    await analyseDmarc(domain, doh),
    await analyseSpf(domain, doh),
    await analyseDkim(domain, doh),
    await analyseMx(domain, doh),
    await analyseMtaSts(domain, doh),
    await analyseDnssec(domain, doh),
  ];
}

// ── DOM wiring ──────────────────────────────────────────────────────────
// Everything below builds elements with createElement/textContent only:
// DNS answers are untrusted data from the public internet and must never be
// passed to innerHTML.

function text(tag: string, className: string, value: string): HTMLElement {
  const el = document.createElement(tag);
  el.className = className;
  el.textContent = value;
  return el;
}

function renderDetail(detail: Detail): HTMLLIElement {
  const li = document.createElement('li');
  li.className = detail.kind === 'service' ? 'ec-result-detail is-service' : detail.kind === 'unknown' ? 'ec-result-detail is-unknown' : 'ec-result-detail';
  const mark = document.createElement('span');
  mark.className = 'ec-result-detail-mark';
  mark.textContent = detail.kind === 'service' ? '✓' : detail.kind === 'unknown' ? '⚠' : '•';
  const body = document.createElement('span');
  body.textContent = detail.text;
  li.append(mark, body);
  return li;
}

function renderResult(result: CheckResult): HTMLDivElement {
  const row = document.createElement('div');
  row.className = 'ec-result-item';
  row.style.borderLeftColor = STATUS_COLOR[result.status];

  const top = document.createElement('div');
  top.className = 'ec-result-top';
  const label = text('span', 'ec-result-label', result.label);
  const statusLabel = text('span', 'ec-result-status', STATUS_LABEL[result.status]);
  statusLabel.style.color = STATUS_COLOR[result.status];
  top.append(label, statusLabel);

  const finding = text('div', 'ec-result-finding', result.finding);
  const meaning = text('div', 'ec-result-meaning', result.meaning);
  row.append(top, finding, meaning);

  if (result.details?.length) {
    const list = document.createElement('ul');
    list.className = 'ec-result-details';
    for (const detail of result.details) list.append(renderDetail(detail));
    row.append(list);
  }
  return row;
}

interface Elements {
  root: HTMLElement;
  inputPanel: HTMLElement;
  form: HTMLFormElement;
  email: HTMLInputElement;
  domainWrap: HTMLElement;
  domain: HTMLInputElement;
  consent: HTMLInputElement;
  error: HTMLElement;
  loading: HTMLElement;
  results: HTMLElement;
  summary: HTMLElement;
  list: HTMLElement;
}

function query<T extends Element>(root: ParentNode, selector: string): T {
  const el = root.querySelector<T>(selector);
  if (!el) throw new Error(`email-checker: missing ${selector}`);
  return el;
}

function collectElements(root: HTMLElement): Elements {
  return {
    root,
    inputPanel: query(root, '[data-email-checker-input]'),
    form: query(root, '[data-email-checker-form]'),
    email: query(root, '#ec-email'),
    domainWrap: query(root, '[data-email-checker-domain-wrap]'),
    domain: query(root, '#ec-domain'),
    consent: query(root, '#ec-consent'),
    error: query(root, '[data-email-checker-error]'),
    loading: query(root, '[data-email-checker-loading]'),
    results: query(root, '[data-email-checker-results]'),
    summary: query(root, '[data-email-checker-summary]'),
    list: query(root, '[data-email-checker-list]'),
  };
}

function setError(els: Elements, message: string): void {
  els.error.textContent = message;
  els.error.hidden = !message;
}

// Field limits enforced by server/api/send-email.php (JavaScript string length).
export const LEAD_NAME_MAX = 120;
export const LEAD_EMAIL_MAX = 254;
export const LEAD_MESSAGE_MAX = 5000;
const LEAD_NAME_SUFFIX = ' (Email Security Check)';
const TRUNCATED_MARKER = '\n[truncated]';
const LINE_BREAKING_CONTROLS = /[\x00-\x1f\x7f\x85\u2028\u2029]/g;

export interface LeadPayload { name: string; email: string; message: string }

/** Cuts to at most max UTF-16 units without leaving half a surrogate pair. */
function truncateUnits(value: string, max: number): string {
  if (value.length <= max) return value;
  const cut = value.slice(0, max);
  return /[\uD800-\uDBFF]$/.test(cut) ? cut.slice(0, -1) : cut;
}

/**
 * Builds the React captureLead() body, adapted to the endpoint's limits:
 * control characters are removed (single-line fields reject them), the domain
 * is shortened so the name fits, and an over-long message is truncated with a
 * marker. Returns null when the email could not pass the endpoint's validation.
 */
export function buildLeadPayload(domain: string, email: string, results: CheckResult[], consent: boolean): LeadPayload | null {
  const cleanEmail = email.trim();
  if (!isValidEmail(cleanEmail) || cleanEmail.length > LEAD_EMAIL_MAX || new RegExp(LINE_BREAKING_CONTROLS.source).test(cleanEmail)) return null;
  const cleanDomain = domain.replace(LINE_BREAKING_CONTROLS, '');
  const name = `${truncateUnits(cleanDomain, LEAD_NAME_MAX - LEAD_NAME_SUFFIX.length)}${LEAD_NAME_SUFFIX}`;

  const reds = results.filter(r => r.status === 'red').length;
  const ambers = results.filter(r => r.status === 'amber').length;
  const overall = reds > 0 ? `EXPOSED (${reds} red, ${ambers} amber)` : ambers > 0 ? `GAPS (${ambers} amber)` : 'SOLID';
  const lines = results.map(r => {
    const extra = r.details?.length ? `\n    ${r.details.map(d => d.text).join('\n    ')}` : '';
    return `- ${r.label} [${r.status.toUpperCase()}]: ${r.finding}${extra}`;
  });
  let message = [
    'Email security check submitted via the website tool.',
    '',
    `Domain: ${cleanDomain}`,
    `Overall: ${overall}`,
    `Marketing opt-in: ${consent ? 'YES' : 'no'}`,
    '',
    'Results:',
    ...lines,
  ].join('\n').replace(/[\x00-\x09\x0b-\x1f\x7f]/g, '');
  if (message.length > LEAD_MESSAGE_MAX) message = truncateUnits(message, LEAD_MESSAGE_MAX - TRUNCATED_MARKER.length) + TRUNCATED_MARKER;
  return { name, email: cleanEmail, message };
}

type LeadFetch = (input: string, init: RequestInit) => Promise<unknown>;

/**
 * Fire-and-forget POST of one completed check. Sends only when the production
 * build enabled capture and the page is on an allowed host. Returns whether a
 * request was started.
 */
export function captureLead(payload: LeadPayload | null, captureMode: string | undefined, hostname: string, fetchImpl: LeadFetch = fetch): boolean {
  if (!payload || captureMode !== 'enabled' || !submissionAllowed('enabled', hostname)) return false;
  try {
    fetchImpl('/api/send-email', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), cache: 'no-store', keepalive: true,
    }).catch(() => {});
  } catch {
    // Lead capture must never affect the on-screen results.
  }
  return true;
}

function renderResults(els: Elements, results: CheckResult[]): void {
  const reds = results.filter(r => r.status === 'red').length;
  const ambers = results.filter(r => r.status === 'amber').length;
  const overallStatus: Status = reds > 0 ? 'red' : ambers > 0 ? 'amber' : 'green';
  const overallHead = reds > 0 ? 'Your domain is exposed' : ambers > 0 ? 'Some gaps to close' : 'Looking solid';

  els.summary.textContent = '';
  els.summary.style.background = STATUS_COLOR[overallStatus];
  const head = text('div', 'ec-summary-head', overallHead);
  const sub = text('div', 'ec-summary-sub', `${reds} red ${reds === 1 ? 'alert' : 'alerts'}, ${ambers} to improve. Here's the detail.`);
  els.summary.append(head, sub);

  els.list.textContent = '';
  for (const result of results) els.list.append(renderResult(result));
}

/** Wires the checker form to live DNS lookups. Call once per page load. */
export function init(root: HTMLElement = document.body): void {
  const section = root.querySelector<HTMLElement>('[data-email-checker]');
  if (!section) return;
  const els = collectElements(section);

  els.form.addEventListener('submit', event => {
    event.preventDefault();
    void run();
  });

  async function run(): Promise<void> {
    setError(els, '');
    const trimmed = els.email.value.trim().toLowerCase();
    if (!isValidEmail(trimmed)) { setError(els, 'Please enter a valid email address.'); return; }
    const emailDomain = trimmed.split('@')[1] ?? '';
    let domain = emailDomain;
    if (isFreeMailDomain(emailDomain)) {
      els.domainWrap.hidden = false;
      const override = els.domain.value.trim();
      if (!override) {
        setError(els, "That looks like a personal email. Enter your business domain (e.g. yourcompany.co.uk) so we check the right one.");
        return;
      }
      domain = normaliseDomain(override);
    }

    els.inputPanel.hidden = true;
    els.loading.hidden = false;
    try {
      const results = await analyse(domain);
      els.loading.hidden = true;
      renderResults(els, results);
      els.results.hidden = false;
      els.results.focus();
      captureLead(buildLeadPayload(domain, trimmed, results, els.consent.checked), section.dataset.leadCapture, window.location.hostname);
    } catch {
      els.loading.hidden = true;
      els.inputPanel.hidden = false;
      setError(els, "Something went wrong running the checks. Please try again, or book a call and we'll do it for you.");
    }
  }
}

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { T, readableOn, useWindowWidth } from './primitives';

// ─────────────────────────────────────────────────────────────────────
// Client-side email-security checker. Runs DNS-over-HTTPS lookups (no
// backend) for SPF, DMARC, DKIM (best-effort), MX/platform, MTA-STS and
// DNSSEC, then captures the lead via the hidden Netlify form in index.html.
// ─────────────────────────────────────────────────────────────────────

type Status = 'red' | 'amber' | 'green';
type DetailKind = 'service' | 'unknown' | 'ip' | 'other';
interface Detail { text: string; kind: DetailKind }
interface CheckResult { key: string; label: string; status: Status; finding: string; meaning: string; details?: Detail[] }
interface DohAnswer { type: number; data: string }
interface DohResponse { Status?: number; AD?: boolean; Answer?: DohAnswer[] }

// Maps common SPF include: hosts to the service they belong to, so we can show
// the user which senders their domain actually authorises (and flag unknowns).
const SPF_SERVICES: [RegExp, string][] = [
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

const FREE_MAIL = new Set([
  'gmail.com', 'googlemail.com', 'outlook.com', 'hotmail.com', 'hotmail.co.uk',
  'live.com', 'live.co.uk', 'yahoo.com', 'yahoo.co.uk', 'icloud.com', 'me.com',
  'aol.com', 'btinternet.com', 'sky.com', 'msn.com', 'protonmail.com',
]);

const STATUS_COLOR: Record<Status, string> = { red: '#c0392b', amber: '#b8791a', green: '#2e7d4f' };
const STATUS_LABEL: Record<Status, string> = { red: 'Red alert', amber: 'Needs attention', green: 'Good' };

async function doh(name: string, type: string): Promise<DohResponse> {
  const r = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(name)}&type=${type}`);
  if (!r.ok) throw new Error('DNS lookup failed');
  return r.json();
}
const txtRecords = (j: DohResponse): string[] =>
  (j.Answer || []).filter(a => a.type === 16).map(a => a.data.replace(/"/g, ''));

async function analyse(domain: string): Promise<CheckResult[]> {
  const out: CheckResult[] = [];

  // DMARC (most important)
  try {
    const rec = txtRecords(await doh(`_dmarc.${domain}`, 'TXT')).find(t => /v=DMARC1/i.test(t));
    if (!rec) {
      out.push({ key: 'dmarc', label: 'DMARC', status: 'red', finding: 'No DMARC record found.', meaning: "This is the big one. Nothing tells the world to reject email that fakes your domain, so criminals can impersonate you freely." });
    } else {
      const p = (rec.match(/p\s*=\s*([a-z]+)/i)?.[1] || 'none').toLowerCase();
      if (p === 'reject') out.push({ key: 'dmarc', label: 'DMARC', status: 'green', finding: 'DMARC is enforcing (p=reject).', meaning: 'Fakes are rejected outright. This is the strongest setting.' });
      else if (p === 'quarantine') out.push({ key: 'dmarc', label: 'DMARC', status: 'green', finding: 'DMARC is enforcing (p=quarantine).', meaning: 'Fakes are sent to spam. Solid. Moving to reject is the final step.' });
      else out.push({ key: 'dmarc', label: 'DMARC', status: 'amber', finding: "DMARC is monitor-only (p=none).", meaning: "It reports but blocks nothing. It looks done, but criminals can still impersonate you. This needs moving to quarantine, then reject." });
    }
  } catch { out.push({ key: 'dmarc', label: 'DMARC', status: 'amber', finding: "Couldn't read DMARC.", meaning: "We couldn't check this automatically. We'll confirm it in your report." }); }

  // SPF (presence isn't enough: the qualifier AND what's in the list both matter)
  try {
    const spf = txtRecords(await doh(domain, 'TXT')).find(t => /v=spf1/i.test(t));
    if (!spf) {
      out.push({ key: 'spf', label: 'SPF', status: 'red', finding: 'No SPF record found.', meaning: 'Other servers have no way to know which systems may send email as you, so your domain is easy to forge and your real email is more likely to hit spam.' });
    } else {
      const tokens = spf.split(/\s+/);
      const includes = tokens.filter(t => /^include:/i.test(t)).map(t => t.slice(8));
      const ip4s = tokens.filter(t => /^ip4:/i.test(t)).map(t => t.slice(4));
      const ip6s = tokens.filter(t => /^ip6:/i.test(t)).map(t => t.slice(4));
      const others = tokens.filter(t => /^(a$|a:|mx$|mx:|ptr|exists:|redirect=)/i.test(t));
      const qual = spf.match(/([~\-?+])all\b/)?.[1];

      // Name the senders the record authorises; flag anything we don't recognise.
      const details: Detail[] = [];
      let unknown = 0;
      for (const inc of includes) {
        const svc = SPF_SERVICES.find(([re]) => re.test(inc))?.[1];
        if (svc) details.push({ text: `${svc} (${inc})`, kind: 'service' });
        else { unknown++; details.push({ text: `Unrecognised, verify this: ${inc}`, kind: 'unknown' }); }
      }
      // Reverse-lookup single IPs to name the host (bounded); list ranges as-is.
      for (const ip of ip4s.slice(0, 4)) {
        if (/^\d+\.\d+\.\d+\.\d+$/.test(ip)) {
          let host = '';
          try { host = (await doh(ip.split('.').reverse().join('.') + '.in-addr.arpa', 'PTR')).Answer?.find(a => a.type === 12)?.data || ''; } catch { /* ignore */ }
          details.push({ text: host ? `IP ${ip} (${host.replace(/\.$/, '')})` : `IP ${ip}`, kind: 'ip' });
        } else { details.push({ text: `IP range ${ip}`, kind: 'ip' }); }
      }
      for (const ip of ip6s) details.push({ text: `IPv6 ${ip}`, kind: 'ip' });
      if (others.length) details.push({ text: `Also allows: ${others.join(', ')}`, kind: 'other' });

      const staleNote = unknown > 0
        ? ` We couldn't identify ${unknown} of the senders below. Check they're tools you still use; anything stale or no longer needed should be removed straight away, as old entries are a common weakness.`
        : '';

      if (qual === '+') {
        out.push({ key: 'spf', label: 'SPF', status: 'red', finding: 'SPF allows anyone to send (+all).', meaning: 'This effectively switches SPF off: every server on the internet passes. The +all needs removing.' + staleNote, details });
      } else if (qual === '?') {
        out.push({ key: 'spf', label: 'SPF', status: 'amber', finding: 'SPF is present but neutral (?all).', meaning: "Neutral tells receivers you have no opinion on servers that aren't on your list, so forged mail isn't failed. It needs to end in ~all or -all to do its job." + staleNote, details });
      } else if (qual === '~' || qual === '-') {
        out.push({ key: 'spf', label: 'SPF', status: 'green', finding: `SPF is set up (ends in ${qual}all).`, meaning: `You've published which servers can send as you. SPF only checks the sending server, so if any of these are shared hosting, other customers there can pass too. That's why DKIM and DMARC matter on top.${staleNote}`, details });
      } else {
        out.push({ key: 'spf', label: 'SPF', status: 'amber', finding: "SPF is present but has no closing 'all' rule.", meaning: "Without a closing ~all or -all, receivers aren't told what to do with servers that aren't listed, so it may not be enforced." + staleNote, details });
      }
    }
  } catch { out.push({ key: 'spf', label: 'SPF', status: 'amber', finding: "Couldn't read SPF.", meaning: "We'll confirm this in your report." }); }

  // DKIM (best-effort across common selectors)
  try {
    const selectors = ['selector1', 'selector2', 'google', 'default', 'k1', 's1', 's2', 'dkim', 'mail'];
    let found = false;
    for (const s of selectors) {
      const recs = txtRecords(await doh(`${s}._domainkey.${domain}`, 'TXT'));
      if (recs.some(v => /v=DKIM1|k=rsa|p=[A-Za-z0-9]{20}/i.test(v))) { found = true; break; }
    }
    if (found) out.push({ key: 'dkim', label: 'DKIM', status: 'green', finding: 'DKIM signing detected.', meaning: 'Your outgoing email is signed, so receivers can confirm it really came from you and was not tampered with.' });
    else out.push({ key: 'dkim', label: 'DKIM', status: 'amber', finding: 'No DKIM found on the common selectors.', meaning: 'You may use a custom selector, or DKIM may be off. We check this properly by hand in your report.' });
  } catch { out.push({ key: 'dkim', label: 'DKIM', status: 'amber', finding: "Couldn't read DKIM.", meaning: "We'll confirm this in your report." }); }

  // Platform (from MX), and whether it even supports modern controls
  try {
    const mx = (await doh(domain, 'MX')).Answer?.filter(a => a.type === 15).map(a => a.data.toLowerCase()).join(' ') || '';
    if (!mx) out.push({ key: 'mx', label: 'Mail platform', status: 'amber', finding: 'No mail servers (MX) found.', meaning: 'This domain may not be set up to receive email at all, which is worth checking.' });
    else if (/outlook|protection\.outlook/.test(mx)) out.push({ key: 'mx', label: 'Mail platform', status: 'green', finding: 'Detected: Microsoft 365.', meaning: 'Microsoft 365 supports SPF, DKIM, DMARC, MTA-STS and DNSSEC natively, so any gaps above are configuration to fix, not platform limits. (We rate 365 highly.)' });
    else if (/google|googlemail|aspmx/.test(mx)) out.push({ key: 'mx', label: 'Mail platform', status: 'green', finding: 'Detected: Google Workspace.', meaning: 'Google Workspace supports SPF, DKIM, DMARC, MTA-STS and DNSSEC natively, so any gaps above are configuration to fix rather than platform limits.' });
    else out.push({ key: 'mx', label: 'Mail platform', status: 'amber', finding: 'Detected: other / web-host mailbox.', meaning: 'Mailboxes run on shared hosting or webmail (IMAP/cPanel-style) usually have multiple weaknesses here and patchy support for DKIM, MTA-STS and DNSSEC. We would normally recommend moving to Microsoft 365 or Google Workspace, which support all of these out of the box.' });
  } catch { out.push({ key: 'mx', label: 'Mail platform', status: 'amber', finding: "Couldn't read MX.", meaning: "We'll confirm this in your report." }); }

  // MTA-STS
  try {
    const sts = txtRecords(await doh(`_mta-sts.${domain}`, 'TXT')).find(t => /v=STSv1/i.test(t));
    if (sts) out.push({ key: 'mtasts', label: 'MTA-STS', status: 'green', finding: 'MTA-STS is published.', meaning: 'Email sent to your domain is forced to travel encrypted.' });
    else out.push({ key: 'mtasts', label: 'MTA-STS', status: 'amber', finding: 'No MTA-STS.', meaning: 'Email to your domain can be intercepted or downgraded in transit. Very few businesses have this, so it is a strong extra layer.' });
  } catch { out.push({ key: 'mtasts', label: 'MTA-STS', status: 'amber', finding: "Couldn't read MTA-STS.", meaning: "We'll confirm this in your report." }); }

  // DNSSEC (DS record at the registry)
  try {
    const ds = (await doh(domain, 'DS')).Answer?.some(a => a.type === 43);
    if (ds) out.push({ key: 'dnssec', label: 'DNSSEC', status: 'green', finding: 'DNSSEC is enabled.', meaning: 'Your DNS records are cryptographically signed, so they are much harder to forge or hijack.' });
    else out.push({ key: 'dnssec', label: 'DNSSEC', status: 'amber', finding: 'No DNSSEC.', meaning: "Your DNS isn't signed, making it easier for an attacker to forge where your email and website point. Some budget domain and DNS providers don't support DNSSEC at all. If yours doesn't, that's a good reason to move the domain to one that does." });
  } catch { out.push({ key: 'dnssec', label: 'DNSSEC', status: 'amber', finding: "Couldn't read DNSSEC.", meaning: "We'll confirm this in your report." }); }

  return out;
}

export const EmailCheckerTool: React.FC<{ onBookCall: () => void }> = ({ onBookCall }) => {
  const ww = useWindowWidth();
  const isMobile = ww < 768;
  const [email, setEmail] = useState('');
  const [domainOverride, setDomainOverride] = useState('');
  const [needsDomain, setNeedsDomain] = useState(false);
  const [consent, setConsent] = useState(false);
  const [phase, setPhase] = useState<'input' | 'loading' | 'results'>('input');
  const [error, setError] = useState('');
  const [results, setResults] = useState<CheckResult[]>([]);

  const captureLead = (domain: string, res: CheckResult[]) => {
    const reds = res.filter(r => r.status === 'red').length;
    const ambers = res.filter(r => r.status === 'amber').length;
    const overall = reds > 0 ? `EXPOSED (${reds} red, ${ambers} amber)` : ambers > 0 ? `GAPS (${ambers} amber)` : 'SOLID';
    const lines = res.map(r => {
      const extra = r.details?.length ? `\n    ${r.details.map(d => d.text).join('\n    ')}` : '';
      return `- ${r.label} [${r.status.toUpperCase()}]: ${r.finding}${extra}`;
    });
    const message = [
      'Email security check submitted via the website tool.',
      '',
      `Domain: ${domain}`,
      `Overall: ${overall}`,
      `Marketing opt-in: ${consent ? 'YES' : 'no'}`,
      '',
      'Results:',
      ...lines,
    ].join('\n');
    // Same SMTP2GO-backed function the contact forms use. Fire-and-forget.
    fetch('/.netlify/functions/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: `${domain} (Email Security Check)`, email, message }),
    }).catch(() => {});
  };

  const run = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const trimmed = email.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(trimmed)) { setError('Please enter a valid email address.'); return; }
    const emailDomain = trimmed.split('@')[1];
    let domain = emailDomain;
    if (FREE_MAIL.has(emailDomain)) {
      if (!domainOverride.trim()) { setNeedsDomain(true); setError("That looks like a personal email. Enter your business domain (e.g. yourcompany.co.uk) so we check the right one."); return; }
      domain = domainOverride.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '').replace(/^www\./, '');
    }
    setPhase('loading');
    try {
      const res = await analyse(domain);
      setResults(res);
      setPhase('results');
      captureLead(domain, res);
    } catch {
      setError("Something went wrong running the checks. Please try again, or book a call and we'll do it for you.");
      setPhase('input');
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '13px 15px', border: `2px solid ${T.ink}`,
    background: T.white, fontFamily: "'Archivo', sans-serif", fontSize: 16, color: T.ink, outline: 'none',
  };
  const reds = results.filter(r => r.status === 'red').length;
  const ambers = results.filter(r => r.status === 'amber').length;
  const overallStatus: Status = reds > 0 ? 'red' : ambers > 0 ? 'amber' : 'green';
  const overallHead = reds > 0 ? 'Your domain is exposed' : ambers > 0 ? 'Some gaps to close' : 'Looking solid';

  return (
    <div style={{
      background: T.white, border: `2px solid ${T.ink}`, boxShadow: `6px 6px 0 0 ${T.ink}`,
      padding: isMobile ? 24 : 36, maxWidth: 760, margin: '0 auto',
    }}>
      {phase !== 'results' && (
        <>
          <div style={{ fontFamily: "'Bungee', sans-serif", fontSize: isMobile ? 22 : 26, color: T.ink, lineHeight: 1.1, marginBottom: 10 }}>
            Check your domain in 20 seconds
          </div>
          <p style={{ fontSize: 15, color: 'rgba(15,25,35,0.65)', lineHeight: 1.6, margin: '0 0 20px' }}>
            Enter your work email. We'll check your live email security and show you exactly what's exposed, in plain English.
          </p>
          <form onSubmit={run}>
            <label style={{ fontFamily: "'Archivo Narrow', sans-serif", fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700, color: 'rgba(15,25,35,0.6)', display: 'block', marginBottom: 6 }}>Work email</label>
            <input style={inputStyle} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@yourcompany.co.uk" required />
            {needsDomain && (
              <div style={{ marginTop: 12 }}>
                <label style={{ fontFamily: "'Archivo Narrow', sans-serif", fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700, color: 'rgba(15,25,35,0.6)', display: 'block', marginBottom: 6 }}>Your business domain</label>
                <input style={inputStyle} value={domainOverride} onChange={e => setDomainOverride(e.target.value)} placeholder="yourcompany.co.uk" />
              </div>
            )}
            <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', margin: '16px 0', cursor: 'pointer' }}>
              <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} style={{ marginTop: 3, width: 18, height: 18, flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: 'rgba(15,25,35,0.7)', lineHeight: 1.5 }}>
                I'm happy for Fresh Tech to follow up about these results and send occasional security tips. Unsubscribe anytime. (Optional, your results show on screen either way.)
              </span>
            </label>
            {error && <div style={{ fontSize: 13, color: STATUS_COLOR.red, marginBottom: 12, fontWeight: 600 }}>{error}</div>}
            <button type="submit" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 26px',
              background: T.accent, color: readableOn(T.accent), border: `2px solid ${T.ink}`,
              fontFamily: "'Archivo', sans-serif", fontWeight: 700, fontSize: 16, cursor: 'pointer',
              boxShadow: `4px 4px 0 0 ${T.ink}`,
            }}>Run my free check →</button>
            <p style={{ fontSize: 12, color: 'rgba(15,25,35,0.62)', margin: '14px 0 0', lineHeight: 1.5 }}>
              We use your email to run the check and to handle your enquiry. We won't share it with anyone else or add you to marketing unless you tick above. See our <Link to="/privacy-policy" style={{ color: T.primaryDark, fontWeight: 600 }}>privacy policy</Link>.
            </p>
          </form>
        </>
      )}

      {phase === 'loading' && (
        <div style={{ textAlign: 'center', padding: '24px 0 0' }}>
          <div style={{ fontFamily: "'Bungee', sans-serif", fontSize: 18, color: T.primary }}>Checking your domain…</div>
        </div>
      )}

      {phase === 'results' && (
        <>
          <div style={{
            background: STATUS_COLOR[overallStatus], color: T.white, padding: '16px 20px', marginBottom: 20,
          }}>
            <div style={{ fontFamily: "'Bungee', sans-serif", fontSize: isMobile ? 20 : 24, lineHeight: 1.1 }}>{overallHead}</div>
            <div style={{ fontSize: 14, opacity: 0.9, marginTop: 4 }}>
              {reds} red {reds === 1 ? 'alert' : 'alerts'}, {ambers} to improve. Here's the detail.
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {results.map(r => (
              <div key={r.key} style={{ border: `1px solid ${T.hairline}`, borderLeft: `5px solid ${STATUS_COLOR[r.status]}`, padding: '14px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: "'Bungee', sans-serif", fontSize: 15 }}>{r.label}</span>
                  <span style={{ fontFamily: "'Archivo Narrow', sans-serif", fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: STATUS_COLOR[r.status] }}>{STATUS_LABEL[r.status]}</span>
                </div>
                <div style={{ fontSize: 14, color: T.ink, fontWeight: 600, margin: '4px 0 2px' }}>{r.finding}</div>
                <div style={{ fontSize: 13, color: 'rgba(15,25,35,0.65)', lineHeight: 1.55 }}>{r.meaning}</div>
                {r.details && r.details.length > 0 && (
                  <ul style={{ margin: '10px 0 0', paddingLeft: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {r.details.map((d, i) => {
                      const isService = d.kind === 'service';
                      const isUnknown = d.kind === 'unknown';
                      const mark = isService ? '✓' : isUnknown ? '⚠' : '•';
                      const markColor = isService ? STATUS_COLOR.green : isUnknown ? STATUS_COLOR.red : 'rgba(15,25,35,0.4)';
                      return (
                        <li key={i} style={{
                          fontSize: 12.5, lineHeight: 1.45, display: 'flex', gap: 8, alignItems: 'baseline',
                          color: isUnknown ? STATUS_COLOR.red : 'rgba(15,25,35,0.78)',
                          fontWeight: isService || isUnknown ? 700 : 400,
                          background: isService ? 'rgba(46,125,79,0.07)' : isUnknown ? 'rgba(192,57,43,0.07)' : T.paper,
                          border: `1px solid ${isService ? 'rgba(46,125,79,0.3)' : isUnknown ? 'rgba(192,57,43,0.3)' : T.hairline}`,
                          padding: '5px 9px',
                        }}>
                          <span style={{ color: markColor, fontWeight: 700, flexShrink: 0 }}>{mark}</span>
                          <span>{d.text}</span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            ))}
          </div>
          <div style={{ marginTop: 22, padding: '18px 20px', background: T.ink, color: T.white }}>
            <div style={{ fontFamily: "'Bungee', sans-serif", fontSize: 17, marginBottom: 6 }}>Want us to fix this?</div>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, margin: '0 0 14px' }}>
              We'll put together your full report and sort any of the above for you. Most of it is quick to fix once you know it's there.
            </p>
            <button onClick={onBookCall} style={{
              display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 22px',
              background: T.accent, color: readableOn(T.accent), border: `2px solid ${T.white}`,
              fontFamily: "'Archivo', sans-serif", fontWeight: 700, fontSize: 15, cursor: 'pointer',
              boxShadow: `4px 4px 0 0 ${T.yellow}`,
            }}>Book a 15-min call →</button>
          </div>
          <p style={{ fontSize: 12, color: 'rgba(15,25,35,0.62)', margin: '14px 0 0', lineHeight: 1.5 }}>
            These checks read public DNS records and are a quick indicator, not a full audit. DKIM in particular needs a manual look. Your full report covers everything.
          </p>
        </>
      )}
    </div>
  );
};

export default EmailCheckerTool;

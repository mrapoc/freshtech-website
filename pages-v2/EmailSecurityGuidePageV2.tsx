import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '../components/SEO';
import { CalendlyModal } from '../components/CalendlyModal';
import { EmailCheckerTool } from '../components-v2/EmailCheckerTool';
import { T, readableOn, useWindowWidth, useContentMax, Eyebrow, DisplayHead, Sticker } from '../components-v2/primitives';
import { LastReviewed } from '../components-v2/LastReviewed';

// ─────────────────────────────────────────────────────────────────────────
// Give-it-away DIY resource page for the cold email + video outreach. Explains
// SPF / DKIM / DMARC (and MTA-STS / DNSSEC) in plain English, shows the reader
// how to fix the basics themselves or hand the steps to their IT, and sows a
// polite doubt about their current setup without naming or blaming anyone.
// Copy verified + adversarially reviewed (facts, legal/tone, UK English, no em
// dashes) before being committed. Embeds the existing live checker tool.
// ─────────────────────────────────────────────────────────────────────────

const halftoneCss = (color: string, dot = 1.4, grid = 12) => ({
  backgroundImage: `radial-gradient(${color} ${dot}px, transparent ${dot}px)`,
  backgroundSize: `${grid}px ${grid}px`,
});

const COPY = {
  seoTitle: 'SPF, DKIM & DMARC in Plain English | Email Security Guide',
  seoDescription:
    'Can anyone send email pretending to be your business? A plain-English guide to SPF, DKIM and DMARC, the free settings that stop spoofing and keep your own email out of spam.',
  heroH1: 'Could someone send an email that looks exactly like it came from your business?',
  heroSub:
    'Three small settings decide whether someone can pretend to be your business by email, and whether your own genuine email lands in the inbox or the junk folder. They are called SPF, DKIM and DMARC.',
  heroNote:
    'They are free, built into Microsoft 365 and Google Workspace, and the basics take about five minutes to switch on. Most setups we look at are missing at least one. No sales pitch and no jargon: this page shows you what they are, the real risk, and exactly what to fix or hand to your IT.',
  spoofHeading: 'Right now, someone could probably send an email as you',
  spoofBody: [
    'Here is the uncomfortable bit, stated plainly. If your domain has no SPF record and no DMARC policy set to enforce, anyone can send an email that displays your domain in the visible From address, the address you actually read in your inbox. No hacking. No access to your mailbox. No clever toolkit. The way email works, a sender can simply state any From address they like, and if nothing on your domain says otherwise, the message lands looking genuine.',
    'That means a fraudster could send a message that appears to come from your finance director asking for an urgent payment, or from you asking a supplier to update their bank details. The reader has no easy way to tell it apart from the real thing. This is the engine behind invoice fraud and CEO scams, and an unprotected domain is the easiest possible target. (To be clear, when we run a check for someone, it is read-only: it reads your public records and never sends mail as you.)',
    'One important nuance, because half-measures give a false sense of safety: SPF on its own does not close this gap. SPF only checks a hidden address behind the scenes, not the From line you actually see. So even a domain with SPF set up can still have its exact address forged unless DMARC is published and set to quarantine or reject. The combination that genuinely stops someone forging your exact domain is SPF and DKIM working together with DMARC turned up to enforcement. Set up all three. We will explain each below.',
  ],
  pillars: [
    {
      name: 'SPF',
      tag: 'The guest list of servers allowed to send as you.',
      analogy: 'A guest list on the door: if a server is not on the list, it does not get to send mail in your name.',
      plain:
        "SPF (Sender Policy Framework) is a short record in your domain's DNS, the public address book for your website and email. It lists the mail servers that are allowed to send email for your domain. When a message arrives, the receiving server can check it against that list.",
      risk:
        'With no SPF, there is no published list of who is allowed to send as you, so receiving servers have less reason to trust your mail. Your own genuine email is more likely to be treated as suspicious and pushed towards spam.',
      fix:
        'It is free and built in. With Microsoft 365 you publish a single TXT record in your DNS, typically v=spf1 include:spf.protection.outlook.com -all. With Google Workspace it is one TXT record, v=spf1 include:_spf.google.com ~all. There is no licence and no add-on: it is included with every plan and is roughly a five-minute job once you are in your DNS. Only one SPF record is allowed per domain, so it needs to list every legitimate sender (your mail platform, your CRM, your accounts software).',
    },
    {
      name: 'DKIM',
      tag: 'A tamper-proof signature that proves a message is really yours.',
      analogy: 'A wax seal on a letter: if the seal is intact, the recipient knows it came from you and was not opened or altered on the way.',
      plain:
        'DKIM (DomainKeys Identified Mail) adds an invisible, tamper-proof signature to every email you send. The receiving server checks that signature against a key published in your DNS, which proves the message genuinely came from your domain and was not altered in transit.',
      risk:
        'Without DKIM on your own domain, receivers cannot confirm your messages are genuinely from you or that they arrived unaltered, which weakens trust and your deliverability. A subtle trap: Google Workspace does sign outgoing mail by default, but with a Google-owned key that does not line up with your own domain, so it does not satisfy DMARC. You can wrongly believe you are authenticated when you are not.',
      fix:
        'Free and built in, just a touch more involved than SPF. In Microsoft 365 you enable DKIM in the Microsoft Defender portal by publishing two CNAME records and flicking a toggle. Worth knowing: the built-in onmicrosoft.com address is signed automatically, but your own custom domain is not signed until you switch it on, so it is worth confirming that has actually been done. In Google Workspace you generate the key in the Admin console, publish one TXT record, then turn authentication on. Both are included in the subscription at no extra cost and take about five minutes of hands-on work.',
    },
    {
      name: 'DMARC',
      tag: 'The policy that actually blocks impersonation, if you let it.',
      analogy: "The instruction the bouncer enforces. A smoke alarm set to 'monitor only' is just a smoke alarm with the speaker disconnected: it notices the fire but warns nobody.",
      plain:
        'DMARC (Domain-based Message Authentication) ties SPF and DKIM together. It tells receiving mail servers what to do with a message that fails the checks, and it sends you back reports showing who is sending mail in your name. It is the piece that requires the visible From address you read to line up with an authenticated sender.',
      risk:
        'The catch is the setting. A DMARC policy at p=none is monitor only: it reports who is sending as you, but it tells receivers to take no action, so it blocks nobody from impersonating you. Many businesses have DMARC stuck on p=none and believe the job is done. It looks finished, but spoofing still gets straight through.',
      fix:
        'Publishing a basic DMARC record takes minutes, but monitor only is not the goal, it is the floor. The setting that actually stops impersonation is p=quarantine (sends fakes to spam) and then p=reject (refuses them outright). Getting there safely is the one part that is not a five-minute job: it needs a monitoring period first so none of your own legitimate email (invoicing systems, newsletters, CRMs) gets caught in the net. You can monitor DMARC for free using tools that turn the raw reports into a readable dashboard, then tighten the policy in stages. This is the part most worth doing properly rather than rushing, and it is exactly what we include and manage for every client.',
    },
  ],
  bonusHeading: 'Two extra layers worth knowing about (also free to set up)',
  bonus: [
    {
      name: 'MTA-STS',
      plain:
        'MTA-STS is a rule that forces email being sent to your domain to travel encrypted, so it is much harder to quietly intercept or downgrade in transit. It is two pieces: a small DNS record, plus a short policy file served over HTTPS at a web address on your domain. It is meaningfully more work than SPF or DKIM because that policy file has to sit on a web address with a valid security certificate, and your mail platform will not host it for you (Microsoft 365 explicitly does not).',
      fix:
        'There is no licence fee. The only potential cost is hosting that small policy file, which can be done for free using something like a Cloudflare Worker or an Azure Static Web App. Best practice is to start in testing mode and switch to enforce once it is validated. Fresh Tech sets this up and includes it for clients.',
    },
    {
      name: 'DNSSEC',
      plain:
        "DNSSEC is cryptographic protection for your DNS records themselves, so criminals cannot forge your DNS to hijack your email or your website. It has also gained a sharper edge recently: from 15 March 2026, certificate authorities must validate DNSSEC whenever a domain has it switched on. If your domain has no DNSSEC, nothing changes and your security certificates carry on as normal. But if DNSSEC is switched on and set up wrongly, it can now block your website's security certificate from renewing. The takeaway is not 'rush to turn it on', it is 'if it is on, it must be done properly'.",
      fix:
        'It is free to switch on at most mainstream DNS providers and registrars. With Cloudflare it is effectively one click on any plan, including the free one, and providers like Namecheap and Porkbun make it straightforward too. The honest caveat: not every budget registrar makes it easy, so on a cheaper provider it can be more fiddly. Fresh Tech sets this up properly and monitors it for clients, rather than leaving it half-done.',
    },
  ],
  deliverabilityHeading: 'This is not just security. It is whether your own email gets delivered',
  deliverabilityBody: [
    'In February 2024, Google (Gmail) and Yahoo rolled out new requirements for the people who send email to their users. They are still in force in 2026, and enforcement has tightened, not relaxed. Microsoft followed with the same baseline for its consumer mailboxes (outlook.com, hotmail.com, live.com), enforced from 5 May 2025.',
    "Here is how the rules actually break down, so you know where you stand. Every sender into Gmail and Yahoo needs at least SPF or DKIM. The full SPF, DKIM and DMARC requirement becomes a hard mandate once you are a bulk sender, defined as sending around 5,000 or more messages a day to those providers' personal mailboxes. Most small businesses are nowhere near that line, so the strict mandate may not apply to you directly.",
    'But, and this is the part that matters for everyone, the same checks now drive how all three providers judge whether your everyday email is trustworthy. Even well below the bulk threshold, weak or missing SPF, DKIM and DMARC make your own genuine email more likely to land in customers\' spam folders. So this is not only about stopping impersonators. It is about your quotes, invoices and replies actually reaching the inbox.',
    'The direction of travel is one way. Google moved from temporarily delaying non-compliant bulk mail to rejecting it outright in late 2025. Microsoft routes non-compliant high-volume mail (around 5,000 or more messages a day to its consumer mailboxes) to the Junk folder and has said outright rejection will follow. Across all three providers, authentication is becoming the baseline for getting delivered at all.',
  ],
  diyHeading: 'How to fix the basics yourself (or hand these steps to your IT)',
  diyIntro:
    'The basics, SPF and DKIM, really are about a five-minute job for whoever runs your email and DNS. You do not need to be technical to understand what should happen; you just need to know what to ask for. Here is the short version. One honest note up front: getting DMARC all the way to enforcement is the one part that is not five minutes, and that is covered in its own section below.',
  diySteps: [
    'Find out who controls your DNS and your email platform. DNS is usually at your domain registrar or a provider like Cloudflare. Email is almost always Microsoft 365 or Google Workspace. Whoever has the admin login does these jobs.',
    'Publish your SPF record. On Microsoft 365 this is a single TXT record, typically v=spf1 include:spf.protection.outlook.com -all. On Google Workspace it is v=spf1 include:_spf.google.com ~all. Only one SPF record is allowed per domain, and it must list every service that legitimately sends mail for you.',
    'Turn on DKIM for your own domain. On Microsoft 365, go to the Microsoft Defender portal (security.microsoft.com), publish the two CNAME records it gives you, and flip the DKIM toggle. Important: your custom domain is not signed until you do this, even though the built-in onmicrosoft.com address is. On Google Workspace, open the Admin console, generate a DKIM key, publish the one TXT record, then click Start authentication.',
    'Allow time for the changes to take effect. DNS updates can take a little while to register, sometimes up to a day or two, so do not panic if a checker does not show green within minutes.',
    'Confirm it worked. Run a free email security checker against your domain to see SPF and DKIM passing on your own domain (not just the onmicrosoft.com or gappssmtp.com default).',
    'Start DMARC, then plan the climb to enforcement. Publishing a starter DMARC record is quick, but monitor only blocks nothing, so treat that as day one, not done. See the DMARC section below for how to move it up safely.',
  ],
  dmarcHeading: 'DMARC: the one that actually blocks impersonation, done properly',
  dmarcBody: [
    'Publishing a basic DMARC record is itself quick: one TXT record. The trap is leaving it on p=none, which is monitor only. At p=none, DMARC reports who is sending as your domain but tells receivers to take no action, so it blocks nobody. Google and Yahoo accept p=none as a starting point to clear their check, which is fine, but clearing the mailbox-provider minimum is not the same as being protected. Monitor only is the floor, not the goal.',
    'To actually stop someone forging your exact domain, the policy has to move up to p=quarantine (fakes go to spam) and then p=reject (fakes are refused outright). That is the part that needs care, because rushing it can block your own legitimate email. The safe approach is to publish DMARC, collect reports for a monitoring period, identify and fix every genuine sender (your accounts software, newsletter tool, CRM and the like), then tighten the policy in stages. A sensible monitoring window is usually several weeks to a few months.',
    "The good news is you can monitor DMARC for free. Cloudflare's DMARC Management tool turns the raw report XML into a readable dashboard showing which senders are passing or failing, and it is free with no report or domain limits for anyone using Cloudflare DNS (including the free plan). It is not the only option: Postmark offers a free weekly DMARC digest by email, and Valimail and dmarcian both have free tiers. Free tiers vary, some give a full dashboard, others just a weekly summary, and some cap the number of domains.",
    'This staged rollout to full enforcement is exactly the sort of thing that gets started and then forgotten on a monitor-only setting. Fresh Tech includes DMARC management for every client: we get it to enforcement safely and keep an eye on the reports so it stays there.',
  ],
  questionsHeading: 'Questions worth asking whoever looks after your IT',
  questionsIntro:
    "None of this is an attack on whoever set your domain up, including if that was you. It is genuinely invisible until something goes wrong, and it is easy to overlook. Think of the list below as what good looks like. If any answer is a no or an 'I'm not sure', treat it as an opportunity to sort one quick thing, not a panic. For what it is worth, this is exactly the sort of thing we pick up on day one when we onboard a new client, so finding a gap here is normal, not a disaster.",
  questions: [
    'Do we have an SPF record published, and does it list every service that sends email for us?',
    'Is DKIM switched on for our own domain, not just the default onmicrosoft.com or Google address?',
    'Do we have a DMARC record, and is it set to quarantine or reject rather than left on monitor only (p=none)?',
    'If DMARC is on monitor only, what is the plan and timeline to move it safely to enforcement?',
    'Are we keeping an eye on our DMARC reports, so we know who is sending as us?',
    'Have we set up MTA-STS and DNSSEC, the two extra free layers, or is there a reason we have not yet?',
    'It can be reassuring to see SPF, DKIM and DMARC all passing on our own domain; a free checker will show this, or our IT can confirm it for us.',
  ],
  impersonationHeading: 'The next layer up: catching the fakes authentication cannot',
  impersonationBody: [
    'The free DNS records (SPF, DKIM and DMARC) stop other people forging your exact domain and help your own mail get delivered. That is the foundation, and it is genuinely the basics. But there is a layer above it that catches the close-but-not-exact fakes, the ones that do not use your exact domain and so slip past authentication entirely.',
    'This is where Microsoft 365 Business Premium earns its place. It includes Microsoft Defender for Office 365 Plan 1 as standard, on top of the basic anti-spam and spoofing protection that comes with every mailbox. That adds impersonation protection: it can spot an attacker pretending to be a specific person (for example a fake message in your finance director\'s name) or using a lookalike domain (for example fresh-teoh.uk in place of fresh-tech.uk), and act on those messages. It also adds Safe Links, which re-checks a link at the moment you click it and blocks it if it has turned malicious, and Safe Attachments, which opens incoming attachments in a sealed sandbox first to catch brand-new malware.',
    'Business Premium also includes Microsoft Entra ID P1, which brings Conditional Access: sign-in rules such as requiring multi-factor authentication or blocking logins from unrecognised devices, so a stolen password alone is much less likely to get someone in. In short: the free DNS records harden your domain; Business Premium hardens the mailbox and the login. We cover how it compares on our [Microsoft 365 Business Premium page](/microsoft-business-premium). One honest note: impersonation protection is not configured by default, an admin has to set it up, which is, again, exactly the kind of thing we sort on day one.',
  ],
  ctaHeading: 'Want to know where your domain actually stands?',
  ctaBody:
    'If you would like to check your own setup, our [free email security check](/email-security-check) tests your live domain in about twenty seconds: the three core settings (SPF, DKIM and DMARC) plus the two extra layers (MTA-STS and DNSSEC), with each result explained in plain English. It is read-only, so it changes nothing. If you would rather we confirmed the findings and sorted any gaps for you, book a quick call and we will walk you through it. No hard sell: most people just want to know whether the door is open. You can also read the deeper explainer on [how SPF, DKIM and DMARC work](/technology/email-authentication), or, if you are worried about invoice and payment fraud specifically, our guide to [business email compromise](/business-email-compromise).',
  ctaPrimaryLabel: 'Run my free email security check',
} as const;

// Renders inline markdown links [label](url) as router Links (internal) or
// anchors (external). Everything else passes through as plain text.
const linkRe = /\[([^\]]+)\]\(([^)]+)\)/g;
const RichText: React.FC<{ text: string }> = ({ text }) => {
  const parts: React.ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  linkRe.lastIndex = 0;
  while ((m = linkRe.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const [, label, url] = m;
    const style: React.CSSProperties = { color: T.primaryDark, fontWeight: 700 };
    parts.push(
      url.startsWith('/')
        ? <Link key={m.index} to={url} style={style}>{label}</Link>
        : <a key={m.index} href={url} style={style} target="_blank" rel="noopener noreferrer">{label}</a>
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts}</>;
};

export const EmailSecurityGuidePageV2: React.FC = () => {
  const ww = useWindowWidth();
  const isMobile = ww < 768;
  const isTablet = ww < 1024;
  const [calOpen, setCalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const maxW = useContentMax(1040);

  const ctaStyle: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    padding: '14px 24px',
    background: T.accent, color: readableOn(T.accent),
    border: `2px solid ${T.white}`,
    fontFamily: "'Archivo', sans-serif", fontWeight: 700, fontSize: 15,
    cursor: 'pointer', textDecoration: 'none',
    boxShadow: `4px 4px 0 0 ${T.yellow}`,
  };

  const para: React.CSSProperties = { color: 'rgba(15,25,35,0.72)', fontSize: 16, lineHeight: 1.7, margin: '0 0 16px' };

  const copyQuestions = () => {
    const text = COPY.questions.map((q, i) => `${i + 1}. ${q}`).join('\n');
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }).catch(() => {});
  };

  const pillarColor = (name: string) => (name === 'DMARC' ? T.accent : name === 'DKIM' ? T.primary : T.green);

  return (
    <>
      <SEO title={COPY.seoTitle} description={COPY.seoDescription} type="article" />

      {/* HERO */}
      <section style={{
        background: T.ink,
        padding: isMobile ? '56px 20px 64px' : '76px 32px 84px',
        ...halftoneCss('rgba(255,255,255,0.04)', 1.4, 13),
      }}>
        <div style={{ maxWidth: maxW, margin: '0 auto' }}>
          <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
            <Sticker rotate={-3} color={T.green} fg="#fff">Free to fix</Sticker>
            <Sticker rotate={2}>Plain English, no jargon</Sticker>
            <Sticker rotate={-2} color={T.primaryDark} fg="#fff">Not a sales pitch</Sticker>
          </div>
          <DisplayHead as="h1" size={isMobile ? 32 : 46} light style={{ marginBottom: 22, lineHeight: 1.02, maxWidth: '20ch' }}>
            {COPY.heroH1}
          </DisplayHead>
          <p style={{ color: 'rgba(255,255,255,0.72)', fontSize: isMobile ? 17 : 19, lineHeight: 1.6, margin: '0 0 18px', maxWidth: '60ch' }}>
            {COPY.heroSub}
          </p>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 15, lineHeight: 1.65, margin: '0 0 28px', maxWidth: '64ch' }}>
            {COPY.heroNote}
          </p>
          <a href="#checker" style={ctaStyle}>{COPY.ctaPrimaryLabel} ↓</a>
        </div>
      </section>

      {/* SPOOF EYE-OPENER */}
      <section style={{ background: T.paper, padding: isMobile ? '48px 20px' : '64px 32px', borderBottom: `1px solid ${T.hairline}` }}>
        <div style={{ maxWidth: maxW, margin: '0 auto' }}>
          <div style={{
            background: T.white,
            border: `2px solid ${T.ink}`,
            borderLeft: `8px solid ${T.red}`,
            boxShadow: `6px 6px 0 0 ${T.ink}`,
            padding: isMobile ? '24px 22px' : '36px 40px',
          }}>
            <Eyebrow style={{ color: T.red }}>The bit nobody shows you</Eyebrow>
            <DisplayHead size={isMobile ? 26 : 34} style={{ marginBottom: 18, lineHeight: 1.05 }}>{COPY.spoofHeading}</DisplayHead>
            {COPY.spoofBody.map((p, i) => (
              <p key={i} style={{ ...para, marginBottom: i === COPY.spoofBody.length - 1 ? 0 : 16, color: 'rgba(15,25,35,0.78)' }}>{p}</p>
            ))}
          </div>
        </div>
      </section>

      {/* INTERACTIVE CHECKER */}
      <section id="checker" style={{ background: T.paperDeep, padding: isMobile ? '48px 20px' : '64px 32px', borderBottom: `1px solid ${T.hairline}`, scrollMarginTop: 80 }}>
        <div style={{ maxWidth: maxW, margin: '0 auto 28px', textAlign: 'center' }}>
          <Eyebrow style={{ textAlign: 'center', color: T.primaryDark }}>See it for yourself</Eyebrow>
          <DisplayHead size={isMobile ? 26 : 34} style={{ marginBottom: 10 }}>Check your own domain first</DisplayHead>
          <p style={{ ...para, margin: '0 auto', maxWidth: '54ch' }}>
            Read-only and instant. Enter your work email and we will read your live public records, then explain each result in plain English. Nothing is changed, and nothing is sent as you.
          </p>
        </div>
        <EmailCheckerTool onBookCall={() => setCalOpen(true)} />
      </section>

      {/* THE THREE */}
      <section style={{ background: T.paper, padding: isMobile ? '56px 20px' : '76px 32px', borderBottom: `1px solid ${T.hairline}` }}>
        <div style={{ maxWidth: maxW, margin: '0 auto' }}>
          <div style={{ marginBottom: 36 }}>
            <Eyebrow style={{ color: T.primaryDark }}>The three that matter</Eyebrow>
            <DisplayHead size={isMobile ? 30 : 40} style={{ marginBottom: 12 }}>SPF, DKIM and DMARC, demystified</DisplayHead>
            <p style={{ ...para, maxWidth: '60ch' }}>
              These are the minimum to stop someone spoofing your email. Two of them are free, built in and quick. The third is the one that actually does the blocking, and the one most often left half-done.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {COPY.pillars.map((p) => (
              <div key={p.name} style={{
                background: T.white,
                border: `2px solid ${T.ink}`,
                boxShadow: `5px 5px 0 0 ${T.ink}`,
                padding: isMobile ? '22px 20px' : '30px 34px',
                borderTop: `6px solid ${pillarColor(p.name)}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, flexWrap: 'wrap', marginBottom: 6 }}>
                  <span style={{ fontFamily: "'Bungee', sans-serif", fontSize: isMobile ? 24 : 30, color: pillarColor(p.name) }}>{p.name}</span>
                  <span style={{ fontFamily: "'Archivo', sans-serif", fontSize: 15, fontWeight: 700, color: T.ink }}>{p.tag}</span>
                </div>
                <p style={{ fontSize: 14, fontStyle: 'italic', color: 'rgba(15,25,35,0.6)', margin: '0 0 16px', lineHeight: 1.6 }}>{p.analogy}</p>
                <p style={para}>{p.plain}</p>
                <div style={{ display: 'grid', gridTemplateColumns: isTablet ? '1fr' : '1fr 1fr', gap: 16, marginTop: 6 }}>
                  <div style={{ background: 'rgba(200,68,58,0.06)', border: `1px solid rgba(200,68,58,0.25)`, padding: '14px 16px' }}>
                    <div style={{ fontFamily: "'Archivo Narrow', sans-serif", fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, color: T.redInk, marginBottom: 6 }}>What happens without it</div>
                    <div style={{ fontSize: 14, color: T.ink, lineHeight: 1.6 }}>{p.risk}</div>
                  </div>
                  <div style={{ background: 'rgba(46,125,91,0.06)', border: `1px solid rgba(46,125,91,0.25)`, padding: '14px 16px' }}>
                    <div style={{ fontFamily: "'Archivo Narrow', sans-serif", fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, color: T.green, marginBottom: 6 }}>How to fix it</div>
                    <div style={{ fontSize: 14, color: T.ink, lineHeight: 1.6 }}>{p.fix}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BONUS LAYERS */}
      <section style={{ background: T.paperDeep, padding: isMobile ? '56px 20px' : '72px 32px', borderBottom: `1px solid ${T.hairline}` }}>
        <div style={{ maxWidth: maxW, margin: '0 auto' }}>
          <div style={{ marginBottom: 32 }}>
            <Eyebrow style={{ color: T.primaryDark }}>Nice to have</Eyebrow>
            <DisplayHead size={isMobile ? 26 : 34} style={{ marginBottom: 12 }}>{COPY.bonusHeading}</DisplayHead>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: 18 }}>
            {COPY.bonus.map((b) => (
              <div key={b.name} style={{ background: T.white, border: `1px solid ${T.hairline}`, padding: '24px 26px', boxShadow: '0 2px 8px rgba(15,25,35,0.04)' }}>
                <div style={{ fontFamily: "'Bungee', sans-serif", fontSize: 20, marginBottom: 12, color: T.ink }}>{b.name}</div>
                <p style={{ ...para, fontSize: 15 }}>{b.plain}</p>
                <div style={{ fontFamily: "'Archivo Narrow', sans-serif", fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, color: T.primaryDark, marginBottom: 4 }}>The cost and effort</div>
                <p style={{ ...para, fontSize: 15, marginBottom: 0 }}>{b.fix}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DELIVERABILITY */}
      <section style={{ background: T.paper, padding: isMobile ? '56px 20px' : '72px 32px', borderBottom: `1px solid ${T.hairline}` }}>
        <div style={{ maxWidth: maxW, margin: '0 auto' }}>
          <div style={{ marginBottom: 24 }}>
            <Eyebrow style={{ color: T.primaryDark }}>Not just security</Eyebrow>
            <DisplayHead size={isMobile ? 26 : 36} style={{ marginBottom: 4 }}>{COPY.deliverabilityHeading}</DisplayHead>
          </div>
          {COPY.deliverabilityBody.map((p, i) => <p key={i} style={para}>{p}</p>)}
        </div>
      </section>

      {/* DIY STEPS */}
      <section style={{ background: T.paperDeep, padding: isMobile ? '56px 20px' : '72px 32px', borderBottom: `1px solid ${T.hairline}` }}>
        <div style={{ maxWidth: maxW, margin: '0 auto' }}>
          <div style={{ marginBottom: 22 }}>
            <Eyebrow style={{ color: T.primaryDark }}>Do it yourself</Eyebrow>
            <DisplayHead size={isMobile ? 26 : 36} style={{ marginBottom: 12 }}>{COPY.diyHeading}</DisplayHead>
            <p style={{ ...para, maxWidth: '62ch' }}>{COPY.diyIntro}</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {COPY.diySteps.map((s, i) => (
              <div key={i} style={{ display: 'flex', gap: 16, background: T.white, border: `1px solid ${T.hairline}`, padding: '16px 18px', alignItems: 'flex-start' }}>
                <span style={{ fontFamily: "'Bungee', sans-serif", fontSize: 22, color: T.primaryDark, lineHeight: 1, flexShrink: 0, minWidth: 34 }}>{String(i + 1).padStart(2, '0')}</span>
                <span style={{ fontSize: 15, color: T.ink, lineHeight: 1.65 }}>{s}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DMARC DEEP DIVE */}
      <section style={{ background: T.paper, padding: isMobile ? '56px 20px' : '72px 32px', borderBottom: `1px solid ${T.hairline}` }}>
        <div style={{ maxWidth: maxW, margin: '0 auto' }}>
          <div style={{ marginBottom: 24 }}>
            <Eyebrow style={{ color: T.primaryDark }}>The one that does the blocking</Eyebrow>
            <DisplayHead size={isMobile ? 26 : 36} style={{ marginBottom: 4 }}>{COPY.dmarcHeading}</DisplayHead>
          </div>
          {COPY.dmarcBody.map((p, i) => <p key={i} style={para}><RichText text={p} /></p>)}
        </div>
      </section>

      {/* QUESTIONS FOR IT */}
      <section style={{ background: T.ink, padding: isMobile ? '56px 20px' : '72px 32px', borderBottom: `1px solid ${T.hairline}`, ...halftoneCss('rgba(255,255,255,0.04)', 1.4, 14) }}>
        <div style={{ maxWidth: maxW, margin: '0 auto' }}>
          <div style={{ marginBottom: 22 }}>
            <Eyebrow light>A polite nudge</Eyebrow>
            <DisplayHead size={isMobile ? 26 : 36} light style={{ marginBottom: 12 }}>{COPY.questionsHeading}</DisplayHead>
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 16, lineHeight: 1.7, margin: 0, maxWidth: '64ch' }}>{COPY.questionsIntro}</p>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', padding: isMobile ? '20px' : '28px 30px' }}>
            <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {COPY.questions.map((q, i) => (
                <li key={i} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <span style={{ fontFamily: "'Bungee', sans-serif", fontSize: 15, color: T.yellow, lineHeight: 1.4, flexShrink: 0, minWidth: 22 }}>{i + 1}</span>
                  <span style={{ color: 'rgba(255,255,255,0.88)', fontSize: 15, lineHeight: 1.6 }}>{q}</span>
                </li>
              ))}
            </ol>
            <button onClick={copyQuestions} style={{
              marginTop: 22, display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '10px 18px', background: copied ? T.green : 'transparent', color: T.white,
              border: `2px solid ${copied ? T.green : 'rgba(255,255,255,0.4)'}`,
              fontFamily: "'Archivo', sans-serif", fontWeight: 700, fontSize: 14, cursor: 'pointer',
            }}>
              {copied ? 'Copied to clipboard ✓' : 'Copy these questions'}
            </button>
          </div>
        </div>
      </section>

      {/* IMPERSONATION / NEXT LAYER */}
      <section style={{ background: T.paper, padding: isMobile ? '56px 20px' : '72px 32px', borderBottom: `1px solid ${T.hairline}` }}>
        <div style={{ maxWidth: maxW, margin: '0 auto' }}>
          <div style={{ marginBottom: 24 }}>
            <Eyebrow style={{ color: T.primaryDark }}>Beyond the free basics</Eyebrow>
            <DisplayHead size={isMobile ? 26 : 36} style={{ marginBottom: 4 }}>{COPY.impersonationHeading}</DisplayHead>
          </div>
          {COPY.impersonationBody.map((p, i) => <p key={i} style={para}><RichText text={p} /></p>)}
        </div>
      </section>

      {/* FINAL CTA */}
      <section style={{ background: T.ink, padding: isMobile ? '60px 20px' : '80px 32px', ...halftoneCss('rgba(255,255,255,0.04)', 1.4, 14) }}>
        <div style={{ maxWidth: 760, margin: '0 auto', textAlign: 'center' }}>
          <Eyebrow light>No obligation</Eyebrow>
          <DisplayHead size={isMobile ? 30 : 40} light style={{ marginBottom: 16 }}>{COPY.ctaHeading}</DisplayHead>
          <p style={{ color: 'rgba(255,255,255,0.72)', fontSize: 17, lineHeight: 1.7, margin: '0 auto 28px', maxWidth: '60ch' }}>
            <RichText text={COPY.ctaBody} />
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="#checker" style={ctaStyle}>{COPY.ctaPrimaryLabel} ↑</a>
            <button onClick={() => setCalOpen(true)} style={{ ...ctaStyle, background: 'transparent', color: T.white, border: '2px solid rgba(255,255,255,0.4)', boxShadow: 'none' }}>Book a 15-min call →</button>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, marginTop: 18 }}>
            Prefer to talk? Call <a href="tel:+441584517234" style={{ color: T.yellow }}>01584 517 234</a>.
          </p>
        </div>
        <LastReviewed light />
      </section>

      <CalendlyModal isOpen={calOpen} onClose={() => setCalOpen(false)} />
    </>
  );
};

export default EmailSecurityGuidePageV2;

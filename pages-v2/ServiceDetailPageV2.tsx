import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { SEO } from '../components/SEO';
import { services } from '../data/content';
import { T, useWindowWidth, contentMax, Eyebrow, DisplayHead } from '../components-v2/primitives';
import { LastReviewed } from '../components-v2/LastReviewed';

const halftoneCss = (color: string, dot = 1.4, grid = 12) => ({
  backgroundImage: `radial-gradient(${color} ${dot}px, transparent ${dot}px)`,
  backgroundSize: `${grid}px ${grid}px`,
});

const Tick: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <circle cx="9" cy="9" r="9" fill={T.green} fillOpacity="0.15" />
    <path d="M5 9l3 3 5-6" stroke={T.green} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Per-service content. Each service gets its own includes/outcomes/how/faqs
// so /services/cyber-essentials doesn't read like /services/managed-it-support.
interface ServiceContent {
  tagline: string;
  heroStat: { num: string; label: string };
  priceFrom?: number | null;
  priceNote: string;
  includes: string[];
  howItWorks: { step: string; title: string; desc: string }[];
  outcomes: { stat: string; label: string }[];
  faqs: [string, string][];
}

const FALLBACK: ServiceContent = {
  tagline: 'One flat fee. One number to call.',
  heroStat: { num: '14min', label: 'Avg response · live from helpdesk' },
  priceFrom: 35,
  priceNote: 'per user / month · all-inclusive',
  includes: [
    'Unlimited helpdesk: phone, email, remote',
    '24/7 proactive device monitoring',
    'Microsoft 365 management',
    'Cyber Essentials (AV + patch management)',
    'New user setup & leaver offboarding',
    'Vendor management (BT, printers, broadband)',
    'Quarterly strategy reviews',
  ],
  howItWorks: [
    { step: '01', title: 'We audit your setup', desc: 'Remote scan of every device, security posture, and licences. You get a plain-English report, yours to keep.' },
    { step: '02', title: 'We set up monitoring', desc: 'Remote monitoring tools on every device. We see problems before your team does, and fix most before anyone notices.' },
    { step: '03', title: 'You call. We answer.',  desc: 'One number. A real person in Ludlow picks up. Avg wait under 1 minute. Avg first response under 15 minutes.' },
    { step: '04', title: 'We review and plan',    desc: 'Quarterly strategy calls. Renewals, upgrades and risks tracked for you.' },
  ],
  outcomes: [
    { stat: 'Zero',  label: 'Unplanned outages for clients on proactive monitoring' },
    { stat: '14min', label: 'Average first response: measured, not promised' },
    { stat: '£34k+', label: 'Saved vs equivalent in-house IT (20-user example)' },
    { stat: '5yrs+', label: 'Average client relationship length' },
  ],
  faqs: [
    ["What's the contract length?", '12 months, with a 30-day money-back guarantee in the first month. After the initial term, rolling quarterly.'],
    ['Do we need to replace all our hardware?', "No. We audit what you have and tell you what needs replacing, what can wait, and what's fine. We're not trying to sell you kit."],
  ],
};

const SERVICE_CONTENT: Record<string, ServiceContent> = {
  'managed-it-support': {
    tagline: 'Your outsourced IT department.',
    heroStat: { num: 'Zero', label: 'Unplanned outages for clients on proactive monitoring' },
    priceFrom: 35,
    priceNote: 'per user / month · all-inclusive',
    includes: [
      'Unlimited helpdesk: call, email, chat. No ticking clock',
      'Zero-touch laptop setup via Microsoft Intune + Autopilot',
      '24/7 remote monitoring: we spot disk + drive failures before you do',
      'Automated patching (Windows + 3rd-party apps like Chrome, Adobe)',
      'Remote wipe + lock for lost or stolen devices',
      'Vendor liaison: we deal with BT, Microsoft, software vendors',
      'Quarterly strategy reviews with Sam or Matt',
    ],
    howItWorks: [
      { step: '01', title: 'We audit your setup', desc: "Remote scan of every device, security posture, licences. You get a plain-English report, yours to keep regardless." },
      { step: '02', title: 'Deploy monitoring',    desc: 'Monitoring agents on every device, running 24/7. Alerts on low disk, failing drives, security events, we fix most in the background.' },
      { step: '03', title: 'You call. We answer',  desc: "One number. A real person in Ludlow picks up. We don't use scripts, we use common sense." },
      { step: '04', title: 'Review + plan',         desc: 'Quarterly strategy calls. Renewals, upgrades and risks tracked for you so your roadmap matches your business plans.' },
    ],
    outcomes: [
      { stat: 'Zero',  label: 'Unplanned outages on proactive monitoring' },
      { stat: '14min', label: 'Average first response: measured, not promised' },
      { stat: 'Fixed', label: 'Monthly fee: we only profit when systems run perfectly' },
      { stat: '5yrs+', label: 'Average client relationship length' },
    ],
    faqs: [
      ['Why a managed model and not break-fix?',
        "With break-fix, your provider only makes money when something's broken. With a fixed monthly fee, we only profit when your systems are running perfectly. That incentivises us to fix root causes, not patch symptoms."],
      ['Can you support our existing in-house IT person?',
        "Yes, and we do this regularly. We handle the day-to-day helpdesk and proactive maintenance, freeing your in-house person up for strategic and project work. We agree the split upfront."],
      ['What if a laptop gets lost?',
        'We can issue a remote wipe or lock command via Intune. The next time the device connects to the internet, it locks or wipes, no recovery possible.'],
    ],
  },

  'cybersecurity': {
    tagline: 'Proper protection for businesses your size: the same controls big firms run, set up to fit you.',
    heroStat: { num: '24/7', label: 'Security team watching for threats, real humans' },
    priceFrom: null,
    priceNote: 'Included on every plan (Standard, Plus, Premium)',
    includes: [
      'Application Control (Ringfencing): no unknown software runs by default',
      'Managed EDR (Endpoint Detection & Response): round-the-clock threat watching by a real security team, not just automated alerts',
      'Conditional Access for Microsoft 365: the digital bouncer on your sign-ins',
      'ITDR (Identity Threat Detection & Response): catches compromised logins before they spread',
      'Multi-Factor Authentication (MFA) enforced on every account',
      'Admin elevation control: approve updates without handing out admin power',
      'Phishing protection + staff awareness training',
    ],
    howItWorks: [
      { step: '01', title: 'Posture audit',     desc: 'We check every device, every M365 account, every firewall rule. Risk-ranked plain-English report.' },
      { step: '02', title: 'Layered defence',    desc: 'Application Control + EDR + Conditional Access + ITDR. We assume a breach could happen and put the locks in place to stop it spreading.' },
      { step: '03', title: 'Train your team',    desc: '5-minute videos + phishing simulations. Tracked so you can see who needs a nudge.' },
      { step: '04', title: '3AM lockdown',        desc: "If an attacker compromises an account at 3am from another country, ITDR (Identity Threat Detection & Response) spots the anomaly and locks the account before any damage is done." },
    ],
    outcomes: [
      { stat: '99%',  label: 'Of account-compromise attacks stopped by Conditional Access' },
      { stat: 'MFA',  label: 'On every account from day one' },
      { stat: '24/7', label: 'Security team watching, day and night' },
      { stat: '0',    label: 'Successful ransomware events on protected clients' },
    ],
    faqs: [
      ['Is antivirus enough?',
        "No. Traditional AV misses around 60% of modern attacks because it only checks files against a known list. EDR (Endpoint Detection & Response) watches for bad behaviour, so when an attacker runs a malicious script, the security team spots it and shuts it down."],
      ['What is Application Control / Ringfencing?',
        "By default, NO unknown software can run on your PCs. We approve what your team genuinely needs, and block everything else. It stops ransomware dead in its tracks: the malware can't execute even if a user clicks the link."],
      ["Don't users hate having to ask for admin rights?",
        'They would, so we automate it. We allow the specific app (e.g. Zoom) to update, without giving the user full admin power. They get the prompt-free experience, you keep the security.'],
    ],
  },

  'cyber-essentials': {
    tagline: 'The Gold Standard for UK business security.',
    heroStat: { num: '80%', label: 'Of common cyber attacks blocked by the controls' },
    priceFrom: null,
    priceNote: 'Fixed-price project · price depends on size + CE vs CE+',
    includes: [
      'Pre-assessment to fix any issues before the official audit',
      'All five technical controls covered: firewalls, secure configuration, user access, malware protection, patch management',
      'Policy pack: ready-made password, access and mobile-device policies',
      'Free cyber insurance on certification (UK businesses, subject to revenue limits)',
      'Blockmark digital trust badge for your website + email footer',
      'Cyber Essentials Plus available: hands-on technical audit by external assessor',
      'Annual re-certification managed for you',
    ],
    howItWorks: [
      { step: '01', title: 'Scope + audit',  desc: "We agree the scope and run a pre-assessment. Most businesses fail at the first attempt without this, we don't." },
      { step: '02', title: 'Fix the gaps',    desc: 'Common issues: missing MFA, out-of-date software, default admin accounts, unencrypted laptops. We remediate everything.' },
      { step: '03', title: 'Submit',         desc: 'We assemble the evidence pack and submit on your behalf via our accredited assessor partner.' },
      { step: '04', title: 'Maintain',       desc: 'Annual re-certification managed for you. We track all five controls in the background.' },
    ],
    outcomes: [
      { stat: '80%',       label: 'Of common attacks blocked by the controls (NCSC figure)' },
      { stat: 'First-try', label: 'Guaranteed-pass service when we manage prep' },
      { stat: 'Free',      label: 'Cyber insurance on certification (terms apply)' },
      { stat: '5',         label: 'Technical controls: we help you nail all of them' },
    ],
    faqs: [
      ['CE vs Cyber Essentials Plus?',
        "Cyber Essentials (Standard) is a self-assessment questionnaire. You declare you meet the standards. Cyber Essentials Plus adds a hands-on technical audit where an external auditor scans your network and tests your defences to PROVE you meet them. CE+ is required for some regulated work and supplier contracts."],
      ['Do we have to write all the policies?',
        "No. We provide ready-made, CE-compliant templates for Password Policies, Access Control and Mobile Device usage. You don't write a thing; we adapt them to your business and you sign them off."],
      ['What if we fail?',
        "We won't let you. The pre-assessment catches issues before the official audit. We work with you until you pass; that's the guarantee."],
    ],
  },

  'cloud-solutions': {
    tagline: 'Work securely from anywhere.',
    heroStat: { num: '500', label: 'Versions of every document kept by SharePoint automatically' },
    priceFrom: null,
    priceNote: 'Microsoft 365 licences from £4.90/user · management included',
    includes: [
      'SharePoint migration: your file server, in the cloud',
      'Live co-authoring: two people in the same Excel sheet, seeing each other in real time',
      'Version control: 500 versions of every document, instant rollback',
      'Teams Phone: make landline calls from Teams on mobile, laptop or desk',
      'Secure link sharing with expiry: stop emailing attachments',
      'Server retirement planning: move to Entra ID, drop the physical server',
      'Conditional Access policies to secure access from anywhere',
    ],
    howItWorks: [
      { step: '01', title: 'Discovery',     desc: 'What you have, what you actually use, where the friction is. We never recommend a migration without knowing the answer.' },
      { step: '02', title: 'Design',         desc: 'Right-sized licences, SharePoint folder structure that maps to how you actually work, security baseline.' },
      { step: '03', title: 'Migrate',        desc: 'Email + files moved out of hours. Most users notice no disruption to their inbox or filing.' },
      { step: '04', title: 'Decommission',   desc: 'Old file server retired. Electricity, maintenance and ageing-hardware risk, gone.' },
    ],
    outcomes: [
      { stat: 'Live',  label: 'Co-authoring on Excel, Word, PowerPoint' },
      { stat: '500',   label: 'Versions of every document kept automatically' },
      { stat: '7-day', label: 'Expiring share links: you stay in control of data' },
      { stat: '£0',    label: 'Hardware costs once the file server retires' },
    ],
    faqs: [
      ['Does M365 back up our data?',
        "No, not in the way you'd want. Microsoft replicates data for availability, but a deleted item past retention is gone. We add a third-party backup layer that keeps everything for years."],
      ['What about Teams Phone vs a separate phone system?',
        "Teams Phone is great if you live in Teams and want one app for messages + calls. A hosted PBX like Yeastar is more flexible for ring groups, IVR menus and call recording. We help you pick: see our [phone systems](/services/cloud-phone-systems) page."],
      ['Can you sort our SharePoint mess?',
        "Yes, and we usually find clients have been paying for Plan 2 when Plan 1 + Business Premium is enough. We right-size as part of the project."],
    ],
  },

  'backup-disaster-recovery': {
    tagline: 'Your data, protected. Your business, resilient.',
    heroStat: { num: '3-2-1', label: 'Backup rule: 3 copies, 2 media, 1 offsite' },
    priceFrom: null,
    priceNote: 'Per-device monthly fee · scales with what you protect',
    includes: [
      'Microsoft 365 backup: SharePoint, OneDrive, Teams, Exchange (years not days)',
      'Immutable storage: once written, cannot be modified or deleted, even by hackers',
      'Air-gapped option: physically disconnected from your network',
      'Quarterly tested restores with a written restore report',
      'Granular file recovery + full bare-metal server restore',
      'RTO / RPO defined per client: we design to your tolerances',
      'Business continuity runbook documented per site',
    ],
    howItWorks: [
      { step: '01', title: 'Define RTO + RPO',   desc: 'How much data can you afford to lose (RPO)? How fast do you need to recover (RTO)? We design to those targets, in your budget.' },
      { step: '02', title: 'Deploy + automate', desc: 'Backup agents on every machine. Cloud + on-prem options. Automated, encrypted, immutable.' },
      { step: '03', title: 'Test quarterly',     desc: "An untested backup isn't a backup. We restore samples every quarter and give you a written report proving it works." },
      { step: '04', title: 'Recover fast',       desc: 'If the worst happens, you call us. We restore from the cleanest pre-incident snapshot, usually within hours.' },
    ],
    outcomes: [
      { stat: '3-2-1',     label: 'Industry-standard backup rule, enforced for you' },
      { stat: 'Immutable', label: 'Storage: even attackers with admin access cannot delete it' },
      { stat: 'Quarterly', label: 'Tested restore: proof, not assumption' },
      { stat: '0',         label: 'Successful ransomware destructions on protected clients' },
    ],
    faqs: [
      ['Does Microsoft back up our M365 data?',
        "Not really. Microsoft's SLA covers availability of the service, not your data integrity. Deleted items past retention are gone forever, including mail rules an attacker creates, files an employee deletes by mistake, or a ransomware-encrypted mailbox."],
      ['What does RTO and RPO mean?',
        'Recovery Point Objective = how much data you can afford to lose between backups (we aim for ≤1 hour). Recovery Time Objective = how fast you need to be back up (varies by client, typically 2–4 hours for critical systems).'],
      ['What is an air-gapped backup?',
        "A backup copy that's physically disconnected from your network. Untouchable by hackers because there's literally no network path to it. We use this for high-risk environments."],
    ],
  },

  'strategic-projects': {
    tagline: 'Digital transformation without the drama.',
    heroStat: { num: '£0', label: 'Surprise invoices on a fixed-price scope' },
    priceFrom: null,
    priceNote: 'Fixed-price quote · agreed before we start',
    includes: [
      'Predictive WiFi + RF surveys using professional heatmapping software',
      'Office relocations: connectivity audit, server moves, comms cabinets',
      'Network infrastructure design built on Ubiquiti UniFi',
      'Structured cabling: Cat6/Cat6A with full documentation',
      'Pre-lease connectivity audits: we check broadband BEFORE you sign',
      'Dedicated project lead from start to formal sign-off',
      'Fixed-price quotes: no surprises, no time-and-materials creep',
    ],
    howItWorks: [
      { step: '01', title: 'Survey + scope',     desc: 'On-site survey, RF heatmap, connectivity check. We ask the questions vendors usually skip.' },
      { step: '02', title: 'Fixed-price quote',  desc: 'Itemised, in writing, with a clear scope boundary. You know the cost before you sign.' },
      { step: '03', title: 'Plan + deliver',     desc: 'Phased cutover, out-of-hours where needed, comms templates for your staff. Dedicated project lead throughout.' },
      { step: '04', title: 'Hand over',          desc: 'Documentation pack (network diagrams, IP scheme, credentials), training, and 30-day post-project warranty.' },
    ],
    outcomes: [
      { stat: '£0',     label: 'Hidden extras on a fixed-price scope' },
      { stat: 'Full',   label: 'WiFi coverage modelled with predictive RF heatmapping' },
      { stat: 'On-time', label: 'And on-budget: we sign off when YOU say it works' },
      { stat: 'Always', label: 'Documented handover: runbooks + credentials' },
    ],
    faqs: [
      ["What if the scope changes mid-project?",
        'We agree variations in writing first. No phone-call commitments that get billed later. The original fixed price stands for the original scope.'],
      ['Why a predictive WiFi survey?',
        "Don't just chuck WiFi points in willy-nilly. We model your walls, obstacles and interference sources in software to predict exactly where to place APs for full coverage. Saves money on unnecessary hardware and eliminates dead spots."],
      ['Can you audit a new office before we sign the lease?',
        "Yes, we'll check the broadband speeds at your new location BEFORE you commit, saving you from a 2Mbps nightmare. We also survey for 4G/5G backup options."],
    ],
  },

  // We DO mark up hardware. The Premier-partner channel + 5-year onsite warranty
  // + zero-touch deploy is the value — not "no markup".
  'hardware-procurement': {
    tagline: 'Dell Premier Partner. Enterprise gear, local expertise.',
    heroStat: { num: '5-Year', label: 'Onsite Warranty as standard on Dell Pro' },
    priceFrom: null,
    priceNote: 'Hardware quoted per device · zero-touch setup included on Plus and Premium',
    includes: [
      'Dell Premier Partner: volume pricing tiers retail cannot match',
      'Custom-spec to the role: Pro Base, Plus, Premium or Pro Max workstation',
      '5-Year Onsite Warranty (next-business-day, subject to parts availability) as standard',
      'We deploy Ubiquiti UniFi networking: single managed stack, no recurring licence fees',
      'Zero-touch deployment via Microsoft Intune + Autopilot',
      'Asset lifecycle managed: warranty tracking, GDPR wipe, certificate of destruction',
      'Drop-ship direct to remote workers: we never need to touch the box',
    ],
    howItWorks: [
      { step: '01', title: 'Specify',          desc: "We match the device to the role: a Sage user needs different kit to a CAD engineer. Pro Base, Plus, Premium or Pro Max workstation." },
      { step: '02', title: 'Order + pre-stage', desc: 'Ordered through the Dell Premier channel. Intune-enrolled for Autopilot before the box even ships.' },
      { step: '03', title: 'Drop-ship',         desc: 'The box arrives at the user. They log in once. M365, apps, Wi-Fi profiles, VPN, security policies, all there automatically.' },
      { step: '04', title: 'Lifecycle',         desc: 'Asset register kept current. At end of life: GDPR-grade wipe, certificate of destruction, responsible recycling.' },
    ],
    outcomes: [
      { stat: '5-Year', label: 'Onsite warranty: next-business-day, not collect-and-return' },
      { stat: '<2hr',   label: 'New user up and running after Autopilot enrolment' },
      { stat: 'One',    label: 'UniFi dashboard for gateway, switches and Wi-Fi' },
      { stat: 'GDPR',   label: 'Grade wipe + certificate of destruction at end of life' },
    ],
    faqs: [
      ['Why Dell Pro, not consumer kit?',
        "Consumer laptops have plastic chassis that crack within 18 months, 'Home' editions of Windows that can't join your domain, and a 1-year collect-and-return warranty meaning you're without the machine for weeks. Dell Pro is metal-chassis, MIL-STD tested, designed to run 8+ hours a day for 5+ years."],
      ['Why Ubiquiti UniFi over Cisco Meraki?',
        "Same single-pane-of-glass benefits, without the recurring licence fees. UniFi includes built-in threat management at no extra cost. You buy the hardware once and manage it forever."],
      ['Can we use our existing laptops?',
        "Yes, we audit what you have, recommend what to keep, what to replace, and what to retire. No sales pressure to refresh fleet for the sake of it."],
    ],
  },

  'cloud-phone-systems': {
    tagline: 'Your office number, anywhere.',
    heroStat: { num: '30–50%', label: 'Typical cost saving vs traditional phone systems' },
    priceFrom: null,
    priceNote: 'Per-extension monthly fee · own handsets outright, no rental traps',
    includes: [
      'Yeastar P Series Cloud PBX: full-feature, hosted, simple pricing',
      'Microsoft Teams Voice: calls direct from the Teams app on mobile + laptop',
      'App-based calling as default: no desk handset required',
      'Handsets supplied at cost if you want them: you own outright, no rental',
      'Number porting from your existing provider',
      'Hunt groups, IVR menus, voicemail-to-email, call recording',
      'No 3–5-year lease lock-ins. No automatic renewal traps',
    ],
    howItWorks: [
      { step: '01', title: 'Map the call flow', desc: 'How calls should land today, where you want them in 12 months. Auto-attendant, ring groups, out-of-hours routing.' },
      { step: '02', title: 'Port + provision',  desc: 'We move your numbers in. Old system runs in parallel until you sign off. Zero-downtime cutover.' },
      { step: '03', title: 'Train staff',        desc: 'Most teams use the desktop app on day one. 30-minute walkthrough covers transfer, call park, voicemail.' },
      { step: '04', title: 'Tune as you go',     desc: 'IVR menus, ring groups, hunt rules: we tweak as your team and call patterns change. Add a user? Takes minutes, not days.' },
    ],
    outcomes: [
      { stat: '30–50%', label: 'Cost saving vs traditional phone systems' },
      { stat: 'App',    label: 'Calling on mobile + laptop: no handset needed for most users' },
      { stat: 'Own',    label: 'Handsets outright: no inflated rental contracts' },
      { stat: 'Mins',   label: 'To add a new user: no engineer visit' },
    ],
    faqs: [
      ['Teams Voice vs Yeastar: which do we need?',
        "Teams Voice integrates directly into Microsoft 365, best if you already live in Teams and want simplicity. Yeastar P Series is more flexible for call queues, auto-attendants and call recording. We help you pick based on how you actually work."],
      ['Do we need to buy desk phones?',
        "Most teams don't: the desktop app + a headset works brilliantly. If you want desk phones for reception or shared areas, we source Yealink or Polycom at cost and you own them outright. No 5-year rental nonsense."],
      ['Can we keep our existing numbers?',
        'Yes. UK number portability is straightforward; we manage the port with both providers. Numbers usually transfer within 2–3 weeks.'],
    ],
  },

  'internet-connectivity': {
    tagline: 'The right connection for your business.',
    heroStat: { num: 'Rural', label: 'Specialists: Starlink, fixed wireless and bonded broadband' },
    priceFrom: null,
    priceNote: 'Project-priced · circuit cost varies by location and service',
    includes: [
      'FTTP (full-fibre), leased lines and SoGEA (DSL-over-fibre): full market scan, not one telco',
      '4G / 5G backup with automatic failover',
      'Multi-provider sourcing: BT, CityFibre, Virgin, Openreach alternatives',
      'SD-WAN for multi-site businesses: combine multiple connections',
      'Rural connectivity expertise: Starlink, fixed wireless, bonded lines',
      'Project-managed installation: we deal with Openreach, not you',
      'Bandwidth review every quarter to right-size for your actual usage',
    ],
    howItWorks: [
      { step: '01', title: 'Survey',          desc: "What's available at your address, what you actually need, what your contention tolerance is. No guessing." },
      { step: '02', title: 'Compare',         desc: 'Multi-supplier quotes shown side by side. We recommend the best value for your needs, not the product that earns the biggest commission.' },
      { step: '03', title: 'Project-manage',  desc: 'Wayleaves, installation scheduling, technical handover: we coordinate the entire process so you only deal with us.' },
      { step: '04', title: 'Operate',         desc: 'If it goes down, you call us. We chase the supplier. No Openreach ping-pong, no script-tree call centres.' },
    ],
    outcomes: [
      { stat: 'Multi',  label: 'Provider: we are not tied to any one telco' },
      { stat: '4G/5G',  label: 'Automatic failover keeps you online during outages' },
      { stat: '1',      label: 'Phone number to call when broadband breaks' },
      { stat: 'Rural',  label: 'Specialists across Shropshire + Welsh Borders' },
    ],
    faqs: [
      ['FTTP vs leased line: what do we actually need?',
        'FTTP for most offices < 20 staff. Leased line if you upload a lot (CAD, video, hosted phone with many calls), need a guaranteed SLA, or run critical cloud apps. We do an honest sizing call.'],
      ['Install times?',
        "FTTP: 2–6 weeks. Leased lines: 4–12 weeks (sometimes longer if civils are needed). 4G failover: same week. We project-manage the whole thing so you don't sit on hold to Openreach."],
      ['Do you cover rural sites?',
        "Yes, we've installed Starlink, 4G/5G fixed wireless, and bonded broadband for Shropshire, Herefordshire and Welsh-borders clients where fibre doesn't reach. We know which technology suits each kind of location."],
    ],
  },

  'structured-cabling': {
    tagline: 'The wired backbone your network runs on.',
    heroStat: { num: 'Fluke', label: 'Certifier-tested + documented per cable run' },
    priceFrom: null,
    priceNote: 'Project-priced · per-point pricing on small jobs',
    includes: [
      'Specialist infrastructure partner: nationwide coverage',
      'Cat6 (1Gbps) or Cat6A (10Gbps future-proofing)',
      'Comms cabinets: wall-mounted or floor-standing, properly managed',
      'Patch panels, faceplates, floor boxes, cable management',
      'Fluke DTX/DSX certifier-tested with test report per run',
      'Office fit-out coordination: first fix + second fix',
      'Full as-built documentation: cable schedules, floor plans, test certificates',
    ],
    howItWorks: [
      { step: '01', title: 'Survey + design',  desc: 'Floor plans, route options, containment, cable count. Measured and photographed on-site.' },
      { step: '02', title: 'Plan with you',    desc: 'Cabling diagram, BoM, route options with cost trade-offs. You see the plan before any cables ship.' },
      { step: '03', title: 'Install',          desc: 'Specialist partner runs the cabling. Out-of-hours where it matters. Site left clean.' },
      { step: '04', title: 'Certify + hand over', desc: 'Every run Fluke-tested. Documentation pack covers test results, labelling and warranty registration.' },
    ],
    outcomes: [
      { stat: 'Cat6A',      label: 'Future-proofed for 10Gbps where it matters' },
      { stat: '100%',       label: 'Of cables Fluke-tested with certificates' },
      { stat: 'Nationwide', label: 'Coverage via our infrastructure partner' },
      { stat: 'As-built',   label: 'Documentation: schedules, plans, test reports' },
    ],
    faqs: [
      ['Cat6 or Cat6A?',
        "Cat6 supports 1Gbps to 100m, fine for most. Cat6A future-proofs you to 10Gbps and is worth the small uplift in cost for new builds, server rooms, and anywhere you'll regret it 10 years from now."],
      ['Can you work alongside our fit-out contractor?',
        'Yes, first fix during the build, second fix after the walls are up. Retrofitting after decoration costs more and looks worse, so we want to be involved early.'],
      ['Do you cover sites outside Shropshire?',
        'Yes, our cabling partner covers the whole of the UK, so multi-site clients get the same standard of work and warranty everywhere.'],
    ],
  },

  'managed-print': {
    tagline: 'Print without the predatory contracts.',
    heroStat: { num: '0%', label: 'Purchase plan: own outright, no lease lock-in' },
    priceFrom: null,
    priceNote: 'Buy outright or 10 interest-free instalments · per-page service contract',
    includes: [
      'Ownership model: buy outright or 10 interest-free monthly instalments',
      'No 5-year leases, no automatic renewals, no exit penalties',
      'Direct manufacturer warranty + service (not a 3rd-party call centre)',
      'No brand loyalty: we pick the right printer for the job',
      'Free print audit: 30 days of real usage data before any recommendation',
      'All-inclusive cost-per-page: toner, parts, labour, callouts',
      '12-month rolling contract, easy out clause, never 5 years',
    ],
    howItWorks: [
      { step: '01', title: 'Free print audit',  desc: 'Monitoring software runs quietly for ~30 days. Tracks exactly how much each device prints, in colour vs mono, and what it costs you.' },
      { step: '02', title: 'Honest report',     desc: "We show you the numbers. If managed print doesn't make financial sense for your business, we'll tell you; that's why we work with this partner." },
      { step: '03', title: 'Right-size + install', desc: 'Right printer in the right place. Konica Minolta, Kyocera, Brother or HP, whichever suits. Installed, networked, drivers deployed via Intune.' },
      { step: '04', title: 'Manage + bill',     desc: 'Toner ships before you run out. Service callouts handled. You pay quarterly in arrears for prints you actually did.' },
    ],
    outcomes: [
      { stat: '0%',      label: 'Interest on the purchase plan' },
      { stat: '~30 days', label: 'Real usage data before any recommendation' },
      { stat: '12-month', label: 'Rolling contract: never 5 years' },
      { stat: '£0',      label: 'Lease termination fees: we never lease' },
    ],
    faqs: [
      ['Why ownership, not leasing?',
        "Leases lock you into a vendor for 5 years at marked-up rates with inflated click charges. We've seen businesses spending £40,000 over a 5-year lease on equipment worth £7,000 to buy outright. Sometimes paying the exit fee and switching to ownership saves money within 12 months."],
      ['What if we want to leave?',
        "12-month rolling contract with an easy out clause. We'll never handcuff you to a 5-year agreement, and we don't charge made-up warranty fees or volume-commitment penalties when you leave."],
      ["What's included in cost-per-page?",
        'Everything except paper: toner, parts, consumables, labour, callouts and support. No volume commitments, no hidden delivery charges. You pay for prints you actually did.'],
    ],
  },
};

const getContent = (slug: string): ServiceContent => SERVICE_CONTENT[slug] || FALLBACK;

const FaqItem: React.FC<{ q: string; a: string }> = ({ q, a }) => {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: `1px solid ${T.hairline}` }}>
      <button onClick={() => setOpen(!open)} style={{
        width: '100%', textAlign: 'left',
        padding: '18px 0',
        background: 'none', border: 'none', cursor: 'pointer',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16,
      }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: T.ink, lineHeight: 1.4 }}>{q}</span>
        <span style={{
          fontFamily: "'Bungee', sans-serif", fontSize: 22, color: T.primary,
          flexShrink: 0,
          transform: open ? 'rotate(45deg)' : 'none',
          transition: 'transform 200ms', lineHeight: 1,
        }}>+</span>
      </button>
      {open && <div style={{ padding: '0 0 18px', color: 'rgba(15,25,35,0.62)', fontSize: 15, lineHeight: 1.65, maxWidth: '60ch' }}>{a}</div>}
    </div>
  );
};

export const ServiceDetailPageV2: React.FC = () => {
  const ww       = useWindowWidth();
  const isMobile = ww < 768;
  const location = useLocation();
  const slug = location.pathname.replace(/^\/services\//, '');
  const service = services.find(s => s.slug === slug);

  if (!service) {
    return (
      <section style={{ background: T.paper, padding: '120px 32px', minHeight: '60vh' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
          <Eyebrow>Service not found</Eyebrow>
          <DisplayHead size={36} style={{ marginBottom: 16 }}>That service page has moved.</DisplayHead>
          <Link to="/services" style={{
            display: 'inline-flex', padding: '14px 24px',
            background: T.accent, color: T.white,
            border: `2px solid ${T.ink}`,
            fontFamily: "'Archivo', sans-serif", fontWeight: 700, fontSize: 15,
            textDecoration: 'none', boxShadow: `4px 4px 0 0 ${T.ink}`,
          }}>See all services →</Link>
        </div>
      </section>
    );
  }

  const content = getContent(slug);
  const related = services.filter(s => s.slug !== slug).slice(0, 3);

  return (
    <>
      <SEO
        title={`${service.title}: IT Support Shropshire`}
        description={service.desc}
        type="service"
      />

      {/* HERO */}
      <section style={{
        background: T.ink,
        padding: isMobile ? '56px 20px 64px' : '72px 32px 80px',
        ...halftoneCss('rgba(255,255,255,0.04)', 1.4, 13),
      }}>
        <div style={{
          maxWidth: contentMax(ww, 1100), margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1.2fr 0.8fr',
          gap: isMobile ? 36 : 64,
          alignItems: 'center',
        }}>
          <div>
            <Eyebrow light>Service</Eyebrow>
            <DisplayHead as="h1" size={isMobile ? 38 : 52} light style={{ marginBottom: 18, lineHeight: 0.95 }}>
              {service.title}
            </DisplayHead>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 20, lineHeight: 1.55, fontWeight: 600, margin: '0 0 12px', maxWidth: '44ch' }}>
              {content.tagline}
            </p>
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 16, lineHeight: 1.65, margin: '0 0 32px', maxWidth: '50ch' }}>
              {service.desc}
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link to="/contact" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '14px 24px',
                background: T.accent, color: T.white,
                border: `2px solid ${T.white}`,
                fontFamily: "'Archivo', sans-serif", fontWeight: 700, fontSize: 15,
                textDecoration: 'none',
                boxShadow: `4px 4px 0 0 ${T.yellow}`,
              }}>Book a 20-min call →</Link>
              <a href="#includes" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '14px 24px',
                background: 'transparent', color: T.white,
                border: '2px solid rgba(255,255,255,0.3)',
                fontFamily: "'Archivo', sans-serif", fontWeight: 700, fontSize: 15,
                textDecoration: 'none',
              }}>What's included ↓</a>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.12)',
              padding: '28px 32px',
            }}>
              <div style={{ fontFamily: "'Bungee', sans-serif", fontSize: 48, color: T.yellow, lineHeight: 1 }}>{content.heroStat.num}</div>
              <div style={{
                fontFamily: "'Archivo Narrow', sans-serif", fontSize: 11,
                textTransform: 'uppercase', letterSpacing: '0.12em',
                color: 'rgba(255,255,255,0.4)', fontWeight: 700, marginTop: 6,
              }}>{content.heroStat.label}</div>
            </div>
            {content.priceFrom != null ? (
              <div style={{ background: T.accent, border: `2px solid ${T.white}`, padding: '24px 32px', position: 'relative' }}>
                <div style={{
                  position: 'absolute', top: -13, right: 16,
                  background: T.yellow, border: `2px solid ${T.ink}`,
                  padding: '4px 12px',
                  fontFamily: "'Bungee', sans-serif", fontSize: 11,
                  transform: 'rotate(3deg)',
                }}>From</div>
                <div style={{ fontFamily: "'Bungee', sans-serif", fontSize: 44, color: T.white, lineHeight: 1 }}>£{content.priceFrom}</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>{content.priceNote}</div>
                <Link to="/pricing" style={{
                  display: 'inline-block', marginTop: 14,
                  fontSize: 13, color: T.white,
                  textDecoration: 'none',
                  borderBottom: '1px solid rgba(255,255,255,0.5)',
                  paddingBottom: 1,
                }}>See full pricing →</Link>
              </div>
            ) : (
              <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', padding: '24px 32px' }}>
                <div style={{
                  fontFamily: "'Archivo Narrow', sans-serif", fontSize: 11,
                  textTransform: 'uppercase', letterSpacing: '0.12em',
                  color: 'rgba(255,255,255,0.4)', fontWeight: 700, marginBottom: 6,
                }}>How it's priced</div>
                <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.85)', lineHeight: 1.55 }}>{content.priceNote}</div>
                <Link to="/contact" style={{
                  display: 'inline-block', marginTop: 14,
                  fontSize: 13, color: T.primary,
                  textDecoration: 'none', fontWeight: 700,
                }}>Get a quote →</Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* INCLUDED + OUTCOMES */}
      <section id="includes" style={{ background: T.paper, padding: '72px 32px', borderBottom: `1px solid ${T.hairline}` }}>
        <div style={{
          maxWidth: contentMax(ww, 1100), margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
          gap: isMobile ? 32 : 64,
          alignItems: 'start',
        }}>
          <div>
            <Eyebrow>What's included</Eyebrow>
            <DisplayHead size={36} style={{ marginBottom: 20 }}>Everything in the price</DisplayHead>
            <p style={{ color: 'rgba(15,25,35,0.62)', fontSize: 16, lineHeight: 1.65, margin: '0 0 28px', maxWidth: '44ch' }}>
              No extras, no "that's not in your contract". One monthly fee covers all of this. Onsite visits, when an issue cannot be fixed remotely, are billed separately.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {content.includes.map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 15, color: T.ink }}>
                  <div style={{ marginTop: 2, flexShrink: 0 }}><Tick /></div>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {content.outcomes.map(({ stat, label }, i) => (
              <div key={i} style={{
                background: i === 0 ? T.ink : T.white,
                border: `1px solid ${T.hairline}`,
                padding: '28px 24px',
                ...(i === 0 ? halftoneCss('rgba(255,255,255,0.05)', 1.4, 12) : { boxShadow: '0 4px 16px rgba(15,25,35,0.06)' }),
              }}>
                <div style={{
                  fontFamily: "'Bungee', sans-serif", fontSize: 36, lineHeight: 1,
                  color: i === 0 ? T.yellow : T.primary, marginBottom: 8,
                }}>{stat}</div>
                <div style={{
                  fontSize: 13,
                  color: i === 0 ? 'rgba(255,255,255,0.6)' : 'rgba(15,25,35,0.62)',
                  lineHeight: 1.4,
                }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ background: T.paperDeep, padding: '72px 32px', borderBottom: `1px solid ${T.hairline}` }}>
        <div style={{ maxWidth: contentMax(ww, 1100), margin: '0 auto' }}>
          <div style={{ marginBottom: 48 }}>
            <Eyebrow>How it works</Eyebrow>
            <DisplayHead size={36} style={{ marginBottom: 8 }}>What you're actually buying</DisplayHead>
            <p style={{ color: 'rgba(15,25,35,0.62)', fontSize: 16, margin: 0, maxWidth: '52ch', lineHeight: 1.6 }}>
              Plain English. What happens, in what order, and what you experience on the ground.
            </p>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)',
            gap: 20,
          }}>
            {content.howItWorks.map(({ step, title, desc }, i) => (
              <div key={i} style={{
                background: T.white, border: `1px solid ${T.hairline}`,
                padding: '28px 24px', boxShadow: '0 4px 16px rgba(15,25,35,0.06)',
                position: 'relative',
              }}>
                <div style={{
                  fontFamily: "'Bungee', sans-serif", fontSize: 40, lineHeight: 1,
                  color: T.hairline,
                  position: 'absolute', top: 16, right: 18,
                }}>{step}</div>
                <div style={{ fontFamily: "'Bungee', sans-serif", fontSize: 18, marginBottom: 10, lineHeight: 1.05, position: 'relative' }}>{title}</div>
                <div style={{ fontSize: 14, color: 'rgba(15,25,35,0.62)', lineHeight: 1.65 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ + RELATED */}
      <section style={{ background: T.paper, padding: '72px 32px', borderBottom: `1px solid ${T.hairline}` }}>
        <div style={{
          maxWidth: contentMax(ww, 1100), margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1.4fr 1fr',
          gap: isMobile ? 32 : 64,
          alignItems: 'start',
        }}>
          <div>
            <Eyebrow>Questions</Eyebrow>
            <DisplayHead size={32} style={{ marginBottom: 24 }}>Common questions about this service</DisplayHead>
            {content.faqs.map(([q, a], i) => <FaqItem key={i} q={q} a={a} />)}
          </div>
          <div>
            <div style={{
              fontFamily: "'Archivo Narrow', sans-serif", fontSize: 11,
              textTransform: 'uppercase', letterSpacing: '0.14em',
              color: 'rgba(15,25,35,0.4)', fontWeight: 700, marginBottom: 16,
            }}>Related services</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
              {related.map(r => (
                <Link key={r.slug} to={`/services/${r.slug}`} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '14px 18px',
                  border: `1px solid ${T.hairline}`,
                  background: T.white,
                  color: T.ink, textDecoration: 'none',
                  fontSize: 14, fontWeight: 600,
                }}>
                  {r.title}<span style={{ color: T.primary }}>→</span>
                </Link>
              ))}
              <Link to="/services" style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '14px 18px',
                border: `1px dashed ${T.hairline}`,
                color: 'rgba(15,25,35,0.4)', textDecoration: 'none', fontSize: 13,
              }}>
                View all services <span>→</span>
              </Link>
            </div>
            <div style={{ background: T.ink, padding: 28, ...halftoneCss('rgba(255,255,255,0.04)', 1.4, 12) }}>
              <div style={{ fontFamily: "'Bungee', sans-serif", fontSize: 22, color: T.white, marginBottom: 10, lineHeight: 1.05 }}>Got a question about this service?</div>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, lineHeight: 1.6, margin: '0 0 16px' }}>
                Call us. 20 minutes. We'll tell you honestly.
              </p>
              <Link to="/contact" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '12px 20px',
                background: T.accent, color: T.white,
                border: `2px solid ${T.white}`,
                fontFamily: "'Archivo', sans-serif", fontWeight: 700, fontSize: 14,
                textDecoration: 'none',
              }}>Book a call →</Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: T.paperDeep, padding: '72px 32px' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
          <Eyebrow>Next step</Eyebrow>
          <DisplayHead size={44} style={{ marginBottom: 16 }}>Ready to talk?</DisplayHead>
          <p style={{ color: 'rgba(15,25,35,0.62)', fontSize: 17, lineHeight: 1.65, margin: '0 auto 32px', maxWidth: '44ch' }}>
            A 20-minute call is all it takes to find out if we're a good fit, and we'll tell you honestly if we're not.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
            <Link to="/contact" style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              padding: '16px 28px',
              background: T.accent, color: T.white,
              border: `2px solid ${T.ink}`,
              fontFamily: "'Archivo', sans-serif", fontWeight: 700, fontSize: 16,
              textDecoration: 'none',
              boxShadow: `4px 4px 0 0 ${T.ink}`,
            }}>Book a 20-min call →</Link>
            <Link to="/pricing" style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              padding: '16px 28px',
              background: 'transparent', color: T.ink,
              border: `2px solid ${T.ink}`,
              fontFamily: "'Archivo', sans-serif", fontWeight: 700, fontSize: 16,
              textDecoration: 'none',
            }}>See pricing</Link>
          </div>
          <div style={{ fontSize: 13, color: 'rgba(15,25,35,0.4)' }}>
            30-day money-back guarantee · 01584 517 234 · Mon–Fri 9am–5pm
          </div>
        </div>
        <LastReviewed />
      </section>
    </>
  );
};

export default ServiceDetailPageV2;

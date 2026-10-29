// Public photo variants captured from the existing image service. See the
// versioned asset-source record in docs/seo/homepage-assets-2026-09-22.json.
export const heroImage = {
  src: '/images/home-team-v1778511802-900.jpg',
  srcset: '/images/home-team-v1778511802-480.webp 480w, /images/home-team-v1778511802-640.webp 640w, /images/home-team-v1778511802-720.webp 720w, /images/home-team-v1778511802-900.jpg 900w, /images/home-team-v1778511802-1280.webp 1280w',
  sizes: '(max-width: 899px) calc(100vw - 40px), 44vw',
};

export const services = [
  { icon: 'shield', title: 'Managed IT Support', desc: 'Unlimited helpdesk, proactive monitoring and patching: your IT team on tap.', href: '/services/managed-it-support', featured: true },
  { icon: 'lock', title: 'Cyber Security', desc: 'Cyber Essentials, real-time threat detection, awareness training, and the controls that keep insurers happy.', href: '/services/cybersecurity' },
  { icon: 'cloud', title: 'Cloud & Microsoft 365', desc: 'Migrate, secure and get more from M365, SharePoint, Teams and Azure.', href: '/services/cloud-solutions' },
  { icon: 'rocket', title: 'Strategic IT Projects', desc: 'WiFi surveys, office moves, server replacements, delivered on time, no surprises.', href: '/services/strategic-projects' },
  { icon: 'database', title: 'Backup & Recovery', desc: 'Immutable, tested backups so a ransomware attack is an inconvenience, not a crisis.', href: '/services/backup-disaster-recovery' },
];

export const comparison = [
  { row: 'Who answers the phone', them: 'Outsourced helpdesk', us: 'Same engineer who fixed it last time' },
  { row: 'Contract length', them: '3-year lock-in', us: '30-day rolling unless your Proposal says otherwise', href: '/terms-of-business' },
  { row: 'Onsite', them: '£95/hr extra', us: 'Remote-first; visits billed separately' },
  { row: 'Hidden fees', them: 'Project bills, T&M creep', us: 'Flat per-user, no surprises' },
  { row: 'Strategic reviews', them: 'Once a year, if you ask', us: 'Quarterly, in plain English' },
];

export const pricingTiers = [
  { name: 'Standard', blurb: '9–5 reactive support, remote-first. Everything most small businesses need to run safely and quietly.', includes: ['Unlimited remote support 9–5', 'Microsoft 365 admin', 'Microsoft 365 backup', 'Huntress managed EDR + identity threat detection', 'Cyber Essentials maintenance + evidence pack', 'Annual technology business review'] },
  { name: 'Plus', best: true, blurb: 'Everything in Standard plus priority handling and a half-yearly roadmap, for businesses that want more structure.', includes: ['Everything in Standard', 'Half-yearly business review + 12-month roadmap', 'Priority queue placement', 'Same SLA as Standard'] },
  { name: 'Premium', blurb: 'For businesses that want extended hours, project work bundled, and first-touch privilege.', includes: ['Everything in Plus', '8am–6pm best-effort cover', 'First-touch queue privilege', '2 hours quarterly project work bundled', 'Quarterly review + vendor & licence rationalisation', '20% off any block-hour work'] },
];

export const processSteps = [
  { n: 1, title: 'Discovery Call', desc: "A relaxed chat about your business and the headaches you'd like to retire." },
  { n: 2, title: 'IT Health Check', desc: 'We audit security, backups and hardware. You get a plain-English report.' },
  { n: 3, title: 'Onboarding Plan', desc: 'A clear 30-day plan, coordinated with your old provider.' },
  { n: 4, title: 'Day-to-day Support', desc: 'Unlimited helpdesk, proactive monitoring and regular reviews.' },
  { n: 5, title: 'Strategic Reviews', desc: 'Roadmaps, budgets and projects to keep your IT three steps ahead.' },
];

export const industries = [
  { name: 'Solicitors & Legal', desc: 'Document security, SRA-aligned compliance and the case-management integrations you actually use.', href: '/industries/solicitors' },
  { name: 'Accountants', desc: 'Iris, Sage, CCH, QuickBooks: secure remote desktops and watertight client data handling.', href: '/industries/accountants' },
  { name: 'Manufacturing', desc: 'Shop-floor connectivity, ERP support and disaster recovery for production-critical systems.', href: '/industries/manufacturing' },
  { name: 'Healthcare & Clinics', desc: 'DSP Toolkit-aligned security and reliable systems for clinical software.', href: '/industries/healthcare' },
  { name: 'Agriculture & Estates', desc: 'Patchy broadband sorted, fleet-wide laptops and farm-office systems that survive Welsh weather.', href: '/industries/agriculture' },
  { name: 'Charities & Education', desc: 'Affordable, donor-friendly IT, including Microsoft non-profit licensing.', href: '/industries/charities' },
];

export const serviceAreas = [
  { town: 'Ludlow', miles: '0', county: 'Shropshire', href: '/it-support-ludlow' },
  { town: 'Shrewsbury', miles: '27', county: 'Shropshire', href: '/it-support-shrewsbury' },
  { town: 'Hereford', miles: '23', county: 'Herefordshire', href: '/it-support-hereford' },
  { town: 'Worcester', miles: '32', county: 'Worcestershire', href: '/it-support-worcester' },
  { town: 'Telford', miles: '30', county: 'Shropshire', href: '/it-support-telford' },
  { town: 'Leominster', miles: '11', county: 'Herefordshire', href: '/locations/leominster' },
  { town: 'Bridgnorth', miles: '22', county: 'Shropshire', href: '/locations/bridgnorth' },
  { town: 'Knighton', miles: '16', county: 'Powys', href: '/locations/welshpool', destination: 'Welshpool area guide' },
  { town: 'Church Stretton', miles: '16', county: 'Shropshire', href: '/locations/ludlow', destination: 'Ludlow area guide' },
  { town: 'Tenbury Wells', miles: '9', county: 'Worcestershire', href: '/locations/worcester', destination: 'Worcester area guide' },
].sort((a, b) => a.county.localeCompare(b.county) || a.town.localeCompare(b.town));

export const countyLinks = [
  ['IT Support Shropshire', '/it-support-shropshire'],
  ['Herefordshire', '/it-support-herefordshire'],
  ['Worcestershire', '/it-support-worcestershire'],
  ['Powys', '/it-support-powys'],
];

export const faqs = [
  ['How quickly can we switch from our current IT provider?', 'Most clients are fully onboarded in 30 days. We do the heavy lifting and coordinate directly with your outgoing provider, so you can focus on your business.'],
  ['Do we sign a long contract?', "Managed services are 30-day rolling unless your signed Proposal says otherwise. You can give 30 days' written notice, and if you end within the first 30 days we refund the first month. Your signed Proposal prevails."],
  ["What's actually included in 'unlimited support'?", "Helpdesk tickets, phone calls, screen-share sessions, monitoring, patching and regular reviews. We invoice on outcomes, not minutes; there's no meter running. Onsite visits, when an issue cannot be fixed remotely, are billed separately."],
  ['Are you really local?', 'Yes. Our office is in Ludlow and we support businesses across the Welsh Borders.'],
  ['Can you replace our existing IT person?', 'Often, yes. We can also work alongside an existing internal hire as their senior team.'],
];

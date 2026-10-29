// Documented, deliberate differences between a native standalone page and its
// production React baseline. Keep each entry minimal and explain why. Text pairs
// are [baseline substring, native replacement] applied once to the baseline's
// normalised main text; headings/links/images entries map the baseline lists.
// Shared difference for pages that render components/Contact.tsx, ported as
// src/components/SourceContact.astro with ContactForm.astro in its disabled
// preview mode (no live form on this host; FORM-01). The trust tick is
// decorative (aria-hidden); label/value pairs are adjacent inline elements; the
// obfuscated email and Calendly button become real links; the idle multi-step
// form copy is replaced by the disabled-preview notice.
const SOURCE_CONTACT_TEXT = [
  ['✓ Trusted by local businesses for over 10 years', 'Trusted by local businesses for over 10 years'],
  ['Call The Batphone 01584 517 234', 'Call The Batphone01584 517 234'],
  ['Email HQ hello@fresh-tech.uk', 'Email HQhello@fresh-tech.uk'],
  ['Face-to-Face Book an Intro Call with Sam', 'Face-to-FaceBook an Intro Call with Sam'],
  ['Send a Signal Step 1 of 3 Name Email Phone (optional) How can we help? We typically respond within 15 minutes during business hours (Mon-Fri, 9am-5pm). Send Message Existing Client? Email support@fresh-tech.uk or call 01584 517 234 for urgent help.',
    'Send a message Tell us what you need help with Share the basics and we can start with the right context. Please do not include passwords or other sensitive information. Online messages are disabled in this preview This preview cannot send enquiries. Call 01584 517 234 or email hello@fresh-tech.uk.'],
];
const sourceContactHeadings = headings => headings.flatMap(h => (h[0] === 3 && h[1] === 'Send a Signal' ? [[2, 'Tell us what you need help with'], [3, 'Online messages are disabled in this preview']] : [h]));
const sourceContactLinks = links => {
  const index = links.findIndex(([href, text]) => href === '/onboarding' && text.startsWith('Thinking of switching'));
  if (index === -1) throw new Error('SourceContact difference: onboarding link not found in baseline');
  return [...links.slice(0, index + 2), ['mailto:hello@fresh-tech.uk', 'hello@fresh-tech.uk'], ['/contact', 'Book an Intro Call with Sam'], ['tel:+441584517234', '01584 517 234'], ['mailto:hello@fresh-tech.uk', 'hello@fresh-tech.uk']];
};
const withSourceContact = entry => ({
  ...entry,
  text: [...(entry.text ?? []), ...SOURCE_CONTACT_TEXT],
  headings: list => sourceContactHeadings(entry.headings ? entry.headings(list) : list),
  links: list => sourceContactLinks(entry.links ? entry.links(list) : list),
});

// The React privacy and cookie policies show their build month as "Last
// updated"; the native pages show the fixed date the wording last changed.
const BASELINE_UPDATED = 'Last updated: September 2026';

export const STANDALONE_DIFFERENCES = Object.freeze({
  // Section 4 names the processors that handle website enquiries (SMTP2GO,
  // 20i), added on 29 October 2026 at Sam's request; later sections renumber.
  '/privacy-policy': {
    text: [
      [BASELINE_UPDATED, 'Last updated: 29 October 2026'],
      ['4. Security', '4. Who we share it with When you send a message through our website, it is delivered to our inbox by SMTP2GO, an email delivery service using servers in the UK and EU, and our website is hosted by 20i in the United Kingdom. Both act only on our instructions under a data processing agreement. We do not share your details with anyone else unless you ask us to or the law requires it. 5. Security'],
      ['5. Cookies', '6. Cookies'],
      ['6. Controlling', '7. Controlling'],
    ],
    headings: headings => headings.flatMap(([level, heading]) => {
      if (level !== 2) return [[level, heading]];
      if (heading === '4. Security') return [[2, '4. Who we share it with'], [2, '5. Security']];
      const renumbered = { '5. Cookies': '6. Cookies', '6. Controlling your personal information': '7. Controlling your personal information' }[heading];
      return [[level, renumbered ?? heading]];
    }),
  },
  '/cookie-policy': { text: [[BASELINE_UPDATED, 'Last updated: 15 June 2026']] },
  // The React breadcrumb repeats "Home" (component Home link plus the page's own
  // Home item); the native breadcrumb shows it once.
  '/support': {
    // The live chat was removed from the site (Sam, 16 September 2026): the
    // warning card and the "Use our live chat" sentence are gone from the page.
    text: [['Home Home Support', 'Home Support'], [" Live chat is for new enquiries The chat widget on our website is for prospective customers. For support, use the channels above so we have your account context.", ''], ["Use our live chat or get in touch to discuss your needs.", 'Get in touch to discuss your needs.']],
    headings: headings => headings.filter(([level, heading]) => !(level === 3 && heading === 'Live chat is for new enquiries')),
    links: links => { const index = links.findIndex(([href, text]) => href === '/' && text === 'Home'); return [...links.slice(0, index), ...links.slice(index + 1)]; },
  },
  // The onboarding FAQ accordion is native <details>/<summary> so it works
  // without JavaScript. React only renders an answer once its item is opened,
  // so the captured baseline has just the question and the "+" toggle glyph;
  // the native markup keeps every answer in the DOM (a native disclosure, not
  // a JS-gated one), so each answer is inserted after its question here.
  '/onboarding': {
    text: [
      ['Can you handle it?+ Our current IT company', "Can you handle it?+ Yes. Complex setups are the norm, not the exception. We audit everything upfront so we know exactly what we're dealing with before we make any commitments. If something is genuinely outside our scope we'll tell you in the first week. Our current IT company"],
      ['awkward?+ What if our staff', "awkward?+ It's a business relationship, not a friendship. You're entitled to choose your IT provider. We handle the professional side of the transition, including formal notice, credential requests, and licence transfers, so you don't have to have that conversation yourself. What if our staff"],
      ['current provider?+ Can we talk to you', "current provider?+ We'll match anything that's working and improve what isn't. We introduce ourselves to the whole team in the first week: quick briefing, new contact details, and that's it. Most staff say the main difference is their calls get answered faster. Can we talk to you"],
      ['anything?+ Ready to talk?', "anything?+ Yes, that's the whole point of the first call. 20 minutes. No sales script. We'll tell you honestly if switching makes sense for your situation, including if it doesn't. Ready to talk?"],
    ],
  },
  // The final CTA's "Book a 15-min call" is a CalendlyModal-opening <button> in
  // production (no href, so it is not in the captured links list). The modal
  // cannot work statically, so the native port renders it as a real /contact
  // link instead, which adds one link versus the baseline.
  '/email-security-guide': {
    // Preview only: lead capture is not connected, so the checker states that nothing is sent.
    text: [["(Optional, your results show on screen either way.) Run my free check", "(Optional, your results show on screen either way.) This preview runs the check in your browser only. Nothing you enter is sent to Fresh Tech, so no follow-up will be sent. Run my free check"]],
    links: (links) => {
      const index = links.findIndex(([href]) => href === 'tel:+441584517234');
      return [...links.slice(0, index), ['/contact', 'Book a 15-min call →'], ...links.slice(index)];
    },
  },
  // Same pattern as /onboarding above: the "Real-World Scenarios" and FAQ
  // accordions are native <details>/<summary>, so their body text (only
  // rendered by React while a card is open) is always present in the DOM.
  // The text diff inserts each scenario's story/without/with/lesson copy and
  // each FAQ answer after its question; the headings diff inserts the two
  // "Without/With Device Enrollment" headings per scenario card.
  // Accessibility fix: these are rendered as h3 (not h4 as in production)
  // because they sit directly under the "Real-World Scenarios" h2 with no h3
  // in between, and skipping a heading level fails the accessibility audit.
  '/upgrade-to-business-premium': withSourceContact({
    text: [
      [
        "The New Starter's Laptop The Shadow IT Sprawl The Compromised Account The Compliance Question The Leaver Who Didn't Leave See the Value Gap",
        "The New Starter's Laptop A new team member joins with a brand new laptop. Someone manually sets up their email, installs Office, and shows them where to save files. Three months later, they're saving everything to their desktop, have no antivirus, and are accessing client data on an unencrypted device. Without Device Enrollment Nobody knows the laptop isn't encrypted. When it's stolen from their car, client data is exposed. You only discover the security gap during the incident response. With Device Enrollment The laptop automatically enrolled when they signed in. Encryption was enforced, antivirus deployed, and files redirected to OneDrive. When reported stolen, you remotely wiped it in minutes. Key Insight: New devices should configure themselves to your security standards automatically -not rely on whoever set it up remembering every step. The Shadow IT Sprawl Your team uses Microsoft 365 for email, but Sarah prefers Google Drive, Tom uses Dropbox, and accounts data lives in a shared folder on someone's PC. You're paying for OneDrive but nobody uses it consistently. Without Device Enrollment Data is scattered everywhere. When Sarah leaves, her Google Drive goes with her. When Tom's Dropbox is breached, you don't even know company files were exposed. The accounts PC fails and nobody backed it up. With Device Enrollment Intune policies redirect everyone's Documents folder to OneDrive automatically. Conditional Access blocks access to company email unless files are saved to approved locations. Shadow IT eliminated at the source. Key Insight: You can't protect data you don't know exists. Device enrollment brings visibility and control to where your data actually lives. The Compromised Account A phishing email tricks your office manager into entering her Microsoft 365 password on a fake login page. The attacker now has her credentials and logs in from overseas. Without Device Enrollment The attacker accesses emails, SharePoint, and OneDrive from their own device. They set up forwarding rules, download client data, and you don't notice for weeks. With Device Enrollment Conditional Access blocks the login attempt -it's from an unrecognised device and unusual location. Even with valid credentials, the attacker can't get in. You're alerted to the blocked attempt. Key Insight: Passwords get stolen. With device enrollment, stolen passwords aren't enough -attackers need a compliant, enrolled device too. The Compliance Question Your accountancy firm wins a large client. Their due diligence questionnaire asks: 'How do you ensure devices accessing our data meet minimum security standards? Can you remotely wipe a lost device?' Without Device Enrollment You can't honestly answer yes. You don't know which devices access client data, whether they're encrypted, or if you could wipe them. The client chooses a competitor who could demonstrate device management. With Device Enrollment You provide screenshots from Intune showing device compliance status, encryption enforcement, and remote wipe capability. The client is reassured and signs the contract. Key Insight: As clients become more security-conscious, proving device management isn't optional -it's a competitive advantage. The Leaver Who Didn't Leave David resigns but keeps accessing company systems from his personal laptop for weeks after his last day. His account was disabled, but he'd saved his password in his browser and connected via a mail app that didn't check. Without Device Enrollment David continues accessing emails and files from his personal device. You have no visibility that this is happening. Sensitive information continues to leak. With Device Enrollment Conditional Access requires a compliant, enrolled device. David's personal laptop isn't enrolled, so even cached credentials don't work. Access terminated completely on his last day. Key Insight: Disabling an account isn't enough when personal devices have cached access. Device-based policies ensure access truly ends when employment does. See the Value Gap",
      ],
      [
        "What's the difference between Business Standard and Business Premium? What does 'enrolling a device' actually mean? Will this slow down our computers or be intrusive? What about personal devices (BYOD)? We're already using Google Workspace -does this still apply? How long does migration take? What happens to our existing security tools? Is this just for laptops, or mobile phones too? Ready to Take Control?",
        "What's the difference between Business Standard and Business Premium? Business Standard (£10.30/user/month) gives you Office apps, email, and Teams -but no device management or advanced security. Business Premium (£18.10/user/month) adds Intune for device management, Defender for Business antivirus, Conditional Access for smart security policies, and more. The £7.80 difference replaces multiple third-party tools that would cost far more separately. What does 'enrolling a device' actually mean? Enrolling a device registers it with Microsoft Intune so you can manage it centrally. Once enrolled, you can push security policies (like requiring encryption), deploy apps automatically, see device compliance status, and remotely wipe it if lost. The user experience barely changes -they just sign in with their work account and the device configures itself. Will this slow down our computers or be intrusive? No. Intune policies run silently in the background. Users won't notice anything different except that their new laptop 'just works' out of the box. We configure sensible defaults -not heavy-handed restrictions that frustrate staff. You get security without the friction. What about personal devices (BYOD)? You have options. You can require full enrollment (giving you complete management), or use 'app protection policies' that only manage company data within specific apps -leaving personal data untouched. Most SMBs we work with provide company devices, but BYOD is fully supported if that's your model. We're already using Google Workspace -does this still apply? If you're on Google Workspace, you face the same device management challenges -you just solve them differently. However, many businesses use both (Google for some things, Microsoft for others). If you're considering consolidating, Business Premium gives you email, productivity apps, AND device management in one platform. We can help you evaluate whether consolidation makes sense. How long does migration take? For most SMBs, we can migrate from Standard to Premium and enroll devices within 1-2 weeks. The license upgrade itself is instant. Enrolling devices can often be done gradually -new devices enroll automatically, and existing devices can be enrolled during a scheduled 'security day' with minimal disruption. What happens to our existing security tools? Business Premium often replaces them entirely. Defender for Business replaces third-party antivirus. Built-in email filtering replaces separate spam tools. Conditional Access replaces standalone MFA tools. We'll audit your current stack and show you exactly what can be consolidated -typically saving money even with the Premium uplift. Is this just for laptops, or mobile phones too? Both. Intune manages Windows, macOS, iOS, and Android devices. If staff access company email on their phones, those devices can be enrolled too -ensuring data is protected regardless of which device someone uses. Ready to Take Control?",
      ],
    ],
    headings: headings => {
      const index = headings.findIndex(([level, text]) => level === 2 && text === 'Real-World Scenarios');
      const scenarioHeadings = Array(5).fill(['Without Device Enrollment', 'With Device Enrollment'])
        .flat().map(text => [3, text]);
      return [...headings.slice(0, index + 1), ...scenarioHeadings, ...headings.slice(index + 1)];
    },
  }),
  // GlossaryPage.tsx renders the shared <Contact/>; same SourceContact.astro +
  // disabled-preview ContactForm.astro pattern as /faq and /resources above
  // (FORM-01, obfuscated-email span, Calendly button).
  // Accessibility fix: each glossary term card heading is native h2 (not h3
  // as in production) because it sits directly under the page's single h1
  // with no h2 in between, and skipping a heading level fails the
  // accessibility audit. sourceContactHeadings only rewrites the "Send a
  // Signal" h3 to h2/h3, so promoting every other h3 to h2 first composes
  // safely with it.
  '/glossary': withSourceContact({
    headings: headings => headings.map(([level, text]) => (level === 3 && text !== 'Send a Signal' ? [2, text] : [level, text])),
  }),
  // Two differences from production, both from features React cannot have:
  //  1. Same CalendlyModal situation as /email-security-guide above: both
  //     booking actions are onClick buttons in production. Only "Book my
  //     free check" (the final CTA section) is visible in the pre-JS state
  //     the parity check reads, so only it needs a documented link addition,
  //     as a /contact link. "Book a 15-min call" lives inside the results
  //     panel, which stays hidden until the visitor runs the checker, so it
  //     is never extracted here.
  '/email-security-check': {
    // Preview only: lead capture is not connected, so the checker states that nothing is sent.
    text: [["(Optional, your results show on screen either way.) Run my free check", "(Optional, your results show on screen either way.) This preview runs the check in your browser only. Nothing you enter is sent to Fresh Tech, so no follow-up will be sent. Run my free check"]],
    links: (links) => {
      const afterCyberEssentials = links.findIndex(([href]) => href === '/services/cyber-essentials');
      return [...links.slice(0, afterCyberEssentials + 1), ['/contact', 'Book my free check →'], ...links.slice(afterCyberEssentials + 1)];
    },
  },
  // Same pattern as /onboarding above: the contract-traps and FAQ accordions
  // are native <details>/<summary>, so their body text (only rendered by React
  // once a card is opened) is always present in the DOM. The text diff inserts
  // each trap's description and each FAQ's answer after its title/question.
  // The closing <SourceContact/> also differs from the captured baseline:
  // SourceContact's trust tick is inside an aria-hidden span (consistent with
  // every other SourceContact call site), losing one character from the
  // extracted text; its Email HQ and Face-to-Face items are real anchors, a
  // disabled-preview stand-in for the source's ObfuscatedEmail button and
  // Calendly button (neither a link in the captured baseline); and the closing
  // form is the shared ContactForm.astro in disabled-preview mode, not the
  // source's live React form, so its heading and body copy differ from the
  // captured idle-state form.
  '/managed-print-guide': {
    text: [
      ["Volume Commitments", "Volume Commitments Some suppliers require you to commit to a minimum number of prints per quarter. Fall short and you still pay for the prints you didn't make. Exceed the limit and you're charged at a higher rate. Volume commitments only ever benefit the supplier."],
      ["Toner Coverage Limitations", "Toner Coverage Limitations The agreed cost per page may only cover a certain percentage of an A4 page in toner - sometimes as low as 5%. Any toner used beyond that threshold is charged at an inflated rate. This is rarely explained upfront and can add thousands to your annual costs."],
      ["Development Meters (Colour Print Trick)", "Development Meters (Colour Print Trick) Some contracts charge per colour, not per colour print. Since a colour printer uses four toner colours (cyan, magenta, yellow, black), each colour page costs you four clicks instead of one. A '5p per colour click' contract actually means 20p per colour page."],
      ["Termination Clauses", "Termination Clauses Exit penalties are deliberately designed to make leaving more expensive than staying, even when you're overpaying. If you realise mid-contract that you're getting a bad deal, the termination fee ensures you can't walk away without paying through the nose."],
      ["Automatic Renewal", "Automatic Renewal Most lease agreements auto-renew if you don't give written notice within a narrow window - typically 3 to 6 months before the end date. Miss it by a week and you're locked in for another year. These clauses exist for one reason: to catch you out."],
      ["Hidden Fees", "Hidden Fees Network support charges, consumable delivery fees, parts warranty surcharges after year one - we've seen all of these buried in the small print. Individually they look small. Collectively they can add 20-30% to your expected costs."],
      ["Annual Price Increases", "Annual Price Increases Buried in the terms will be a clause allowing the supplier to increase costs each year, often by RPI or a fixed percentage. Over a 5-year contract, compound increases can push your costs significantly above what you originally agreed to."],
      ["How much does a managed print service cost?", "How much does a managed print service cost? It depends entirely on your print volumes, which is why we start with a free print audit. The hardware cost is a one-off purchase (typically spread over 10 interest-free monthly payments). The ongoing service is a simple cost-per-page covering all toner, parts, and engineer callouts. Most businesses find the total cost is significantly lower than what they were spending on ad-hoc toner purchases."],
      ["What if we don't print enough to justify managed print?", "What if we don't print enough to justify managed print? Then we'll tell you. Honestly. If your print volumes are low and your current setup is working fine, managed print may not make sense. That's exactly what the print audit is designed to establish - we'll only recommend it if the numbers genuinely stack up."],
      ["We're currently in a lease contract. Can you help?", "We're currently in a lease contract. Can you help? Yes. We can review your existing contract, identify the notice period and renewal date, and advise on the most cost-effective exit strategy. Even if the end date is years away, getting it in the diary now means you won't miss the cancellation window and get auto-renewed."],
      ["What brands do you supply?", "What brands do you supply? We're not tied to any single manufacturer. Our print partner assesses your requirements and recommends the best device for the job regardless of brand. A small office with light printing gets a different recommendation to a busy accounts department churning through thousands of pages a month."],
      ["What does the service agreement include?", "What does the service agreement include? Everything except paper. Toner, parts, consumables, labour, callouts, and support are all included in the cost-per-page charge. It's a 12-month rolling agreement - no 5-year lock-ins, no automatic renewals, and you can leave with reasonable notice."],
      ["Is the print audit really free?", "Is the print audit really free? Yes. We deploy monitoring software that runs in the background for around a month and collects the data. We then analyse it and present the findings. If improvements can be made, we'll show you the numbers. If everything is already in good shape, that's the end of it. No obligation, no pressure."],
      ["Do you cover the whole UK?", "Do you cover the whole UK? Yes. Our print partner provides national coverage with direct manufacturer warranty and service. Whether you have one office or multiple sites across the country, you're covered."],
      ["What about printer security?", "What about printer security? Business-grade managed printers include features that consumer devices don't: secure print release (documents only print when you authenticate at the device), encrypted storage, access controls, and managed firmware updates. We ensure print devices are properly secured as part of the setup."],
      ["✓ Trusted by local businesses for over 10 years", "Trusted by local businesses for over 10 years"],
      ["Call The Batphone 01584 517 234", "Call The Batphone01584 517 234"],
      ["Email HQ hello@fresh-tech.uk", "Email HQhello@fresh-tech.uk"],
      ["Face-to-Face Book an Intro Call with Sam", "Face-to-FaceBook an Intro Call with Sam"],
      ["Send a Signal Step 1 of 3 Name Email Phone (optional) How can we help? We typically respond within 15 minutes during business hours (Mon-Fri, 9am-5pm). Send Message Existing Client? Email support@fresh-tech.uk or call 01584 517 234 for urgent help.", "Send a message Tell us what you need help with Share the basics and we can start with the right context. Please do not include passwords or other sensitive information. Online messages are disabled in this preview This preview cannot send enquiries. Call 01584 517 234 or email hello@fresh-tech.uk."],
    ],
    // Accessibility fix: the security-feature and commitment card headings
    // are native h3 (not h4 as in production) because they sit directly
    // under their section's h2 with no h3 in between, and skipping a heading
    // level fails the accessibility audit. The "Real Example"/"Same Workload"
    // pair stays h4 - it is correctly nested under the "Razor-and-Blades
    // Problem" h3, so it is left alone.
    headings: headings => {
      const promoted = new Set([
        'Secure Print Release', 'Encrypted Storage', 'Access Controls', 'Managed Firmware Updates',
        'Nothing Hidden Below the Line', 'No Long-Term Contracts', 'No Hard Sell', 'Complete Honesty',
        'Qualified Engineers', 'No Brand Loyalty',
      ]);
      return headings.flatMap(h => (
        h[0] === 3 && h[1] === 'Send a Signal'
          ? [[2, 'Tell us what you need help with'], [3, 'Online messages are disabled in this preview']]
          : h[0] === 4 && promoted.has(h[1]) ? [[3, h[1]]] : [h]
      ));
    },
    links: links => [
      ...links.slice(0, 9),
      ['mailto:hello@fresh-tech.uk', 'hello@fresh-tech.uk'],
      ['/contact', 'Book an Intro Call with Sam'],
      ['tel:+441584517234', '01584 517 234'],
      ['mailto:hello@fresh-tech.uk', 'hello@fresh-tech.uk'],
    ],
  },
  // FaqPage.tsx renders the shared <Contact/>; same SourceContact.astro +
  // disabled-preview ContactForm.astro pattern as /managed-print-guide above
  // (FORM-01, obfuscated-email span, Calendly button). SourceContact's trust
  // tick is inside an aria-hidden span, losing the leading "✓ " character.
  '/faq': {
    text: [
      ['✓ Trusted by local businesses for over 10 years', 'Trusted by local businesses for over 10 years'],
      // SourceContact's label/value pairs are adjacent inline elements with no
      // whitespace between them in the template, unlike production's separate
      // block-level <p> label, so Astro's compiler drops the space entirely.
      ['Call The Batphone 01584 517 234', 'Call The Batphone01584 517 234'],
      ['Email HQ hello@fresh-tech.uk', 'Email HQhello@fresh-tech.uk'],
      ['Face-to-Face Book an Intro Call with Sam', 'Face-to-FaceBook an Intro Call with Sam'],
      ['Send a Signal Step 1 of 3 Name Email Phone (optional) How can we help? We typically respond within 15 minutes during business hours (Mon-Fri, 9am-5pm). Send Message Existing Client? Email support@fresh-tech.uk or call 01584 517 234 for urgent help.',
        'Send a message Tell us what you need help with Share the basics and we can start with the right context. Please do not include passwords or other sensitive information. Online messages are disabled in this preview This preview cannot send enquiries. Call 01584 517 234 or email hello@fresh-tech.uk.'],
    ],
    headings: (headings) => headings.flatMap(h => (
      h[0] === 3 && h[1] === 'Send a Signal'
        ? [[2, 'Tell us what you need help with'], [3, 'Online messages are disabled in this preview']]
        : [h]
    )),
    // The category quick-nav items scroll to the question list in production
    // (onClick buttons); natively they are links to #faq-list so they work
    // without JavaScript, adding four links after the featured answers.
    links: (links) => {
      const featured = links.findIndex(([, text]) => text === 'See how it works');
      links = [...links.slice(0, featured + 1), ...['General IT Support3', 'Cyber Security2', 'Pricing & Costs2', 'Onboarding2'].map(text => ['#faq-list', text]), ...links.slice(featured + 1)];
      const idx = links.findIndex(([href, text]) => href === '/onboarding' && text.startsWith('Thinking of switching'));
      if (idx === -1) return links;
      return [
        ...links.slice(0, idx + 2),
        ['mailto:hello@fresh-tech.uk', 'hello@fresh-tech.uk'],
        ['/contact', 'Book an Intro Call with Sam'],
        ['tel:+441584517234', '01584 517 234'],
        ['mailto:hello@fresh-tech.uk', 'hello@fresh-tech.uk'],
      ];
    },
  },
  // Same pattern as /upgrade-to-business-premium above: the "Real-World
  // Scenarios" and FAQ accordions are native <details>/<summary>, so their
  // body text (only rendered by React once a card is open) is always present
  // in the DOM. The headings/text diffs insert the per-scenario "Without/With
  // Independent Backup" headings and every scenario/FAQ body sentence.
  // Accessibility fix: these are rendered as h3 (not h4 as in production)
  // because they sit directly under the "Real-World Scenarios" h2 with no h3
  // in between, and skipping a heading level fails the accessibility audit.
  // The closing <SourceContact/> differs the same way as /managed-print-guide
  // above: the trust tick's leading "✓ " is inside an aria-hidden span, and
  // the shared ContactForm.astro in disabled-preview mode replaces the
  // source's live idle-state form and its "Existing Client?" note with a
  // shorter disabled notice, dropping the mailto:support@ and second tel
  // links and adding Email HQ, Face-to-Face and the disabled notice's own
  // call/email links instead.
  '/cloud-backup-necessity': {
    headings: headings => {
      const scenarioIndex = headings.findIndex(([level, text]) => level === 2 && text === 'Real-World Scenarios');
      const perScenario = [
        [3, 'Without Independent Backup'],
        [3, 'With Independent Backup'],
      ];
      const withScenarios = [
        ...headings.slice(0, scenarioIndex + 1),
        ...Array.from({ length: 5 }, () => perScenario).flat(),
        ...headings.slice(scenarioIndex + 1),
      ];
      return withScenarios.flatMap(h => (
        h[0] === 3 && h[1] === 'Send a Signal'
          ? [[2, 'Tell us what you need help with'], [3, 'Online messages are disabled in this preview']]
          : [h]
      ));
    },
    text: [
      [
        'Real-World Scenarios These situations happen every day. The difference between disaster and minor inconvenience is backup. The Accidental Deletion The Disgruntled Leaver The Ransomware Sync The Retention Gap The Account Compromise The Real Cost Comparison',
        "Real-World Scenarios These situations happen every day. The difference between disaster and minor inconvenience is backup. The Accidental Deletion Sarah, an office manager, accidentally deleted a SharePoint folder containing 3 years of client contracts while reorganising files. She didn't notice for 6 weeks. Without Independent Backup The files exceeded the 93-day retention window. They were permanently gone. The business had to contact clients to request copies of their own contracts -embarrassing and time-consuming. With Independent Backup A quick restore from the backup solution brought back the entire folder within minutes. The business didn't even need to inform clients. Lesson: Microsoft 365's recycle bin only retains deleted items for 93 days. After that, it's gone forever -unless you have independent backup. The Disgruntled Leaver James, a sales manager, resigned with immediate effect after a disagreement. Before handing over his laptop, he logged into OneDrive and permanently deleted his entire sales pipeline, contacts, and 2 years of proposal documents. Without Independent Backup The deletion was discovered a week later when his replacement started. Microsoft's retention had already cleared the recycle bin. The new hire spent months rebuilding relationships from scratch. With Independent Backup The IT team restored James's entire OneDrive to the state it was in before his departure. The new sales manager hit the ground running. Lesson: When employees leave unhappily, your data is at risk. Microsoft won't protect you from authorised users deleting their own files. The Ransomware Sync A manufacturing firm's accountant opened a malicious email attachment. Ransomware encrypted her local files -and because OneDrive was syncing, the encrypted versions replaced the good copies in the cloud. Without Independent Backup The 'cloud backup' everyone assumed existed was just OneDrive sync. The encrypted files were now in the cloud too. They paid a £45,000 ransom and still lost 3 months of data. With Independent Backup The backup solution stored immutable copies that ransomware couldn't touch. Full restore completed in 4 hours. Zero ransom paid. Lesson: OneDrive sync is not backup -it replicates problems as fast as it replicates files. See our guide on ransomware recovery. The Retention Gap A law firm needed to retrieve emails from 18 months ago for a court case. The emails had been deleted by the user after the matter 'closed'. Without Independent Backup Microsoft 365's default retention is 30 days for deleted items. Even with litigation hold enabled (which they hadn't configured), the emails were unrecoverable. With Independent Backup The backup solution retained all emails for 7 years as per their configured policy. The evidence was produced within the hour. Lesson: Legal and compliance requirements often exceed Microsoft's default retention. Without independent backup, you may fail regulatory obligations. The Account Compromise A hacker gained access to the finance director's Microsoft 365 account through a phishing email. They set up email forwarding rules and deleted evidence of fraudulent payment requests over several weeks. Without Independent Backup By the time the breach was discovered, the deleted emails had aged out of retention. There was no audit trail of what had been sent or deleted. With Independent Backup The backup retained a complete timeline. Investigators could see exactly which emails were forwarded, deleted, and when -crucial evidence for the fraud investigation. Lesson: Attackers don't just steal data -they cover their tracks. Independent backup preserves the evidence chain. The Real Cost Comparison",
      ],
      [
        "Isn't my data already backed up because it's 'in the cloud'? What's the difference between OneDrive sync and OneDrive backup? What is Known Folder Move (KFM) and should we use it? How long does Microsoft keep deleted files? What about Google Workspace -is it the same problem? How much does proper cloud backup cost? Can't I just export my data regularly instead? We have Microsoft 365 E5 -doesn't that include backup? Don't Wait for a Disaster to Discover You're Not Protected",
        "Isn't my data already backed up because it's 'in the cloud'? No -and this is the most dangerous assumption businesses make. Cloud services like Microsoft 365 and Google Workspace provide high availability (your data is replicated across data centres so the service stays online), but this is not backup. If you delete a file, that deletion is replicated everywhere. If ransomware encrypts your files via sync, the encrypted versions replace the originals. The cloud protects against their hardware failures, not your data loss. What's the difference between OneDrive sync and OneDrive backup? OneDrive Sync mirrors files between your computer and the cloud -changes go both ways instantly. OneDrive Backup (Known Folder Move) redirects your Desktop, Documents, and Pictures folders to OneDrive. Both are sync technologies, not backup. A true backup is a separate, protected copy of your data that can be restored to a point in time -even if the original is deleted, corrupted, or encrypted. What is Known Folder Move (KFM) and should we use it? KFM is a Microsoft feature that redirects your Desktop, Documents, and Pictures folders to OneDrive. You absolutely should use it -it means files aren't trapped on individual laptops and are accessible from anywhere. But it's protection against device loss, not data loss. If a file is deleted from OneDrive, it's deleted everywhere. KFM + independent backup = comprehensive protection. How long does Microsoft keep deleted files? It varies by service: OneDrive/SharePoint keeps deleted items in the recycle bin for 93 days, then they're permanently deleted. Exchange Online keeps deleted emails for 14-30 days depending on configuration. Teams messages follow complex retention rules. After these windows close, Microsoft cannot recover your data -even if you pay them. These retention periods are also not guaranteed and can change. What about Google Workspace -is it the same problem? Yes. Google's Terms of Service contain nearly identical disclaimers. Google Drive's trash empties after 30 days. Gmail deleted items last 30 days. Google explicitly states they are not responsible for data loss. The 'it's in the cloud' false sense of security applies equally to Google Workspace users. How much does proper cloud backup cost? Typically £2-4 per user per month for comprehensive Microsoft 365 or Google Workspace backup. Compare this to the cost of losing your data: the average cost of a ransomware attack for SMBs is £115,000. For a 20-person company, that's roughly £50/month for insurance against potentially business-ending data loss. Can't I just export my data regularly instead? Manual exports are better than nothing, but they're not practical at scale. They require someone to remember, they're incomplete (you rarely get everything), they're not easily restorable, and they're typically stored somewhere that's also vulnerable to the same threats. Automated, managed backup with tested restores is the only reliable approach. We have Microsoft 365 E5 -doesn't that include backup? No. Even the most expensive Microsoft 365 licence does not include true backup. E5 includes advanced compliance features like extended retention and litigation hold, but these are not the same as backup. Retention policies keep data longer before deletion -but if data is corrupted or encrypted, that corrupted version is what's retained. Microsoft is now offering 'Microsoft 365 Backup' as an additional paid product, acknowledging that backup was never included. Don't Wait for a Disaster to Discover You're Not Protected",
      ],
      ['✓ Trusted by local businesses for over 10 years', 'Trusted by local businesses for over 10 years'],
      ['Call The Batphone 01584 517 234', 'Call The Batphone01584 517 234'],
      ['Email HQ hello@fresh-tech.uk', 'Email HQhello@fresh-tech.uk'],
      ['Face-to-Face Book an Intro Call with Sam', 'Face-to-FaceBook an Intro Call with Sam'],
      [
        'Send a Signal Step 1 of 3 Name Email Phone (optional) How can we help? We typically respond within 15 minutes during business hours (Mon-Fri, 9am-5pm). Send Message Existing Client? Email support@fresh-tech.uk or call 01584 517 234 for urgent help.',
        'Send a message Tell us what you need help with Share the basics and we can start with the right context. Please do not include passwords or other sensitive information. Online messages are disabled in this preview This preview cannot send enquiries. Call 01584 517 234 or email hello@fresh-tech.uk.',
      ],
    ],
    // The captured baseline shows the SmartImage onError fallback
    // (placehold.co) because that capture run's headless browser could not
    // reach Cloudinary; the real asset (the source's genuine Cloudinary
    // upload) is restored here rather than reproduced literally as a broken
    // image, matching rule 6's Cloudinary transform convention.
    images: images =>
      images.map(([src, alt]) =>
        src.includes('placehold.co')
          ? ['https://res.cloudinary.com/djkmeg5se/image/upload/v1749314205/cloud-backup-data-protection-microsoft-365.jpg', alt]
          : [src, alt]
      ),
    links: links => {
      const index = links.findIndex(([href]) => href === 'tel:01584517234');
      return [
        ...links.slice(0, index + 1),
        ['mailto:hello@fresh-tech.uk', 'hello@fresh-tech.uk'],
        ['/contact', 'Book an Intro Call with Sam'],
        ['tel:+441584517234', '01584 517 234'],
        ['mailto:hello@fresh-tech.uk', 'hello@fresh-tech.uk'],
      ];
    },
  },
  // The referral form only fakes a "SENT!" success message (FORM-01), so it is
  // replaced with a short truthful fallback (call, email or /contact); the
  // surrounding "how it works" and trust copy is kept unchanged.
  '/refer': {
    text: [
      ["Your details Your name Your email Your business (so we know which account to credit) Business you're referring Business name Contact name Their phone Anything useful for us to know? (optional) Submit referral → We'll send you a confirmation email once we've made contact.",
        "Referring a business This preview cannot submit referrals online. Call 01584 517 234, email hello@fresh-tech.uk or use our contact page, and let us know who you'd like to introduce."],
    ],
    links: () => [
      ['tel:+441584517234', '01584 517 234'],
      ['mailto:hello@fresh-tech.uk', 'hello@fresh-tech.uk'],
      ['/contact', 'contact page'],
    ],
  },
  // ResourceCentrePage.tsx renders the shared <Contact/>; same SourceContact.astro
  // + disabled-preview ContactForm.astro pattern as /faq and /managed-print-guide
  // above (FORM-01, obfuscated-email span, Calendly button). SourceContact's
  // trust tick is inside an aria-hidden span, losing the leading "✓ " character,
  // and its label/value pairs are adjacent inline elements with no whitespace
  // between them in the template (unlike production's separate block-level
  // label), so Astro's compiler drops the space entirely.
  '/resources': {
    text: [
      ['Download PDF Now Ship Me a Free Copy', 'Ship Me a Free Copy'],
      ['✓ Trusted by local businesses for over 10 years', 'Trusted by local businesses for over 10 years'],
      ['Call The Batphone 01584 517 234', 'Call The Batphone01584 517 234'],
      ['Email HQ hello@fresh-tech.uk', 'Email HQhello@fresh-tech.uk'],
      ['Face-to-Face Book an Intro Call with Sam', 'Face-to-FaceBook an Intro Call with Sam'],
      ['Send a Signal Step 1 of 3 Name Email Phone (optional) How can we help? We typically respond within 15 minutes during business hours (Mon-Fri, 9am-5pm). Send Message Existing Client? Email support@fresh-tech.uk or call 01584 517 234 for urgent help.',
        'Send a message Tell us what you need help with Share the basics and we can start with the right context. Please do not include passwords or other sensitive information. Online messages are disabled in this preview This preview cannot send enquiries. Call 01584 517 234 or email hello@fresh-tech.uk.'],
    ],
    // Accessibility fix: the Essential Guides, Industry IT Guides, Technology
    // Explained, IT Crisis Help and Fresh From The Press card titles are
    // native h3 (not h4 as in production) because they sit directly under
    // their section's h2 with no h3 in between, and skipping a heading level
    // fails the accessibility audit.
    headings: headings => headings.flatMap(h => (
      h[0] === 3 && h[1] === 'Send a Signal'
        ? [[2, 'Tell us what you need help with'], [3, 'Online messages are disabled in this preview']]
        : h[0] === 4 ? [[3, h[1]]] : [h]
    )),
    // BuyersGuideCta.tsx: "Download PDF Now" points at
    // /assets/FreshTech-Buyers-Guide.pdf, which does not exist (production
    // serves its HTML fallback there, checked 16 September 2026), so the native
    // page omits that broken button. "Ship Me a Free Copy" opens a lead-capture
    // modal in production, which cannot work statically, so it becomes a
    // /contact link with the same label, inserted before the Contact section.
    links: (links) => {
      const idx = links.findIndex(([href, text]) => href === '/onboarding' && text.startsWith('Thinking of switching'));
      if (idx === -1) return links;
      return [
        ...links.slice(0, idx),
        ['/contact', 'Ship Me a Free Copy'],
        ...links.slice(idx, idx + 2),
        ['mailto:hello@fresh-tech.uk', 'hello@fresh-tech.uk'],
        ['/contact', 'Book an Intro Call with Sam'],
        ['tel:+441584517234', '01584 517 234'],
        ['mailto:hello@fresh-tech.uk', 'hello@fresh-tech.uk'],
      ];
    },
  },
  // The health-check request form only fakes a "SENT!" success message
  // (FORM-01), so it is replaced with a short truthful fallback (call, email
  // or /contact); the surrounding checklist, process and "what you'll
  // receive" copy is kept unchanged.
  '/it-health-check': {
    text: [
      ["Your name Work email Company How many staff use IT? 1–5 5–10 10–25 25–50 50+ Request the audit → We only use your details to schedule the audit and send you the report.",
        "Requesting your check This preview cannot accept requests online. Call 01584 517 234, email hello@fresh-tech.uk or use our contact page to book your free health check."],
    ],
    links: (links) => {
      const idx = links.findIndex(([href]) => href === '#form');
      if (idx === -1) return links;
      return [
        links[idx],
        ['tel:+441584517234', '01584 517 234'],
        ['mailto:hello@fresh-tech.uk', 'hello@fresh-tech.uk'],
        ['/contact', 'contact page'],
        ...links.slice(idx + 1),
      ];
    },
  },
  // AboutPageV2.tsx only renders each team member's bio while its card is
  // hovered (React state, not CSS), so it is entirely absent from the
  // captured baseline. The native card keeps the bio in the DOM always (a
  // mouse-only reveal would hide it from keyboard and touch visitors), so it
  // is inserted here after each team member's "power" line.
  '/about': {
    text: [
      ['Sam James Founder & Director Uptime Avenger Matthew Morgan',
        "Sam James Founder & Director Uptime Avenger Started Fresh Tech in 2014 after watching local businesses get burned by national IT firms who didn't know Shropshire and didn't care to. Built the kind of support he'd have wanted to hire. Fixes servers. Makes excellent coffee. Matthew Morgan"],
      ['Matthew Morgan Senior Engineer Network Whisperer The origin',
        "Matthew Morgan Senior Engineer Network Whisperer Deep network and infrastructure knowledge, fast on-site across the region. Probably diagnosed your problem before you've finished explaining it. Specialises in M365, connectivity, and anything that involves a patch panel. The origin"],
    ],
  },
  // WhyTrustUsPageV2.tsx shows three live helpdesk figures (response, call
  // wait, resolution). The shared live-metrics script (src/scripts/
  // live-metrics.ts, reused from PricingPage.astro) only fetches and renders
  // "response" and "callWait": there is no native key for average resolution
  // time, so rather than fake a permanently-"Loading…" figure, that stat is
  // dropped entirely.
  '/why-trust-us': {
    text: [
      ['Loading… Avg resolution Last 30 days Reviews', 'Reviews'],
      // Accessibility fix: the founder card's 👤 placeholder avatar is purely
      // decorative (the founder's name and role are given right next to it),
      // so it is aria-hidden here, which also fixes the emoji's failing
      // contrast against its background. aria-hidden subtrees are excluded
      // from the parity text, dropping the glyph from the native extraction.
      ['See guarantees ↓ 👤 Sam James', 'See guarantees ↓ Sam James'],
    ],
  },
});

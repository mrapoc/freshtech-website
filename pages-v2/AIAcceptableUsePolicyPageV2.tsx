import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '../components/SEO';
import { T, useWindowWidth, useContentMax, Eyebrow, DisplayHead, Sticker } from '../components-v2/primitives';

const halftoneCss = (color: string, dot = 1.4, grid = 12) => ({
  backgroundImage: `radial-gradient(${color} ${dot}px, transparent ${dot}px)`,
  backgroundSize: `${grid}px ${grid}px`,
});

// Each section: number, emoji marker, title, body (markdown-lite — **bold**, bullets prefixed with • )
const SECTIONS: { n: number; emoji: string; title: string; body: string }[] = [
  { n: 1,  emoji: '🧠', title: 'Our approach to AI',
    body: "Artificial Intelligence offers real opportunities for productivity, creativity and efficiency. We want everyone in the business to benefit from these tools and to do the best work of their careers with them.\n\nHowever, AI also introduces new risks. Data leakage, copyright issues and misinformation can threaten our business, our clients and our reputation if tools are used carelessly.\n\nThis policy exists to make sure we use AI safely and responsibly. It is not here to slow anyone down. It is here to protect the business so we can continue to innovate without putting our hard work at risk.\n\nIf you find a tool that makes your job easier, we want to hear about it. Just ask before you use it so we can check it is safe." },
  { n: 2,  emoji: '🙋', title: 'Personal responsibility',
    body: "You are responsible for the accuracy, legality and privacy of any work you submit, regardless of whether AI was involved in producing it.\n\nAI is a tool, not an employee. Using AI does not excuse errors, bias or copyright infringement. You must verify all AI-generated outputs before they leave your desk.\n\nThink of AI as a junior assistant. It is fast, eager and helpful, but it does not know our business context, our clients or our ethical standards the way you do. Your professional judgment is the final filter." },
  { n: 3,  emoji: '📖', title: 'Key definitions',
    body: "**Generative AI:** Artificial intelligence that creates new content (text, images, code) in response to prompts. Examples: ChatGPT, Microsoft Copilot, Midjourney.\n\n**Hallucination:** When AI confidently generates false, misleading or nonsensical information as though it were fact.\n\n**Training Data:** Information fed into an AI model to teach it. If company data is used as training data by a public AI tool, that data may become part of the public model.\n\n**Shadow IT:** The use of unauthorised or unvetted software by employees without IT department approval.\n\n**Jailbreaking / Prompt Injection:** Using specific inputs to trick AI into bypassing its safety filters or security rules.\n\n**PII (Personally Identifiable Information):** Any data that could identify a specific individual: names, National Insurance numbers, addresses, phone numbers.\n\n**Anonymisation:** Removing or masking sensitive details from a document before sharing it with an AI tool.\n\n**Deepfake:** Synthetic media (video, audio, image) created by AI to convincingly impersonate a real person.\n\n**API:** A software bridge that allows two applications to exchange data. Automation tools like Zapier and Power Automate use APIs.\n\n**Human Oversight:** A process requiring human review and approval before an AI-generated decision is finalised.\n\n**BYOD:** Employees using personal devices for work purposes." },
  { n: 4,  emoji: '🔍', title: 'Scope of policy',
    body: "This policy applies to all forms of AI usage within the business, including but not limited to:\n\n• **Web-based tools:** ChatGPT, Claude, Gemini and similar platforms.\n• **Browser extensions:** Grammar checkers, page summarisers, writing assistants.\n• **Operating system features:** AI features built into Windows, macOS, iOS or Android (e.g. Copilot in Windows, Apple Intelligence).\n• **Meeting recorders:** Automated transcription and note-taking tools.\n\nAI features and tools pre-installed on company devices are also covered by this policy." },
  { n: 5,  emoji: '🛡️', title: 'Authorised and prohibited software',
    body: "To protect against data leakage, we restrict which AI tools may be used for business purposes.\n\nUnvetted tools expose the company to Shadow IT risks, where data may be used to train public models or stored on insecure servers outside our control.\n\n**Rules:**\n• You may only use AI tools that have been formally approved and set up by the IT department.\n• Subscriptions to unapproved AI tools will not be reimbursed.\n• Any AI tool, browser extension or plugin that is not on the Authorised Software List is prohibited.\n\nWe do not maintain a \"banned apps\" list because new tools appear daily. Unless a tool has been vetted and added to the Authorised List, it may not be used for company business.\n\nRefer to Appendix A for the current Authorised AI Software List." },
  { n: 6,  emoji: '📋', title: 'Requesting new tools',
    body: "Innovation is encouraged. If you would like to request an AI tool to be added to the Authorised Software List, contact [YOUR IT CONTACT].\n\nThey will perform an AI Vendor Review covering privacy, security and data governance to ensure the tool is safe for your environment." },
  { n: 7,  emoji: '🗂️', title: 'Data classification protocol',
    body: "You must classify data before entering it into any AI tool. Use the following guide:\n\n**PUBLIC DATA: Safe to Use**\nInformation already in the public domain. No restrictions.\nExamples: Marketing copy, general industry research, brainstorming.\n\n**INTERNAL DATA: Use with Caution**\nInternal business documents that are not confidential. Anonymisation required before input.\nExamples: Internal memos, process documentation, draft emails.\n\n**RESTRICTED DATA: Never Input into AI**\nAny data that would cause harm if leaked.\nExamples: Client names, National Insurance numbers, home addresses, bank account details, credit card numbers, passwords, API keys.\n\nIf you are ever unsure how to classify a document, contact your IT department before proceeding." },
  { n: 8,  emoji: '⚖️', title: 'Regional and industry regulations',
    body: "Processing data subject to specific privacy or industry regulations requires a compliance review by IT before use with any AI tool.\n\nMost standard AI tools do not automatically meet regulatory standards. Many regulations require data to remain within a specific country or require strict audit logs that public AI tools do not provide.\n\nJust because a tool is popular does not mean it is compliant with the laws governing your industry.\n\nYou are responsible for adhering to the regulations relevant to your role. If you have questions about compliance, speak to your IT or legal team." },
  { n: 9,  emoji: '📄', title: 'Client contract requirements',
    body: "Client contracts come first.\n\nBefore using AI on any client project, verify that the relevant Master Services Agreement (MSA) does not prohibit the use of AI.\n\nIf a contract forbids AI usage, you must not use it regardless of the data classification." },
  { n: 10, emoji: '🎙️', title: 'Meeting recorders and extensions',
    body: "**Meeting Recorders:** Third-party AI bots (e.g. Otter.ai, Fireflies) are prohibited from joining meetings unless authorised by IT. If an unauthorised bot joins a meeting, the host must remove it immediately.\n\n**Browser Extensions:** Installing browser extensions that use AI features is prohibited unless deployed by the IT department. These extensions often require full read-access to web traffic, including private emails and banking portals." },
  { n: 11, emoji: '👁️', title: 'Monitoring and privacy',
    body: "Company-provided AI accounts are company property.\n\nThe business reserves the right to audit, monitor and review all prompts, inputs and outputs generated on company AI accounts to ensure compliance with this policy.\n\nCompany AI accounts are monitored and should not be treated as private." },
  { n: 12, emoji: '⚠️', title: 'AI hallucinations and output verification',
    body: "AI models frequently hallucinate: they confidently present incorrect information as fact.\n\nYou are required to fact-check 100% of AI-generated claims against a primary source.\n\n**Never rely on AI for:**\n• Legal statutes or case law\n• Mathematical calculations\n• Factual citations or historical dates\n\nIf you make a business decision based on AI output, you must validate the underlying data first." },
  { n: 13, emoji: '©️', title: 'Intellectual property and copyright',
    body: "AI-generated content occupies a complex legal grey area.\n\n**Copyright Risks:** Do not use AI to generate content that copies the distinct style of existing copyrighted works or deliberately reproduces protected trademarks.\n\n**Brand Representation:** Be cautious using AI to generate photos, videos or audio representing your brand. AI often introduces subtle errors (misspelled logos, physical anomalies) that can damage professional reputation.\n\n**Code Generation:** Using AI to generate software code is prohibited unless you are qualified to audit the code for security vulnerabilities. Ensure AI-generated code does not inadvertently incorporate open-source code that could create legal issues." },
  { n: 14, emoji: '🔁', title: 'Automation workflows',
    body: "Creating automated workflows (e.g. via Zapier, Power Automate, Make.com) that automatically send company data to an AI API without prior IT review is prohibited.\n\nA misconfigured automation can accidentally leak thousands of emails or files in minutes. Even if the AI tool is approved, the API connection must be secured by IT." },
  { n: 15, emoji: '🎤', title: 'Voice cloning and deepfakes',
    body: "Using AI to clone, simulate or mimic the voice or likeness of any person, including staff, contractors, suppliers or public figures, is strictly prohibited unless explicitly authorised in writing by company leadership.\n\nThis includes using text-to-speech tools trained on a specific individual's voice samples." },
  { n: 16, emoji: '💷', title: 'Financial verification',
    body: "Deepfake technology is now used to commit wire fraud.\n\nAny urgent request for funds (wire transfers, gift cards, invoice payments) or credential changes received via voice, video or email requires secondary verification through a known, trusted channel.\n\nIf you receive an unexpected call from a senior figure requesting money, hang up and call them back on their known internal number to verify." },
  { n: 17, emoji: '🧑‍⚖️', title: 'AI-assisted decisions',
    body: "AI tools lack human judgment, ethical reasoning and real-world context. They frequently hallucinate or rely on biased training data while sounding completely authoritative.\n\nA human must review and approve all AI-assisted decisions. This applies to any professional judgment, including:\n\n• Hiring and termination decisions\n• Employee performance evaluations\n• Financial approvals\n• Strategic business planning\n• Professional advice (legal, medical, financial)" },
  { n: 18, emoji: '🪧', title: 'Transparency and disclosure',
    body: "Transparency is key to maintaining trust.\n\n**External Disclosure:** If AI is used to generate content for a client deliverable (report, code, image, article), you must disclose the use of AI unless your contract states otherwise.\n\n**Internal Disclosure:** When submitting work to a manager, flag if the content was AI-assisted to ensure proper review.\n\n**Watermarking:** Where technically feasible, AI-generated images should retain their metadata or visible watermarks indicating their artificial origin." },
  { n: 19, emoji: '📱', title: 'Mobile and personal device usage (BYOD)',
    body: "Using AI apps on personal devices to process company data is prohibited.\n\nYou may not copy company emails, files or chat logs into AI apps (e.g. the ChatGPT mobile app) on a personal device.\n\nMobile access to AI tools is only permitted via a company-managed work profile or approved apps installed by IT." },
  { n: 20, emoji: '🎓', title: 'AI training requirements',
    body: "Access to company AI tools is conditional on competence.\n\nAccess is typically granted upon successful completion of required AI training programmes, including AI Security Awareness, AI Usability Training, and Ethics modules.\n\nThe company reserves the right to revoke AI access for any employee who fails to complete required annual training." },
  { n: 21, emoji: '🤝', title: 'Vendor and contractor compliance',
    body: "Security standards extend to the supply chain.\n\nContractors, vendors and freelancers must use company-approved and provisioned AI tools when working with company data. Use of personal or free AI accounts by contractors is prohibited unless explicit written permission is granted by the IT department.\n\nAll vendors should sign this AI Acceptable Use Policy as part of their onboarding process." },
  { n: 22, emoji: '🔒', title: 'Termination and data retention',
    body: "All prompts, inputs and outputs generated using company AI accounts are the exclusive property of the business.\n\nUpon termination of employment, IT will archive the employee's AI account to ensure business continuity. Employees may not delete, export or transfer AI chat history to a personal account prior to departure." },
  { n: 23, emoji: '🚫', title: 'Ethics and prohibited content',
    body: "AI tools may not be used to generate content that violates the company's Code of Conduct or Harassment Policy.\n\n**Prohibited uses include:**\n• Generating discriminatory, sexually explicit, hateful or harassing content\n• Facilitating cyberattacks, creating phishing emails or generating malicious software" },
  { n: 24, emoji: '🔐', title: 'Security integrity',
    body: "Attempting to bypass the security filters, content moderation protocols or safety guardrails of any AI tool, commonly known as \"jailbreaking\" or \"prompt injection\", is strictly prohibited.\n\nManipulating an AI tool to ignore its safety instructions is a violation of this policy." },
  { n: 25, emoji: '📞', title: 'Incident reporting',
    body: "If you accidentally input restricted data into an AI tool, or suspect an unauthorised bot has recorded a meeting, report it immediately.\n\nSelf-reporting accidental errors is encouraged. Early reporting allows rapid remediation and protects the entire team.\n\nTo report an issue, open an emergency security ticket or call [YOUR IT CONTACT] immediately." },
  { n: 26, emoji: '🔄', title: 'Policy review and updates',
    body: "Due to the rapid pace of AI advancement, this policy is a living document.\n\nIt should be reviewed and updated at least every six months, or upon the release of significant new AI capabilities, to ensure it addresses emerging risks.\n\nEmployees should be notified of any major updates. Continued use of company systems after an update constitutes agreement to the new terms." },
  { n: 27, emoji: '⚖️', title: 'Policy enforcement and acknowledgment',
    body: "These guidelines exist to protect employees, clients and the company's reputation. Mistakes happen, but wilful disregard for these safety measures is a serious issue.\n\nViolations will be investigated. Accidental errors, especially self-reported ones, are typically treated as learning opportunities. Deliberate violations or negligence will be met with appropriate disciplinary action.\n\n**Acknowledgment:**\nAll employees should read and confirm they understand this policy. Employees acknowledge that AI technology evolves rapidly and that it is their responsibility to seek clarification from IT or their manager if they are ever unsure about the safety of a specific tool or action." },
];

// Minimal **bold** + bullet renderer for section bodies
const renderBody = (body: string): React.ReactNode =>
  body.split('\n\n').map((para, i) => {
    if (para.startsWith('• ')) {
      const items = para.split('\n').filter(l => l.startsWith('• ')).map(l => l.slice(2));
      return (
        <ul key={i} style={{ paddingLeft: 22, margin: '0 0 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {items.map((it, k) => <li key={k}>{renderInline(it)}</li>)}
        </ul>
      );
    }
    return (
      <p key={i} style={{ margin: '0 0 12px', lineHeight: 1.7, color: T.ink }}>{renderInline(para)}</p>
    );
  });

const renderInline = (text: string): React.ReactNode => {
  const parts: React.ReactNode[] = [];
  let i = 0; let key = 0;
  while (i < text.length) {
    const start = text.indexOf('**', i);
    if (start === -1) { parts.push(text.slice(i)); break; }
    if (start > i) parts.push(text.slice(i, start));
    const end = text.indexOf('**', start + 2);
    if (end === -1) { parts.push(text.slice(i)); break; }
    parts.push(<strong key={key++}>{text.slice(start + 2, end)}</strong>);
    i = end + 2;
  }
  return <>{parts}</>;
};

export const AIAcceptableUsePolicyPageV2: React.FC = () => {
  const ww       = useWindowWidth();
  const isMobile = ww < 768;
  const isTablet = ww < 1024;
  const [copied, setCopied] = useState(false);
  const policyRef = useRef<HTMLDivElement>(null);

  const handleCopy = async () => {
    if (!policyRef.current) return;
    const text = policyRef.current.innerText;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // Older browser fallback
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handlePrint = () => window.print();

  return (
    <>
      <SEO
        title="Free AI Acceptable Use Policy Template"
        description="Free, ready-to-edit AI Acceptable Use Policy template for UK small businesses. Covers data classes, approved tools, deepfakes, BYOD, output checks and IP."
        type="article"
      />

      {/* HERO */}
      <section style={{
        background: T.ink,
        padding: isMobile ? '56px 20px 64px' : '72px 32px 80px',
        ...halftoneCss('rgba(255,255,255,0.04)', 1.4, 13),
      }}>
        <div style={{
          maxWidth: useContentMax(1100), margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1.3fr 0.7fr',
          gap: isMobile ? 32 : 56,
          alignItems: 'center',
        }}>
          <div>
            <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
              <Sticker rotate={-3} color={T.yellow}>Free template</Sticker>
              <Sticker rotate={2} color={T.green} fg="#fff">For your business, not ours</Sticker>
            </div>
            <DisplayHead as="h1" size={isMobile ? 36 : 48} light style={{ marginBottom: 18, lineHeight: 1.0 }}>
              AI Acceptable Use Policy template.
            </DisplayHead>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 18, lineHeight: 1.6, margin: '0 0 16px', maxWidth: '50ch' }}>
              A battle-tested AI policy template you can adapt for your own business. Copy it, fill in the <code style={{ background: 'rgba(245,194,74,0.15)', color: T.yellow, padding: '1px 6px' }}>[PLACEHOLDER]</code> fields, deploy.
            </p>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14, lineHeight: 1.6, margin: '0 0 28px', maxWidth: '50ch' }}>
              This is <strong style={{ color: 'rgba(255,255,255,0.7)' }}>not</strong> Fresh Tech's internal policy. It's a free starting point for businesses who want to give their team clear rules on AI use without paying a consultant to write one from scratch.
            </p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button onClick={handleCopy} style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '14px 22px',
                background: T.accent, color: T.white,
                border: `2px solid ${T.white}`,
                fontFamily: "'Archivo', sans-serif", fontWeight: 700, fontSize: 15,
                cursor: 'pointer',
                boxShadow: `4px 4px 0 0 ${T.yellow}`,
              }}>{copied ? '✓ Copied' : 'Copy full text'}</button>
              <button onClick={handlePrint} style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '14px 22px',
                background: 'transparent', color: T.white,
                border: '2px solid rgba(255,255,255,0.3)',
                fontFamily: "'Archivo', sans-serif", fontWeight: 700, fontSize: 15,
                cursor: 'pointer',
              }}>Print / Save as PDF</button>
            </div>
            <div style={{
              marginTop: 16,
              fontSize: 12, color: 'rgba(255,255,255,0.4)',
            }}>Browser tip: in the print dialog, "Save as PDF" gives you a clean download.</div>
          </div>
          <div style={{
            background: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(255,255,255,0.12)',
            padding: '24px 28px',
          }}>
            <div style={{
              fontFamily: "'Archivo Narrow', sans-serif", fontSize: 11,
              textTransform: 'uppercase', letterSpacing: '0.12em',
              color: 'rgba(255,255,255,0.4)', fontWeight: 700, marginBottom: 12,
            }}>What's inside</div>
            <ul style={{ paddingLeft: 18, margin: 0, color: 'rgba(255,255,255,0.7)', fontSize: 13, lineHeight: 1.7 }}>
              <li>27 sections covering every common AI risk</li>
              <li>Data classification protocol (Public / Internal / Restricted)</li>
              <li>Deepfake + voice-clone fraud guidance</li>
              <li>BYOD + meeting-recorder rules</li>
              <li>Vendor + contractor compliance</li>
              <li>Plain English, UK-flavoured, ready to edit</li>
            </ul>
          </div>
        </div>
      </section>

      {/* WHY YOU NEED ONE */}
      <section style={{ background: T.paper, padding: '64px 32px', borderBottom: `1px solid ${T.hairline}` }}>
        <div style={{ maxWidth: useContentMax(1100), margin: '0 auto' }}>
          <div style={{ marginBottom: 32 }}>
            <Eyebrow>Why your business needs one</Eyebrow>
            <DisplayHead size={32} style={{ marginBottom: 12 }}>AI is already in your business. Decide on the terms.</DisplayHead>
            <p style={{ color: 'rgba(15,25,35,0.62)', fontSize: 16, lineHeight: 1.6, margin: 0, maxWidth: '60ch' }}>
              ChatGPT, Copilot, Gemini: your team is using them whether you have a policy or not. Without clear rules, you risk:
            </p>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : isTablet ? '1fr 1fr' : 'repeat(4, 1fr)',
            gap: 16,
          }}>
            {[
              { i: '🕳️', t: 'Data leaks',         d: 'Client data pasted into ChatGPT becomes part of the public training pool.' },
              { i: '©️', t: 'Copyright trouble', d: 'AI-generated content can replicate protected styles or trademarks without warning.' },
              { i: '📑', t: 'Compliance breach', d: 'Regulated industries have strict rules on where data can be processed. Public AI tools often violate them.' },
              { i: '🎭', t: 'Deepfake fraud',     d: 'Voice-cloning is now used to authorise fake wire transfers from the "CEO".' },
            ].map(r => (
              <div key={r.t} style={{
                background: T.white,
                border: `1px solid ${T.hairline}`,
                padding: 20,
                boxShadow: '0 2px 8px rgba(15,25,35,0.04)',
              }}>
                <div style={{ fontSize: 24, marginBottom: 10 }}>{r.i}</div>
                <div style={{ fontFamily: "'Bungee', sans-serif", fontSize: 15, marginBottom: 8, lineHeight: 1.15 }}>{r.t}</div>
                <div style={{ fontSize: 13, color: 'rgba(15,25,35,0.62)', lineHeight: 1.6 }}>{r.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TABLE OF CONTENTS */}
      <section style={{ background: T.paperDeep, padding: '48px 32px', borderBottom: `1px solid ${T.hairline}` }}>
        <div style={{ maxWidth: 880, margin: '0 auto' }}>
          <div style={{
            fontFamily: "'Archivo Narrow', sans-serif", fontSize: 11,
            textTransform: 'uppercase', letterSpacing: '0.14em',
            fontWeight: 700, color: T.primary, marginBottom: 16,
          }}>Contents</div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
            gap: '6px 24px',
          }}>
            {SECTIONS.map(s => (
              <a key={s.n} href={`#section-${s.n}`} style={{
                display: 'flex', gap: 10, alignItems: 'baseline',
                fontSize: 13, color: T.ink,
                textDecoration: 'none', padding: '4px 0',
              }}>
                <span style={{
                  width: 26, textAlign: 'right',
                  fontFamily: "'Bungee', sans-serif", fontSize: 12, color: T.primary, flexShrink: 0,
                }}>{s.n}.</span>
                <span>{s.title}</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* POLICY BODY */}
      <section style={{ background: T.paper, padding: isMobile ? '48px 20px' : '64px 32px' }}>
        <div style={{ maxWidth: 880, margin: '0 auto' }} ref={policyRef}>
          <div style={{
            marginBottom: 32,
            padding: '16px 20px',
            background: T.paperDeep,
            border: `1px solid ${T.hairline}`,
            fontSize: 13, color: 'rgba(15,25,35,0.62)', lineHeight: 1.6,
          }}>
            <strong style={{ color: T.ink }}>Version 1.0.</strong> Replace the <code style={{ background: 'rgba(245,194,74,0.25)', padding: '1px 6px' }}>[PLACEHOLDER]</code> fields throughout (e.g. <code style={{ background: 'rgba(245,194,74,0.25)', padding: '1px 6px' }}>[YOUR IT CONTACT]</code>) with your own company details before distributing.
          </div>

          {SECTIONS.map(s => (
            <div key={s.n} id={`section-${s.n}`} style={{ marginBottom: 36, scrollMarginTop: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <div style={{
                  width: 36, height: 36,
                  background: T.paperDeep,
                  border: `2px solid ${T.ink}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, flexShrink: 0,
                }}>{s.emoji}</div>
                <h2 style={{
                  fontFamily: "'Bungee', sans-serif", fontSize: isMobile ? 18 : 20,
                  color: T.ink, margin: 0, lineHeight: 1.15,
                }}>{s.n}. {s.title}</h2>
              </div>
              <div style={{ paddingLeft: isMobile ? 0 : 48, fontFamily: "'Archivo', sans-serif", fontSize: 15 }}>
                {renderBody(s.body)}
              </div>
            </div>
          ))}

          <div style={{ marginTop: 32, padding: '20px 24px', background: T.ink, color: T.paper, ...halftoneCss('rgba(255,255,255,0.04)', 1.4, 12) }}>
            <div style={{ fontFamily: "'Bungee', sans-serif", fontSize: 16, color: T.yellow, marginBottom: 8 }}>Appendix A: Authorised AI Software List</div>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, margin: 0 }}>
              List the AI tools your business has formally approved here. Common starter items: Microsoft Copilot in M365, ChatGPT Enterprise / Team, Anthropic Claude (via API or Team plan), Otter.ai (with IT-approved meeting policy). Update this list as part of every policy review.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{
        background: T.ink, padding: '64px 32px',
        ...halftoneCss('rgba(255,255,255,0.04)', 1.4, 14),
      }}>
        <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
          <Eyebrow light>Need a hand?</Eyebrow>
          <DisplayHead size={36} light style={{ marginBottom: 14 }}>We can help tailor this to your business</DisplayHead>
          <p style={{
            color: 'rgba(255,255,255,0.6)', fontSize: 16, lineHeight: 1.65,
            margin: '0 auto 28px', maxWidth: '46ch',
          }}>
            If your sector has specific compliance obligations (legal, healthcare, finance), we'll tune this template and the supporting M365 controls to match. Free 20-min call to scope it.
          </p>
          <Link to="/contact" style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            padding: '14px 24px',
            background: T.accent, color: T.white,
            border: `2px solid ${T.white}`,
            fontFamily: "'Archivo', sans-serif", fontWeight: 700, fontSize: 15,
            textDecoration: 'none',
            boxShadow: `4px 4px 0 0 ${T.yellow}`,
          }}>Book a 20-min call →</Link>
        </div>
      </section>
    </>
  );
};

export default AIAcceptableUsePolicyPageV2;

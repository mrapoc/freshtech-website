import React, { useState } from 'react';
import { PageHeader } from '../components/PageHeader';
import { Contact } from '../components/Contact';
import { SEO } from '../components/SEO';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { LicenseComparator } from '../components/LicenseComparator';
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Shield,
  Laptop,
  Lock,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Settings,
  Wifi,
  HardDrive,
  UserMinus,
  Globe,
  ShieldCheck,
  ShieldOff,
  Zap,
  Clock,
  RefreshCw,
  FileWarning,
  Cloud,
  Monitor,
  BookOpen
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const BusinessPremiumUpgradePage = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [openScenario, setOpenScenario] = useState<number | null>(null);

  const breadcrumbItems = [
    { label: 'Resources', href: '/resources' },
    { label: 'Why Enroll Devices to Business Premium' }
  ];

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const toggleScenario = (index: number) => {
    setOpenScenario(openScenario === index ? null : index);
  };

  const scenarios = [
    {
      title: "The New Starter's Laptop",
      icon: Laptop,
      color: "amber",
      story: "A new team member joins with a brand new laptop. Someone manually sets up their email, installs Office, and shows them where to save files. Three months later, they're saving everything to their desktop, have no antivirus, and are accessing client data on an unencrypted device.",
      withoutEnrollment: "Nobody knows the laptop isn't encrypted. When it's stolen from their car, client data is exposed. You only discover the security gap during the incident response.",
      withEnrollment: "The laptop automatically enrolled when they signed in. Encryption was enforced, antivirus deployed, and files redirected to OneDrive. When reported stolen, you remotely wiped it in minutes.",
      lesson: "New devices should configure themselves to your security standards automatically -not rely on whoever set it up remembering every step."
    },
    {
      title: "The Shadow IT Sprawl",
      icon: EyeOff,
      color: "red",
      story: "Your team uses Microsoft 365 for email, but Sarah prefers Google Drive, Tom uses Dropbox, and accounts data lives in a shared folder on someone's PC. You're paying for OneDrive but nobody uses it consistently.",
      withoutEnrollment: "Data is scattered everywhere. When Sarah leaves, her Google Drive goes with her. When Tom's Dropbox is breached, you don't even know company files were exposed. The accounts PC fails and nobody backed it up.",
      withEnrollment: "Intune policies redirect everyone's Documents folder to OneDrive automatically. Conditional Access blocks access to company email unless files are saved to approved locations. Shadow IT eliminated at the source.",
      lesson: "You can't protect data you don't know exists. Device enrollment brings visibility and control to where your data actually lives."
    },
    {
      title: "The Compromised Account",
      icon: Lock,
      color: "red",
      story: "A phishing email tricks your office manager into entering her Microsoft 365 password on a fake login page. The attacker now has her credentials and logs in from overseas.",
      withoutEnrollment: "The attacker accesses emails, SharePoint, and OneDrive from their own device. They set up forwarding rules, download client data, and you don't notice for weeks.",
      withEnrollment: "Conditional Access blocks the login attempt -it's from an unrecognised device and unusual location. Even with valid credentials, the attacker can't get in. You're alerted to the blocked attempt.",
      lesson: "Passwords get stolen. With device enrollment, stolen passwords aren't enough -attackers need a compliant, enrolled device too."
    },
    {
      title: "The Compliance Question",
      icon: FileWarning,
      color: "amber",
      story: "Your accountancy firm wins a large client. Their due diligence questionnaire asks: 'How do you ensure devices accessing our data meet minimum security standards? Can you remotely wipe a lost device?'",
      withoutEnrollment: "You can't honestly answer yes. You don't know which devices access client data, whether they're encrypted, or if you could wipe them. The client chooses a competitor who could demonstrate device management.",
      withEnrollment: "You provide screenshots from Intune showing device compliance status, encryption enforcement, and remote wipe capability. The client is reassured and signs the contract.",
      lesson: "As clients become more security-conscious, proving device management isn't optional -it's a competitive advantage."
    },
    {
      title: "The Leaver Who Didn't Leave",
      icon: UserMinus,
      color: "red",
      story: "David resigns but keeps accessing company systems from his personal laptop for weeks after his last day. His account was disabled, but he'd saved his password in his browser and connected via a mail app that didn't check.",
      withoutEnrollment: "David continues accessing emails and files from his personal device. You have no visibility that this is happening. Sensitive information continues to leak.",
      withEnrollment: "Conditional Access requires a compliant, enrolled device. David's personal laptop isn't enrolled, so even cached credentials don't work. Access terminated completely on his last day.",
      lesson: "Disabling an account isn't enough when personal devices have cached access. Device-based policies ensure access truly ends when employment does."
    }
  ];

  const faqs = [
    {
      q: "What's the difference between Business Standard and Business Premium?",
      a: "**Business Standard** (£10.30/user/month) gives you Office apps, email, and Teams -but no device management or advanced security. **Business Premium** (£18.10/user/month) adds Intune for device management, Defender for Business antivirus, Conditional Access for smart security policies, and more. The £7.80 difference replaces multiple third-party tools that would cost far more separately."
    },
    {
      q: "What does 'enrolling a device' actually mean?",
      a: "Enrolling a device registers it with Microsoft Intune so you can manage it centrally. Once enrolled, you can push security policies (like requiring encryption), deploy apps automatically, see device compliance status, and remotely wipe it if lost. The user experience barely changes -they just sign in with their work account and the device configures itself."
    },
    {
      q: "Will this slow down our computers or be intrusive?",
      a: "No. Intune policies run silently in the background. Users won't notice anything different except that their new laptop 'just works' out of the box. We configure sensible defaults -not heavy-handed restrictions that frustrate staff. You get security without the friction."
    },
    {
      q: "What about personal devices (BYOD)?",
      a: "You have options. You can require full enrollment (giving you complete management), or use 'app protection policies' that only manage company data within specific apps -leaving personal data untouched. Most SMBs we work with provide company devices, but BYOD is fully supported if that's your model."
    },
    {
      q: "We're already using Google Workspace -does this still apply?",
      a: "If you're on Google Workspace, you face the same device management challenges -you just solve them differently. However, many businesses use both (Google for some things, Microsoft for others). If you're considering consolidating, Business Premium gives you email, productivity apps, AND device management in one platform. We can help you evaluate whether consolidation makes sense."
    },
    {
      q: "How long does migration take?",
      a: "For most SMBs, we can migrate from Standard to Premium and enroll devices within 1-2 weeks. The license upgrade itself is instant. Enrolling devices can often be done gradually -new devices enroll automatically, and existing devices can be enrolled during a scheduled 'security day' with minimal disruption."
    },
    {
      q: "What happens to our existing security tools?",
      a: "Business Premium often replaces them entirely. Defender for Business replaces third-party antivirus. Built-in email filtering replaces separate spam tools. Conditional Access replaces standalone MFA tools. We'll audit your current stack and show you exactly what can be consolidated -typically saving money even with the Premium uplift."
    },
    {
      q: "Is this just for laptops, or mobile phones too?",
      a: "Both. Intune manages Windows, macOS, iOS, and Android devices. If staff access company email on their phones, those devices can be enrolled too -ensuring data is protected regardless of which device someone uses."
    }
  ];

  // Schema for SEO
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.q,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.a.replace(/\*\*([^*]+)\*\*/g, '$1')
      }
    }))
  };

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "Why Enroll Devices to Microsoft 365 Business Premium",
    "description": "Discover why enrolling devices to Intune via Business Premium gives SMBs enterprise-grade security, visibility, and control -without enterprise complexity.",
    "author": {
      "@type": "Organization",
      "name": "Fresh Tech",
      "url": "https://fresh-tech.uk"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Fresh Tech",
      "logo": {
        "@type": "ImageObject",
        "url": "https://res.cloudinary.com/djkmeg5se/image/upload/f_auto,q_auto/fresh-tech-logo.png"
      }
    }
  };

  return (
    <div className="bg-white">
      <SEO
        title="Why Enroll Devices to Business Premium | Intune & Autopilot Benefits"
        description="Stop managing devices manually. Learn why enrolling devices to Microsoft 365 Business Premium with Intune gives you visibility, security, and control over company data."
        breadcrumbs={breadcrumbItems.map(item => ({
          name: item.label,
          item: item.href || '/upgrade-to-business-premium'
        }))}
        schema={[articleSchema, faqSchema]}
      />

      <PageHeader
        title="Take Control of Your Devices"
        subtitle="Unmanaged devices are accessing your company data right now. Intune and Autopilot change that -giving you visibility, security, and control without the complexity."
        highlightText="Control"
      />

      {/* Breadcrumbs */}
      <div className="container mx-auto px-4 pt-8">
        <Breadcrumbs items={breadcrumbItems} className="justify-center" />
      </div>

      {/* Hero Introduction */}
      <section className="py-12 bg-linear-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="w-5 h-5 text-primary" />
                <span className="text-sm font-semibold text-primary uppercase tracking-wider">Essential Guide</span>
              </div>
              <h2 className="font-heading text-2xl md:text-3xl text-neutral mb-4">
                Does This Sound Familiar?
              </h2>
              <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-lg mb-6">
                <p className="text-gray-700 italic text-sm">
                  "We've got a mix of everything -some stuff in SharePoint, some in Dropbox, a few people still use personal Gmail. I think most laptops have antivirus but I'm not certain. Oh, and we've just bought three new laptops for the team starting next month."
                </p>
                <p className="text-amber-700 font-semibold text-xs mt-2"> - Conversation we have weekly</p>
              </div>
              <p className="text-gray-600">
                Data scattered across platforms. New devices set up manually. No idea what's being saved where.
                This is the reality for most SMBs -and it's a security incident waiting to happen.
              </p>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-primary/10 rounded-2xl transform rotate-3"></div>
              <div className="relative bg-white rounded-2xl shadow-xl p-6 border-4 border-white">
                <h3 className="font-bold text-lg mb-4 text-center text-neutral">The Unmanaged Device Problem</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
                    <EyeOff className="w-5 h-5 text-red-500 shrink-0" />
                    <span className="text-sm text-gray-700">No visibility into which devices access data</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
                    <ShieldOff className="w-5 h-5 text-red-500 shrink-0" />
                    <span className="text-sm text-gray-700">Can't enforce encryption or security policies</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
                    <HardDrive className="w-5 h-5 text-red-500 shrink-0" />
                    <span className="text-sm text-gray-700">Files saved locally never get backed up</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
                    <UserMinus className="w-5 h-5 text-red-500 shrink-0" />
                    <span className="text-sm text-gray-700">No way to wipe a lost or stolen laptop</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What Changes With Enrollment */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl text-neutral mb-4">What Changes When You Enroll Devices</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Microsoft 365 Business Premium includes Intune and Autopilot -enterprise device management made simple for SMBs.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Without Enrollment */}
            <div className="bg-gray-50 rounded-xl p-8 border border-gray-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="font-bold text-xl text-red-700">Without Device Enrollment</h3>
              </div>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Manual Setup Every Time</span>
                    <p className="text-gray-600 text-sm">Each new laptop requires hours of manual configuration -and something always gets missed</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">No Visibility</span>
                    <p className="text-gray-600 text-sm">You don't know which devices are encrypted, have antivirus, or are even accessing your data</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Files Trapped on Devices</span>
                    <p className="text-gray-600 text-sm">Staff save to Desktop or Documents locally -when the device fails, the files are gone</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Stolen Laptop = Data Breach</span>
                    <p className="text-gray-600 text-sm">No remote wipe capability. You just have to hope encryption was enabled (it probably wasn't)</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Shadow IT Everywhere</span>
                    <p className="text-gray-600 text-sm">Company data ends up in Dropbox, Google Drive, USB sticks -wherever users find convenient</p>
                  </div>
                </li>
              </ul>
            </div>

            {/* With Enrollment */}
            <div className="bg-green-50 rounded-xl p-8 border-2 border-green-300">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-bold text-xl text-green-700">With Device Enrollment (Intune)</h3>
              </div>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Zero-Touch Setup</span>
                    <p className="text-gray-600 text-sm">User signs in, device configures itself. Apps install, policies apply, security enforced -automatically</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Complete Visibility</span>
                    <p className="text-gray-600 text-sm">Dashboard shows every device, its compliance status, encryption state, and last check-in time</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Files Protected Automatically</span>
                    <p className="text-gray-600 text-sm">Known Folder Move redirects Desktop/Documents to OneDrive -files sync to the cloud without user action</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Remote Wipe Ready</span>
                    <p className="text-gray-600 text-sm">Laptop stolen? Wipe it remotely in minutes. Data protected even if device is lost</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Shadow IT Blocked</span>
                    <p className="text-gray-600 text-sm">Conditional Access ensures only compliant, enrolled devices can access company data</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Key Capabilities Deep Dive */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 max-w-5xl">
          <h2 className="font-heading text-3xl text-center mb-4">The Business Premium Advantage</h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            These features work together to give you control without complexity.
          </p>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Autopilot */}
            <div className="bg-white rounded-xl p-8 shadow-xs hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Zap className="w-7 h-7 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-xl text-neutral">Windows Autopilot</h3>
                  <p className="text-sm text-gray-500">Zero-touch deployment</p>
                </div>
              </div>
              <p className="text-gray-600 mb-4">
                New laptop? Ship it directly to the employee. When they sign in with their work account, the device automatically:
              </p>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Joins your organisation</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Applies security policies</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Installs required apps</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Enables BitLocker encryption</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Configures OneDrive backup</li>
              </ul>
              <p className="text-blue-600 font-semibold text-sm mt-4">No IT visit required. No manual setup checklist.</p>
            </div>

            {/* Conditional Access */}
            <div className="bg-white rounded-xl p-8 shadow-xs hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Shield className="w-7 h-7 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-bold text-xl text-neutral">Conditional Access</h3>
                  <p className="text-sm text-gray-500">Smart security policies</p>
                </div>
              </div>
              <p className="text-gray-600 mb-4">
                Define rules for who can access what, from where, on which devices. For example:
              </p>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-center gap-2"><Lock className="w-4 h-4 text-purple-500" /> Block access from unmanaged devices</li>
                <li className="flex items-center gap-2"><Globe className="w-4 h-4 text-purple-500" /> Block logins from high-risk countries</li>
                <li className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-purple-500" /> Require MFA for sensitive apps</li>
                <li className="flex items-center gap-2"><Monitor className="w-4 h-4 text-purple-500" /> Only allow compliant devices</li>
                <li className="flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-purple-500" /> Block risky sign-ins automatically</li>
              </ul>
              <p className="text-purple-600 font-semibold text-sm mt-4">Even stolen passwords won't get attackers in.</p>
            </div>

            {/* Intune Policies */}
            <div className="bg-white rounded-xl p-8 shadow-xs hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center">
                  <Settings className="w-7 h-7 text-green-600" />
                </div>
                <div>
                  <h3 className="font-bold text-xl text-neutral">Intune Policies</h3>
                  <p className="text-sm text-gray-500">Standardised configuration</p>
                </div>
              </div>
              <p className="text-gray-600 mb-4">
                Push consistent settings to every device without touching them individually:
              </p>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-center gap-2"><Wifi className="w-4 h-4 text-green-500" /> WiFi passwords deployed silently</li>
                <li className="flex items-center gap-2"><HardDrive className="w-4 h-4 text-green-500" /> BitLocker encryption enforced</li>
                <li className="flex items-center gap-2"><Cloud className="w-4 h-4 text-green-500" /> OneDrive Known Folder Move enabled</li>
                <li className="flex items-center gap-2"><Shield className="w-4 h-4 text-green-500" /> Windows Defender configured</li>
                <li className="flex items-center gap-2"><RefreshCw className="w-4 h-4 text-green-500" /> Windows Updates managed</li>
              </ul>
              <p className="text-green-600 font-semibold text-sm mt-4">Every device meets your security baseline.</p>
            </div>

            {/* Defender for Business */}
            <div className="bg-white rounded-xl p-8 shadow-xs hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-red-100 rounded-xl flex items-center justify-center">
                  <ShieldCheck className="w-7 h-7 text-red-600" />
                </div>
                <div>
                  <h3 className="font-bold text-xl text-neutral">Defender for Business</h3>
                  <p className="text-sm text-gray-500">Enterprise-grade protection</p>
                </div>
              </div>
              <p className="text-gray-600 mb-4">
                Not just antivirus -a complete endpoint protection platform:
              </p>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-center gap-2"><Shield className="w-4 h-4 text-red-500" /> Next-gen anti-malware</li>
                <li className="flex items-center gap-2"><Eye className="w-4 h-4 text-red-500" /> Attack surface reduction</li>
                <li className="flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-red-500" /> Ransomware protection</li>
                <li className="flex items-center gap-2"><Globe className="w-4 h-4 text-red-500" /> Web content filtering</li>
                <li className="flex items-center gap-2"><Monitor className="w-4 h-4 text-red-500" /> Centralised dashboard</li>
              </ul>
              <p className="text-red-600 font-semibold text-sm mt-4">Replaces Sophos, ESET, and similar -included in the license.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Real-World Scenarios */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl text-neutral mb-4">Real-World Scenarios</h2>
            <p className="text-gray-600">
              These situations happen in SMBs every day. The difference between crisis and non-event is device enrollment.
            </p>
          </div>

          <div className="space-y-4">
            {scenarios.map((scenario, index) => {
              const IconComponent = scenario.icon;
              const colorClasses: Record<string, { bg: string; text: string; border: string }> = {
                amber: { bg: 'bg-amber-100', text: 'text-amber-600', border: 'border-amber-300' },
                red: { bg: 'bg-red-100', text: 'text-red-600', border: 'border-red-300' }
              };
              const colors = colorClasses[scenario.color];

              return (
                <div key={index} className="bg-white rounded-xl overflow-hidden shadow-xs border border-gray-200">
                  <button
                    onClick={() => toggleScenario(index)}
                    className="w-full px-6 py-5 text-left flex justify-between items-center hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 ${colors.bg} rounded-lg flex items-center justify-center`}>
                        <IconComponent className={`w-5 h-5 ${colors.text}`} />
                      </div>
                      <span className="font-bold text-lg text-primary">{scenario.title}</span>
                    </div>
                    {openScenario === index ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </button>

                  {openScenario === index && (
                    <div className="px-6 pb-6">
                      <p className="text-gray-700 mb-6 italic border-l-4 border-gray-200 pl-4">
                        {scenario.story}
                      </p>

                      <div className="grid md:grid-cols-2 gap-4 mb-4">
                        <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                          <h4 className="font-bold text-red-700 mb-2 flex items-center gap-2">
                            <XCircle className="w-4 h-4" /> Without Device Enrollment
                          </h4>
                          <p className="text-gray-700 text-sm">{scenario.withoutEnrollment}</p>
                        </div>
                        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                          <h4 className="font-bold text-green-700 mb-2 flex items-center gap-2">
                            <CheckCircle className="w-4 h-4" /> With Device Enrollment
                          </h4>
                          <p className="text-gray-700 text-sm">{scenario.withEnrollment}</p>
                        </div>
                      </div>

                      <div className={`${colors.bg} rounded-lg p-4 border ${colors.border}`}>
                        <p className={`${colors.text} font-medium text-sm`}>
                          <strong>Key Insight:</strong> {scenario.lesson}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* License Comparator */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-8">
            <h2 className="font-heading text-3xl text-neutral mb-4">See the Value Gap</h2>
            <p className="text-gray-600">
              The price difference between Standard and Premium is often less than what you're already paying for separate tools.
            </p>
          </div>
          <LicenseComparator />
        </div>
      </section>

      {/* The Upgrade Path */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 max-w-5xl">
          <h2 className="font-heading text-3xl text-center mb-4">The Upgrade Path</h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            Moving to Business Premium and enrolling devices is straightforward. Here's what to expect.
          </p>

          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 relative">
                <span className="absolute -top-2 -right-2 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold text-sm">1</span>
                <RefreshCw className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-bold mb-2">License Upgrade</h3>
              <p className="text-sm text-gray-600">We upgrade your Microsoft 365 licenses from Standard to Premium. Takes effect immediately.</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 relative">
                <span className="absolute -top-2 -right-2 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold text-sm">2</span>
                <Settings className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-bold mb-2">Configure Intune</h3>
              <p className="text-sm text-gray-600">We deploy our tested security templates -policies for encryption, updates, OneDrive, and more.</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 relative">
                <span className="absolute -top-2 -right-2 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold text-sm">3</span>
                <Laptop className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-bold mb-2">Enroll Devices</h3>
              <p className="text-sm text-gray-600">Existing devices enroll during a scheduled rollout. New devices auto-enroll via Autopilot.</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 relative">
                <span className="absolute -top-2 -right-2 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold text-sm">4</span>
                <ShieldCheck className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-bold mb-2">Protected & Visible</h3>
              <p className="text-sm text-gray-600">You now have a dashboard showing every device, its compliance status, and the power to act.</p>
            </div>
          </div>

          <div className="mt-12 bg-blue-50 rounded-xl p-8 border border-blue-200">
            <div className="flex items-start gap-4">
              <Clock className="w-8 h-8 text-blue-500 shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-lg text-blue-900 mb-2">Typical Timeline</h3>
                <p className="text-gray-700">
                  For most SMBs (10-50 users), the complete process takes <strong>1-2 weeks</strong> from license upgrade to all devices enrolled.
                  Users experience minimal disruption -most of the work happens silently in the background.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="font-heading text-3xl text-center mb-4">Frequently Asked Questions</h2>
          <p className="text-center text-gray-600 mb-12">Common questions about upgrading and device enrollment</p>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white rounded-xl overflow-hidden shadow-xs">
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50 transition-colors"
                >
                  <span className="font-semibold text-primary pr-4">{faq.q}</span>
                  {openFaq === index ? (
                    <ChevronUp className="w-5 h-5 text-accent shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400 shrink-0" />
                  )}
                </button>
                {openFaq === index && (
                  <div className="px-6 pb-4">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                      {faq.a.split(/(\*\*[^*]+\*\*)/g).map((part, i) => {
                        if (part.startsWith('**') && part.endsWith('**')) {
                          return <strong key={i}>{part.slice(2, -2)}</strong>;
                        }
                        if (part.startsWith('*') && part.endsWith('*')) {
                          return <em key={i}>{part.slice(1, -1)}</em>;
                        }
                        return part;
                      })}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-heading text-3xl text-white mb-4">Ready to Take Control?</h2>
          <p className="text-gray-200 text-lg mb-8 max-w-2xl mx-auto">
            Stop wondering which devices are accessing your data and whether they're secure.
            Let's get your devices enrolled and protected.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/contact"
              className="bg-accent text-neutral font-bold px-8 py-4 rounded-lg shadow-comic border-2 border-neutral hover:shadow-comic-hover hover:translate-y-[2px] transition-all"
            >
              Discuss Your Upgrade
            </Link>
            <Link
              to="/it-health-check"
              className="bg-white/10 hover:bg-white/20 border border-white/30 text-white font-bold px-8 py-4 rounded-lg transition-all"
            >
              Take Our IT Health Check
            </Link>
          </div>
        </div>
      </section>

      {/* Related Reading Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 max-w-5xl">
          <h2 className="font-heading text-2xl text-center mb-8">Related Reading</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Link
              to="/microsoft-business-premium"
              className="group bg-gray-50 rounded-xl p-6 hover:shadow-lg transition-all border border-gray-100 hover:border-primary"
            >
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-500 transition-colors">
                <Zap className="w-5 h-5 text-blue-600 group-hover:text-white transition-colors" />
              </div>
              <h3 className="font-bold text-lg mb-2 group-hover:text-primary transition-colors">Why Business Premium?</h3>
              <p className="text-sm text-gray-600">Feature comparison and cost analysis.</p>
            </Link>

            <Link
              to="/technology/intune-autopilot"
              className="group bg-gray-50 rounded-xl p-6 hover:shadow-lg transition-all border border-gray-100 hover:border-primary"
            >
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-green-500 transition-colors">
                <Laptop className="w-5 h-5 text-green-600 group-hover:text-white transition-colors" />
              </div>
              <h3 className="font-bold text-lg mb-2 group-hover:text-primary transition-colors">Intune & Autopilot Explained</h3>
              <p className="text-sm text-gray-600">Technical deep-dive into device management.</p>
            </Link>

            <Link
              to="/cloud-backup-necessity"
              className="group bg-gray-50 rounded-xl p-6 hover:shadow-lg transition-all border border-gray-100 hover:border-primary"
            >
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-purple-500 transition-colors">
                <Cloud className="w-5 h-5 text-purple-600 group-hover:text-white transition-colors" />
              </div>
              <h3 className="font-bold text-lg mb-2 group-hover:text-primary transition-colors">Cloud Backup Myth</h3>
              <p className="text-sm text-gray-600">Why OneDrive sync isn't backup.</p>
            </Link>
          </div>

          <div className="mt-8 text-center">
            <Link
              to="/resources"
              className="inline-flex items-center gap-2 text-primary font-semibold hover:underline"
            >
              Browse all resources <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      <Contact />
    </div>
  );
};

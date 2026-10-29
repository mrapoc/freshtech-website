import React, { useState } from 'react';
import { PageHeader } from '../components/PageHeader';
import { Contact } from '../components/Contact';
import { SEO } from '../components/SEO';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { SmartImage } from '../components/SmartImage';
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Cloud,
  Shield,
  FolderSync,
  Laptop,
  Trash2,
  Lock,
  Clock,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Quote,
  UserX,
  Bug,
  HardDrive,
  Smartphone,
  BookOpen
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const CloudBackupNecessityPage = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [openScenario, setOpenScenario] = useState<number | null>(null);

  const breadcrumbItems = [
    { label: 'Resources', href: '/resources' },
    { label: 'Why Cloud Backup is Essential' }
  ];

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const toggleScenario = (index: number) => {
    setOpenScenario(openScenario === index ? null : index);
  };

  const scenarios = [
    {
      title: "The Accidental Deletion",
      icon: Trash2,
      color: "amber",
      story: "Sarah, an office manager, accidentally deleted a SharePoint folder containing 3 years of client contracts while reorganising files. She didn't notice for 6 weeks.",
      withoutBackup: "The files exceeded the 93-day retention window. They were permanently gone. The business had to contact clients to request copies of their own contracts -embarrassing and time-consuming.",
      withBackup: "A quick restore from the backup solution brought back the entire folder within minutes. The business didn't even need to inform clients.",
      lesson: "Microsoft 365's recycle bin only retains deleted items for 93 days. After that, it's gone forever -unless you have independent backup."
    },
    {
      title: "The Disgruntled Leaver",
      icon: UserX,
      color: "red",
      story: "James, a sales manager, resigned with immediate effect after a disagreement. Before handing over his laptop, he logged into OneDrive and permanently deleted his entire sales pipeline, contacts, and 2 years of proposal documents.",
      withoutBackup: "The deletion was discovered a week later when his replacement started. Microsoft's retention had already cleared the recycle bin. The new hire spent months rebuilding relationships from scratch.",
      withBackup: "The IT team restored James's entire OneDrive to the state it was in before his departure. The new sales manager hit the ground running.",
      lesson: "When employees leave unhappily, your data is at risk. Microsoft won't protect you from authorised users deleting their own files."
    },
    {
      title: "The Ransomware Sync",
      icon: Bug,
      color: "red",
      story: "A manufacturing firm's accountant opened a malicious email attachment. Ransomware encrypted her local files -and because OneDrive was syncing, the encrypted versions replaced the good copies in the cloud.",
      withoutBackup: "The 'cloud backup' everyone assumed existed was just OneDrive sync. The encrypted files were now in the cloud too. They paid a £45,000 ransom and still lost 3 months of data.",
      withBackup: "The backup solution stored immutable copies that ransomware couldn't touch. Full restore completed in 4 hours. Zero ransom paid.",
      lesson: "OneDrive sync is not backup -it replicates problems as fast as it replicates files. See our guide on ransomware recovery."
    },
    {
      title: "The Retention Gap",
      icon: Clock,
      color: "amber",
      story: "A law firm needed to retrieve emails from 18 months ago for a court case. The emails had been deleted by the user after the matter 'closed'.",
      withoutBackup: "Microsoft 365's default retention is 30 days for deleted items. Even with litigation hold enabled (which they hadn't configured), the emails were unrecoverable.",
      withBackup: "The backup solution retained all emails for 7 years as per their configured policy. The evidence was produced within the hour.",
      lesson: "Legal and compliance requirements often exceed Microsoft's default retention. Without independent backup, you may fail regulatory obligations."
    },
    {
      title: "The Account Compromise",
      icon: Lock,
      color: "red",
      story: "A hacker gained access to the finance director's Microsoft 365 account through a phishing email. They set up email forwarding rules and deleted evidence of fraudulent payment requests over several weeks.",
      withoutBackup: "By the time the breach was discovered, the deleted emails had aged out of retention. There was no audit trail of what had been sent or deleted.",
      withBackup: "The backup retained a complete timeline. Investigators could see exactly which emails were forwarded, deleted, and when -crucial evidence for the fraud investigation.",
      lesson: "Attackers don't just steal data -they cover their tracks. Independent backup preserves the evidence chain."
    }
  ];

  const faqs = [
    {
      q: "Isn't my data already backed up because it's 'in the cloud'?",
      a: "No -and this is the most dangerous assumption businesses make. Cloud services like Microsoft 365 and Google Workspace provide **high availability** (your data is replicated across data centres so the service stays online), but this is not backup. If you delete a file, that deletion is replicated everywhere. If ransomware encrypts your files via sync, the encrypted versions replace the originals. The cloud protects against *their* hardware failures, not *your* data loss."
    },
    {
      q: "What's the difference between OneDrive sync and OneDrive backup?",
      a: "**OneDrive Sync** mirrors files between your computer and the cloud -changes go both ways instantly. **OneDrive Backup (Known Folder Move)** redirects your Desktop, Documents, and Pictures folders to OneDrive. Both are sync technologies, not backup. A true backup is a separate, protected copy of your data that can be restored to a point in time -even if the original is deleted, corrupted, or encrypted."
    },
    {
      q: "What is Known Folder Move (KFM) and should we use it?",
      a: "KFM is a Microsoft feature that redirects your Desktop, Documents, and Pictures folders to OneDrive. **You absolutely should use it** -it means files aren't trapped on individual laptops and are accessible from anywhere. But it's protection against *device loss*, not data loss. If a file is deleted from OneDrive, it's deleted everywhere. KFM + independent backup = comprehensive protection."
    },
    {
      q: "How long does Microsoft keep deleted files?",
      a: "It varies by service: **OneDrive/SharePoint** keeps deleted items in the recycle bin for 93 days, then they're permanently deleted. **Exchange Online** keeps deleted emails for 14-30 days depending on configuration. **Teams** messages follow complex retention rules. After these windows close, Microsoft cannot recover your data -even if you pay them. These retention periods are also not guaranteed and can change."
    },
    {
      q: "What about Google Workspace -is it the same problem?",
      a: "Yes. Google's Terms of Service contain nearly identical disclaimers. Google Drive's trash empties after 30 days. Gmail deleted items last 30 days. Google explicitly states they are not responsible for data loss. The 'it's in the cloud' false sense of security applies equally to Google Workspace users."
    },
    {
      q: "How much does proper cloud backup cost?",
      a: "Typically £2-4 per user per month for comprehensive Microsoft 365 or Google Workspace backup. Compare this to the cost of losing your data: the average cost of a ransomware attack for SMBs is £115,000. For a 20-person company, that's roughly £50/month for insurance against potentially business-ending data loss."
    },
    {
      q: "Can't I just export my data regularly instead?",
      a: "Manual exports are better than nothing, but they're not practical at scale. They require someone to remember, they're incomplete (you rarely get everything), they're not easily restorable, and they're typically stored somewhere that's also vulnerable to the same threats. Automated, managed backup with tested restores is the only reliable approach."
    },
    {
      q: "We have Microsoft 365 E5 -doesn't that include backup?",
      a: "No. Even the most expensive Microsoft 365 licence does not include true backup. E5 includes advanced compliance features like extended retention and litigation hold, but these are not the same as backup. Retention policies keep data longer before deletion -but if data is corrupted or encrypted, that corrupted version is what's retained. Microsoft is now offering 'Microsoft 365 Backup' as an additional paid product, acknowledging that backup was never included."
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
    "headline": "Why Microsoft 365 and Google Workspace Need Backing Up",
    "description": "The cloud doesn't back up your data. Microsoft and Google's own terms of service make this clear. Learn why independent backup is essential for business continuity.",
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
        title="Why Microsoft 365 & Google Workspace Need Backing Up | The Cloud Backup Myth"
        description="Microsoft and Google explicitly state they're not responsible for your data loss. Learn why cloud services need independent backup, with real examples and expert guidance."
        breadcrumbs={breadcrumbItems.map(item => ({
          name: item.label,
          item: item.href || '/cloud-backup-necessity'
        }))}
        schema={[articleSchema, faqSchema]}
      />

      <PageHeader
        title="The Cloud Doesn't Back Up Your Data"
        subtitle="Microsoft and Google explicitly say so in their terms of service. Most businesses don't discover this until it's too late."
        highlightText="Back Up"
      />

      {/* Breadcrumbs */}
      <div className="container mx-auto px-4 pt-8">
        <Breadcrumbs items={breadcrumbItems} className="justify-center" />
      </div>

      {/* Hero Image Section */}
      <section className="py-12 bg-linear-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="w-5 h-5 text-primary" />
                <span className="text-sm font-semibold text-primary uppercase tracking-wider">Essential Guide</span>
              </div>
              <h2 className="font-heading text-2xl md:text-3xl text-neutral mb-4">
                The Shared Responsibility Model
              </h2>
              <p className="text-gray-600 mb-6">
                Microsoft and Google operate under a "shared responsibility" model. They protect the infrastructure -you protect your data.
                This guide explains what that means in practice and how to ensure your business data is truly protected.
              </p>
              <div className="flex flex-wrap gap-3">
                <span className="inline-flex items-center gap-1 text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
                  <Cloud className="w-4 h-4" /> Microsoft 365
                </span>
                <span className="inline-flex items-center gap-1 text-sm bg-green-100 text-green-700 px-3 py-1 rounded-full">
                  <Cloud className="w-4 h-4" /> Google Workspace
                </span>
                <span className="inline-flex items-center gap-1 text-sm bg-purple-100 text-purple-700 px-3 py-1 rounded-full">
                  <FolderSync className="w-4 h-4" /> OneDrive KFM
                </span>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-primary/10 rounded-2xl transform rotate-3"></div>
              <SmartImage
                src="https://res.cloudinary.com/djkmeg5se/image/upload/v1749314205/cloud-backup-data-protection-microsoft-365.jpg"
                alt="Cloud backup and data protection for Microsoft 365 and Google Workspace"
                width={600}
                className="relative rounded-2xl shadow-xl border-4 border-white w-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* The Uncomfortable Truth Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-6">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="font-heading text-3xl text-neutral mb-4">The Uncomfortable Truth</h2>
            <p className="text-lg text-gray-600">
              Most businesses believe their data is safe because it's "in the cloud".
              Microsoft and Google's own legal terms tell a different story.
            </p>
          </div>

          {/* Microsoft Quote */}
          <div className="bg-gray-50 rounded-2xl p-8 mb-8 border-l-4 border-blue-500">
            <div className="flex items-start gap-4">
              <Quote className="w-8 h-8 text-blue-500 shrink-0 mt-1" />
              <div>
                <p className="text-gray-800 text-lg italic mb-4">
                  "We recommend that you regularly backup Your Content and Data that you store on the Services or store using Third-Party Apps and Services."
                </p>
                <p className="text-gray-800 text-lg italic mb-4">
                  "We strive to keep the Services up and running; however, all online services suffer occasional disruptions and outages, and Microsoft is not liable for any disruption or loss you may suffer as a result."
                </p>
                <p className="font-semibold text-gray-700"> - Microsoft Services Agreement, Section 6(b)</p>
                <a
                  href="https://www.microsoft.com/en-us/servicesagreement"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline text-sm"
                >
                  View current Microsoft Services Agreement →
                </a>
              </div>
            </div>
          </div>

          {/* Google Quote */}
          <div className="bg-gray-50 rounded-2xl p-8 border-l-4 border-green-500">
            <div className="flex items-start gap-4">
              <Quote className="w-8 h-8 text-green-500 shrink-0 mt-1" />
              <div>
                <p className="text-gray-800 text-lg italic mb-4">
                  "When permitted by law, Google, and Google's suppliers and distributors, will not be responsible for lost profits, revenues, or data, financial losses or indirect, special, consequential, exemplary, or punitive damages."
                </p>
                <p className="text-gray-800 text-lg italic mb-4">
                  "Google does not make any commitments about the content within the services, the specific functions of the services, or their reliability, availability, or ability to meet your needs."
                </p>
                <p className="font-semibold text-gray-700"> - Google Workspace Terms of Service</p>
                <a
                  href="https://workspace.google.com/terms/user_features.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-600 hover:underline text-sm"
                >
                  View current Google Workspace Terms →
                </a>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-gray-600">
              In plain English: <strong>if your data is lost, corrupted, or deleted -that's your problem, not theirs.</strong>
            </p>
          </div>
        </div>
      </section>

      {/* What Cloud Services Actually Provide */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 max-w-6xl">
          <h2 className="font-heading text-3xl text-center mb-4">What Cloud Services Actually Provide</h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            Understanding the difference between high availability and backup is critical.
          </p>

          <div className="grid md:grid-cols-2 gap-8">
            {/* What They DO Provide */}
            <div className="bg-white rounded-xl p-8 shadow-xs border border-gray-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-bold text-xl text-green-700">What They DO Provide</h3>
              </div>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">High Availability</span>
                    <p className="text-gray-600 text-sm">Data replicated across multiple data centres so the service stays online</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Infrastructure Redundancy</span>
                    <p className="text-gray-600 text-sm">Protection against their hardware failures, power outages, and natural disasters at their facilities</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Limited Retention</span>
                    <p className="text-gray-600 text-sm">Recycle bin and version history for a limited window (typically 30-93 days)</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Physical Security</span>
                    <p className="text-gray-600 text-sm">Data centres are secure, climate-controlled, and access-restricted</p>
                  </div>
                </li>
              </ul>
            </div>

            {/* What They DON'T Provide */}
            <div className="bg-white rounded-xl p-8 shadow-xs border border-red-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="font-bold text-xl text-red-700">What They DON'T Provide</h3>
              </div>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Protection from User Deletion</span>
                    <p className="text-gray-600 text-sm">If you or your staff delete files (accidentally or deliberately), that's replicated everywhere</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Ransomware Protection</span>
                    <p className="text-gray-600 text-sm">Encrypted files sync to the cloud as fast as healthy ones -your "backup" becomes encrypted too</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Long-Term Retention</span>
                    <p className="text-gray-600 text-sm">Once retention windows close (30-93 days), data is permanently unrecoverable</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Point-in-Time Recovery</span>
                    <p className="text-gray-600 text-sm">You can't restore your entire tenant to how it was 6 months ago</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* OneDrive Backup / Known Folder Move Explainer */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="flex items-center gap-4 mb-8 justify-center">
            <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center">
              <FolderSync className="w-7 h-7 text-blue-600" />
            </div>
            <h2 className="font-heading text-3xl text-neutral">Understanding OneDrive "Backup"</h2>
          </div>

          <div className="bg-blue-50 rounded-2xl p-8 mb-8">
            <h3 className="font-bold text-xl mb-4 text-blue-900">What is Known Folder Move (KFM)?</h3>
            <p className="text-gray-700 mb-6">
              When you enable "Backup" in OneDrive settings, you're actually enabling <strong>Known Folder Move</strong>.
              This redirects your Desktop, Documents, and Pictures folders so they sync to OneDrive instead of
              staying on your local hard drive.
            </p>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl p-6">
                <h4 className="font-bold text-green-700 mb-3 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" /> KFM is Excellent For:
                </h4>
                <ul className="space-y-2 text-gray-700">
                  <li>• Protecting against laptop loss or theft</li>
                  <li>• Accessing files from any device</li>
                  <li>• Preventing files being "trapped" on one computer</li>
                  <li>• Making device replacement painless</li>
                  <li>• Ensuring remote workers' files are centralised</li>
                </ul>
              </div>
              <div className="bg-white rounded-xl p-6">
                <h4 className="font-bold text-red-700 mb-3 flex items-center gap-2">
                  <XCircle className="w-5 h-5" /> KFM Does NOT Protect Against:
                </h4>
                <ul className="space-y-2 text-gray-700">
                  <li>• Accidental or malicious file deletion</li>
                  <li>• Ransomware encrypting synced files</li>
                  <li>• Data corruption replicating to the cloud</li>
                  <li>• Account compromise and data destruction</li>
                  <li>• Retention windows expiring</li>
                </ul>
              </div>
            </div>

            <div className="mt-6 p-4 bg-amber-100 rounded-lg border border-amber-300">
              <p className="text-amber-900 font-medium">
                <AlertTriangle className="w-5 h-5 inline mr-2" />
                <strong>Key Insight:</strong> KFM is <em>sync</em>, not <em>backup</em>. It replicates changes in both directions -including deletions and corruptions.
                You should absolutely use KFM, but you also need independent backup.
              </p>
            </div>
          </div>

          {/* How Fresh Tech Implements KFM via Intune */}
          <div className="bg-gray-50 rounded-2xl p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                <Laptop className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="font-bold text-xl text-neutral">How We Enable This Automatically</h3>
            </div>

            <p className="text-gray-700 mb-6">
              For businesses using <Link to="/microsoft-business-premium" className="text-primary hover:underline font-semibold">Microsoft 365 Business Premium</Link>,
              we configure <Link to="/technology/intune-autopilot" className="text-primary hover:underline font-semibold">Intune</Link> to
              automatically enable Known Folder Move on every enrolled device. No manual setup required -it just works.
            </p>

            <div className="grid md:grid-cols-3 gap-6 mb-6">
              <div className="bg-white rounded-lg p-5 text-center">
                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Smartphone className="w-5 h-5 text-indigo-600" />
                </div>
                <h4 className="font-bold mb-2">Automatic Enrollment</h4>
                <p className="text-sm text-gray-600">New devices automatically join Intune when users sign in with their work account</p>
              </div>
              <div className="bg-white rounded-lg p-5 text-center">
                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <FolderSync className="w-5 h-5 text-indigo-600" />
                </div>
                <h4 className="font-bold mb-2">Policy-Driven KFM</h4>
                <p className="text-sm text-gray-600">Intune policies silently enable KFM -users don't need to do anything</p>
              </div>
              <div className="bg-white rounded-lg p-5 text-center">
                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <HardDrive className="w-5 h-5 text-indigo-600" />
                </div>
                <h4 className="font-bold mb-2">No More "Local Only" Files</h4>
                <p className="text-sm text-gray-600">Eliminates files scattered across individual laptops that never get backed up</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                to="/technology/intune-autopilot"
                className="inline-flex items-center gap-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-semibold px-6 py-3 rounded-lg transition-colors"
              >
                Learn about Intune & Autopilot <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/microsoft-business-premium"
                className="inline-flex items-center gap-2 bg-blue-100 hover:bg-blue-200 text-blue-700 font-semibold px-6 py-3 rounded-lg transition-colors"
              >
                Why Business Premium? <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Real-World Scenarios */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl text-neutral mb-4">Real-World Scenarios</h2>
            <p className="text-gray-600">
              These situations happen every day. The difference between disaster and minor inconvenience is backup.
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
                            <XCircle className="w-4 h-4" /> Without Independent Backup
                          </h4>
                          <p className="text-gray-700 text-sm">{scenario.withoutBackup}</p>
                        </div>
                        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                          <h4 className="font-bold text-green-700 mb-2 flex items-center gap-2">
                            <CheckCircle className="w-4 h-4" /> With Independent Backup
                          </h4>
                          <p className="text-gray-700 text-sm">{scenario.withBackup}</p>
                        </div>
                      </div>

                      <div className={`${colors.bg} rounded-lg p-4 border ${colors.border}`}>
                        <p className={`${colors.text} font-medium text-sm`}>
                          <strong>Lesson:</strong> {scenario.lesson}
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

      {/* Risk vs Reward Comparison */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 max-w-5xl">
          <h2 className="font-heading text-3xl text-center mb-12">The Real Cost Comparison</h2>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Without Backup */}
            <div className="bg-red-50 rounded-2xl p-8 border-2 border-red-200">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="font-bold text-2xl text-red-700">Without Independent Backup</h3>
              </div>

              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <span className="text-gray-700">Average ransomware cost for SMBs: <strong>£115,000</strong></span>
                </li>
                <li className="flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <span className="text-gray-700">Average downtime after data loss: <strong>21 days</strong></span>
                </li>
                <li className="flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <span className="text-gray-700">60% of SMBs close within 6 months of major data loss</span>
                </li>
                <li className="flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <span className="text-gray-700">Regulatory fines for losing customer data</span>
                </li>
                <li className="flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <span className="text-gray-700">Reputational damage and lost client trust</span>
                </li>
                <li className="flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <span className="text-gray-700">Staff productivity loss rebuilding lost work</span>
                </li>
              </ul>
            </div>

            {/* With Backup */}
            <div className="bg-green-50 rounded-2xl p-8 border-2 border-green-300">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="font-bold text-2xl text-green-700">With Independent Backup</h3>
              </div>

              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                  <span className="text-gray-700">Typical cost: <strong>£2-4 per user/month</strong></span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                  <span className="text-gray-700">Recovery time measured in <strong>hours, not weeks</strong></span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                  <span className="text-gray-700">Point-in-time restore to any date</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                  <span className="text-gray-700">Immutable backups ransomware can't touch</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                  <span className="text-gray-700">Compliance with data retention requirements</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                  <span className="text-gray-700">Peace of mind that data is truly protected</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="text-center mt-8">
            <p className="text-lg text-gray-600">
              For a 20-person company, comprehensive cloud backup costs roughly <strong>£50-80/month</strong>.
              That's the price of one team lunch to protect against potentially business-ending data loss.
            </p>
          </div>
        </div>
      </section>

      {/* The Complete Protection Stack */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 max-w-5xl">
          <h2 className="font-heading text-3xl text-center mb-4">The Complete Protection Stack</h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            True data protection requires multiple layers working together. Here's what we implement for our clients.
          </p>

          <div className="grid md:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl p-6 text-center hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FolderSync className="w-7 h-7 text-blue-600" />
              </div>
              <h3 className="font-bold mb-2">Known Folder Move</h3>
              <p className="text-sm text-gray-600 mb-3">Files sync to OneDrive automatically -no files trapped on laptops</p>
              <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full">Via Intune Policy</span>
            </div>

            <div className="bg-white rounded-xl p-6 text-center hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Cloud className="w-7 h-7 text-green-600" />
              </div>
              <h3 className="font-bold mb-2">M365/Google Backup</h3>
              <p className="text-sm text-gray-600 mb-3">Independent backup of all cloud data with long-term retention</p>
              <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full">3rd Party Solution</span>
            </div>

            <div className="bg-white rounded-xl p-6 text-center hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="w-7 h-7 text-purple-600" />
              </div>
              <h3 className="font-bold mb-2">Immutable Storage</h3>
              <p className="text-sm text-gray-600 mb-3">Backups that can't be modified or deleted -ransomware-proof</p>
              <span className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full">Write-Once Technology</span>
            </div>

            <div className="bg-white rounded-xl p-6 text-center hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-7 h-7 text-amber-600" />
              </div>
              <h3 className="font-bold mb-2">Tested Restores</h3>
              <p className="text-sm text-gray-600 mb-3">Regular restore tests prove backups actually work</p>
              <span className="text-xs bg-amber-100 text-amber-700 px-3 py-1 rounded-full">Quarterly Verification</span>
            </div>
          </div>

          <div className="text-center mt-10">
            <Link
              to="/services/backup-disaster-recovery"
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold px-8 py-4 rounded-lg transition-all hover:scale-105 shadow-lg"
            >
              Learn About Our Backup Services <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="font-heading text-3xl text-center mb-4">Frequently Asked Questions</h2>
          <p className="text-center text-gray-600 mb-12">Common questions about cloud backup and data protection</p>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-gray-50 rounded-xl overflow-hidden">
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-100 transition-colors"
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
                        return <React.Fragment key={i}>{part.split(/(\*[^*]+?\*)/g).map((sub, j) => {
                          if (sub.startsWith('*') && sub.endsWith('*') && sub.length > 2) {
                            return <em key={j}>{sub.slice(1, -1)}</em>;
                          }
                          return <React.Fragment key={j}>{sub}</React.Fragment>;
                        })}</React.Fragment>;
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
          <h2 className="font-heading text-3xl text-white mb-4">Don't Wait for a Disaster to Discover You're Not Protected</h2>
          <p className="text-gray-200 text-lg mb-8 max-w-2xl mx-auto">
            Let us audit your current backup situation. We'll show you exactly what's protected, what isn't, and what it would take to close the gaps.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/contact"
              className="bg-accent text-neutral font-bold px-8 py-4 rounded-lg shadow-comic border-2 border-neutral hover:shadow-comic-hover hover:translate-y-[2px] transition-all"
            >
              Request a Backup Audit
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
              to="/blog/backup-test-most-businesses-fail"
              className="group bg-gray-50 rounded-xl p-6 hover:shadow-lg transition-all border border-gray-100 hover:border-primary"
            >
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-red-500 transition-colors">
                <AlertTriangle className="w-5 h-5 text-red-600 group-hover:text-white transition-colors" />
              </div>
              <h3 className="font-bold text-lg mb-2 group-hover:text-primary transition-colors">The Backup Test 60% of Businesses Fail</h3>
              <p className="text-sm text-gray-600">Common backup mistakes and how to avoid them.</p>
            </Link>

            <Link
              to="/ransomware-recovery"
              className="group bg-gray-50 rounded-xl p-6 hover:shadow-lg transition-all border border-gray-100 hover:border-primary"
            >
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-purple-500 transition-colors">
                <Shield className="w-5 h-5 text-purple-600 group-hover:text-white transition-colors" />
              </div>
              <h3 className="font-bold text-lg mb-2 group-hover:text-primary transition-colors">Ransomware Recovery Guide</h3>
              <p className="text-sm text-gray-600">What to do if your business is hit by ransomware.</p>
            </Link>

            <Link
              to="/services/backup-disaster-recovery"
              className="group bg-gray-50 rounded-xl p-6 hover:shadow-lg transition-all border border-gray-100 hover:border-primary"
            >
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-green-500 transition-colors">
                <Cloud className="w-5 h-5 text-green-600 group-hover:text-white transition-colors" />
              </div>
              <h3 className="font-bold text-lg mb-2 group-hover:text-primary transition-colors">Our Backup Services</h3>
              <p className="text-sm text-gray-600">How we protect businesses with comprehensive backup solutions.</p>
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

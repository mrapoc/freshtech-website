import React from 'react';
import { Shield, FileText, Wifi, AlertTriangle, Lock, Server, Monitor, Cloud, Smartphone, Truck, Package, Sun, Battery } from 'lucide-react';

export interface ChecklistItem {
  id: string;
  text: string;
  priority: 'critical' | 'high' | 'medium';
  tip?: string;
}

export interface GuideSection {
  id: string;
  title: string;
  icon: React.ElementType;
  content: string;
  checklist?: ChecklistItem[];
  locked?: boolean;
}

export interface IndustryGuide {
  industry: string;
  title: string;
  subtitle: string;
  metaDesc: string;
  intro: string;
  stats: {
    readTime: string;
    lastUpdated: string;
  };
  sections: GuideSection[];
}

export const industryGuides: Record<string, IndustryGuide> = {
  engineering: {
    industry: "Engineering",
    title: "Engineer's IT Performance Guide",
    subtitle: "Optimise your CAD workstations, secure your IP, and eliminate network bottlenecks",
    metaDesc: "Free IT guide for engineering firms. Covers CAD workstation specs, network performance, legacy CNC security, and Cyber Essentials compliance.",
    intro: "Engineering firms face unique IT challenges. Large CAD files, legacy CNC equipment, and the need for precision mean you can't afford slow networks or security gaps. It shows you how to stop slow networks, underpowered CAD machines and security gaps costing you contracts and billable hours.",
    stats: {
      readTime: "15 min",
      lastUpdated: "Dec 2025"
    },
    sections: [
      {
        id: "workstations",
        title: "CAD Workstation Specifications",
        icon: Monitor,
        content: `Your CAD workstation is the heart of your productivity. Underpowered machines mean waiting for assemblies to load, renders to complete, and files to save.

**Minimum Specs for SolidWorks/AutoCAD (2025):**
• CPU: Intel Core i7-13700 or AMD Ryzen 7 7700X (8+ cores)
• RAM: 32GB DDR5 (64GB for large assemblies)
• GPU: NVIDIA RTX A2000 or Quadro equivalent (ISV certified)
• Storage: 1TB NVMe SSD + secondary drive for projects
• Display: 27"+ 4K IPS panel

**Why ISV Certification Matters:**
Graphics cards certified by software vendors (ISV) are tested to work perfectly with your CAD software. Consumer gaming cards may render incorrectly or crash during complex operations.

**The Hidden Cost of Consumer Hardware:**
A £1,500 gaming PC might seem cheaper than a £2,500 workstation, but:
• No onsite warranty (you ship it away for weeks)
• No ISV certification (random crashes and display glitches)
• Shorter lifespan (not designed for 8+ hours daily use)
• No enterprise management features (Intune, TPM 2.0)`,
        checklist: [
          { id: "eng-1", text: "Audit current workstation specs against software requirements", priority: "high", tip: "Check your CAD vendor's hardware recommendations" },
          { id: "eng-2", text: "Ensure all workstations have 32GB+ RAM", priority: "critical" },
          { id: "eng-3", text: "Verify graphics cards are ISV certified", priority: "high", tip: "Check nvidia.com/quadro for certified drivers" },
          { id: "eng-4", text: "Replace mechanical hard drives with NVMe SSDs", priority: "critical" },
          { id: "eng-5", text: "Confirm workstations have TPM 2.0 for Windows 11", priority: "medium" }
        ]
      },
      {
        id: "network",
        title: "Network Performance for Large Files",
        icon: Wifi,
        content: `When your assemblies are 5GB+ and you're working remotely, network performance is critical.

**Local Network Optimisation:**
• Upgrade to 2.5GbE or 10GbE for file server connections
• Use managed switches with QoS for CAD traffic priority
• Ensure WiFi 6E access points in design offices
• Consider a dedicated VLAN for CAD workstations

**Remote Access Without VPN Lag:**
Traditional VPNs route ALL traffic through your office, creating bottlenecks. Modern solutions:
• SharePoint/OneDrive for file sync (works offline)
• Azure Files for legacy apps requiring mapped drives
• Parsec or similar for remote workstation access (GPU streaming)

**File Server vs Cloud Storage:**
For engineering, a hybrid approach works best:
• Active projects: Local NAS with 10GbE connection
• Archive projects: Cloud storage (cheaper, disaster recovery included)
• Automatic tiering: Move inactive files to cloud after 90 days`,
        checklist: [
          { id: "eng-6", text: "Test file transfer speeds between workstations and server", priority: "high", tip: "Should achieve 100MB/s+ for local transfers" },
          { id: "eng-7", text: "Implement QoS rules for CAD application traffic", priority: "medium" },
          { id: "eng-8", text: "Configure OneDrive Files On-Demand for project folders", priority: "high" },
          { id: "eng-9", text: "Set up automatic archival for completed projects", priority: "medium" }
        ]
      },
      {
        id: "legacy",
        title: "Securing Legacy CNC Equipment",
        icon: AlertTriangle,
        content: `Many engineering firms have CNC machines running Windows XP or proprietary controllers that cannot be updated. These are security nightmares but essential for production.

**The Risk:**
Legacy systems with known vulnerabilities are prime ransomware targets. If your CNC machine is on the same network as your email, an infected attachment could encrypt your production line.

**The Solution: Network Segmentation**
Create isolated VLANs (Virtual LANs) for legacy equipment:
• VLAN 1: Office network (PCs, email, internet)
• VLAN 2: Production network (CNC, PLCs, HMIs)
• Firewall rules: Block internet access for VLAN 2
• Specific allow rules: Only required connections between VLANs

**Additional Protections:**
• Disable USB ports on legacy machines (prevents infected drives)
• Use application whitelisting where possible
• Monitor network traffic for anomalies
• Document all connections for audit purposes`,
        checklist: [
          { id: "eng-10", text: "Identify all legacy systems on the network", priority: "critical" },
          { id: "eng-11", text: "Create network diagram showing legacy equipment connections", priority: "high" },
          { id: "eng-12", text: "Implement VLAN segmentation for production equipment", priority: "critical" },
          { id: "eng-13", text: "Block internet access for legacy machines", priority: "critical" },
          { id: "eng-14", text: "Disable USB ports on CNC controllers", priority: "high" }
        ]
      },
      {
        id: "compliance",
        title: "Cyber Essentials for Supply Chain",
        icon: Shield,
        content: `Many Tier 1 manufacturers and defence contractors now require suppliers to hold Cyber Essentials Plus certification. Without it, you may be excluded from tender lists.

**Why Engineering Firms Need Certification:**
• MOD contracts mandate Cyber Essentials Plus
• Large manufacturers (JLR, Rolls-Royce, Airbus) require it from suppliers
• Insurance premiums are lower for certified businesses
• It proves due diligence if you suffer a breach

**The 5 Controls You Must Implement:**
1. Firewalls: Secure your internet boundary
2. Secure Configuration: No default passwords, minimal software
3. Access Control: Least privilege, no shared admin accounts
4. Malware Protection: EDR on all endpoints
5. Patch Management: Updates within 14 days

**Engineering-Specific Challenges:**
• Legacy CNC machines may need to be excluded from scope
• CAD software requires admin rights for some operations
• Remote access for field engineers needs careful configuration`,
        checklist: [
          { id: "eng-15", text: "Review supply chain requirements for certification", priority: "high" },
          { id: "eng-16", text: "Conduct gap analysis against Cyber Essentials controls", priority: "critical" },
          { id: "eng-17", text: "Implement automated patch management", priority: "critical" },
          { id: "eng-18", text: "Remove admin rights from daily user accounts", priority: "high" },
          { id: "eng-19", text: "Document scope exclusions for legacy equipment", priority: "medium" }
        ],
        locked: true
      }
    ]
  },

  legal: {
    industry: "Legal",
    title: "Legal Tech Compliance Checklist",
    subtitle: "Protect client confidentiality, meet SRA requirements, and prevent conveyancing fraud",
    metaDesc: "Free IT compliance guide for law firms. Covers SRA requirements, email encryption, DMS integration, and conveyancing fraud prevention.",
    intro: "Law firms handle some of the most sensitive data in any industry. Client confidentiality isn't just ethical - it's regulated. This guide covers the IT controls every law firm needs to meet SRA requirements and protect against the growing threat of conveyancing fraud.",
    stats: {
      readTime: "12 min",
      lastUpdated: "Dec 2025"
    },
    sections: [
      {
        id: "sra",
        title: "SRA Compliance Requirements",
        icon: FileText,
        content: `The Solicitors Regulation Authority (SRA) requires firms to have adequate systems for managing risks, including cyber security risks.

**Key SRA Principles Affecting IT:**
• Principle 2: Act with integrity - includes protecting client data
• Principle 6: Behave in a way that maintains public trust
• Code of Conduct 3.4: Effective governance and risk management

**What This Means Practically:**
• You must have documented IT policies
• Staff must be trained on data protection
• You need incident response procedures
• Regular risk assessments are required
• Client data must be protected in transit and at rest

**Evidence You Should Maintain:**
• IT security policy (reviewed annually)
• Staff training records
• Incident log (even if no incidents)
• Business continuity plan
• Supplier due diligence records`,
        checklist: [
          { id: "leg-1", text: "Create/update IT security policy document", priority: "critical" },
          { id: "leg-2", text: "Conduct annual staff security training", priority: "critical" },
          { id: "leg-3", text: "Establish incident response procedure", priority: "high" },
          { id: "leg-4", text: "Document all IT suppliers and their security measures", priority: "medium" },
          { id: "leg-5", text: "Schedule annual IT risk assessment", priority: "high" }
        ]
      },
      {
        id: "email",
        title: "Email Security & Encryption",
        icon: Lock,
        content: `Email is the biggest vulnerability in most law firms. Conveyancing fraud losses exceeded £100 million in 2024, with most attacks starting with email compromise.

**The Attack Pattern:**
1. Attacker compromises a solicitor's email (phishing or password theft)
2. They monitor conversations, especially regarding completions
3. At the critical moment, they send new bank details "from" the solicitor
4. Client transfers funds to criminal accounts
5. Money is gone within hours

**Essential Email Controls:**
• Multi-Factor Authentication on all accounts (one of the strongest defences against account takeover)
• Email encryption for sensitive correspondence
• Warning banners on external emails
• Link scanning (checks URLs in real-time)
• Attachment sandboxing (opens files safely before delivery)

**When to Use Encryption:**
• Client account details
• Confidential case information
• Settlement agreements
• Anything you wouldn't want intercepted

Microsoft 365 Business Premium includes all these features.`,
        checklist: [
          { id: "leg-6", text: "Enable MFA on all Microsoft 365 accounts", priority: "critical" },
          { id: "leg-7", text: "Configure external email warning banners", priority: "high" },
          { id: "leg-8", text: "Set up message encryption for sensitive emails", priority: "high" },
          { id: "leg-9", text: "Enable Safe Links and Safe Attachments", priority: "critical" },
          { id: "leg-10", text: "Train staff on Friday afternoon fraud attempts", priority: "high", tip: "Most fraud attempts happen before bank holiday weekends" }
        ]
      },
      {
        id: "dms",
        title: "Document Management Best Practices",
        icon: FileText,
        content: `Your Document Management System (DMS) is the backbone of your practice. Whether you use Leap, Clio, iManage, or a simpler solution, these principles apply.

**Access Control:**
• Implement matter-based permissions (staff only see their matters)
• Separate permissions for partners, associates, and support staff
• Log all document access (who opened what, when)
• Automatic lock-out after inactivity

**Version Control:**
• Never rely on "Final_v2_FINAL.docx" naming
• Use proper version history (built into most DMS)
• Lock documents during editing to prevent conflicts
• Require check-out for critical documents

**Backup & Disaster Recovery:**
• Daily backups minimum (hourly for active matters)
• Offsite/cloud backup copy
• Test restores quarterly (can you actually recover files?)
• Document retention policy (how long do you keep closed matters?)`,
        checklist: [
          { id: "leg-11", text: "Review DMS user permissions", priority: "high" },
          { id: "leg-12", text: "Enable document access logging", priority: "high" },
          { id: "leg-13", text: "Test backup restore procedure", priority: "critical" },
          { id: "leg-14", text: "Document retention policy in writing", priority: "medium" },
          { id: "leg-15", text: "Train staff on version control procedures", priority: "medium" }
        ]
      },
      {
        id: "mobile",
        title: "Mobile Device Management for Partners",
        icon: Smartphone,
        content: `Partners and fee-earners work everywhere - courts, client sites, trains, home. Their mobile devices contain client data and email access.

**The Risk:**
A lost or stolen phone with email access is a data breach. If that phone has saved passwords and no screen lock, it's a disaster.

**Mobile Device Management (MDM) Controls:**
• Require PIN/biometric to unlock device
• Encrypt all device storage
• Remote wipe capability (if lost/stolen)
• Separate "container" for work apps
• Prevent copy/paste from work to personal apps

**BYOD (Bring Your Own Device) Policy:**
If partners use personal phones:
• Require MDM enrolment
• Work data stays in managed apps only
• IT can wipe ONLY work data (not personal photos)
• Clear policy on what happens when they leave the firm

Microsoft Intune provides all these capabilities.`,
        checklist: [
          { id: "leg-16", text: "Enrol all mobile devices in MDM", priority: "critical" },
          { id: "leg-17", text: "Require 6-digit PIN or biometric unlock", priority: "critical" },
          { id: "leg-18", text: "Test remote wipe capability", priority: "high" },
          { id: "leg-19", text: "Create BYOD policy document", priority: "high" },
          { id: "leg-20", text: "Brief partners on mobile security procedures", priority: "medium" }
        ],
        locked: true
      }
    ]
  },

  healthcare: {
    industry: "Healthcare",
    title: "NHS Data Security Guide",
    subtitle: "Meet DSPT requirements, secure patient data, and pass CQC inspections",
    metaDesc: "Free IT security guide for healthcare providers. Covers NHS DSPT, CQC requirements, clinical system security, and patient data protection.",
    intro: "Healthcare providers face some of the strictest data protection requirements in any sector. Patient confidentiality is critical, regulators are vigilant, and the consequences of a breach are severe. This guide covers the IT controls needed to protect patient data and meet regulatory requirements.",
    stats: {
      readTime: "14 min",
      lastUpdated: "Dec 2025"
    },
    sections: [
      {
        id: "dspt",
        title: "Data Security & Protection Toolkit",
        icon: Shield,
        content: `The DSPT is an annual self-assessment that all organisations handling NHS patient data must complete. It covers 10 National Data Guardian standards.

**Key Requirements:**
• Personal Confidential Data: Identify what you hold and where
• Staff Responsibilities: Training and awareness
• Training: Annual cyber security training for all staff
• Managing Access: Principle of least privilege
• Process Reviews: Regular review of who has access to what
• Responding to Incidents: Documented procedures
• Continuity Planning: Backup and disaster recovery
• Unsupported Systems: No Windows 7/XP without risk mitigation
• IT Protection: Antivirus, patching, firewalls
• Accountable Suppliers: Due diligence on third parties

**Submission Deadline:**
30th June annually. Status affects ability to access NHS systems.

**Common Fail Points:**
• Staff training not completed (or not documented)
• Outdated systems still in use
• No documented incident response procedure
• Backup testing not evidenced`,
        checklist: [
          { id: "hc-1", text: "Identify all personal confidential data assets", priority: "critical" },
          { id: "hc-2", text: "Complete staff cyber security training", priority: "critical" },
          { id: "hc-3", text: "Document incident response procedure", priority: "high" },
          { id: "hc-4", text: "Test backup restore procedure and document results", priority: "high" },
          { id: "hc-5", text: "Review user access permissions quarterly", priority: "medium" }
        ]
      },
      {
        id: "clinical",
        title: "Clinical System Security",
        icon: Server,
        content: `Clinical systems (EMIS, SystmOne, Vision, Dentally, etc.) contain highly sensitive patient data. Lose control of them and you have a reportable data breach, lost patient trust, and every clinical record exposed at once.

**Access Control:**
• Individual logins for every user (no shared accounts)
• Role-based permissions (reception can't access clinical notes)
• Automatic session timeout after inactivity
• Audit trail of who accessed which records

**Integration Security:**
• Secure connections to NHS Spine
• NHSmail for clinical correspondence
• Encrypted connections for remote access
• No patient data on personal email accounts

**Workstation Security:**
• Screen positioned away from patient view
• Automatic screen lock after 5 minutes
• Privacy screens on reception PCs
• Smartcard required for NHS Spine access`,
        checklist: [
          { id: "hc-6", text: "Eliminate shared login accounts", priority: "critical" },
          { id: "hc-7", text: "Configure automatic session timeout", priority: "high" },
          { id: "hc-8", text: "Install privacy screens on reception PCs", priority: "medium" },
          { id: "hc-9", text: "Review clinical system audit logs monthly", priority: "high" },
          { id: "hc-10", text: "Ensure all clinical staff have NHSmail accounts", priority: "high" }
        ]
      },
      {
        id: "wifi",
        title: "Network Segmentation & Guest WiFi",
        icon: Wifi,
        content: `Patients expect WiFi. But letting them on your clinical network is a serious security risk.

**The Three-Network Model:**
1. Clinical Network: Staff PCs, clinical systems, NHS Spine
2. Corporate Network: Admin PCs, email, non-clinical applications
3. Guest Network: Patient WiFi, isolated from everything else

**Guest WiFi Best Practices:**
• Completely separate VLAN (can't see clinical network)
• Bandwidth throttling (patients don't slow down clinical work)
• Content filtering (block inappropriate sites)
• Terms of use acceptance (liability protection)
• No password, or simple daily-changing password

**Implementation:**
Modern access points (like Ubiquiti UniFi) make this straightforward. A single device can broadcast multiple network names (SSIDs), each on a separate VLAN.`,
        checklist: [
          { id: "hc-11", text: "Implement VLAN segmentation", priority: "critical" },
          { id: "hc-12", text: "Create isolated guest WiFi network", priority: "high" },
          { id: "hc-13", text: "Configure bandwidth limits for guest network", priority: "medium" },
          { id: "hc-14", text: "Add terms of use splash page", priority: "medium" },
          { id: "hc-15", text: "Test that guest devices cannot access clinical systems", priority: "critical" }
        ]
      },
      {
        id: "cqc",
        title: "CQC Inspection Preparation",
        icon: FileText,
        content: `CQC inspectors increasingly ask about IT security as part of the "Safe" and "Well-led" domains.

**What Inspectors Look For:**
• Evidence of staff training (certificates, attendance records)
• Written policies (IT security, acceptable use, BYOD)
• Business continuity plans (what if systems go down?)
• Incident records (even if no incidents have occurred)
• Risk assessments (including cyber risks)

**Common Questions:**
• "How do you ensure patient data is kept confidential?"
• "What would happen if your clinical system was unavailable?"
• "How are staff trained on data protection?"
• "When did you last test your backups?"

**Documentation to Prepare:**
• IT Security Policy
• Business Continuity Plan
• Staff training records
• Backup test evidence
• Supplier contracts with data processing terms`,
        checklist: [
          { id: "hc-16", text: "Update IT Security Policy", priority: "high" },
          { id: "hc-17", text: "Document Business Continuity Plan", priority: "high" },
          { id: "hc-18", text: "Compile staff training evidence", priority: "critical" },
          { id: "hc-19", text: "Perform and document backup test", priority: "critical" },
          { id: "hc-20", text: "Review supplier data processing agreements", priority: "medium" }
        ],
        locked: true
      }
    ]
  },

  manufacturing: {
    industry: "Manufacturing",
    title: "Smart Factory IT Guide",
    subtitle: "Connect your shop floor, optimise ERP performance, and secure OT systems",
    metaDesc: "Free IT guide for manufacturers. Covers warehouse WiFi, ERP optimisation, OT security, and Industry 4.0 implementation.",
    intro: "Modern manufacturing relies on data. From ERP systems managing production schedules to IoT sensors on the production line, your IT infrastructure is the backbone of your operation. This guide covers everything from warehouse WiFi to securing operational technology.",
    stats: {
      readTime: "15 min",
      lastUpdated: "Dec 2025"
    },
    sections: [
      {
        id: "wifi",
        title: "Warehouse & Shop Floor WiFi",
        icon: Wifi,
        content: `WiFi in industrial environments is challenging. Metal racking, moving equipment, and building structures create dead zones that disconnect handheld scanners.

**Common Problems:**
• Scanners drop connection behind racking
• Slow speeds in far corners of warehouse
• Interference from machinery
• Consumer access points can't handle density

**The Solution: Industrial WiFi Design**
• Site survey with heatmapping (measure before installing)
• Industrial-grade access points (wider temperature range)
• Higher density placement (more APs, lower power)
• Wired backhaul between APs (don't rely on mesh)
• Band steering (keep devices on 5GHz where possible)

**Scanner-Specific Considerations:**
• Seamless roaming (devices don't disconnect between APs)
• Legacy 2.4GHz support for older scanners
• QoS for warehouse management system traffic
• Battery impact (poor signal drains batteries faster)`,
        checklist: [
          { id: "mfg-1", text: "Conduct professional WiFi site survey", priority: "high" },
          { id: "mfg-2", text: "Document current dead zones and problem areas", priority: "high" },
          { id: "mfg-3", text: "Test scanner connectivity at all rack locations", priority: "critical" },
          { id: "mfg-4", text: "Upgrade to industrial-grade access points", priority: "high" },
          { id: "mfg-5", text: "Configure smooth roaming for mobile devices", priority: "high" }
        ]
      },
      {
        id: "erp",
        title: "ERP Performance Optimisation",
        icon: Server,
        content: `When Sage, SAP, or your ERP system slows down, everything stops. Orders can't be processed, goods can't be dispatched, and trucks sit at the loading bay.

**Common Performance Issues:**
• Slow report generation
• Lag when opening large customer orders
• Timeout errors during peak times
• "Thinking" when switching between modules

**Server-Side Optimisation:**
• Database maintenance (index rebuilds, statistics updates)
• Memory allocation (ERP databases love RAM)
• SSD storage (eliminates disk bottlenecks)
• Dedicated SQL Server (don't share with other apps)

**Network Optimisation:**
• Gigabit connections to all ERP clients
• Quality of Service (prioritise ERP traffic)
• Local caching for remote sites
• VPN split tunnelling for remote workers

**Application Review:**
• Archive old data (completed orders from 5+ years ago)
• Disable unused modules
• Review custom reports (some are very inefficient)
• Update to latest patches`,
        checklist: [
          { id: "mfg-6", text: "Schedule weekly database maintenance jobs", priority: "critical" },
          { id: "mfg-7", text: "Review server RAM allocation (32GB+ recommended)", priority: "high" },
          { id: "mfg-8", text: "Move database to SSD storage", priority: "high" },
          { id: "mfg-9", text: "Archive data older than 5 years", priority: "medium" },
          { id: "mfg-10", text: "Review and optimise custom reports", priority: "medium" }
        ]
      },
      {
        id: "ot",
        title: "OT Security (Operational Technology)",
        icon: AlertTriangle,
        content: `Operational Technology (OT) - PLCs, HMIs, SCADA systems - was designed for reliability, not security. Connecting it to the internet creates serious risks.

**The Convergence Problem:**
IT and OT used to be separate. Now, dashboards need real-time production data, ERP needs machine output, and managers want mobile access. This connectivity creates attack surface.

**Recent Incidents:**
• Colonial Pipeline (2021): Ransomware stopped fuel distribution
• JBS Foods (2021): Meat processing plants shut down globally
• Multiple water treatment plants targeted

**Protection Strategy:**
1. Network Segmentation: OT on separate, firewalled network
2. No Direct Internet: OT devices should not reach the internet
3. Jump Servers: Controlled access points between IT and OT
4. Monitoring: Detect anomalous traffic patterns
5. Patch Where Possible: Many OT systems can be updated
6. Compensating Controls: Where patching isn't possible`,
        checklist: [
          { id: "mfg-11", text: "Inventory all OT devices and connections", priority: "critical" },
          { id: "mfg-12", text: "Implement IT/OT network segmentation", priority: "critical" },
          { id: "mfg-13", text: "Block OT network from internet access", priority: "critical" },
          { id: "mfg-14", text: "Deploy jump server for maintenance access", priority: "high" },
          { id: "mfg-15", text: "Establish OT patching schedule where possible", priority: "high" }
        ]
      },
      {
        id: "iot",
        title: "Industry 4.0 & IoT Implementation",
        icon: Cloud,
        content: `Industry 4.0 promises real-time visibility, predictive maintenance, and data-driven decisions. But implementation requires careful planning.

**Starting Small:**
Don't try to transform everything at once. Pick high-value, low-risk pilots:
• Machine utilisation monitoring (OEE dashboards)
• Environmental sensors (temperature, humidity)
• Energy monitoring (identify waste)
• Predictive maintenance on critical equipment

**Platform Considerations:**
• Microsoft Azure IoT Hub for enterprise integration
• Simpler platforms (e.g., Ubidots) for basic monitoring
• Edge computing for latency-sensitive applications
• Consider vendor lock-in before committing

**Security from Day One:**
• Separate IoT VLAN (don't mix with production OT)
• Device authentication (no default passwords)
• Encrypted communications (TLS everywhere)
• Regular firmware updates
• Monitor for anomalous behaviour`,
        checklist: [
          { id: "mfg-16", text: "Identify 2-3 pilot IoT use cases", priority: "high" },
          { id: "mfg-17", text: "Evaluate platform options (Azure, AWS, etc.)", priority: "medium" },
          { id: "mfg-18", text: "Create IoT security policy", priority: "high" },
          { id: "mfg-19", text: "Implement separate IoT VLAN", priority: "high" },
          { id: "mfg-20", text: "Document device inventory and credentials", priority: "critical" }
        ],
        locked: true
      }
    ]
  },

  veterinary: {
    industry: "Veterinary",
    title: "Vet Practice Network Security Check",
    subtitle: "Secure your PMS, optimise imaging workflows, and isolate guest WiFi",
    metaDesc: "Free IT security guide for veterinary practices. Covers PMS security, DICOM imaging, network segmentation, and guest WiFi setup.",
    intro: "Modern veterinary practices are technology-dependent. Cloud-based Practice Management Systems, digital X-rays, and client expectations for WiFi mean your network is business-critical. This guide covers the specific IT challenges facing vet practices.",
    stats: {
      readTime: "10 min",
      lastUpdated: "Dec 2025"
    },
    sections: [
      {
        id: "pms",
        title: "Practice Management System Security",
        icon: Server,
        content: `Your PMS (RxWorks, Merlin, Teleos, etc.) contains client data, financial records, and clinical histories. Lose control of it and you lose client trust, your billing and every clinical record in one hit.

**Access Control:**
• Individual logins for every staff member
• Role-based permissions (reception vs clinicians)
• Automatic logout after inactivity
• Strong password requirements

**Data Protection:**
• Daily backups (automatic, verified)
• Offsite/cloud backup copy
• Encryption for sensitive data
• Regular access audits

**Cloud vs On-Premise:**
Cloud PMS (like ezyVet) handles security for you, but you're dependent on internet connectivity. On-premise systems give control but require more IT management.

**Integration Security:**
• Secure connections to labs
• Encrypted communications with suppliers
• No patient data via personal email`,
        checklist: [
          { id: "vet-1", text: "Eliminate shared login accounts", priority: "critical" },
          { id: "vet-2", text: "Configure role-based permissions", priority: "high" },
          { id: "vet-3", text: "Enable automatic session timeout", priority: "high" },
          { id: "vet-4", text: "Verify daily backup is running", priority: "critical" },
          { id: "vet-5", text: "Test restore from backup", priority: "critical" }
        ]
      },
      {
        id: "imaging",
        title: "Digital Imaging & DICOM Workflow",
        icon: Monitor,
        content: `Digital X-rays and imaging generate large files that need fast access and reliable backup.

**File Sizes:**
• Standard X-ray: 10-50MB
• Dental X-ray series: 50-100MB
• CT scan: 500MB-2GB
• MRI: 1-5GB

**Local Storage Strategy:**
• NAS (Network Attached Storage) for instant access
• SSD storage for active cases
• Automatic sync to cloud for backup
• Archive older images to cheaper storage

**Network Requirements:**
• Gigabit ethernet to imaging workstations
• Dedicated VLAN for imaging traffic
• QoS to prioritise DICOM over general traffic

**PACS Integration:**
If you're using a PACS (Picture Archiving and Communication System):
• Ensure redundancy (what if PACS server fails?)
• Regular backup verification
• Access logging for compliance`,
        checklist: [
          { id: "vet-6", text: "Install local NAS for imaging storage", priority: "high" },
          { id: "vet-7", text: "Configure automatic cloud backup for images", priority: "critical" },
          { id: "vet-8", text: "Verify gigabit connection to imaging rooms", priority: "high" },
          { id: "vet-9", text: "Set up archive policy for older images", priority: "medium" },
          { id: "vet-10", text: "Test image restore from backup", priority: "high" }
        ]
      },
      {
        id: "wifi",
        title: "Client WiFi & Network Segmentation",
        icon: Wifi,
        content: `Clients waiting for their pets expect WiFi. But connecting them to your practice network is a security risk.

**The Risk:**
An infected client device on your network could:
• Spread malware to practice PCs
• Scan for and attack other devices on the network
• Attempt to access clinical systems
• Slow down your internet connection

**The Solution: Network Segmentation**
Create separate networks (VLANs):
• Practice Network: PMS, workstations, imaging
• Guest Network: Client WiFi only
• IoT Network: Blood analysers, smart devices

**Guest WiFi Best Practices:**
• No password (or simple daily password)
• Bandwidth limit per device
• Block access to local network entirely
• Content filtering (optional but recommended)
• Branded login page (marketing opportunity)`,
        checklist: [
          { id: "vet-11", text: "Implement VLAN segmentation", priority: "critical" },
          { id: "vet-12", text: "Create isolated guest WiFi network", priority: "critical" },
          { id: "vet-13", text: "Test that guest devices cannot see practice network", priority: "critical" },
          { id: "vet-14", text: "Configure bandwidth limits for guest WiFi", priority: "medium" },
          { id: "vet-15", text: "Add branded splash page to guest WiFi", priority: "medium" }
        ]
      },
      {
        id: "continuity",
        title: "Business Continuity & Internet Redundancy",
        icon: AlertTriangle,
        content: `If your internet goes down and you use cloud PMS, you can't access patient records, process payments, or contact clients.

**Internet Redundancy Options:**
1. Dual-WAN Router: Two broadband connections, automatic failover
2. 4G/5G Backup: Mobile connection activates if primary fails
3. Starlink: Satellite backup for rural areas

**What to Keep Working:**
• Card payments (4G card machines as backup)
• Patient record access (local cache if cloud PMS)
• Phone system (VoIP needs internet - have mobile backup)
• Prescription printing (keep a local copy of templates)

**Power Resilience:**
• UPS on critical equipment (server, router, phones)
• Enough battery for graceful shutdown (15-30 minutes)
• Consider generator for rural locations

**Documentation:**
• Emergency contact numbers (IT provider, internet, phone)
• Manual procedures (what to do when systems are down)
• Client communication templates (for outage notifications)`,
        checklist: [
          { id: "vet-16", text: "Install dual-WAN or 4G backup internet", priority: "high" },
          { id: "vet-17", text: "Configure 4G backup for card machine", priority: "high" },
          { id: "vet-18", text: "Install UPS on server and network equipment", priority: "critical" },
          { id: "vet-19", text: "Document manual procedures for system outage", priority: "high" },
          { id: "vet-20", text: "Test failover to backup internet", priority: "high" }
        ],
        locked: true
      }
    ]
  },

  "renewable-energy": {
    industry: "Renewable Energy",
    title: "Renewable Energy IT Guide",
    subtitle: "Connect remote sites, monitor assets securely, and scale with your portfolio",
    metaDesc: "Free IT guide for renewable energy companies. Covers remote site connectivity, SCADA security, asset monitoring, and multi-site management.",
    intro: "Renewable energy businesses face unique IT challenges. Wind farms in remote locations, solar arrays spanning acres, and the need for real-time monitoring mean your IT infrastructure must be reliable, secure, and scalable. This guide covers the specific requirements for renewable energy operations.",
    stats: {
      readTime: "12 min",
      lastUpdated: "Dec 2025"
    },
    sections: [
      {
        id: "connectivity",
        title: "Remote Site Connectivity",
        icon: Wifi,
        content: `Wind farms, solar installations, and hydro sites are often in locations with limited connectivity. Reliable communication is essential for monitoring and control.

**Connectivity Options:**
• Fibre: Ideal if available, but expensive to install remotely
• 4G/5G: Good bandwidth, but coverage varies
• Satellite: Starlink now offers 100Mbps+ in rural areas
• Point-to-Point Wireless: Connect nearby sites without cables

**Redundancy is Critical:**
A single connection failure shouldn't blind you to site operations:
• Primary: Best available broadband or fibre
• Secondary: 4G/5G with automatic failover
• Tertiary: Low-bandwidth satellite for critical alerts

**Bandwidth Requirements:**
• SCADA data: Low bandwidth, but latency-sensitive
• Video monitoring: 2-5 Mbps per camera
• Remote access: 5-10 Mbps per concurrent user
• Firmware updates: Occasional high bandwidth needs`,
        checklist: [
          { id: "re-1", text: "Survey connectivity options at each site", priority: "critical" },
          { id: "re-2", text: "Implement redundant connections at critical sites", priority: "critical" },
          { id: "re-3", text: "Test failover between primary and backup connections", priority: "high" },
          { id: "re-4", text: "Document bandwidth requirements for each application", priority: "medium" },
          { id: "re-5", text: "Consider Starlink for sites with poor terrestrial coverage", priority: "medium" }
        ]
      },
      {
        id: "scada",
        title: "SCADA & Control System Security",
        icon: Shield,
        content: `SCADA (Supervisory Control and Data Acquisition) systems are the nervous system of your renewable assets. They're also increasingly targeted by attackers.

**The Threat Landscape:**
• Nation-state actors targeting energy infrastructure
• Ransomware groups seeing energy as high-value targets
• Insider threats from contractors with access
• Legacy systems with known vulnerabilities

**Security Architecture:**
• DMZ: Create a demilitarised zone between IT and OT networks
• Firewall Rules: Explicit allow-lists, not blocklists
• Jump Servers: All OT access through controlled gateways
• Monitoring: Detect anomalous commands and traffic

**Vendor Access:**
Turbine manufacturers need remote access for maintenance:
• Time-limited access windows (not 24/7)
• Multi-factor authentication required
• Session recording for audit
• Segregated access to specific assets only

**Patching Strategy:**
OT systems can't be patched like IT systems:
• Test patches in lab environment first
• Schedule updates during low-generation periods
• Have rollback plans ready
• Document compensating controls for unpatchable systems`,
        checklist: [
          { id: "re-6", text: "Map all connections between IT and OT networks", priority: "critical" },
          { id: "re-7", text: "Implement jump server for vendor access", priority: "critical" },
          { id: "re-8", text: "Review and tighten firewall rules", priority: "high" },
          { id: "re-9", text: "Enable session recording for OT access", priority: "high" },
          { id: "re-10", text: "Create OT patching schedule and test environment", priority: "high" }
        ]
      },
      {
        id: "monitoring",
        title: "Asset Monitoring & Analytics",
        icon: Sun,
        content: `Real-time monitoring maximises generation and minimises downtime. But the data volumes can be overwhelming.

**Data Collection:**
• Turbine data: Power output, wind speed, pitch angle, temperatures
• Solar data: Irradiance, panel output, inverter status
• Grid data: Frequency, voltage, reactive power
• Environmental: Weather stations, wildlife monitoring

**Architecture Options:**
• Edge Computing: Process data locally, send summaries
• Cloud Platforms: Azure IoT, AWS IoT, or specialist platforms
• Hybrid: Local storage with cloud analytics

**Key Metrics to Track:**
• Availability: Percentage of time generating when conditions allow
• Performance Ratio: Actual output vs theoretical maximum
• Mean Time Between Failures (MTBF)
• Mean Time To Repair (MTTR)

**Alerting Strategy:**
Not every alert needs immediate response:
• Critical: Generation stopped, security breach - immediate page
• High: Component degradation - next business day
• Medium: Efficiency drop - weekly review
• Low: Informational - monthly reporting`,
        checklist: [
          { id: "re-11", text: "Document all data sources and collection points", priority: "high" },
          { id: "re-12", text: "Implement edge processing to reduce bandwidth", priority: "medium" },
          { id: "re-13", text: "Define alert priority levels and response procedures", priority: "high" },
          { id: "re-14", text: "Set up automated daily generation reports", priority: "medium" },
          { id: "re-15", text: "Configure predictive maintenance analytics", priority: "medium" }
        ]
      },
      {
        id: "scaling",
        title: "Multi-Site Management & Scaling",
        icon: Battery,
        content: `As your portfolio grows, IT complexity increases. What worked for 3 sites doesn't scale to 30.

**Centralised vs Distributed:**
• Control Room: Centralised monitoring of all sites
• Local Presence: On-site hardware for autonomy during WAN outages
• Hybrid: Central oversight with local failover

**Standardisation:**
• Common hardware platforms across sites
• Unified monitoring and management tools
• Documented build procedures
• Spare equipment pre-configured

**Network Architecture:**
• SD-WAN for intelligent traffic routing
• Centralised security policies
• Consistent addressing schemes
• Automated configuration management

**Acquisition Integration:**
When acquiring operational assets:
• Security audit before network connection
• Migrate to standard platforms where possible
• Document legacy systems and their dependencies
• Plan for eventual replacement`,
        checklist: [
          { id: "re-16", text: "Standardise hardware platforms across sites", priority: "high" },
          { id: "re-17", text: "Implement centralised monitoring dashboard", priority: "critical" },
          { id: "re-18", text: "Create documented site build procedures", priority: "high" },
          { id: "re-19", text: "Evaluate SD-WAN for multi-site connectivity", priority: "medium" },
          { id: "re-20", text: "Develop acquisition IT integration playbook", priority: "medium" }
        ],
        locked: true
      }
    ]
  },

  "retail-distribution": {
    industry: "Retail & Distribution",
    title: "Retail & Distribution IT Operations Guide",
    subtitle: "Optimise warehouse systems, secure EPOS, and enable omnichannel retail",
    metaDesc: "Free IT guide for retail and distribution businesses. Covers warehouse WiFi, EPOS security, WMS optimisation, and omnichannel integration.",
    intro: "Retail and distribution businesses depend on fast, reliable IT. From warehouse scanners to EPOS terminals, from ecommerce platforms to delivery tracking, your technology must keep pace with customer expectations. This guide covers the IT essentials for modern retail and logistics operations.",
    stats: {
      readTime: "13 min",
      lastUpdated: "Dec 2025"
    },
    sections: [
      {
        id: "warehouse",
        title: "Warehouse WiFi & Scanner Performance",
        icon: Wifi,
        content: `Warehouse WiFi is challenging. High racking, metal structures, and constant movement create an unforgiving RF environment.

**Common Problems:**
• Scanners disconnecting in certain aisles
• Slow response times during peak periods
• Battery drain from poor signal
• Inconsistent performance between locations

**Design Principles:**
• Professional site survey with heatmapping
• Industrial-grade access points (wider temperature tolerance)
• High-density deployment (more APs, lower power)
• Wired backhaul between access points (avoid mesh)
• Band steering (keep devices on 5GHz)

**Scanner-Specific Considerations:**
• Seamless roaming (802.11r/k/v)
• Legacy 2.4GHz support for older devices
• QoS for WMS traffic
• Keep-alive packets to prevent disconnection

**Testing:**
Walk every aisle with a survey tool. Map signal strength and test actual scanner performance under load.`,
        checklist: [
          { id: "rd-1", text: "Conduct professional WiFi site survey", priority: "critical" },
          { id: "rd-2", text: "Document all WiFi dead zones", priority: "high" },
          { id: "rd-3", text: "Upgrade to industrial-grade access points", priority: "high" },
          { id: "rd-4", text: "Configure smooth roaming protocols", priority: "high" },
          { id: "rd-5", text: "Test scanner connectivity at all rack locations", priority: "critical" }
        ]
      },
      {
        id: "epos",
        title: "EPOS Security & PCI DSS",
        icon: Lock,
        content: `Electronic Point of Sale systems handle payment card data. Security isn't optional - it's mandated by PCI DSS.

**PCI DSS Requirements:**
• Secure network segmentation for cardholder data
• Strong access controls
• Regular security testing
• Encryption of card data in transit
• Documented security policies

**EPOS Network Isolation:**
• Separate VLAN for all EPOS terminals
• Firewall rules limiting EPOS traffic
• No internet browsing from EPOS devices
• Dedicated payment switch/acquirer connections

**Physical Security:**
• Tamper-evident seals on terminals
• Regular inspection for skimming devices
• CCTV coverage of all EPOS positions
• Controlled access to back-of-house EPOS servers

**Compliance Evidence:**
Keep records of:
• Network diagrams showing EPOS segmentation
• Firewall rule reviews (quarterly)
• Security awareness training
• Vulnerability scans`,
        checklist: [
          { id: "rd-6", text: "Implement EPOS VLAN segmentation", priority: "critical" },
          { id: "rd-7", text: "Review and document firewall rules", priority: "critical" },
          { id: "rd-8", text: "Conduct PCI DSS gap analysis", priority: "high" },
          { id: "rd-9", text: "Implement tamper inspection procedures", priority: "high" },
          { id: "rd-10", text: "Train staff on payment security", priority: "high" }
        ]
      },
      {
        id: "wms",
        title: "WMS & Inventory Optimisation",
        icon: Package,
        content: `Your Warehouse Management System is the brain of your operation. When it's slow, everything slows down.

**Performance Factors:**
• Database server specifications (RAM, SSD storage)
• Network latency between scanners and server
• Query optimisation for frequently-used operations
• Report scheduling (don't run heavy reports during picks)

**Common WMS Issues:**
• Slow location lookups
• Delay updating stock after picks
• Report timeouts
• Integration lag with ERP

**Optimisation Steps:**
• Database maintenance (index rebuilds, statistics updates)
• Query analysis (identify slow queries)
• Memory tuning (give the database more RAM)
• SSD storage (eliminates disk bottlenecks)

**Integration Points:**
• ERP: Stock levels, orders, financials
• Ecommerce: Real-time availability
• Carriers: Shipping labels, tracking
• Suppliers: EDI for automated ordering`,
        checklist: [
          { id: "rd-11", text: "Review WMS server specifications", priority: "high" },
          { id: "rd-12", text: "Schedule weekly database maintenance", priority: "critical" },
          { id: "rd-13", text: "Audit slow queries and optimise", priority: "high" },
          { id: "rd-14", text: "Move database to SSD storage", priority: "high" },
          { id: "rd-15", text: "Review integration performance", priority: "medium" }
        ]
      },
      {
        id: "omnichannel",
        title: "Omnichannel & Ecommerce Integration",
        icon: Truck,
        content: `Customers expect smooth experiences across channels. Buy online, collect in store. Return in store for online purchase. Real-time stock visibility.

**Integration Challenges:**
• Stock synchronisation (prevent overselling)
• Order routing (which location fulfils?)
• Returns processing (any channel to any channel)
• Consistent pricing and promotions

**Architecture Patterns:**
• Central Order Management System (OMS)
• Real-time inventory visibility layer
• API-first approach for flexibility
• Event-driven updates (not batch syncs)

**Stock Accuracy:**
Omnichannel requires accurate stock data:
• Regular cycle counts
• Automated discrepancy alerts
• Location accuracy audits
• Buffer stock for high-velocity items

**Click & Collect:**
• Dedicated pick queue in WMS
• Store notification system
• Customer collection alerts
• Uncollected order management`,
        checklist: [
          { id: "rd-16", text: "Implement real-time stock synchronisation", priority: "critical" },
          { id: "rd-17", text: "Configure order routing rules", priority: "high" },
          { id: "rd-18", text: "Set up stock discrepancy alerts", priority: "high" },
          { id: "rd-19", text: "Enable API access for ecommerce platform", priority: "high" },
          { id: "rd-20", text: "Create click & collect workflow", priority: "medium" }
        ],
        locked: true
      }
    ]
  }
};

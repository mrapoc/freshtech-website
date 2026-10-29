// Centralized blog post images by category
// Each category has 4 images that rotate to add variety
// User uploads images to Cloudinary with matching filenames

// Cloudinary base URL for Fresh Tech account
const CLOUDINARY_BASE = "https://res.cloudinary.com/djkmeg5se/image/upload/f_auto,q_auto";

// Cloudinary image filenames per category (SEO optimized)
// User uploads images to Cloudinary with these exact filenames
export const cloudinaryFilenames: Record<string, string[]> = {
  security: [
    "cyber-security-lock-protection.jpg",
    "data-breach-prevention-shield.jpg",
    "network-security-firewall.jpg",
    "password-security-authentication.jpg",
  ],
  backup: [
    "cloud-backup-disaster-recovery.jpg",
    "data-protection-backup-server.jpg",
    "business-continuity-planning.jpg",
    "automated-backup-solutions.jpg",
  ],
  microsoft365: [
    "microsoft-365-productivity-suite.jpg",
    "office-365-collaboration-tools.jpg",
    "teams-communication-platform.jpg",
    "sharepoint-document-management.jpg",
  ],
  hardware: [
    "business-laptop-workstation.jpg",
    "server-hardware-infrastructure.jpg",
    "network-equipment-setup.jpg",
    "computer-upgrade-maintenance.jpg",
  ],
  itSupport: [
    "it-helpdesk-support-team.jpg",
    "technical-support-engineer.jpg",
    "remote-it-assistance.jpg",
    "managed-it-services.jpg",
  ],
  business: [
    "business-technology-strategy.jpg",
    "cost-saving-it-solutions.jpg",
    "enterprise-solutions-planning.jpg",
    "digital-transformation-office.jpg",
  ],
  remoteWork: [
    "remote-working-home-office.jpg",
    "hybrid-workplace-technology.jpg",
    "video-conferencing-setup.jpg",
    "mobile-workforce-solutions.jpg",
  ],
  training: [
    "cyber-awareness-training.jpg",
    "employee-it-training-session.jpg",
    "security-workshop-presentation.jpg",
    "digital-skills-development.jpg",
  ],
  compliance: [
    "gdpr-compliance-documentation.jpg",
    "data-protection-regulations.jpg",
    "compliance-audit-checklist.jpg",
    "regulatory-standards-certificate.jpg",
  ],
  ai: [
    "artificial-intelligence-business.jpg",
    "ai-automation-innovation.jpg",
    "machine-learning-technology.jpg",
    "copilot-ai-assistant.jpg",
  ],
  christmas: [
    "christmas-office-celebration.jpg",
    "holiday-business-season.jpg",
    "festive-workplace-decorations.jpg",
    "year-end-it-review.jpg",
  ],
  easter: [
    "easter-spring-office.jpg",
    "spring-business-renewal.jpg",
    "easter-holiday-technology.jpg",
    "spring-cleaning-it-refresh.jpg",
  ],
  newYear: [
    "new-year-business-planning.jpg",
    "fresh-start-technology-upgrade.jpg",
    "annual-it-strategy-review.jpg",
    "january-business-goals.jpg",
  ],
  summer: [
    "summer-holiday-it-support.jpg",
    "vacation-remote-access.jpg",
    "summer-office-productivity.jpg",
    "seasonal-business-continuity.jpg",
  ],
  veterinary: [
    "veterinary-practice-it-support.jpg",
    "animal-clinic-technology.jpg",
    "vet-surgery-network.jpg",
    "veterinary-software-systems.jpg",
  ],
  default: [
    "fresh-tech-it-support-general.jpg",
    "business-technology-solutions.jpg",
    "professional-it-services.jpg",
    "modern-office-technology.jpg",
  ],
};

// Track which Cloudinary images have been uploaded
// Set to true when user confirms upload to Cloudinary
export const cloudinaryUploaded: Record<string, boolean[]> = {
  security: [true, true, true, true],
  backup: [true, true, true, true],
  microsoft365: [true, true, true, true],
  hardware: [true, true, true, true],
  itSupport: [true, true, true, true],
  business: [true, true, true, true],
  remoteWork: [true, true, true, true],
  training: [true, true, true, true],
  compliance: [true, true, true, true],
  ai: [true, true, true, true],
  christmas: [true, true, true, true],
  easter: [true, true, true, true],
  newYear: [true, true, true, true],
  summer: [true, true, true, true],
  veterinary: [true, true, true, true],
  default: [true, true, true, true],
};

// Main image collection - uses Cloudinary URLs where available, Unsplash fallback otherwise
export const blogImages: Record<string, string[]> = {
  // Security & Cyber topics (3 Cloudinary + 1 fallback)
  security: [
    `${CLOUDINARY_BASE}/v1764867427/guide-to-cyber-essentials-security.jpg`,
    `${CLOUDINARY_BASE}/v1764868023/password-it-security-cybersecurity-biometrics.jpg`,
    `${CLOUDINARY_BASE}/password-security-authentication.jpg`,
    `${CLOUDINARY_BASE}/password-security-authentication.jpg`, // password-security-authentication.jpg pending
  ],

  // Backup & Disaster Recovery
  backup: [
    `${CLOUDINARY_BASE}/automated-backup-solutions.jpg`,
    `${CLOUDINARY_BASE}/v1764867427/guide-to-cyber-essentials-security.jpg`,
    `${CLOUDINARY_BASE}/business-continuity-planning.jpg`,
    `${CLOUDINARY_BASE}/automated-backup-solutions.jpg`,
  ],

  // Microsoft 365 & Productivity
  microsoft365: [
    `${CLOUDINARY_BASE}/v1764867334/is-business-premium-worth-it.jpg`,
    `${CLOUDINARY_BASE}/computer-upgrade-maintenance.jpg`,
    `${CLOUDINARY_BASE}/teams-communication-platform.jpg`,
    `${CLOUDINARY_BASE}/sharepoint-document-management.jpg`,
  ],

  // Hardware & Devices
  hardware: [
    `${CLOUDINARY_BASE}/computer-upgrade-maintenance.jpg`,
    `${CLOUDINARY_BASE}/v1764866385/manufacturing-it-support.jpg`,
    `${CLOUDINARY_BASE}/network-equipment-setup.jpg`,
    `${CLOUDINARY_BASE}/computer-upgrade-maintenance.jpg`,
  ],

  // IT Support & Strategy
  itSupport: [
    `${CLOUDINARY_BASE}/managed-it-services.jpg`,
    `${CLOUDINARY_BASE}/remote-it-assistance.jpg`,
    `${CLOUDINARY_BASE}/remote-it-assistance.jpg`,
    `${CLOUDINARY_BASE}/managed-it-services.jpg`,
  ],

  // Business & Cost Saving
  business: [
    `${CLOUDINARY_BASE}/v1764610139/luxury-furniture-retail-google-workspace-case-study.jpg`,
    `${CLOUDINARY_BASE}/v1764866529/renewable-energy-biogas-solar-it-support.jpg`,
    `${CLOUDINARY_BASE}/enterprise-solutions-planning.jpg`,
    `${CLOUDINARY_BASE}/digital-transformation-office.jpg`,
  ],

  // Remote Work & Cloud
  remoteWork: [
    `${CLOUDINARY_BASE}/business-networking-infrastructure.jpg`,
    `${CLOUDINARY_BASE}/v1764867334/is-business-premium-worth-it.jpg`,
    `${CLOUDINARY_BASE}/video-conferencing-setup.jpg`,
    `${CLOUDINARY_BASE}/mobile-workforce-solutions.jpg`,
  ],

  // Training & Awareness
  training: [
    `${CLOUDINARY_BASE}/v1764868023/password-it-security-cybersecurity-biometrics.jpg`,
    `${CLOUDINARY_BASE}/v1764867427/guide-to-cyber-essentials-security.jpg`,
    `${CLOUDINARY_BASE}/security-workshop-presentation.jpg`,
    `${CLOUDINARY_BASE}/digital-skills-development.jpg`,
  ],

  // Compliance & GDPR
  compliance: [
    `${CLOUDINARY_BASE}/v1764866179/legal-it-services-solicitors-law.jpg`,
    `${CLOUDINARY_BASE}/v1764867427/guide-to-cyber-essentials-security.jpg`,
    `${CLOUDINARY_BASE}/compliance-audit-checklist.jpg`,
    `${CLOUDINARY_BASE}/regulatory-standards-certificate.jpg`,
  ],

  // AI & Innovation
  ai: [
    `${CLOUDINARY_BASE}/v1764867334/is-business-premium-worth-it.jpg`,
    `${CLOUDINARY_BASE}/cloud-vs-on-premise-servers.jpg`,
    `${CLOUDINARY_BASE}/machine-learning-technology.jpg`,
    `${CLOUDINARY_BASE}/copilot-ai-assistant.jpg`,
  ],

  // Seasonal / Holiday - Split by specific occasion
  christmas: [
    `${CLOUDINARY_BASE}/v1765888172/christmas_2025_blog_post.jpg`,
    `${CLOUDINARY_BASE}/holiday-business-season.jpg`,
    `${CLOUDINARY_BASE}/festive-workplace-decorations.jpg`,
    `${CLOUDINARY_BASE}/year-end-it-review.jpg`,
  ],
  easter: [
    `${CLOUDINARY_BASE}/easter-spring-office.jpg`,
    `${CLOUDINARY_BASE}/spring-business-renewal.jpg`,
    `${CLOUDINARY_BASE}/easter-holiday-technology.jpg`,
    `${CLOUDINARY_BASE}/spring-cleaning-it-refresh.jpg`,
  ],
  newYear: [
    `${CLOUDINARY_BASE}/new-year-business-planning.jpg`,
    `${CLOUDINARY_BASE}/fresh-start-technology-upgrade.jpg`,
    `${CLOUDINARY_BASE}/annual-it-strategy-review.jpg`,
    `${CLOUDINARY_BASE}/january-business-goals.jpg`,
  ],
  summer: [
    `${CLOUDINARY_BASE}/summer-holiday-it-support.jpg`,
    `${CLOUDINARY_BASE}/vacation-remote-access.jpg`,
    `${CLOUDINARY_BASE}/summer-office-productivity.jpg`,
    `${CLOUDINARY_BASE}/seasonal-business-continuity.jpg`,
  ],

  // Industry specific
  veterinary: [
    `${CLOUDINARY_BASE}/v1764865091/vets-wifi-install-network-upgrade.jpg`,
    `${CLOUDINARY_BASE}/animal-clinic-technology.jpg`,
    `${CLOUDINARY_BASE}/vet-surgery-network.jpg`,
    `${CLOUDINARY_BASE}/veterinary-software-systems.jpg`,
  ],

  // Default fallback
  default: [
    `${CLOUDINARY_BASE}/managed-it-services.jpg`,
    `${CLOUDINARY_BASE}/business-technology-solutions.jpg`,
    `${CLOUDINARY_BASE}/professional-it-services.jpg`,
    `${CLOUDINARY_BASE}/modern-office-technology.jpg`,
  ],
};

// Tag to category mapping
const tagToCategory: Record<string, keyof typeof blogImages> = {
  // Security tags
  'Security': 'security',
  'Cyber Essentials': 'security',
  'Passwords': 'security',
  'GDPR': 'compliance',
  'Compliance': 'compliance',

  // Backup tags
  'Backup': 'backup',
  'Disaster Recovery': 'backup',

  // Microsoft tags
  'Microsoft 365': 'microsoft365',
  'Productivity': 'microsoft365',

  // Hardware tags
  'Hardware': 'hardware',
  'Windows': 'hardware',

  // IT Support tags
  'IT Support': 'itSupport',
  'Strategy': 'business',
  'Business': 'business',
  'Cost Saving': 'business',

  // Remote work tags
  'Remote Work': 'remoteWork',
  'Cloud': 'remoteWork',
  'Holiday': 'remoteWork',

  // Training tags
  'Training': 'training',

  // AI tags
  'AI': 'ai',

  // Seasonal/Holiday tags - specific occasions
  'Christmas': 'christmas',
  'Easter': 'easter',
  'New Year': 'newYear',
  'Summer': 'summer',

  // Industry tags
  'Veterinary': 'veterinary',
};

/**
 * Get the appropriate image for a blog post based on its tags
 * Uses a simple hash of the post ID to rotate through available images
 */
export const getBlogImage = (tags: string[], postId: string): string => {
  // Find the first matching category based on tags
  let category: keyof typeof blogImages = 'default';

  for (const tag of tags) {
    if (tagToCategory[tag]) {
      category = tagToCategory[tag];
      break;
    }
  }

  const images = blogImages[category];

  // Use post ID to consistently select an image (creates variety but stays consistent)
  const idNum = parseInt(postId, 10) || 0;
  const imageIndex = idNum % images.length;

  return images[imageIndex];
};

/**
 * Get all images for social media preview purposes
 */
export const getAllBlogImages = () => blogImages;

/**
 * Get upload status for all categories
 * Returns object with category names and their upload completion percentage
 */
export const getUploadStatus = () => {
  const status: Record<string, { uploaded: number; total: number; pending: string[] }> = {};

  for (const [category, uploaded] of Object.entries(cloudinaryUploaded)) {
    const filenames = cloudinaryFilenames[category] || [];
    const uploadedCount = uploaded.filter(Boolean).length;
    const pendingFilenames = filenames.filter((_, i) => !uploaded[i]);

    status[category] = {
      uploaded: uploadedCount,
      total: filenames.length,
      pending: pendingFilenames,
    };
  }

  return status;
};

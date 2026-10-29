#!/usr/bin/env node
/**
 * Update Unsplash URLs → Cloudinary URLs after uploading images.
 *
 * Usage:
 *   node scripts/update-image-urls.js
 *
 * This script:
 *   1. Reads content.ts and blogImages.ts
 *   2. Replaces all Unsplash URLs with Cloudinary equivalents
 *   3. Updates cloudinaryUploaded flags to all true
 *   4. Removes the unsplashFallbacks constant (no longer needed)
 *
 * Prerequisites:
 *   - All images from unsplash-downloads/ uploaded to Cloudinary
 *   - Images uploaded with their original filenames (no renaming)
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const CLOUDINARY_BASE = 'https://res.cloudinary.com/djkmeg5se/image/upload/f_auto,q_auto';

// ============================================================================
// content.ts replacements: Unsplash URL → Cloudinary filename
// ============================================================================
const contentReplacements = [
  // Service hero
  { from: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&q=80', to: `${CLOUDINARY_BASE}/backup-disaster-recovery-hero.jpg` },

  // Industry heroes
  { from: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1200', to: `${CLOUDINARY_BASE}/accountants-financial-services-hero.jpg` },
  { from: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1200', to: `${CLOUDINARY_BASE}/solicitors-law-firms-hero.jpg` },
  { from: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=1200', to: `${CLOUDINARY_BASE}/manufacturing-engineering-hero.jpg` },
  { from: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=1200', to: `${CLOUDINARY_BASE}/agriculture-rural-estates-hero.jpg` },
  { from: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1200', to: `${CLOUDINARY_BASE}/healthcare-care-homes-hero.jpg` },
  { from: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200', to: `${CLOUDINARY_BASE}/professional-services-hero.jpg` },
  { from: 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=1200', to: `${CLOUDINARY_BASE}/charities-non-profits-hero.jpg` },
  { from: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1200', to: `${CLOUDINARY_BASE}/education-training-hero.jpg` },
  { from: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1200', to: `${CLOUDINARY_BASE}/construction-hero.jpg` },
  { from: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1200', to: `${CLOUDINARY_BASE}/hospitality-hero.jpg` },
  { from: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200', to: `${CLOUDINARY_BASE}/estate-agents-hero.jpg` },
  { from: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=1200', to: `${CLOUDINARY_BASE}/recruitment-hero.jpg` },

  // Case study images (note: ?w=800 variant)
  { from: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800', to: `${CLOUDINARY_BASE}/accountancy-practice-case-study.jpg` },
  { from: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800', to: `${CLOUDINARY_BASE}/rural-estate-agriculture-case-study.jpg` },
  { from: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800', to: `${CLOUDINARY_BASE}/architecture-studio-case-study.jpg` },
  { from: 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=800', to: `${CLOUDINARY_BASE}/community-trust-charity-case-study.jpg` },
  { from: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800', to: `${CLOUDINARY_BASE}/preparatory-school-case-study.jpg` },

  // Tech explainer heroes
  { from: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&q=80', to: `${CLOUDINARY_BASE}/rmm-remote-monitoring-management.jpg` },
  { from: 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=1200&q=80', to: `${CLOUDINARY_BASE}/application-control-ringfencing.jpg` },
  { from: 'https://images.unsplash.com/photo-1614064641938-3bbee52942c7?w=1200&q=80', to: `${CLOUDINARY_BASE}/admin-rights-removal-security.jpg` },
  { from: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=1200&q=80', to: `${CLOUDINARY_BASE}/edr-mdr-endpoint-security.jpg` },
  { from: 'https://images.unsplash.com/photo-1633265486064-086b219458ec?w=1200&q=80', to: `${CLOUDINARY_BASE}/itdr-identity-threat-detection.jpg` },
  { from: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&q=80', to: `${CLOUDINARY_BASE}/conditional-access-security.jpg` },
  { from: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=1200&q=80', to: `${CLOUDINARY_BASE}/intune-autopilot-device-management.jpg` },
  { from: 'https://images.unsplash.com/photo-1529074105199-8d146ff4c79e?w=1200&q=80', to: `${CLOUDINARY_BASE}/ncsc-national-cyber-security.jpg` },
  { from: 'https://images.unsplash.com/photo-1629654297299-c8506221ca97?w=1200&q=80', to: `${CLOUDINARY_BASE}/software-patching-updates.jpg` },
  { from: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=1200&q=80', to: `${CLOUDINARY_BASE}/end-of-life-devices-hardware.jpg` },
  { from: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=1200&q=80', to: `${CLOUDINARY_BASE}/business-networking-infrastructure.jpg` },
  { from: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&q=80', to: `${CLOUDINARY_BASE}/cloud-vs-on-premise-servers.jpg` },
  { from: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200&q=80', to: `${CLOUDINARY_BASE}/zero-trust-security-model.jpg` },
  { from: 'https://images.unsplash.com/photo-1510915228340-29c85a43dcfe?w=1200&q=80', to: `${CLOUDINARY_BASE}/two-factor-authentication-mfa.jpg` },
  { from: 'https://images.unsplash.com/photo-1563986768494-4dee2763ff3f?w=1200&q=80', to: `${CLOUDINARY_BASE}/phishing-email-scam-protection.jpg` },
];

// ============================================================================
// blogImages.ts: New content to replace fallback references
// ============================================================================
const blogImageReplacements = {
  // category: { slotIndex: cloudinaryFilename }
  security: { 3: 'password-security-authentication.jpg' },
  backup: { 2: 'business-continuity-planning.jpg', 3: 'automated-backup-solutions.jpg' },
  microsoft365: { 2: 'teams-communication-platform.jpg', 3: 'sharepoint-document-management.jpg' },
  hardware: { 2: 'network-equipment-setup.jpg', 3: 'computer-upgrade-maintenance.jpg' },
  itSupport: { 2: 'remote-it-assistance.jpg', 3: 'managed-it-services.jpg' },
  business: { 2: 'enterprise-solutions-planning.jpg', 3: 'digital-transformation-office.jpg' },
  remoteWork: { 2: 'video-conferencing-setup.jpg', 3: 'mobile-workforce-solutions.jpg' },
  training: { 2: 'security-workshop-presentation.jpg', 3: 'digital-skills-development.jpg' },
  compliance: { 2: 'compliance-audit-checklist.jpg', 3: 'regulatory-standards-certificate.jpg' },
  ai: { 2: 'machine-learning-technology.jpg', 3: 'copilot-ai-assistant.jpg' },
  christmas: { 1: 'holiday-business-season.jpg', 2: 'festive-workplace-decorations.jpg', 3: 'year-end-it-review.jpg' },
  easter: { 0: 'easter-spring-office.jpg', 1: 'spring-business-renewal.jpg', 2: 'easter-holiday-technology.jpg', 3: 'spring-cleaning-it-refresh.jpg' },
  newYear: { 0: 'new-year-business-planning.jpg', 1: 'fresh-start-technology-upgrade.jpg', 2: 'annual-it-strategy-review.jpg', 3: 'january-business-goals.jpg' },
  summer: { 0: 'summer-holiday-it-support.jpg', 1: 'vacation-remote-access.jpg', 2: 'summer-office-productivity.jpg', 3: 'seasonal-business-continuity.jpg' },
  veterinary: { 1: 'animal-clinic-technology.jpg', 2: 'vet-surgery-network.jpg', 3: 'veterinary-software-systems.jpg' },
  default: { 1: 'business-technology-solutions.jpg', 2: 'professional-it-services.jpg', 3: 'modern-office-technology.jpg' },
};

// ============================================================================
// Main
// ============================================================================

// 1. Update content.ts
console.log('Updating data/content.ts...');
const contentPath = resolve('data/content.ts');
let content = readFileSync(contentPath, 'utf-8');

let contentCount = 0;
for (const { from, to } of contentReplacements) {
  if (content.includes(from)) {
    content = content.replaceAll(from, to);
    contentCount++;
  }
}
writeFileSync(contentPath, content);
console.log(`  Replaced ${contentCount} Unsplash URLs in content.ts`);

// 2. Update blogImages.ts
console.log('Updating data/blogImages.ts...');
const blogPath = resolve('data/blogImages.ts');
let blogContent = readFileSync(blogPath, 'utf-8');

let blogCount = 0;
for (const [category, slots] of Object.entries(blogImageReplacements)) {
  for (const [slotStr, filename] of Object.entries(slots)) {
    const slot = Number(slotStr);
    const fallbackRef = `unsplashFallbacks.${category}[${slot}]`;
    const cloudinaryUrl = '`${CLOUDINARY_BASE}/' + filename + '`';
    if (blogContent.includes(fallbackRef)) {
      blogContent = blogContent.replace(fallbackRef, cloudinaryUrl);
      blogCount++;
    }
  }
}

// Update cloudinaryUploaded to all true
blogContent = blogContent.replace(
  /export const cloudinaryUploaded[\s\S]*?};/,
  `export const cloudinaryUploaded: Record<string, boolean[]> = {
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
};`
);

writeFileSync(blogPath, blogContent);
console.log(`  Replaced ${blogCount} fallback references in blogImages.ts`);
console.log('  Updated cloudinaryUploaded flags to all true');

// 3. Check for any remaining Unsplash URLs
console.log('\nVerification...');
const finalContent = readFileSync(contentPath, 'utf-8');
const finalBlog = readFileSync(blogPath, 'utf-8');
const remaining = (finalContent.match(/images\.unsplash\.com/g) || []).length
  + (finalBlog.match(/images\.unsplash\.com/g) || []).length;

if (remaining > 0) {
  console.log(`  ⚠  ${remaining} Unsplash URLs still remain (likely in unsplashFallbacks constant - safe to remove once verified)`);
} else {
  console.log('  ✓  No Unsplash URLs remain');
}

console.log('\nDone! Run `npm run build` to verify the build still passes.');
console.log('After verifying, you can remove images.unsplash.com from the CSP in netlify.toml.');

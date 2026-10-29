#!/bin/bash
# =============================================================================
# Download Unsplash images for Cloudinary upload - HIGH RESOLUTION
# =============================================================================
# Blog images: 1920x1008 (16:~9.5 crop, matches OG ratio at higher res)
# Hero images: 2560w (retina-ready, matches SmartImage srcSet max)
# Case studies: 1400w (card images, don't need full hero width)
# =============================================================================

set -e
OUTDIR="./unsplash-downloads"
mkdir -p "$OUTDIR/blog" "$OUTDIR/industry-heroes" "$OUTDIR/case-studies" "$OUTDIR/tech-explainers" "$OUTDIR/service-heroes"

echo "Downloading high-resolution images..."
echo ""

# =============================================================================
# BLOG IMAGES (40 pending slots) - 1920x1008 crop
# =============================================================================
echo "=== Blog Images (40 files @ 1920x1008) ==="

# Security [3]
curl -sL -o "$OUTDIR/blog/password-security-authentication.jpg" 'https://images.unsplash.com/photo-1633265486064-086b219458ec?w=1920&h=1008&fit=crop&q=85'
echo "  done: password-security-authentication.jpg"

# Backup [2,3]
curl -sL -o "$OUTDIR/blog/business-continuity-planning.jpg" 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1920&h=1008&fit=crop&q=85'
curl -sL -o "$OUTDIR/blog/automated-backup-solutions.jpg" 'https://images.unsplash.com/photo-1484557052118-f32bd25b45b5?w=1920&h=1008&fit=crop&q=85'
echo "  done: backup [2,3]"

# Microsoft 365 [2,3]
curl -sL -o "$OUTDIR/blog/teams-communication-platform.jpg" 'https://images.unsplash.com/photo-1587560699334-cc4ff634909a?w=1920&h=1008&fit=crop&q=85'
curl -sL -o "$OUTDIR/blog/sharepoint-document-management.jpg" 'https://images.unsplash.com/photo-1552581234-26160f608093?w=1920&h=1008&fit=crop&q=85'
echo "  done: microsoft365 [2,3]"

# Hardware [2,3]
curl -sL -o "$OUTDIR/blog/network-equipment-setup.jpg" 'https://images.unsplash.com/photo-1625842268584-8f3296236761?w=1920&h=1008&fit=crop&q=85'
curl -sL -o "$OUTDIR/blog/computer-upgrade-maintenance.jpg" 'https://images.unsplash.com/photo-1591370874773-6702e8f12fd8?w=1920&h=1008&fit=crop&q=85'
echo "  done: hardware [2,3]"

# IT Support [2,3]
curl -sL -o "$OUTDIR/blog/remote-it-assistance.jpg" 'https://images.unsplash.com/photo-1560264280-88b68371db39?w=1920&h=1008&fit=crop&q=85'
curl -sL -o "$OUTDIR/blog/managed-it-services.jpg" 'https://images.unsplash.com/photo-1521737852567-6949f3f9f2b5?w=1920&h=1008&fit=crop&q=85'
echo "  done: itSupport [2,3]"

# Business [2,3]
curl -sL -o "$OUTDIR/blog/enterprise-solutions-planning.jpg" 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1920&h=1008&fit=crop&q=85'
curl -sL -o "$OUTDIR/blog/digital-transformation-office.jpg" 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1920&h=1008&fit=crop&q=85'
echo "  done: business [2,3]"

# Remote Work [2,3]
curl -sL -o "$OUTDIR/blog/video-conferencing-setup.jpg" 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1920&h=1008&fit=crop&q=85'
curl -sL -o "$OUTDIR/blog/mobile-workforce-solutions.jpg" 'https://images.unsplash.com/photo-1521898284481-a5ec348cb555?w=1920&h=1008&fit=crop&q=85'
echo "  done: remoteWork [2,3]"

# Training [2,3]
curl -sL -o "$OUTDIR/blog/security-workshop-presentation.jpg" 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=1920&h=1008&fit=crop&q=85'
curl -sL -o "$OUTDIR/blog/digital-skills-development.jpg" 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1920&h=1008&fit=crop&q=85'
echo "  done: training [2,3]"

# Compliance [2,3]
curl -sL -o "$OUTDIR/blog/compliance-audit-checklist.jpg" 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=1920&h=1008&fit=crop&q=85'
curl -sL -o "$OUTDIR/blog/regulatory-standards-certificate.jpg" 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1920&h=1008&fit=crop&q=85'
echo "  done: compliance [2,3]"

# AI [2,3]
curl -sL -o "$OUTDIR/blog/machine-learning-technology.jpg" 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=1920&h=1008&fit=crop&q=85'
curl -sL -o "$OUTDIR/blog/copilot-ai-assistant.jpg" 'https://images.unsplash.com/photo-1535378620166-273708d44e4c?w=1920&h=1008&fit=crop&q=85'
echo "  done: ai [2,3]"

# Christmas [1,2,3]
curl -sL -o "$OUTDIR/blog/holiday-business-season.jpg" 'https://images.unsplash.com/photo-1482517967863-00e15c9b44be?w=1920&h=1008&fit=crop&q=85'
curl -sL -o "$OUTDIR/blog/festive-workplace-decorations.jpg" 'https://images.unsplash.com/photo-1543589077-47d81606c1bf?w=1920&h=1008&fit=crop&q=85'
curl -sL -o "$OUTDIR/blog/year-end-it-review.jpg" 'https://images.unsplash.com/photo-1513297887119-d46091b24bfa?w=1920&h=1008&fit=crop&q=85'
echo "  done: christmas [1,2,3]"

# Easter [0,1,2,3]
curl -sL -o "$OUTDIR/blog/easter-spring-office.jpg" 'https://images.unsplash.com/photo-1457301547464-55b8223552c6?w=1920&h=1008&fit=crop&q=85'
curl -sL -o "$OUTDIR/blog/spring-business-renewal.jpg" 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=1920&h=1008&fit=crop&q=85'
curl -sL -o "$OUTDIR/blog/easter-holiday-technology.jpg" 'https://images.unsplash.com/photo-1522542550221-31fd8575f4d4?w=1920&h=1008&fit=crop&q=85'
curl -sL -o "$OUTDIR/blog/spring-cleaning-it-refresh.jpg" 'https://images.unsplash.com/photo-1455659817273-f96807779a8a?w=1920&h=1008&fit=crop&q=85'
echo "  done: easter [0,1,2,3]"

# New Year [0,1,2,3]
curl -sL -o "$OUTDIR/blog/new-year-business-planning.jpg" 'https://images.unsplash.com/photo-1467810563316-b5476525c0f9?w=1920&h=1008&fit=crop&q=85'
curl -sL -o "$OUTDIR/blog/fresh-start-technology-upgrade.jpg" 'https://images.unsplash.com/photo-1483921020237-2ff51e8e4b22?w=1920&h=1008&fit=crop&q=85'
curl -sL -o "$OUTDIR/blog/annual-it-strategy-review.jpg" 'https://images.unsplash.com/photo-1514803530489-a9f7b51cbc41?w=1920&h=1008&fit=crop&q=85'
curl -sL -o "$OUTDIR/blog/january-business-goals.jpg" 'https://images.unsplash.com/photo-1546074177-ffdda98d214f?w=1920&h=1008&fit=crop&q=85'
echo "  done: newYear [0,1,2,3]"

# Summer [0,1,2,3]
curl -sL -o "$OUTDIR/blog/summer-holiday-it-support.jpg" 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920&h=1008&fit=crop&q=85'
curl -sL -o "$OUTDIR/blog/vacation-remote-access.jpg" 'https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?w=1920&h=1008&fit=crop&q=85'
curl -sL -o "$OUTDIR/blog/summer-office-productivity.jpg" 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&h=1008&fit=crop&q=85'
curl -sL -o "$OUTDIR/blog/seasonal-business-continuity.jpg" 'https://images.unsplash.com/photo-1530789253388-582c481c54b0?w=1920&h=1008&fit=crop&q=85'
echo "  done: summer [0,1,2,3]"

# Veterinary [1,2,3]
curl -sL -o "$OUTDIR/blog/animal-clinic-technology.jpg" 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=1920&h=1008&fit=crop&q=85'
curl -sL -o "$OUTDIR/blog/vet-surgery-network.jpg" 'https://images.unsplash.com/photo-1612531386530-97286d97c2d2?w=1920&h=1008&fit=crop&q=85'
curl -sL -o "$OUTDIR/blog/veterinary-software-systems.jpg" 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=1920&h=1008&fit=crop&q=85'
echo "  done: veterinary [1,2,3]"

# Default [1,2,3]
curl -sL -o "$OUTDIR/blog/business-technology-solutions.jpg" 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1920&h=1008&fit=crop&q=85'
curl -sL -o "$OUTDIR/blog/professional-it-services.jpg" 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1920&h=1008&fit=crop&q=85'
curl -sL -o "$OUTDIR/blog/modern-office-technology.jpg" 'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=1920&h=1008&fit=crop&q=85'
echo "  done: default [1,2,3]"

# =============================================================================
# SERVICE HEROES (1 file) - 2560w retina
# =============================================================================
echo ""
echo "=== Service Heroes (1 file @ 2560w) ==="

curl -sL -o "$OUTDIR/service-heroes/backup-disaster-recovery-hero.jpg" 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=2560&q=85'
echo "  done: backup-disaster-recovery-hero.jpg"

# =============================================================================
# INDUSTRY HEROES (13 files) - 2560w retina
# =============================================================================
echo ""
echo "=== Industry Heroes (13 files @ 2560w) ==="

curl -sL -o "$OUTDIR/industry-heroes/accountants-financial-services-hero.jpg" 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=2560&q=85'
curl -sL -o "$OUTDIR/industry-heroes/solicitors-law-firms-hero.jpg" 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=2560&q=85'
curl -sL -o "$OUTDIR/industry-heroes/manufacturing-engineering-hero.jpg" 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=2560&q=85'
curl -sL -o "$OUTDIR/industry-heroes/agriculture-rural-estates-hero.jpg" 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=2560&q=85'
curl -sL -o "$OUTDIR/industry-heroes/healthcare-care-homes-hero.jpg" 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=2560&q=85'
curl -sL -o "$OUTDIR/industry-heroes/professional-services-hero.jpg" 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=2560&q=85'
curl -sL -o "$OUTDIR/industry-heroes/charities-non-profits-hero.jpg" 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=2560&q=85'
curl -sL -o "$OUTDIR/industry-heroes/education-training-hero.jpg" 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=2560&q=85'
curl -sL -o "$OUTDIR/industry-heroes/construction-hero.jpg" 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=2560&q=85'
curl -sL -o "$OUTDIR/industry-heroes/hospitality-hero.jpg" 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=2560&q=85'
curl -sL -o "$OUTDIR/industry-heroes/estate-agents-hero.jpg" 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=2560&q=85'
curl -sL -o "$OUTDIR/industry-heroes/financial-advisers-hero.jpg" 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=2560&q=85'
curl -sL -o "$OUTDIR/industry-heroes/recruitment-hero.jpg" 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=2560&q=85'
echo "  done: 13 industry heroes"

# =============================================================================
# CASE STUDY IMAGES (5 files) - 1400w (card grid, not full-width)
# =============================================================================
echo ""
echo "=== Case Study Images (5 files @ 1400w) ==="

curl -sL -o "$OUTDIR/case-studies/accountancy-practice-case-study.jpg" 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1400&q=85'
curl -sL -o "$OUTDIR/case-studies/rural-estate-agriculture-case-study.jpg" 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=1400&q=85'
curl -sL -o "$OUTDIR/case-studies/architecture-studio-case-study.jpg" 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1400&q=85'
curl -sL -o "$OUTDIR/case-studies/community-trust-charity-case-study.jpg" 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=1400&q=85'
curl -sL -o "$OUTDIR/case-studies/preparatory-school-case-study.jpg" 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1400&q=85'
echo "  done: 5 case studies"

# =============================================================================
# TECH EXPLAINER HEROES (16 files) - 2560w retina
# =============================================================================
echo ""
echo "=== Tech Explainer Heroes (16 files @ 2560w) ==="

curl -sL -o "$OUTDIR/tech-explainers/rmm-remote-monitoring-management.jpg" 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=2560&q=85'
curl -sL -o "$OUTDIR/tech-explainers/application-control-ringfencing.jpg" 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=2560&q=85'
curl -sL -o "$OUTDIR/tech-explainers/admin-rights-removal-security.jpg" 'https://images.unsplash.com/photo-1614064641938-3bbee52942c7?w=2560&q=85'
curl -sL -o "$OUTDIR/tech-explainers/edr-mdr-endpoint-security.jpg" 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=2560&q=85'
curl -sL -o "$OUTDIR/tech-explainers/itdr-identity-threat-detection.jpg" 'https://images.unsplash.com/photo-1633265486064-086b219458ec?w=2560&q=85'
curl -sL -o "$OUTDIR/tech-explainers/conditional-access-security.jpg" 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=2560&q=85'
curl -sL -o "$OUTDIR/tech-explainers/intune-autopilot-device-management.jpg" 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=2560&q=85'
curl -sL -o "$OUTDIR/tech-explainers/ncsc-national-cyber-security.jpg" 'https://images.unsplash.com/photo-1529074105199-8d146ff4c79e?w=2560&q=85'
curl -sL -o "$OUTDIR/tech-explainers/software-patching-updates.jpg" 'https://images.unsplash.com/photo-1629654297299-c8506221ca97?w=2560&q=85'
curl -sL -o "$OUTDIR/tech-explainers/end-of-life-devices-hardware.jpg" 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=2560&q=85'
curl -sL -o "$OUTDIR/tech-explainers/business-networking-infrastructure.jpg" 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=2560&q=85'
curl -sL -o "$OUTDIR/tech-explainers/cloud-vs-on-premise-servers.jpg" 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=2560&q=85'
curl -sL -o "$OUTDIR/tech-explainers/zero-trust-security-model.jpg" 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=2560&q=85'
curl -sL -o "$OUTDIR/tech-explainers/two-factor-authentication-mfa.jpg" 'https://images.unsplash.com/photo-1510915228340-29c85a43dcfe?w=2560&q=85'
curl -sL -o "$OUTDIR/tech-explainers/phishing-email-scam-protection.jpg" 'https://images.unsplash.com/photo-1563986768494-4dee2763ff3f?w=2560&q=85'
curl -sL -o "$OUTDIR/tech-explainers/vpn-virtual-private-network.jpg" 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=2560&q=85'
echo "  done: 16 tech explainers"

echo ""
echo "============================================"
echo "Download complete!"
echo ""
du -sh "$OUTDIR"
echo ""
echo "Folder structure:"
echo "  unsplash-downloads/"
echo "  blog/              (40 files @ 1920x1008)"
echo "  industry-heroes/   (13 files @ 2560w)"
echo "  case-studies/      (5 files  @ 1400w)"
echo "  tech-explainers/   (16 files @ 2560w)"
echo "  service-heroes/    (1 file   @ 2560w)"
echo ""
echo "NEXT STEPS:"
echo "  1. Open Cloudinary dashboard > Media Library"
echo "  2. Drag and drop each folders contents (NOT the folders)"
echo "  3. Run: node scripts/update-image-urls.js"
echo "============================================"

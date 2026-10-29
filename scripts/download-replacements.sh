#!/bin/bash
# =============================================================================
# Download replacement images for the 29 that need replacing
# All images from Unsplash - free for commercial use, no attribution required
#
# Criteria applied:
#   - No stock photos of people (faces, posed groups)
#   - Conceptual/object images preferred
#   - UK-appropriate (no US tax forms, no foreign-language signs)
#   - Relevant to the topic
#
# Usage: cd freshtech-website && bash scripts/download-replacements.sh
# =============================================================================

set -e

BLOG_DIR="unsplash-downloads/blog"
HERO_DIR="unsplash-downloads/industry-heroes"
CASE_DIR="unsplash-downloads/case-studies"
TECH_DIR="unsplash-downloads/tech-explainers"

# Resolution targets (matching SmartImage srcSet breakpoints)
BLOG_SIZE="w=1920&h=1008&fit=crop"
HERO_SIZE="w=2560"
CASE_SIZE="w=1400"
TECH_SIZE="w=2560"

BASE="https://images.unsplash.com"

download() {
  local dir="$1" file="$2" photo_id="$3" size="$4" desc="$5"
  local url="${BASE}/${photo_id}?${size}&q=80"
  local path="${dir}/${file}"

  # Back up original if it exists and isn't broken (>100 bytes)
  if [ -f "$path" ] && [ "$(stat -c%s "$path" 2>/dev/null)" -gt 100 ]; then
    mv "$path" "${path}.old"
  fi

  curl -sL -o "$path" "$url"
  local fsize=$(stat -c%s "$path" 2>/dev/null)

  if [ "$fsize" -gt 1000 ]; then
    echo "  OK  ${file} ($(( fsize / 1024 ))KB) - ${desc}"
    # Remove backup
    rm -f "${path}.old"
  else
    echo "  FAIL ${file} (${fsize}B) - ${desc}"
    # Restore backup if we had one
    if [ -f "${path}.old" ]; then
      mv "${path}.old" "$path"
      echo "       (restored original)"
    fi
  fi
}

echo "============================================="
echo "  Downloading 29 replacement images"
echo "============================================="
echo ""

# =============================================================================
# BLOG: Stock people replacements (11 images)
# =============================================================================
echo "--- Blog: Replacing stock people images (11) ---"

# 1. managed-it-services - WAS: coffeeshop people with laptops
#    NOW: Professional laptop on clean white desk (Dell XPS, no person)
download "$BLOG_DIR" "managed-it-services.jpg" \
  "photo-1587614382346-4ec70e388b28" "$BLOG_SIZE" \
  "Professional laptop on clean desk"

# 2. digital-transformation-office - WAS: same coffeeshop duplicate
#    NOW: Code on dark screen - represents digital/tech transformation
download "$BLOG_DIR" "digital-transformation-office.jpg" \
  "photo-1517430816045-df4b7de11d1d" "$BLOG_SIZE" \
  "Code on dark screen (digital transformation)"

# 3. enterprise-solutions-planning - WAS: close-up smiling man face
#    NOW: Laptop with business charts/analytics (Scott Graham)
download "$BLOG_DIR" "enterprise-solutions-planning.jpg" \
  "photo-1454165804606-c3d57bc86b40" "$BLOG_SIZE" \
  "Laptop with business charts"

# 4. compliance-audit-checklist - WAS: man adjusting cufflinks on stairs
#    NOW: Hand signing approval/compliance document - no face, generic
download "$BLOG_DIR" "compliance-audit-checklist.jpg" \
  "photo-1521791055366-0d553872125f" "$BLOG_SIZE" \
  "Hand signing compliance document"

# 5. remote-it-assistance - WAS: open plan office with people
#    NOW: Laptop open with code on wooden desk (Clement Helardot)
download "$BLOG_DIR" "remote-it-assistance.jpg" \
  "photo-1517694712202-14dd9538aa97" "$BLOG_SIZE" \
  "Laptop with code on desk (remote work)"

# 6. security-workshop-presentation - WAS: woman with post-its in meeting
#    NOW: Laptop with notepad, pen and coffee - workshop/training prep
download "$BLOG_DIR" "security-workshop-presentation.jpg" \
  "photo-1501504905252-473c47e087f8" "$BLOG_SIZE" \
  "Laptop with notepad and coffee (workshop)"

# 7. business-technology-solutions - WAS: large co-working crowd
#    NOW: Circuit board close-up - technology concept (Alexandre Debieve)
download "$BLOG_DIR" "business-technology-solutions.jpg" \
  "photo-1518770660439-4636190af475" "$BLOG_SIZE" \
  "Circuit board close-up"

# 8. modern-office-technology - WAS: two people at desk B&W
#    NOW: Empty modern office/meeting room
download "$BLOG_DIR" "modern-office-technology.jpg" \
  "photo-1497366811353-6870744d04b2" "$BLOG_SIZE" \
  "Empty modern meeting room"

# 9. sharepoint-document-management - WAS: group meeting with post-its
#    NOW: Organized papers and documents on desk (Bench Accounting)
download "$BLOG_DIR" "sharepoint-document-management.jpg" \
  "photo-1507925921958-8a62f3d1a50d" "$BLOG_SIZE" \
  "Organized papers and documents"

# 10. vet-surgery-network - WAS: man in lab coat posed portrait
#     NOW: Cat portrait - veterinary concept without people
download "$BLOG_DIR" "vet-surgery-network.jpg" \
  "photo-1514888286974-6c03e2ca1dba" "$BLOG_SIZE" \
  "Cat portrait (veterinary concept)"

# 11. video-conferencing-setup - WAS: coffeeshop group (same source again)
#     NOW: Clean laptop on desk with phone - workspace setup
download "$BLOG_DIR" "video-conferencing-setup.jpg" \
  "photo-1484788984921-03950022c9ef" "$BLOG_SIZE" \
  "Clean laptop workspace setup"

echo ""

# =============================================================================
# BLOG: Gaming PC replacements (3 images)
# =============================================================================
echo "--- Blog: Replacing gaming PC images (3) ---"

# 12. computer-upgrade-maintenance - WAS: RGB triple gaming monitors
#     NOW: MacBook being opened/set up (Ales Nesetril) - business laptop
download "$BLOG_DIR" "computer-upgrade-maintenance.jpg" \
  "photo-1525547719571-a2d4ac8945e2" "$BLOG_SIZE" \
  "MacBook laptop (business hardware)"

# 13. network-equipment-setup - WAS: Pokemon wallpaper gaming monitor
#     NOW: Rackmount network switch with ethernet & fibre cables (Thomas Jensen)
download "$BLOG_DIR" "network-equipment-setup.jpg" \
  "photo-1520869562399-e772f042f422" "$BLOG_SIZE" \
  "Network switch with ethernet cables"

echo ""

# =============================================================================
# BLOG: Irrelevant subject replacements (4 images)
# =============================================================================
echo "--- Blog: Replacing irrelevant images (4) ---"

# 14. fresh-start-technology-upgrade - WAS: Alpine mountain landscape
#     NOW: Fresh clean workspace with laptop and plant
download "$BLOG_DIR" "fresh-start-technology-upgrade.jpg" \
  "photo-1524758631624-e2822e304c36" "$BLOG_SIZE" \
  "Fresh clean workspace with plants"

# 15. january-business-goals - WAS: "READ MORE" letter tiles
#     NOW: Notebook planner with pen on desk - goals/planning concept
download "$BLOG_DIR" "january-business-goals.jpg" \
  "photo-1484480974693-6ca0a78fb36b" "$BLOG_SIZE" \
  "Notepad with checklist/goals"

# 16. summer-office-productivity - WAS: mountains above clouds
#     NOW: Bright sunlit office workspace
download "$BLOG_DIR" "summer-office-productivity.jpg" \
  "photo-1497215842964-222b430dc094" "$BLOG_SIZE" \
  "Bright modern office workspace"

# 17. seasonal-business-continuity - WAS: Cappadocia hot air balloons
#     NOW: Server room infrastructure - business continuity concept
download "$BLOG_DIR" "seasonal-business-continuity.jpg" \
  "photo-1558494949-ef010cbdcc31" "$BLOG_SIZE" \
  "Server room infrastructure"

echo ""

# =============================================================================
# BLOG: Broken file replacements (3 images - were 29 bytes each)
# =============================================================================
echo "--- Blog: Replacing broken downloads (3) ---"

# 18. annual-it-strategy-review - BROKEN (newYear category)
#     NOW: Dashboard analytics on laptop screen (Luke Chesser)
download "$BLOG_DIR" "annual-it-strategy-review.jpg" \
  "photo-1460925895917-afdab827c52f" "$BLOG_SIZE" \
  "Analytics dashboard on screen"

# 19. easter-holiday-technology - BROKEN (easter category)
#     NOW: Naturally-dyed colourful Easter eggs in basket
download "$BLOG_DIR" "easter-holiday-technology.jpg" \
  "photo-1555748663-9f016d2c0b0a" "$BLOG_SIZE" \
  "Colourful Easter eggs in basket"

# 20. easter-spring-office - BROKEN (easter category)
#     NOW: Yellow daffodils - quintessentially UK spring
download "$BLOG_DIR" "easter-spring-office.jpg" \
  "photo-1492116837775-ddf9550b9546" "$BLOG_SIZE" \
  "Yellow daffodils (UK spring)"

echo ""

# =============================================================================
# INDUSTRY HEROES: Not-UK replacements (5 images)
# =============================================================================
echo "--- Industry Heroes: Replacing non-UK images (5) ---"

# 21. accountants-financial-services-hero - WAS: US IRS tax forms
#     NOW: Financial charts on paper - UK-neutral (Chris Liverani)
download "$HERO_DIR" "accountants-financial-services-hero.jpg" \
  "photo-1590283603385-17ffb3a7f29f" "$HERO_SIZE" \
  "Financial charts on paper"

# 22. financial-advisers-hero - WAS: same US IRS forms duplicate
#     NOW: Trading/finance screen with charts
download "$HERO_DIR" "financial-advisers-hero.jpg" \
  "photo-1611974789855-9c2a0a7236a3" "$HERO_SIZE" \
  "Financial trading charts on screen"

# 23. charities-non-profits-hero - WAS: Asian Para Games volunteer
#     NOW: Hands joined in circle - community/teamwork concept
download "$HERO_DIR" "charities-non-profits-hero.jpg" \
  "photo-1469571486292-0ba58a3f068b" "$HERO_SIZE" \
  "Hands joined in community circle"

# 24. healthcare-care-homes-hero - WAS: Spanish hospital (PISO 1)
#     NOW: Stethoscope on white surface - healthcare concept, no people/text
download "$HERO_DIR" "healthcare-care-homes-hero.jpg" \
  "photo-1584982751601-97dcc096659c" "$HERO_SIZE" \
  "Stethoscope on white surface"

# 25. hospitality-hero - WAS: Middle Eastern resort with palm trees
#     NOW: Boutique hotel room - classic British style, tufted sofa
download "$HERO_DIR" "hospitality-hero.jpg" \
  "photo-1590490360182-c33d57733427" "$HERO_SIZE" \
  "Boutique hotel room (British style)"

echo ""

# =============================================================================
# CASE STUDIES: Not-UK replacements (2 images)
# =============================================================================
echo "--- Case Studies: Replacing non-UK images (2) ---"

# 26. accountancy-practice-case-study - WAS: same US IRS forms (3rd duplicate)
#     NOW: Hands writing on documents - generic paperwork, no face
download "$CASE_DIR" "accountancy-practice-case-study.jpg" \
  "photo-1450101499163-c8848c66ca85" "$CASE_SIZE" \
  "Hands writing on documents"

# 27. community-trust-charity-case-study - WAS: same Asian Para Games duplicate
#     NOW: Hands together in circle - local community/teamwork concept
download "$CASE_DIR" "community-trust-charity-case-study.jpg" \
  "photo-1582213782179-e0d53f98f2ca" "$CASE_SIZE" \
  "Hands together in circle (community)"

echo ""

# =============================================================================
# TECH EXPLAINERS: Replacements (2 images)
# =============================================================================
echo "--- Tech Explainers: Replacing images (2) ---"

# 28. end-of-life-devices-hardware - WAS: RGB gaming PC build
#     NOW: Abandoned dusty beige CRT monitors and keyboards - e-waste
download "$TECH_DIR" "end-of-life-devices-hardware.jpg" \
  "photo-1728610996936-d93900f1886b" "$TECH_SIZE" \
  "Dusty old CRT monitors and keyboards"

# 29. ncsc-national-cyber-security - BROKEN
#     NOW: Padlock on keyboard - cybersecurity concept (different from existing)
download "$TECH_DIR" "ncsc-national-cyber-security.jpg" \
  "photo-1555949963-aa79dcee981c" "$TECH_SIZE" \
  "Cybersecurity padlock concept"

echo ""
echo "============================================="
echo "  Done! Downloaded 29 replacement images"
echo "============================================="
echo ""
echo "Next steps:"
echo "  1. Review the new images in unsplash-downloads/"
echo "  2. Any that aren't right can be manually swapped from unsplash.com"
echo "  3. Upload all images to Cloudinary"
echo "  4. Run: node scripts/update-image-urls.js"
echo ""
echo "Note: .old backup files were created for any replaced images."
echo "Delete them once you're happy: find unsplash-downloads -name '*.old' -delete"

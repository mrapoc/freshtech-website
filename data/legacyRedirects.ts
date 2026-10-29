// data/legacyRedirects.ts

/**
 * EXACT REDIRECTS
 * ---------------------
 * Specific old URLs mapped to specific new pages.
 * Useful for high-traffic pages like 'Contact Us' or specific landing pages.
 */
export const exactRedirects: Record<string, string> = {
    "/industries/engineering": "/industries/manufacturing",
    "/industries/legal": "/industries/solicitors",
    // Common WordPress Paths
    "/news": "/blog",
    "/latest-news": "/blog",
    "/category/blog": "/blog",
    "/feed": "/blog", 
    "/rss": "/blog",
    "/atom": "/blog",
    
    // Core Pages from Old Site
    "/about-us": "/about",
    "/contact-us": "/contact",
    "/our-team": "/about",
    "/testimonials": "/about",
    "/reviews": "/about",
    "/home": "/",
    
    // Legal
    "/privacy": "/privacy-policy",
    "/terms-and-conditions": "/terms-conditions",

    // Specific Service Mappings (targets mirror netlify.toml edge redirects)
    "/technology-projects": "/technology",
    "/cyber-security-services": "/services/cybersecurity",
    "/managed-print-solutions": "/services/managed-print",
    
    // Location & Area Mappings (targets mirror netlify.toml edge redirects)
    "/service-area": "/about", // Fallback for general area map
    "/service-area/it-support-in-shropshire": "/it-support-shropshire",
    "/service-area/it-support-in-ludlow": "/it-support-ludlow",
    "/service-area/it-support-in-hereford": "/it-support-hereford",
    "/service-area/it-support-in-telford": "/it-support-telford",
    "/it-support-craven-arms": "/locations/craven-arms",
    "/it-support-in-craven-arms": "/locations/craven-arms",
    "/it-support-leominster": "/locations/leominster",
    "/it-support-in-leominster": "/locations/leominster",
    "/it-support-church-stretton": "/locations/church-stretton",
    "/it-support-bridgnorth": "/locations/bridgnorth",
    "/it-support-in-bridgnorth": "/locations/bridgnorth",
    "/ludlow": "/locations/ludlow",
    "/shrewsbury": "/locations/shrewsbury",
    "/hereford": "/locations/hereford",
    "/telford": "/locations/telford",
    "/leominster": "/locations/leominster",

    // Case Studies
    "/heroic-it-feats": "/case-studies",
    "/portfolio": "/case-studies",
    "/projects": "/case-studies",

    // --- SEO: High Value Blog Mappings ---
    // Mapping old content to specific new articles where relevant
    
    // Business Premium
    "/2025/unleash-the-ultimate-power-with-microsoft-365-business-premium": "/blog/microsoft-365-business-premium",
    
    // Password Security (Map all historic password posts to the new guide)
    "/2024/why-you-need-a-password-manager": "/blog/password-security-tips",
    "/2023/its-time-to-say-bye-to-traditional-passwords": "/blog/password-security-tips",
    "/2023/longpasswordisntkeepingyouprotected": "/blog/password-security-tips",
    "/2022/when-can-you-finally-say-goodbye-to-your-password": "/blog/password-security-tips",

    // Cyber Security General -> Cyber Essentials Guide
    "/2024/protect-business-shropshire-herefordshire-cyber-security": "/blog/cyber-essentials-explained",
    "/2024/reporting-security-issues-shropshire": "/blog/cyber-essentials-explained",
    
    // Windows 11/Modernization -> Services
    "/2024/say-goodbye-to-windows-10-free-shropshire-business-guide": "/services/hardware-procurement",
    "/2024/windows-11-update-for-shropshire-businesses": "/services/hardware-procurement",
    
    // AI -> Blog Index (until AI specific post is written)
    "/2023/unleash-the-power-of-ai-elevate-your-business-with-chatgpt-and-bard": "/blog",

    // --- WordPress Admin/Security Paths (redirect to home to avoid 404s in logs) ---
    "/wp-admin": "/",
    "/wp-login.php": "/",
    "/wp-login": "/",
    "/admin": "/",
    "/login": "/contact",
    "/wp-content": "/",
    "/wp-includes": "/",
    "/xmlrpc.php": "/",
    "/wp-json": "/",
    "/.env": "/",
    "/wp-config.php": "/",

    // --- Additional Old Site Service Pages ---
    "/it-support": "/services/managed-it-support",
    "/managed-services": "/services/managed-it-support",
    "/cloud-services": "/services/cloud-solutions",
    "/cloud-computing": "/services/cloud-solutions",
    "/office-365": "/microsoft-business-premium",
    "/microsoft-365": "/microsoft-business-premium",
    "/hardware": "/services/hardware-procurement",
    "/laptops": "/services/hardware-procurement",
    "/computers": "/services/hardware-procurement",
    "/networking": "/services/strategic-projects",
    "/office-moves": "/services/strategic-projects",
    "/voip": "/services",
    "/telecoms": "/services",

    // --- Onboarding aliases ---
    "/switching": "/onboarding",
    "/switch-provider": "/onboarding",
    "/getting-started": "/onboarding",
    "/new-client": "/onboarding",
};

/**
 * PREFIX REDIRECTS
 * -----------------
 * Catches any URL starting with these strings.
 * Order matters less here as we check for best match, but generally keep them distinct.
 */
export const prefixRedirects: Record<string, string> = {
    // Old Blog Structures
    "/news/": "/blog",
    "/updates/": "/blog",
    "/articles/": "/blog",
    "/category/": "/blog",
    "/tag/": "/blog",
    
    // XML Data (Testimonials) -> Redirect to About Page
    "/the7_reviews/": "/about",
    
    // Old Portfolio/Cases
    "/case-studies/": "/case-studies",
    "/portfolio/": "/case-studies",
    "/projects/": "/case-studies"
};

/**
 * REGEX PATTERNS
 * --------------
 * For catching dynamic patterns like /2023/my-post-title
 */
export const regexRedirects: { pattern: RegExp, to: string }[] = [
    // Matches /YYYY/anything (e.g. /2024/my-blog-post) -> Redirect to Blog
    // This acts as the "Catch All" for any blog post not specifically mapped above
    { pattern: /^\/\d{4}\/.*$/, to: "/blog" }
];
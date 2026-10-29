const UK_TIME_ZONE = 'Europe/London';
const ISSUE_EPOCH = Date.UTC(2023, 8, 14);

export function mastheadIssue(now) {
  return Math.max(1, Math.floor((now.getTime() - ISSUE_EPOCH) / 604_800_000) + 1);
}

export function mastheadLabels(now) {
  return {
    day: new Intl.DateTimeFormat('en-GB', { weekday: 'short', timeZone: UK_TIME_ZONE }).format(now),
    month: new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric', timeZone: UK_TIME_ZONE }).format(now),
    issue: mastheadIssue(now),
  };
}

const COUNTY_SHORT_LABELS = {
  Shropshire: 'Shropshire',
  Herefordshire: 'Herefordshire',
  Worcestershire: 'Worcestershire',
  Powys: 'Powys',
};

export function countyShortLabel(county) {
  return COUNTY_SHORT_LABELS[county] ?? county;
}

export function homepageCaseStudies(caseStudies) {
  return caseStudies.slice(0, 3).map(study => ({
    client: study.client,
    industry: study.industry,
    title: study.title,
    outcome: study.outcome,
    href: `/case-studies/${study.slug}`,
    badge: study.shortStats?.victory ?? study.result ?? 'Win',
    label: study.shortStats?.strategy ?? study.result ?? 'Outcome',
  }));
}

export function homepagePricing(tiers, pricing) {
  return tiers.map(tier => {
    const rate = pricing?.rates?.[tier.name];
    if (!Number.isFinite(rate) || rate < 0) throw new Error(`Missing validated homepage rate for ${tier.name}`);
    return { ...tier, rate };
  });
}

export function featuredTestimonial(caseStudies) {
  const study = caseStudies.find(item => item.slug === 'food-production-uptime') ?? caseStudies.find(item => item.testimonial);
  if (!study?.testimonial) return null;
  const initials = (study.contactName || study.client).split(/\s+/).slice(0, 2).map(word => word[0]).join('').toUpperCase().slice(0, 2);
  return { quote: study.testimonial, attribution: `${study.contactName || study.client} · ${study.client}`, initials, href: `/case-studies/${study.slug}` };
}

import { sharedSchemas, siteTitle } from './service-seo.mjs';
import { indexRobots } from './blog-seo.mjs';

// Head contract for /team/:slug, following components/SEO.tsx as called by
// pages/AuthorPage.tsx:
// <SEO title={`${name} - ${role}`} description={extendedBio.slice(0, 155) + '...'}
//      image={imgUnmasked} type="profile" schema={personSchema}
//      breadcrumbs={[Home /, About /about, name /team/slug]} />
// The explicit schema replaces the profile default, so the graph is
// [Person, Organization, BreadcrumbList]; og:type is profile.
const baseUrl = 'https://fresh-tech.uk';

export const teamCanonical = slug => `${baseUrl}/team/${slug}`;
// `author.extendedBio?.slice(0, 155) + '...' || author.bio`: the concatenation
// is always truthy, so the bio fallback never applies.
export const teamDescription = member => `${member.extendedBio.slice(0, 155)}...`;

export function personSchema(member) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: member.name,
    jobTitle: member.role,
    description: member.extendedBio,
    image: member.imgUnmasked,
    url: teamCanonical(member.slug),
    worksFor: { '@type': 'Organization', name: 'Fresh Tech IT Support', url: baseUrl },
    knowsAbout: member.expertise,
    ...(member.linkedin && { sameAs: [member.linkedin] }),
  };
}

export function teamSeo(member) {
  const rawTitle = `${member.name} - ${member.role}`;
  const canonical = teamCanonical(member.slug);
  const { organization } = sharedSchemas();
  return {
    title: siteTitle(rawTitle), rawTitle,
    description: teamDescription(member), canonical, image: member.imgUnmasked,
    ogType: 'profile', robots: indexRobots,
    schemas: [
      personSchema(member),
      organization,
      {
        '@context': 'https://schema.org', '@type': 'BreadcrumbList',
        itemListElement: [['Home', `${baseUrl}/`], ['About', `${baseUrl}/about`], [member.name, canonical]].map(([name, item], index) => ({ '@type': 'ListItem', position: index + 1, name, item })),
      },
    ],
  };
}

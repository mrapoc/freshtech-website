import React from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { teamMembers, blogPosts } from '../data/content';
import { isHeld } from '../data/editorialHolds';
import { SEO } from '../components/SEO';
import { SmartImage } from '../components/SmartImage';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { Linkedin, Calendar, Clock, ArrowRight, Shield, Cpu, Cloud, Wrench } from 'lucide-react';
import { calculateReadingTime, formatReadingTime } from '../components/ReadingTime';

// Icon mapping for expertise areas
const expertiseIcons: Record<string, React.ElementType> = {
  'Strategic IT Planning': Shield,
  'Cybersecurity': Shield,
  'Microsoft 365': Cloud,
  'Business Continuity': Shield,
  'Infrastructure': Cpu,
  'Networking': Cpu,
  'Hardware': Wrench,
  'Troubleshooting': Wrench
};

// Helper to check if post date is in the future (scheduled post)
const isFuturePost = (dateString: string): boolean => {
  const postDate = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return postDate > today;
};

export const AuthorPage = () => {
  const { slug } = useParams();
  const author = teamMembers.find(m => m.slug === slug);

  if (!author) {
    return <Navigate to="/about" replace />;
  }

  // Get all published posts by this author
  const authorPosts = blogPosts
    .filter(post => post.author === author.shortName && !isHeld(post.slug) && !isFuturePost(post.date))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Person schema for SEO
  const personSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": author.name,
    "jobTitle": author.role,
    "description": author.extendedBio,
    "image": author.imgUnmasked,
    "url": `https://fresh-tech.uk/team/${author.slug}`,
    "worksFor": {
      "@type": "Organization",
      "name": "Fresh Tech IT Support",
      "url": "https://fresh-tech.uk"
    },
    "knowsAbout": author.expertise,
    ...(author.linkedin && { "sameAs": [author.linkedin] })
  };

  return (
    <div className="bg-white">
      <SEO
        title={`${author.name} - ${author.role}`}
        description={author.extendedBio?.slice(0, 155) + '...' || author.bio}
        image={author.imgUnmasked}
        type="profile"
        slug={`/team/${author.slug}`}
        schema={personSchema}
        breadcrumbs={[
          { name: "Home", item: "/" },
          { name: "About", item: "/about" },
          { name: author.name, item: `/team/${author.slug}` }
        ]}
      />

      {/* Hero Section */}
      <section className="bg-neutral text-white py-16 relative overflow-hidden">
        {/* Comic background pattern */}
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(#2B7AB1 2px, transparent 2px)', backgroundSize: '20px 20px' }}>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <Breadcrumbs
            items={[
              { label: 'About', href: '/about' },
              { label: author.name }
            ]}
            variant="light"
            className="mb-8"
          />

          <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
            {/* Author Image */}
            <div className="w-48 h-48 md:w-64 md:h-64 rounded-2xl overflow-hidden border-4 border-highlight shadow-2xl shrink-0">
              <SmartImage
                src={author.imgUnmasked}
                alt={author.name}
                className="w-full h-full object-cover object-top"
              />
            </div>

            {/* Author Info */}
            <div className="text-center md:text-left">
              <div className="inline-block bg-accent text-neutral text-xs font-bold px-3 py-1 rounded-full mb-4">
                {author.power}
              </div>
              <h1 className="font-heading text-4xl md:text-5xl text-highlight mb-2">
                {author.name}
              </h1>
              <p className="text-xl text-accent font-bold mb-4">{author.role}</p>

              <p className="text-gray-300 max-w-2xl leading-relaxed mb-6">
                {author.extendedBio || author.bio}
              </p>

              {/* Expertise Tags */}
              {author.expertise && (
                <div className="flex flex-wrap gap-2 justify-center md:justify-start mb-6">
                  {author.expertise.map((skill, idx) => {
                    const Icon = expertiseIcons[skill] || Shield;
                    return (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 bg-white/10 text-white text-sm px-3 py-1.5 rounded-full"
                      >
                        <Icon size={14} />
                        {skill}
                      </span>
                    );
                  })}
                </div>
              )}

              {/* LinkedIn Link */}
              {author.linkedin && (
                <a
                  href={author.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-[#0077b5] text-white px-4 py-2 rounded-lg font-bold hover:bg-[#006699] transition-colors"
                >
                  <Linkedin size={18} />
                  Connect on LinkedIn
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Articles Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="font-heading text-3xl text-neutral mb-8">
            Articles by {author.shortName}
            <span className="text-gray-400 text-lg font-normal ml-2">({authorPosts.length})</span>
          </h2>

          {authorPosts.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {authorPosts.map((post) => (
                <Link
                  key={post.id}
                  to={`/blog/${post.slug}`}
                  className="group bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-primary/30"
                >
                  <div className="aspect-video overflow-hidden bg-gray-100">
                    <SmartImage
                      src={post.image}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-5">
                    <div className="flex flex-wrap gap-2 mb-3">
                      {post.tags?.slice(0, 2).map(tag => (
                        <span
                          key={tag}
                          className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <h3 className="font-heading text-lg text-neutral group-hover:text-primary transition-colors line-clamp-2 mb-2">
                      {post.title}
                    </h3>
                    <p className="text-sm text-gray-500 line-clamp-2 mb-4">{post.excerpt}</p>

                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Calendar size={12} />
                          {post.date}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {formatReadingTime(calculateReadingTime(post.content))}
                        </span>
                      </div>
                      <span className="text-primary font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">
                        Read <ArrowRight size={12} />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-xl">
              <p className="text-gray-500">No articles published yet.</p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4 text-center">
          <h3 className="font-heading text-2xl text-neutral mb-4">Want to work with {author.shortName}?</h3>
          <p className="text-gray-600 mb-6 max-w-xl mx-auto">
            Get in touch to discuss how Fresh Tech can help your business with IT support, cybersecurity, and technology strategy.
          </p>
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-lg font-bold hover:bg-primary-dark transition-colors"
          >
            Get in Touch
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </div>
  );
};

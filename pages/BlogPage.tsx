import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { blogPosts } from '../data/content';
import { ArrowRight, Filter, Flame, Mail, BookOpen, Clock } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { SEO } from '../components/SEO';
import { SmartImage } from '../components/SmartImage';

// Helper to check if a post date is in the future
const isFuturePost = (dateString: string): boolean => {
  const postDate = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Compare dates only, not times
  return postDate > today;
};

export const BlogPage = () => {
  const [activeCategory, setActiveCategory] = useState<string>('All');

  // Filter out future posts for public display
  const publishedPosts = useMemo(() => {
    return blogPosts.filter(post => !isFuturePost(post.date));
  }, []);

  // Extract unique categories from published posts only
  const categories = useMemo(() => {
    const allTags = publishedPosts.flatMap(post => post.tags || []);
    return ['All', ...Array.from(new Set(allTags))];
  }, [publishedPosts]);

  // Sort posts by date (newest first)
  const sortedPosts = useMemo(() => {
    return [...publishedPosts].sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateB - dateA;
    });
  }, [publishedPosts]);

  // Featured post (most recent)
  const featuredPost = sortedPosts[0];

  // Popular posts (could be based on tags or manually curated - using security-related for now)
  const popularPosts = useMemo(() => {
    return sortedPosts
      .filter(post => post.tags?.some(tag => ['Security', 'Cyber Essentials', 'Microsoft 365'].includes(tag)))
      .slice(0, 3);
  }, [sortedPosts]);

  // Filter and Sort Logic for main grid
  const filteredPosts = useMemo(() => {
    let posts = sortedPosts.slice(1); // Exclude featured post

    // Filter by Category
    if (activeCategory !== 'All') {
      posts = posts.filter(post => post.tags && post.tags.includes(activeCategory));
    }

    return posts;
  }, [activeCategory, sortedPosts]);

  // ItemList schema for blog listing
  const blogListSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Fresh Tech Blog - IT Tips & Cybersecurity News",
    "description": "IT tips, cybersecurity news and updates from the Fresh Tech team.",
    "url": "https://fresh-tech.uk/blog",
    "mainEntity": {
      "@type": "ItemList",
      "itemListElement": sortedPosts.slice(0, 10).map((post, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "url": `https://fresh-tech.uk/blog/${post.slug}`,
        "name": post.title
      }))
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <SEO
        title="Blog - IT Tips & Cybersecurity News"
        description="IT tips, cybersecurity news and updates from the Fresh Tech team. Learn about Cyber Essentials, Microsoft 365, password security, and more."
        schema={blogListSchema}
      />

      <PageHeader
        title="Latest News & Tips"
        subtitle="Tech tips, industry news, and occasional superhero puns from the Fresh Tech Gazette."
        highlightText="The Gazette"
      />

      <div className="container mx-auto px-4 py-12">

        {/* Featured Post - Hero Style */}
        {featuredPost && (
          <section className="mb-16">
            <div className="flex items-center gap-2 text-accent font-bold text-sm uppercase tracking-wider mb-4">
              <Flame size={18} />
              Latest Article
            </div>
            <Link to={`/blog/${featuredPost.slug}`} className="group block">
              <div className="grid lg:grid-cols-2 gap-8 bg-white rounded-3xl overflow-hidden shadow-xl border border-gray-100 hover:shadow-2xl transition-shadow">
                <div className="h-64 lg:h-auto lg:aspect-4/3 overflow-hidden">
                  <SmartImage
                    src={featuredPost.image}
                    alt={featuredPost.title}
                    width={800}
                    height={600}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-8 lg:p-12 flex flex-col justify-center">
                  <div className="flex flex-wrap gap-2 mb-4">
                    {featuredPost.tags?.map(tag => (
                      <span key={tag} className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full font-bold uppercase">{tag}</span>
                    ))}
                  </div>
                  <h2 className="font-heading text-3xl lg:text-4xl text-neutral mb-4 group-hover:text-primary transition-colors">
                    {featuredPost.title}
                  </h2>
                  <p className="text-gray-600 mb-6 text-lg line-clamp-3">{featuredPost.excerpt}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>{featuredPost.date}</span>
                      <span className="flex items-center gap-1"><Clock size={14} /> {featuredPost.readTime}</span>
                    </div>
                    <span className="inline-flex items-center font-bold text-primary group-hover:translate-x-2 transition-transform">
                      Read Article <ArrowRight size={18} className="ml-2" />
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          </section>
        )}

        {/* Popular Posts Sidebar + Main Grid */}
        <div className="grid lg:grid-cols-4 gap-12">

          {/* Sidebar */}
          <aside className="lg:col-span-1 space-y-8">
            {/* Popular Posts */}
            <div className="bg-white p-6 rounded-2xl shadow-xs border border-gray-100">
              <h3 className="font-heading text-xl text-neutral mb-4 flex items-center gap-2">
                <BookOpen size={20} className="text-primary" />
                Popular Reads
              </h3>
              <div className="space-y-4">
                {popularPosts.map((post, idx) => (
                  <Link
                    key={post.id}
                    to={`/blog/${post.slug}`}
                    className="flex gap-3 group"
                  >
                    <span className="text-2xl font-heading text-primary/30 group-hover:text-primary transition-colors">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <div>
                      <h4 className="font-bold text-sm text-neutral group-hover:text-primary transition-colors leading-tight">
                        {post.title}
                      </h4>
                      <p className="text-xs text-gray-500 mt-1">{post.readTime}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Newsletter CTA */}
            <div className="bg-primary text-white p-6 rounded-2xl">
              <Mail size={32} className="mb-4 text-highlight" />
              <h3 className="font-heading text-xl mb-2">Stay Updated</h3>
              <p className="text-blue-100 text-sm mb-4">
                Get IT tips and security alerts straight to your inbox. No spam, just useful stuff.
              </p>
              <Link
                to="/contact"
                className="block w-full bg-white text-primary text-center py-3 rounded-lg font-bold hover:bg-highlight hover:text-neutral transition-colors"
              >
                Subscribe
              </Link>
            </div>

            {/* Category Descriptions */}
            <div className="bg-gray-100 p-6 rounded-2xl">
              <h3 className="font-heading text-lg text-neutral mb-3">Browse Topics</h3>
              <ul className="space-y-2 text-sm">
                <li><span className="font-bold text-primary">Security:</span> Cyber threats, MFA, password tips</li>
                <li><span className="font-bold text-primary">Cyber Essentials:</span> Certification guides</li>
                <li><span className="font-bold text-primary">Microsoft 365:</span> Licensing, productivity</li>
                <li><span className="font-bold text-primary">WiFi:</span> Network setup, VLANs</li>
              </ul>
            </div>
          </aside>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Category Filter */}
            <div className="flex flex-wrap gap-2 mb-8">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-2 rounded-full text-sm font-bold transition-all border-2 ${
                    activeCategory === cat
                      ? 'bg-primary text-white border-primary shadow-md'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-primary hover:text-primary'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Blog Grid */}
            {filteredPosts.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-8">
                {filteredPosts.map((post) => (
                  <article key={post.id} className="bg-white rounded-2xl overflow-hidden border-2 border-gray-100 shadow-lg hover:shadow-comic hover:border-neutral transition-all duration-300 flex flex-col h-full">
                    <div className="h-48 overflow-hidden bg-gray-200 relative">
                      <SmartImage
                        src={post.image}
                        alt={post.title}
                        width={600}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    </div>
                    <div className="p-6 flex flex-col grow">
                      <div className="flex justify-between items-center text-xs text-gray-500 font-bold uppercase mb-3">
                        <span>{post.date}</span>
                        <span>{post.readTime}</span>
                      </div>
                      <h2 className="font-heading text-2xl mb-3 text-neutral leading-tight hover:text-primary transition-colors">
                        <Link to={`/blog/${post.slug}`}>{post.title}</Link>
                      </h2>
                      <p className="text-gray-600 mb-6 grow line-clamp-3">{post.excerpt}</p>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {post.tags?.slice(0, 2).map(tag => (
                          <span key={tag} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-1 rounded-sm font-bold uppercase">{tag}</span>
                        ))}
                      </div>

                      <Link to={`/blog/${post.slug}`} className="inline-flex items-center font-bold text-primary hover:text-accent transition-colors mt-auto">
                        Read Article <ArrowRight size={16} className="ml-2" />
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 text-gray-500 bg-white rounded-2xl">
                <Filter size={48} className="mx-auto mb-4 opacity-20" />
                <p className="text-xl font-heading">No posts found in this category.</p>
                <button onClick={() => setActiveCategory('All')} className="text-primary font-bold mt-2 hover:underline">View all posts</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

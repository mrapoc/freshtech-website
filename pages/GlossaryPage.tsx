import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { techDefinitions } from '../data/content';
import { Contact } from '../components/Contact';
import { SEO } from '../components/SEO';
import { Search, ShieldAlert, Lock, Activity, List, Smartphone, CheckCircle, Shield, Cloud, Wifi, Key, Monitor, Eye, Cpu, Server, Database, Zap, Globe, Mail, FileCheck, RefreshCw, Network, Users, BadgeCheck, Laptop, ShieldCheck, FileWarning, BookOpen } from 'lucide-react';
import { Breadcrumbs } from '../components/Breadcrumbs';

export const GlossaryPage = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const iconMap: Record<string, React.ElementType> = {
    ShieldAlert, Lock, Activity, List, Smartphone, CheckCircle, Shield, Cloud,
    Wifi, Key, Monitor, Eye, Cpu, Server, Database, Zap, Globe, Mail, FileCheck, RefreshCw, Search,
    Network, Users, BadgeCheck, Laptop, ShieldCheck, FileWarning, BookOpen
  };

  const filteredDefinitions = useMemo(() => {
    if (!searchTerm.trim()) return techDefinitions;
    const term = searchTerm.toLowerCase();
    return techDefinitions.filter(def =>
      def.term.toLowerCase().includes(term) ||
      def.question.toLowerCase().includes(term) ||
      def.risk.toLowerCase().includes(term) ||
      def.reward.toLowerCase().includes(term)
    );
  }, [searchTerm]);

  const glossarySchema = {
    "@context": "https://schema.org",
    "@type": "DefinedTermSet",
    "name": "IT Glossary - Jargon-Free Technology Guide",
    "description": "Plain English explanations of common IT and cybersecurity terms. No jargon, no fluff - just clear answers to help you understand your business technology.",
    "hasDefinedTerm": techDefinitions.map(def => ({
      "@type": "DefinedTerm",
      "name": def.term,
      "description": def.reward
    }))
  };

  return (
    <>
      <SEO
        title="IT Glossary - Jargon-Free Technology Guide | Fresh Tech"
        description="Plain English explanations of common IT and cybersecurity terms. EDR, RMM, MDM, SIEM - decoded without the jargon. Your guide to understanding business technology."
        canonical="https://fresh-tech.uk/glossary"
        schema={[glossarySchema]}
      />

      {/* Hero */}
      <section className="bg-linear-to-br from-primary via-primary to-secondary text-white pt-32 pb-20">
        <div className="container max-w-4xl mx-auto px-4">
          <Breadcrumbs
            items={[
              { label: 'Resources', href: '/resources' },
              { label: 'IT Glossary' }
            ]}
            variant="light"
          />
          <h1 className="text-4xl md:text-5xl font-black mb-6 leading-tight">IT Glossary</h1>
          <p className="text-xl text-gray-200 mb-8 leading-relaxed">
            Technology is full of acronyms and jargon. We believe you shouldn't need a computer science degree to understand what your IT company is talking about. Here's our plain English guide to the terms that matter for your business.
          </p>

          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search terms..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-300 focus:outline-hidden focus:ring-2 focus:ring-accent focus:bg-white/15"
            />
          </div>
        </div>
      </section>

      {/* Definitions Grid */}
      <section className="py-16 bg-white">
        <div className="container max-w-6xl mx-auto px-4">
          {filteredDefinitions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No terms match "{searchTerm}". Try a different search.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDefinitions.map((def, index) => {
                const IconComponent = iconMap[def.icon] || Shield;
                return (
                  <div key={index} className="bg-gray-50 rounded-2xl p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                        <IconComponent className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-gray-900">{def.term}</h3>
                        <p className="text-sm text-accent font-medium">{def.question}</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="bg-red-50 border border-red-100 rounded-lg p-3">
                        <p className="text-sm text-red-800">
                          <span className="font-semibold">The risk:</span> {def.risk}
                        </p>
                      </div>
                      <div className="bg-green-50 border border-green-100 rounded-lg p-3">
                        <p className="text-sm text-green-800">
                          <span className="font-semibold">What we do:</span> {def.reward}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Deep Dive CTA */}
      <section className="py-16 bg-gray-50">
        <div className="container max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4 text-primary">Want to Go Deeper?</h2>
          <p className="text-gray-600 text-lg mb-8">
            Each of these technologies has a dedicated explainer page with detailed information on how it works, why it matters, and how we deploy it for your business.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/technology"
              className="bg-primary hover:bg-primary/90 text-white font-bold px-8 py-4 rounded-lg transition-all hover:scale-105 shadow-lg"
            >
              Browse Technology Explainers
            </Link>
            <Link
              to="/contact"
              className="bg-accent text-neutral font-bold px-8 py-4 rounded-lg shadow-comic border-2 border-neutral hover:shadow-comic-hover hover:translate-y-[2px] transition-all"
            >
              Ask Us a Question
            </Link>
          </div>
        </div>
      </section>

      <Contact />
    </>
  );
};

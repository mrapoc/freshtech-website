import React, { memo } from 'react';
import { Shield, Lock, Cpu, Rocket, FileText, Cloud, BadgeCheck, Database, Phone, Wifi, Cable, Printer, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { services } from '../data/content';
import { useInView } from '../hooks/useInView';

// Icon config: component, text color, bg color, ring color, top accent
const iconConfig: Record<string, { Icon: React.ElementType; text: string; bg: string; ring: string; accent: string }> = {
  Shield:     { Icon: Shield,     text: 'text-blue-700',   bg: 'bg-blue-50',    ring: 'ring-blue-700/20',   accent: 'bg-blue-500' },
  Lock:       { Icon: Lock,       text: 'text-amber-600',  bg: 'bg-amber-50',   ring: 'ring-amber-600/20',  accent: 'bg-amber-500' },
  Cpu:        { Icon: Cpu,        text: 'text-indigo-600', bg: 'bg-indigo-50',  ring: 'ring-indigo-600/20', accent: 'bg-indigo-500' },
  Rocket:     { Icon: Rocket,     text: 'text-rose-600',   bg: 'bg-rose-50',    ring: 'ring-rose-600/20',   accent: 'bg-rose-500' },
  FileText:   { Icon: FileText,   text: 'text-green-600',  bg: 'bg-green-50',   ring: 'ring-green-600/20',  accent: 'bg-green-500' },
  Cloud:      { Icon: Cloud,      text: 'text-sky-600',    bg: 'bg-sky-50',     ring: 'ring-sky-600/20',    accent: 'bg-sky-500' },
  BadgeCheck: { Icon: BadgeCheck,  text: 'text-amber-600',  bg: 'bg-amber-50',   ring: 'ring-amber-600/20',  accent: 'bg-amber-500' },
  Database:   { Icon: Database,   text: 'text-blue-600',   bg: 'bg-blue-50',    ring: 'ring-blue-600/20',   accent: 'bg-blue-500' },
  Phone:      { Icon: Phone,      text: 'text-green-600',  bg: 'bg-green-50',   ring: 'ring-green-600/20',  accent: 'bg-green-500' },
  Wifi:       { Icon: Wifi,       text: 'text-cyan-600',   bg: 'bg-cyan-50',    ring: 'ring-cyan-600/20',   accent: 'bg-cyan-500' },
  Cable:      { Icon: Cable,      text: 'text-orange-600', bg: 'bg-orange-50',  ring: 'ring-orange-600/20', accent: 'bg-orange-500' },
  Printer:    { Icon: Printer,    text: 'text-purple-600', bg: 'bg-purple-50',  ring: 'ring-purple-600/20', accent: 'bg-purple-500' },
};

export const Services = memo(function Services() {
  const [ref, isInView] = useInView(0.05);

  return (
    <section ref={ref as React.RefObject<HTMLElement>} id="services" className="py-20 bg-white relative">
      <div className="container mx-auto px-4">
        <div className={`text-center mb-16 transition-all duration-700 ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h2 className="font-heading text-4xl md:text-5xl text-primary-dark mb-4">Our Superpowers</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">Everything you need to keep your business flying high, secure, and productive.</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service, index) => {
            const config = iconConfig[service.icon as string] || iconConfig.Shield;
            const IconComponent = config.Icon;
            return (
              <Link
                key={index}
                to={`/services/${service.slug}`}
                className={`group relative bg-white p-8 rounded-2xl border-2 border-gray-100 shadow-sm hover:shadow-comic hover:border-neutral hover:-translate-y-2 transition-all duration-500 flex flex-col overflow-hidden focus:outline-hidden focus-visible:ring-2 focus-visible:ring-primary ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
                style={{ transitionDelay: `${150 + index * 75}ms` }}
                aria-label={`${service.title} - See how it works`}
              >
                {/* Top accent bar */}
                <div className={`absolute top-0 left-0 right-0 h-1 ${config.accent} opacity-60 group-hover:opacity-100 transition-opacity`} />

                {/* Hover arrow */}
                <ArrowRight className="absolute top-6 right-6 w-5 h-5 text-gray-300 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />

                <div className={`mb-6 w-14 h-14 rounded-xl flex items-center justify-center ${config.bg} ring-2 ring-inset ${config.ring} group-hover:scale-110 transition-transform duration-300`}>
                  <IconComponent size={28} className={config.text} />
                </div>
                <h3 className="font-heading text-2xl mb-3 text-neutral">{service.title}</h3>
                <p className="text-gray-600 mb-6 leading-relaxed grow">{service.desc}</p>
                <span className="text-primary-dark font-bold group-hover:text-accent flex items-center gap-2 mt-auto">
                  See how it works <span className="group-hover:translate-x-1 transition-transform">→</span>
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
});
import React, { useState, memo } from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, Video, ArrowRight } from 'lucide-react';
import { ContactForm } from './ContactForm';
import { contactDetails } from '../data/content';
import { ObfuscatedEmail } from './ObfuscatedEmail';
import { CalendlyModal } from './CalendlyModal';
import { trackPhoneClick, trackCalendlyOpen } from '../utils/analytics';
import { useInView } from '../hooks/useInView';

export const Contact = memo(function Contact() {
  const [ref, isInView] = useInView(0.05);
  const [isCalendlyOpen, setIsCalendlyOpen] = useState(false);

  return (
    <section ref={ref as React.RefObject<HTMLElement>} id="contact" className="py-20 bg-tertiary/30 relative overflow-hidden">
      <CalendlyModal isOpen={isCalendlyOpen} onClose={() => setIsCalendlyOpen(false)} />
      <div className="absolute top-0 right-0 w-64 h-64 bg-accent rounded-full mix-blend-multiply filter blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2"></div>
      
      <div className="container mx-auto px-4">
        <div className={`bg-white rounded-3xl shadow-xl border-4 border-neutral overflow-hidden flex flex-col lg:flex-row transition-all duration-700 ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
          
          {/* Left Side: Info */}
          <div className="p-8 lg:p-12 lg:w-1/2 flex flex-col justify-center">
            <h2 className="font-heading text-4xl text-primary mb-6">Signal for Help</h2>
            <p className="text-gray-600 mb-4 text-lg">
              Ready to banish tech headaches? Fill out the form or book a chat directly.
              We respond faster than a speeding bullet (usually under 15 minutes).
            </p>
            <p className="text-sm text-green-700 bg-green-50 px-3 py-2 rounded-lg mb-4 inline-block border border-green-200">
              ✓ Trusted by local businesses for over 10 years
            </p>
            <p className="text-sm text-gray-600 mb-8">
              <Link to="/onboarding" className="text-primary-dark hover:text-primary underline inline-flex items-center gap-1 font-medium">
                Thinking of switching providers? See how easy it is <ArrowRight size={14} />
              </Link>
            </p>

            <div className="space-y-6 mb-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-secondary/20 rounded-full flex items-center justify-center text-primary">
                  <Phone size={24} />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-500 uppercase">Call The Batphone</p>
                  <a
                    href={`tel:${contactDetails.phone.replace(/\s/g, '')}`}
                    className="text-2xl font-bold text-neutral hover:text-accent"
                    onClick={() => trackPhoneClick(contactDetails.phone, 'contact_section')}
                  >
                    {contactDetails.phone}
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-secondary/20 rounded-full flex items-center justify-center text-primary">
                  <Mail size={24} />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-500 uppercase">Email HQ</p>
                  <ObfuscatedEmail className="text-xl font-bold text-neutral hover:text-accent" label="hello@fresh-tech.uk" />
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-highlight/20 rounded-full flex items-center justify-center text-neutral">
                   <Video size={24} />
                </div>
                <div>
                   <p className="text-sm font-bold text-gray-500 uppercase">Face-to-Face</p>
                   <button
                      onClick={() => {
                        trackCalendlyOpen();
                        setIsCalendlyOpen(true);
                      }}
                      className="text-xl font-bold text-neutral hover:text-accent text-left"
                   >
                      Book an Intro Call with Sam
                   </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side: Form */}
          <div className="bg-gray-50 p-8 lg:p-12 lg:w-1/2 border-t-4 lg:border-t-0 lg:border-l-4 border-neutral">
             <ContactForm />
          </div>

        </div>
      </div>
    </section>
  );
});

import React, { useState } from 'react';
import { BookOpen, Truck, Download, Shield } from 'lucide-react';
import { BookRequestModal } from './BookRequestModal';
import { useInView } from '../hooks/useInView';

export const BuyersGuideCta = () => {
  const [ref, isInView] = useInView(0.1);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Basic Bot Protection: We don't expose the href in the DOM until click
  // and we use a handler to force a download.
  const handleDownload = (e: React.MouseEvent) => {
    e.preventDefault();
    // Create a temporary link and click it
    const link = document.createElement('a');
    link.href = '/assets/FreshTech-Buyers-Guide.pdf';
    link.download = 'FreshTech-Buyers-Guide.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <BookRequestModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      
      <section ref={ref as React.RefObject<HTMLElement>} className="py-20 bg-white relative overflow-hidden">
        <div className="container mx-auto px-4">
           <div className={`bg-neutral rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center gap-12 relative overflow-hidden shadow-comic border-4 border-primary transition-all duration-700 ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
              {/* Background Pattern */}
               <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#2B7AB1 2px, transparent 2px)', backgroundSize: '20px 20px' }}></div>
               
               {/* Book Mockup Area - Using Image */}
               <div className="w-full md:w-1/3 flex justify-center relative z-10 py-8">
                  <div 
                    className="relative w-64 md:w-80 aspect-3/4 cursor-pointer group hover:scale-105 transition-transform duration-500" 
                    onClick={() => setIsModalOpen(true)}
                    title="Click to ship a physical copy"
                  >
                      {/* Glow Effect */}
                      <div className="absolute -inset-4 bg-blue-500/30 rounded-full blur-2xl group-hover:bg-blue-400/40 transition-colors"></div>
                      
                      {/* The Book Image */}
                      <img
                        src="https://res.cloudinary.com/djkmeg5se/image/upload/w_320,f_auto,q_auto/Buyers-Guide.png"
                        alt="The 2025 IT Services Buyer's Guide"
                        width="320"
                        height="427"
                        loading="lazy"
                        decoding="async"
                        className="relative z-10 w-full h-auto drop-shadow-2xl transform rotate-3 group-hover:rotate-0 transition-transform duration-500 rounded-lg"
                      />
                      
                      {/* Badge */}
                      <div className="absolute -top-2 -right-2 bg-highlight text-neutral text-xs font-bold px-3 py-1 rounded-full border-2 border-neutral shadow-comic z-20 transform rotate-12 group-hover:rotate-6 transition-transform">
                         FREE COPY!
                      </div>
                  </div>
               </div>

               {/* Content */}
               <div className="w-full md:w-2/3 text-center md:text-left relative z-10">
                   <div className="inline-flex items-center gap-2 bg-highlight text-neutral px-3 py-1 font-bold uppercase tracking-widest text-xs mb-6 rounded-xs border border-neutral shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      <BookOpen size={14} /> Essential Reading
                   </div>
                   <h2 className="font-heading text-3xl md:text-5xl text-white mb-6 leading-tight">Don't Get Ripped Off By <br/><span className="text-primary">Bad IT Support</span></h2>
                   <p className="text-gray-300 text-lg mb-8 max-w-xl leading-relaxed">
                      Our 2025 Buyer's Guide reveals the dirty secrets most IT companies don't want you to know. 
                      Learn the 3 critical questions you must ask before signing any contract.
                   </p>
                   
                   <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                      <button 
                        onClick={handleDownload}
                        className="flex items-center justify-center gap-2 bg-white text-neutral px-6 py-4 rounded-lg font-bold hover:bg-gray-100 transition-all border-2 border-transparent group animate-pulse hover:animate-none"
                      >
                         <Download size={20} className="text-primary group-hover:translate-y-1 transition-transform" />
                         Download PDF Now
                      </button>
                      <button
                         onClick={() => setIsModalOpen(true)}
                         className="flex items-center justify-center gap-2 bg-accent text-neutral px-6 py-4 rounded-lg font-bold shadow-comic hover:translate-y-[2px] transition-all border-2 border-neutral hover:shadow-comic-hover"
                      >
                         <Truck size={20} />
                         Ship Me a Free Copy
                      </button>
                   </div>
                   <div className="mt-6 flex flex-col sm:flex-row items-center justify-center md:justify-start gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><Truck size={12} /> We pay postage</span>
                      <span className="flex items-center gap-1"><Shield size={12} /> No obligation</span>
                   </div>
               </div>
           </div>
        </div>
      </section>
    </>
  );
};
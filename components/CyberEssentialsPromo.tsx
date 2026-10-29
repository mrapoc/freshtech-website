import React from 'react';
import { Shield, ArrowRight, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useInView } from '../hooks/useInView';

export const CyberEssentialsPromo = () => {
  const [ref, isInView] = useInView(0.15);

  return (
    <section ref={ref as React.RefObject<HTMLElement>} className="py-12 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className={`bg-white rounded-2xl border-2 border-gray-200 shadow-lg overflow-hidden flex flex-col md:flex-row transition-all duration-700 ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="bg-primary p-8 md:w-1/3 flex flex-col justify-center items-center text-center text-white relative overflow-hidden">
             <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#fff 2px, transparent 2px)', backgroundSize: '12px 12px' }}></div>
             <Shield size={64} className="text-highlight mb-4 relative z-10" />
             <h3 className="font-heading text-2xl relative z-10">Cyber Essentials</h3>
             <p className="text-blue-100 text-sm mt-2 relative z-10">Government Backed Standard</p>
          </div>
          <div className="p-8 md:w-2/3 flex flex-col justify-center">
             <h3 className="font-heading text-2xl text-neutral mb-4">Are you an easy target for hackers?</h3>
             <p className="text-gray-600 mb-6">
                Getting Cyber Essentials certified protects you from 80% of common cyber attacks. It also proves to your clients (and insurers) that you take security seriously.
             </p>
             <div className="flex flex-col sm:flex-row gap-4 items-center">
                <Link to="/services/cyber-essentials" className="w-full sm:w-auto bg-accent text-neutral px-6 py-3 rounded-lg font-bold shadow-comic border-2 border-neutral hover:shadow-comic-hover hover:translate-y-[2px] transition-all flex items-center justify-center gap-2">
                   Check Your Readiness Score <ArrowRight size={18} />
                </Link>
                <div className="text-xs text-gray-500 flex items-center gap-2">
                   <CheckCircle size={14} className="text-green-500" /> Easier than you think
                </div>
             </div>
          </div>
        </div>
      </div>
    </section>
  );
};
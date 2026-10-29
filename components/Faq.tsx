

import React, { useState, memo } from 'react';
import { ChevronDown, ChevronUp, Search, Filter } from 'lucide-react';
import { faqData, faqCategories } from '../data/content';
import { useInView } from '../hooks/useInView';

interface FaqProps {
  detailed?: boolean;
  categories?: string[];
  title?: string;
  subtitle?: string;
}

interface FaqItem {
  q: string;
  a: string;
  category?: string;
}

export const Faq: React.FC<FaqProps> = memo(function Faq({
  detailed = false,
  categories,
  title = "Common Questions",
  subtitle = "No secrets, no jargon. Just answers."
}) {
  const [ref, isInView] = useInView(0.05);
  const [openIndex, setOpenIndex] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');

  const getFilteredQuestions = (): FaqItem[] => {
    let questions: FaqItem[] = [];

    // If specific categories are requested, filter the source categories
    const sourceCategories = categories 
        ? faqCategories.filter(c => categories.includes(c.title))
        : faqCategories;

    if (detailed) {
        // Flatten filtered categories for detailed view
        sourceCategories.forEach(cat => {
            cat.items.forEach(item => {
                questions.push({ ...item, category: cat.title });
            });
        });

        // Search Filter
        if (searchTerm) {
            questions = questions.filter(q => 
                q.q.toLowerCase().includes(searchTerm.toLowerCase()) || 
                q.a.toLowerCase().includes(searchTerm.toLowerCase())
            );
        } 
        // Category Filter (Pills)
        else if (activeCategory !== 'All') {
            questions = questions.filter(q => q.category === activeCategory);
        }

        return questions;
    }

    // Contextual Mode (Not detailed, just relevant categories)
    if (categories && categories.length > 0) {
        return sourceCategories.flatMap(cat => cat.items);
    }

    // Default Homepage Fallback
    return faqData;
  };

  const filteredData = getFilteredQuestions();
  
  // Calculate available categories for the pills if in detailed mode
  const sourceCategories = categories 
      ? faqCategories.filter(c => categories.includes(c.title))
      : faqCategories;

  const toggleFaq = (identifier: string) => {
    setOpenIndex(openIndex === identifier ? null : identifier);
  };

  return (
    <section ref={ref as React.RefObject<HTMLElement>} className={`bg-white ${detailed ? 'pb-20 pt-12' : 'py-20'}`}>
      <div className={`container mx-auto px-4 ${detailed ? 'max-w-4xl' : 'max-w-3xl'}`}>

        {!detailed && (
          <div className={`text-center mb-12 transition-all duration-700 ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <h2 className="font-heading text-4xl text-neutral mb-4">{title}</h2>
            <p className="text-gray-600">{subtitle}</p>
          </div>
        )}

        {/* Detailed Controls */}
        {detailed && (
          <div className="mb-10 space-y-6">
             {/* Search */}
             <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input 
                  type="text" 
                  placeholder="Search for answers (e.g., 'price', 'security', 'contract')" 
                  className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-gray-200 focus:border-primary focus:outline-hidden focus-visible:ring-2 focus-visible:ring-primary transition-colors text-lg"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
             </div>

             {/* Category Pills - Hide if searching */}
             {!searchTerm && (
               <div className="flex flex-wrap gap-2 justify-center">
                  <button 
                    onClick={() => setActiveCategory('All')}
                    className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${activeCategory === 'All' ? 'bg-primary text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  >
                    All Topics
                  </button>
                  {sourceCategories.map((cat, idx) => (
                    <button 
                      key={idx}
                      onClick={() => setActiveCategory(cat.title)}
                      className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${activeCategory === cat.title ? 'bg-primary text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                      {cat.title}
                    </button>
                  ))}
               </div>
             )}
          </div>
        )}

        {/* Questions List */}
        <div className="space-y-4">
          {filteredData.length === 0 ? (
             <div className="text-center py-10 text-gray-500">
               <Filter size={48} className="mx-auto mb-4 opacity-20" />
               <p>No answers found matching "{searchTerm}". Try a different keyword.</p>
               <button onClick={() => setSearchTerm('')} className="text-primary font-bold mt-2 hover:underline">Clear Search</button>
             </div>
          ) : (
            filteredData.map((item, index) => {
              // Create unique ID for accordion state
              const identifier = `${index}-${item.q.substring(0, 10)}`;
              
              return (
                <div key={identifier} className={`border-2 border-gray-100 rounded-xl overflow-hidden group hover:border-gray-200 transition-all duration-500 ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`} style={{ transitionDelay: `${150 + index * 75}ms` }}>
                  <button 
                    className="w-full flex items-center justify-between p-5 bg-white text-left hover:bg-gray-50 transition-colors focus:outline-hidden focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
                    onClick={() => toggleFaq(identifier)}
                    aria-expanded={openIndex === identifier}
                  >
                    <div className="pr-4">
                       {detailed && item.category && !searchTerm && activeCategory === 'All' && (
                         <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                           {item.category}
                         </span>
                       )}
                       <span className={`font-bold text-lg transition-colors ${openIndex === identifier ? 'text-primary' : 'text-neutral'}`}>
                         {item.q}
                       </span>
                    </div>
                    {openIndex === identifier ? <ChevronUp className="text-accent shrink-0" /> : <ChevronDown className="text-gray-400 shrink-0" />}
                  </button>
                  
                  <div 
                    className={`transition-all duration-300 ease-in-out overflow-hidden ${openIndex === identifier ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
                  >
                    <div className="p-5 pt-0 bg-white border-t border-gray-100">
                      <p className="text-gray-600 leading-relaxed mt-4 text-base">{item.a}</p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
});
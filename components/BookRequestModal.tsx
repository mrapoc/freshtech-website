
import React, { useEffect } from 'react';
import { X, Truck } from 'lucide-react';

interface BookRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BookRequestModal: React.FC<BookRequestModalProps> = ({ isOpen, onClose }) => {
  
  useEffect(() => {
    if (!isOpen) return;

    // Inject the CRM script dynamically when modal opens
    const script = document.createElement('script');
    script.src = "https://links.growably.com/js/form_embed.js";
    script.async = true;
    document.body.appendChild(script);

    // Add the resize listener provided in your snippet
    const handleMessage = (e: MessageEvent) => {
      if (
        e.origin === 'https://links.growably.com' &&
        e.data && typeof e.data.formHeight === 'number'
      ) {
        const iframe = document.getElementById('inline-UfGYsQKyuX9rtfPNao07');
        if (iframe) {
          const h = Math.max(e.data.formHeight, 600);
          iframe.style.height = h + 'px';
        }
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      // Cleanup
      window.removeEventListener('message', handleMessage);
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-neutral/80 backdrop-blur-xs animate-in fade-in">
       <div
         role="dialog"
         aria-modal="true"
         aria-labelledby="book-request-title"
         className="bg-white w-full max-w-2xl h-[90vh] md:h-auto max-h-[90vh] rounded-2xl shadow-2xl relative overflow-hidden border-4 border-primary flex flex-col animate-in zoom-in-95 duration-200"
       >
          {/* Header */}
          <div className="bg-primary p-4 flex justify-between items-center text-white shrink-0">
             <h3 id="book-request-title" className="font-heading text-xl flex items-center gap-2">
                <Truck size={20} /> Request Physical Copy
             </h3>
             <button
               onClick={onClose}
               aria-label="Close dialog"
               className="hover:bg-white/20 p-2 rounded-full transition-colors"
             >
                <X size={24} />
             </button>
          </div>
          
          {/* Iframe Container - Scrolling enabled if form gets very long */}
          <div className="grow overflow-y-auto bg-white w-full">
            <div className="growably-iframe-container w-full">
              <iframe
                id="inline-UfGYsQKyuX9rtfPNao07"
                className="growably-iframe w-full"
                style={{ minHeight: '600px', height: 'auto', border: 'none' }}
                src="https://links.growably.com/widget/form/UfGYsQKyuX9rtfPNao07"
                title="Book Signup"
                data-layout="{'id':'INLINE'}"
                data-trigger-type="alwaysShow"
                data-activation-type="alwaysActivated"
                data-deactivation-type="neverDeactivate"
                data-form-name="Book Signup"
                data-form-id="UfGYsQKyuX9rtfPNao07"
              ></iframe>
            </div>
          </div>
       </div>
    </div>
  );
};

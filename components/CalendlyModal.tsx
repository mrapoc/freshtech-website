import React, { useEffect, useRef, useState } from 'react';
import { X, CalendarCheck, Shield, Building2, Headset, Phone, Mail, ArrowRight } from 'lucide-react';
import { useFocusTrap } from '../utils/focusTrap';

type ModalStep = 'qualify' | 'calendly' | 'existing-customer';
// "embedded" means the vendor script ran and placed something in the
// container. It is not proof the calendar itself loaded, so the direct
// booking link and contact details stay visible on this step.
type WidgetStatus = 'loading' | 'embedded' | 'error';

interface CalendlyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CALENDLY_URL = 'https://calendly.com/fresh-sam/20min';
const WIDGET_SCRIPT = 'https://assets.calendly.com/assets/external/widget.js';
const WIDGET_TIMEOUT_MS = 15000;

type CalendlyWindow = Window & {
  Calendly?: { initInlineWidget?: (opts: { url: string; parentElement: HTMLElement }) => void };
};

const findWidgetScript = () =>
  document.querySelector<HTMLScriptElement>(`script[src="${WIDGET_SCRIPT}"]`);

export const CalendlyModal: React.FC<CalendlyModalProps> = ({ isOpen, onClose }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const widgetRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState<ModalStep>('qualify');
  const [widgetStatus, setWidgetStatus] = useState<WidgetStatus>('loading');
  const [attempt, setAttempt] = useState(0);

  // Keyboard containment, Escape to close, focus restored to the opener on
  // close or unmount (some pages unmount the modal instead of toggling isOpen).
  useFocusTrap(modalRef, isOpen, onClose);

  // Reset to the qualifier step on open and move focus to the current step's
  // heading so the dialog name and step are announced together.
  useEffect(() => {
    if (isOpen) setStep('qualify');
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) headingRef.current?.focus();
  }, [isOpen, step]);

  // Prevent body scroll while open.
  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Load the Calendly widget script for the calendar step. The script's own
  // scan runs only once at load, before our container exists, so the inline
  // widget is initialised explicitly. Script errors, a missing vendor object,
  // an empty container after init, or a timeout show the retry prompt. Each
  // attempt starts from an empty container so a broken embed is not reused.
  useEffect(() => {
    if (!isOpen || step !== 'calendly') return;

    let done = false;
    setWidgetStatus('loading');
    const timer = setTimeout(() => finish('error'), WIDGET_TIMEOUT_MS);

    const finish = (status: WidgetStatus) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      setWidgetStatus(status);
    };

    const init = () => {
      const parent = widgetRef.current;
      const calendly = (window as CalendlyWindow).Calendly;
      if (!parent || typeof calendly?.initInlineWidget !== 'function') {
        finish('error');
        return;
      }
      parent.replaceChildren();
      try {
        calendly.initInlineWidget({ url: `${CALENDLY_URL}?hide_gdpr_banner=1`, parentElement: parent });
      } catch {
        finish('error');
        return;
      }
      finish(parent.children.length > 0 ? 'embedded' : 'error');
    };
    const fail = () => finish('error');

    let script = findWidgetScript();
    if ((window as CalendlyWindow).Calendly) {
      init();
    } else {
      if (!script) {
        script = document.createElement('script');
        script.src = WIDGET_SCRIPT;
        script.async = true;
        document.body.appendChild(script);
      }
      // Listen rather than assign onload so a script still in flight from an
      // earlier open is handled too.
      script.addEventListener('load', init);
      script.addEventListener('error', fail);
    }

    return () => {
      done = true;
      clearTimeout(timer);
      script?.removeEventListener('load', init);
      script?.removeEventListener('error', fail);
    };
  }, [isOpen, step, attempt]);

  const retryWidget = () => {
    // A script tag that never produced the vendor object is removed so the
    // browser fetches it again rather than reusing the failed element.
    if (!(window as CalendlyWindow).Calendly) findWidgetScript()?.remove();
    setAttempt(a => a + 1);
  };

  if (!isOpen) return null;

  const headingClass = 'font-heading text-2xl md:text-3xl mb-3 text-neutral outline-none';

  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-neutral/80 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        // Close when clicking backdrop
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="calendly-modal-title"
        className="bg-white w-full max-w-5xl h-[95vh] md:h-[85vh] rounded-2xl shadow-2xl border-4 border-primary relative flex flex-col md:flex-row overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* Close button - always visible */}
        <div className="absolute top-4 right-4 z-10">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-100 hover:bg-gray-200 p-2 rounded-full transition-colors text-neutral focus:outline-hidden focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              aria-label="Close booking dialog"
            >
                <X size={24} aria-hidden="true" />
            </button>
        </div>

        {/* Step 1: Qualifier */}
        {step === 'qualify' && (
          <div className="flex flex-col items-center justify-center grow p-8 md:p-16 text-center">
            <Shield size={48} className="text-primary mb-6" aria-hidden="true" />
            <h3 id="calendly-modal-title" ref={headingRef} tabIndex={-1} className={headingClass}>
              How Can We Help?
            </h3>
            <p className="text-gray-600 mb-10 max-w-md leading-relaxed">
              This helps us point you in the right direction.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 w-full max-w-lg">
              <button
                type="button"
                onClick={() => setStep('calendly')}
                className="flex-1 flex flex-col items-center gap-3 p-6 bg-white border-2 border-primary rounded-xl shadow-comic hover:shadow-comic-hover hover:translate-y-[2px] transition-all group"
              >
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                  <Building2 size={28} />
                </div>
                <span className="font-heading text-lg text-neutral">I'm Exploring IT Support</span>
                <span className="text-sm text-gray-500">For my business, let's chat</span>
              </button>

              <button
                type="button"
                onClick={() => setStep('existing-customer')}
                className="flex-1 flex flex-col items-center gap-3 p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-md transition-all group"
              >
                <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 group-hover:bg-gray-200 transition-colors">
                  <Headset size={28} />
                </div>
                <span className="font-heading text-lg text-neutral">I'm an Existing Customer</span>
                <span className="text-sm text-gray-500">I need help with something</span>
              </button>
            </div>

            <p className="text-xs text-gray-400 mt-8">
              Prefer to call? <a href="tel:01584517234" className="underline hover:text-primary">01584 517 234</a>
            </p>
          </div>
        )}

        {/* Step 2a: Existing customer, redirect to support */}
        {step === 'existing-customer' && (
          <div className="flex flex-col items-center justify-center grow p-8 md:p-16 text-center">
            <Headset size={48} className="text-primary mb-6" aria-hidden="true" />
            <h3 id="calendly-modal-title" ref={headingRef} tabIndex={-1} className={headingClass}>
              We've Got You Covered
            </h3>
            <p className="text-gray-600 mb-8 max-w-md leading-relaxed">
              The fastest way to get help is through our support channels, with no need to book a call.
            </p>

            <div className="w-full max-w-sm space-y-4 mb-8">
              <a
                href="tel:01584517234"
                className="flex items-center gap-4 p-4 bg-white border-2 border-gray-200 rounded-xl hover:border-primary hover:shadow-md transition-all"
              >
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600 shrink-0">
                  <Phone size={22} />
                </div>
                <div className="text-left">
                  <p className="font-bold text-neutral">Call our helpdesk</p>
                  <p className="text-sm text-gray-500">01584 517 234</p>
                </div>
                <ArrowRight size={18} className="ml-auto text-gray-400" />
              </a>

              <a
                href="mailto:support@fresh-tech.uk"
                className="flex items-center gap-4 p-4 bg-white border-2 border-gray-200 rounded-xl hover:border-primary hover:shadow-md transition-all"
              >
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                  <Mail size={22} />
                </div>
                <div className="text-left">
                  <p className="font-bold text-neutral">Email support</p>
                  <p className="text-sm text-gray-500">support@fresh-tech.uk</p>
                </div>
                <ArrowRight size={18} className="ml-auto text-gray-400" />
              </a>
            </div>

            <button
              type="button"
              onClick={() => setStep('qualify')}
              className="text-sm text-primary hover:underline"
            >
              ← Go back
            </button>
          </div>
        )}

        {/* Step 2b: New business, Calendly widget */}
        {step === 'calendly' && (
          <div className="flex flex-col md:flex-row grow overflow-hidden">
            {/* Sidebar */}
            <div className="bg-gray-50 p-6 md:w-1/3 border-b md:border-b-0 md:border-r-2 border-gray-200 flex flex-col justify-center">
               <div className="mb-6 text-primary">
                  <CalendarCheck size={48} aria-hidden="true" />
               </div>
               <h3 id="calendly-modal-title" ref={headingRef} tabIndex={-1} className="font-heading text-2xl md:text-3xl mb-4 text-neutral outline-none">
                 Let's See If We're a Good Fit
               </h3>
               <p className="text-gray-600 mb-6 leading-relaxed">
                 A quick 20-minute intro call with Sam. We'll learn about your business and see how we can help.
               </p>
               <ul className="space-y-4 mb-8">
                  <li className="flex items-center gap-3 text-sm font-bold text-gray-700">
                     <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-600"><CalendarCheck size={14} aria-hidden="true" /></div>
                     No sales pressure
                  </li>
                  <li className="flex items-center gap-3 text-sm font-bold text-gray-700">
                     <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600"><Shield size={14} aria-hidden="true" /></div>
                     100% Confidential
                  </li>
                  <li className="flex items-center gap-3 text-sm font-bold text-gray-700">
                     <div className="w-6 h-6 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600"><Building2 size={14} aria-hidden="true" /></div>
                     For businesses only
                  </li>
               </ul>
               <div className="text-sm text-gray-600 mb-6 space-y-1">
                 <p className="font-bold text-gray-700">Calendar not showing?</p>
                 <p>
                   <a href={CALENDLY_URL} target="_blank" rel="noopener noreferrer" className="text-primary underline">
                     Open the booking page in a new tab
                   </a>
                 </p>
                 <p>
                   Call <a href="tel:01584517234" className="underline">01584 517 234</a> or email{' '}
                   <a href="mailto:hello@fresh-tech.uk" className="underline">hello@fresh-tech.uk</a>
                 </p>
               </div>
               <button
                 type="button"
                 onClick={() => setStep('qualify')}
                 className="text-sm text-primary hover:underline text-left"
               >
                 ← Go back
               </button>
            </div>

            {/* Widget Area */}
            <div className="grow relative bg-white flex flex-col">
                {widgetStatus === 'loading' && (
                  <p role="status" className="absolute inset-0 flex items-center justify-center text-gray-600">
                    Loading the booking calendar
                  </p>
                )}
                {widgetStatus === 'error' && (
                  <div role="alert" className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8 text-center bg-white">
                    <p className="text-gray-700 max-w-sm">
                      The booking calendar did not load. It may be blocked by your browser or network.
                    </p>
                    <button
                      type="button"
                      onClick={retryWidget}
                      className="px-5 py-2 bg-primary text-white rounded-lg font-bold hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                    >
                      Try again
                    </button>
                    <p className="text-sm text-gray-600">Or use the booking link or contact details alongside.</p>
                  </div>
                )}
                <div className="grow w-full h-full overflow-hidden">
                    <div
                        ref={widgetRef}
                        className="calendly-inline-widget"
                        data-url={`${CALENDLY_URL}?hide_gdpr_banner=1`}
                        style={{ minWidth: '320px', height: '100%', width: '100%' }}
                    />
                </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

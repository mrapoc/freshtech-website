export interface ContactPayload {
  name: string;
  email: string;
  phone: string;
  companySize: string;
  painPoint: string;
  message: string;
  honeypot: string;
}

export interface ContactAcceptance { success: true }
type FetchLike = (input: string, init: RequestInit) => Promise<Pick<Response, 'ok' | 'json'>>;

export class ContactSubmissionError extends Error {
  constructor(message = 'We could not accept your message. Please try again or call us.') {
    super(message);
    this.name = 'ContactSubmissionError';
  }
}

export async function submitContact(payload: ContactPayload, fetchImpl: FetchLike = fetch, timeoutMs = 12_000): Promise<ContactAcceptance> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl('/api/send-email', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), cache: 'no-store', signal: controller.signal,
    });
    let body: unknown;
    try { body = await response.json(); } catch { throw new ContactSubmissionError(); }
    if (!response.ok || !isAcceptance(body)) throw new ContactSubmissionError();
    return body;
  } catch (error) {
    if (error instanceof ContactSubmissionError) throw error;
    throw new ContactSubmissionError();
  } finally { clearTimeout(timeout); }
}

function isAcceptance(value: unknown): value is ContactAcceptance {
  return typeof value === 'object' && value !== null && (value as { success?: unknown }).success === true;
}

function isLocalhost(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
}

export function submissionAllowed(mode: string, hostname: string): boolean {
  const canonicalHost = hostname === 'fresh-tech.uk' || hostname === 'www.fresh-tech.uk';
  return (mode === 'enabled' && canonicalHost) || (mode === 'test' && isLocalhost(hostname));
}

function payloadFrom(form: HTMLFormElement): ContactPayload {
  const data = new FormData(form);
  const value = (name: string) => {
    const entry = data.get(name);
    return typeof entry === 'string' ? entry : '';
  };
  return { name: value('name'), email: value('email'), phone: value('phone'), companySize: value('companySize'), painPoint: value('painPoint'), message: value('message'), honeypot: value('ft_hp') };
}

export function enhanceContactForm(root: ParentNode = document): void {
  const form = root.querySelector<HTMLFormElement>('[data-contact-form]');
  if (!form) return;
  const submit = form.querySelector<HTMLButtonElement>('[data-contact-submit]');
  const submitLabel = form.querySelector<HTMLElement>('[data-submit-label]');
  const error = form.querySelector<HTMLElement>('[data-contact-error]');
  const errorText = form.querySelector<HTMLElement>('[data-contact-error-text]');
  const retry = form.querySelector<HTMLButtonElement>('[data-contact-retry]');
  const jsNote = form.querySelector<HTMLElement>('.js-note');
  const success = root.querySelector<HTMLElement>('[data-contact-success]');
  const another = root.querySelector<HTMLButtonElement>('[data-contact-another]');
  const name = form.elements.namedItem('name') as HTMLInputElement | null;
  const email = form.elements.namedItem('email') as HTMLInputElement | null;
  const qualification = form.querySelector<HTMLElement>('[data-qualification]');
  let pending = false;
  if (!submit || !submitLabel || !error || !errorText || !success || !another || !name || !email) return;
  if (!submissionAllowed(form.dataset.submissionMode ?? 'disabled', window.location.hostname)) {
    if (jsNote) jsNote.textContent = 'Online messages are unavailable on this preview host. Please call or email us.';
    return;
  }

  form.classList.add('is-progressive');
  submit.disabled = false;
  const updateQualification = () => {
    if (qualification) qualification.hidden = !(name.validity.valid && email.validity.valid && name.value !== '' && email.value !== '');
  };
  name.addEventListener('input', updateQualification);
  email.addEventListener('input', updateQualification);
  updateQualification();
  retry?.addEventListener('click', () => { error.hidden = true; submit.focus(); });
  another.addEventListener('click', () => {
    form.reset(); form.hidden = false; success.hidden = true; error.hidden = true; updateQualification(); name.focus();
  });
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (pending || !form.reportValidity()) return;
    pending = true; form.setAttribute('aria-busy', 'true'); submit.disabled = true; submitLabel.textContent = 'Sending…'; error.hidden = true;
    try {
      await submitContact(payloadFrom(form));
      form.hidden = true; success.hidden = false; success.querySelector<HTMLElement>('[data-success-heading]')?.focus();
    } catch (submissionError) {
      errorText.textContent = submissionError instanceof Error ? submissionError.message : new ContactSubmissionError().message;
      error.hidden = false; error.focus();
    } finally {
      pending = false; form.removeAttribute('aria-busy'); submit.disabled = false; submitLabel.textContent = 'Send message';
    }
  });
}

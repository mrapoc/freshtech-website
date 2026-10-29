// No-JavaScript form policy for the standalone browser gate. Pure: the gate
// extracts one descriptor per <form> inside <main> and this module decides.
//
// Two forms are legitimate on a built standalone page:
//   - the in-browser email checker (no action; nothing is ever sent);
//   - the shared contact form (ContactForm.astro). Preview builds replace it
//     with a disabled notice, but a production build intentionally renders the
//     real form posting to the live same-origin handler. Without JavaScript it
//     must still be inert: the submit button is server-rendered disabled, so
//     neither a click nor implicit (Enter) submission can post, and a
//     <noscript> note tells the visitor to call or email instead.
// Anything else that could submit somewhere is a defect.
export const CONTACT_FORM_ACTION = '/api/send-email';
export const CONTACT_SUBMISSION_MODES = Object.freeze(['enabled', 'test']);

// descriptor: { action, method, checker, contact, submissionMode, submitButtons: [{ disabled }], noscriptNote }
export const assessNoJsForms = forms => {
  const problems = [];
  let contactForms = 0;
  for (const [index, form] of forms.entries()) {
    const label = `form ${index}`;
    if (form.checker) {
      if (form.action) problems.push(`${label}: email checker form must not have an action (${form.action})`);
      continue;
    }
    if (form.contact) {
      contactForms++;
      if (form.action !== CONTACT_FORM_ACTION) problems.push(`${label}: contact form action must be ${CONTACT_FORM_ACTION}, got ${form.action}`);
      if ((form.method ?? '').toLowerCase() !== 'post') problems.push(`${label}: contact form must post, got ${form.method}`);
      if (!CONTACT_SUBMISSION_MODES.includes(form.submissionMode)) problems.push(`${label}: unexpected contact submission mode ${form.submissionMode}`);
      if (!form.submitButtons?.length) problems.push(`${label}: contact form has no submit button`);
      else if (!form.submitButtons.every(button => button.disabled)) problems.push(`${label}: contact form submit button is enabled without JavaScript`);
      if (!form.noscriptNote) problems.push(`${label}: contact form lacks the no-JavaScript notice`);
      continue;
    }
    problems.push(`${label}: a form that could submit somewhere is present (${JSON.stringify({ action: form.action, method: form.method })})`);
  }
  if (contactForms > 1) problems.push(`${contactForms} contact forms on one page`);
  return { ok: problems.length === 0, problems, contactForms };
};

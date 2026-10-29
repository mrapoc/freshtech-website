import test from 'node:test';
import assert from 'node:assert/strict';
import { assessNoJsForms } from './standalone-forms.mjs';

const contact = (overrides = {}) => ({
  action: '/api/send-email', method: 'post', checker: false, contact: true, submissionMode: 'enabled',
  submitButtons: [{ disabled: true }], noscriptNote: true, ...overrides,
});

test('no forms and the email checker pass', () => {
  assert.equal(assessNoJsForms([]).ok, true);
  assert.equal(assessNoJsForms([{ action: null, method: 'get', checker: true, contact: false }]).ok, true);
  assert.equal(assessNoJsForms([{ action: '/somewhere', method: 'get', checker: true, contact: false }]).ok, false);
});

test('the production contact form passes only when it is inert without JavaScript', () => {
  assert.deepEqual(assessNoJsForms([contact()]), { ok: true, problems: [], contactForms: 1 });
  for (const [name, broken] of Object.entries({
    'wrong action': contact({ action: '/api/other' }),
    'get method': contact({ method: 'get' }),
    'enabled submit': contact({ submitButtons: [{ disabled: false }] }),
    'no submit button': contact({ submitButtons: [] }),
    'no noscript note': contact({ noscriptNote: false }),
    'disabled mode rendered as a form': contact({ submissionMode: 'disabled' }),
  })) assert.equal(assessNoJsForms([broken]).ok, false, name);
  assert.equal(assessNoJsForms([contact(), contact()]).ok, false, 'two contact forms');
});

test('any other form that could submit is rejected', () => {
  const result = assessNoJsForms([{ action: '/api/send-email', method: 'post', checker: false, contact: false }]);
  assert.equal(result.ok, false);
  assert.match(result.problems[0], /could submit somewhere/);
});

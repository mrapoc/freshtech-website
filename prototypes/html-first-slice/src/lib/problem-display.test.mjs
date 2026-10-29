import assert from 'node:assert/strict';
import test from 'node:test';
import { CALL_NOW_LABEL, EMERGENCY_SLUG, HERO_CALL_LABEL, ICON_MAP_KEYS, PHONE_HREF, breadcrumbItems, iconName, isEmergency, mergeRouteInventory, problemFontPreloads } from './problem-display.mjs';
import { ICON_NODES, ICON_TAGS, iconNodes } from './problem-icons.mjs';

// Synthetic records only; shapes follow pages/ProblemPage.tsx.
const page = { slug: 'slow-things', h1: 'Why Are Your Test Things So Slow?' };

test('only the ransomware-recovery slug is the emergency variant and the source phone contract is kept', () => {
  assert.equal(EMERGENCY_SLUG, 'ransomware-recovery');
  assert.equal(isEmergency({ slug: 'ransomware-recovery' }), true);
  assert.equal(isEmergency(page), false);
  assert.equal(isEmergency({ slug: 'ransomware-recovery-2' }), false);
  assert.equal(PHONE_HREF, 'tel:01584517234');
  assert.equal(CALL_NOW_LABEL, 'Call Now: 01584 517 234');
  assert.equal(HERO_CALL_LABEL, 'Call 01584 517 234');
});

test('breadcrumb is Home > Resources > h1 with the current page unlinked', () => {
  assert.deepEqual(breadcrumbItems(page), [['Home', '/'], ['Resources', '/resources'], ['Why Are Your Test Things So Slow?', null]]);
});

test('card icons resolve like the React iconMap, falling back to CheckCircle for anything absent from it', () => {
  assert.equal(ICON_MAP_KEYS.length, 51);
  for (const key of ICON_MAP_KEYS) assert.equal(iconName(key), key);
  // Names lucide ships but the source iconMap does not list.
  for (const absent of ['Smartphone', 'Brain', 'Home', 'Trash2', 'Copy', 'User', 'UserX', 'Link', 'Hand', 'XCircle', 'ChevronDown', '', undefined]) {
    assert.equal(iconName(absent), 'CheckCircle', `${absent} should fall back`);
  }
  assert.equal(iconName('checkcircle'), 'CheckCircle');
});

test('the glyph packet covers every iconMap key plus the three page-drawn markers with only stroked shape nodes', () => {
  const names = Object.keys(ICON_NODES);
  assert.equal(names.length, 54);
  assert.deepEqual(names.filter(name => !ICON_MAP_KEYS.includes(name)), ['XCircle', 'ChevronDown', 'ChevronUp']);
  for (const name of names) {
    const nodes = iconNodes(name);
    assert.ok(nodes.length >= 1, `${name} has nodes`);
    for (const [tag, attrs] of nodes) {
      assert.ok(ICON_TAGS.includes(tag), `${name} uses allowed tag ${tag}`);
      for (const [attr, value] of Object.entries(attrs)) {
        assert.match(attr, /^(d|cx|cy|r|rx|ry|x|y|x1|x2|y1|y2|width|height|points)$/, `${name} attribute ${attr}`);
        assert.equal(typeof value, 'string');
        assert.doesNotMatch(value, /[<>"&]/, `${name}.${attr} is plain shape data`);
      }
    }
  }
  assert.deepEqual(iconNodes('ArrowRight'), [['path', { d: 'M5 12h14' }], ['path', { d: 'm12 5 7 7-7 7' }]]);
  assert.throws(() => iconNodes('ChevronLeft'), /No problem-family glyph/);
  assert.throws(() => iconNodes('constructor'), /No problem-family glyph/);
});

test('H1 font preloads use the existing Bungee subsets', () => {
  assert.deepEqual(problemFontPreloads('Why Are Your Business Computers So Slow?'), ['/fonts/bungee-latin.woff2']);
  assert.deepEqual(problemFontPreloads('Łódź office move'), ['/fonts/bungee-latin.woff2', '/fonts/bungee-latin-ext.woff2']);
});

test('merged root-slug inventory keeps family then source order and tags each route with its family', () => {
  const routes = mergeRouteInventory([
    { family: 'service-location', pages: [{ slug: 'it-support-testshire' }, { slug: 'it-support-testtown' }] },
    { family: 'problem', pages: [{ slug: 'slow-things' }, { slug: 'windows-10-test' }] },
  ]);
  assert.deepEqual(routes.map(route => [route.slug, route.family]), [
    ['it-support-testshire', 'service-location'], ['it-support-testtown', 'service-location'],
    ['slow-things', 'problem'], ['windows-10-test', 'problem'],
  ]);
  assert.equal(routes[2].page.slug, 'slow-things');
});

test('merged inventory fails closed on collisions, unsafe slugs and empty families', () => {
  assert.throws(() => mergeRouteInventory([
    { family: 'service-location', pages: [{ slug: 'shared-slug' }] },
    { family: 'problem', pages: [{ slug: 'shared-slug' }] },
  ]), /collision: \/shared-slug is claimed by both service-location and problem/);
  assert.throws(() => mergeRouteInventory([{ family: 'problem', pages: [{ slug: 'twice' }, { slug: 'twice' }] }]), /collision/);
  assert.throws(() => mergeRouteInventory([{ family: 'problem', pages: [{ slug: 'Bad Slug' }] }]), /safe slug/);
  assert.throws(() => mergeRouteInventory([{ family: 'problem', pages: [{ slug: '../etc' }] }]), /safe slug/);
  assert.throws(() => mergeRouteInventory([{ family: 'problem', pages: [{}] }]), /safe slug/);
  assert.throws(() => mergeRouteInventory([{ family: 'problem', pages: [] }]), /no records/);
  assert.throws(() => mergeRouteInventory([{ pages: [{ slug: 'a' }] }]), /needs a name/);
  assert.throws(() => mergeRouteInventory([]), /at least one family/);
});

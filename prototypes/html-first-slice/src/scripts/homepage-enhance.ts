export function refreshHomepageMasthead(root: Document = document, now = new Date()) {
  const zone = 'Europe/London';
  const issue = Math.max(1, Math.floor((now.getTime() - Date.UTC(2023, 8, 14)) / 604_800_000) + 1);
  const day = new Intl.DateTimeFormat('en-GB', { weekday: 'short', timeZone: zone }).format(now);
  const month = new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric', timeZone: zone }).format(now);
  root.querySelectorAll<HTMLElement>('[data-masthead-day]').forEach(node => {
    const issueNode = node.querySelector<HTMLElement>('[data-masthead-issue]');
    if (node.firstChild) node.firstChild.textContent = `● ${day} · Issue №`;
    if (issueNode) issueNode.textContent = String(issue);
  });
  root.querySelectorAll<HTMLElement>('[data-masthead-month]').forEach(node => { node.textContent = month; });
}

interface HomepageLifecycleWindow {
  addEventListener(type: 'pagehide' | 'pageshow', listener: (event: PageTransitionEvent) => void): void;
  setInterval(handler: () => void, timeout: number): number;
  clearInterval(handle: number): void;
}

interface HomepageEnhancementOptions {
  root?: Document;
  runtime?: HomepageLifecycleWindow;
  now?: () => Date;
}

export function startHomepageEnhancements({
  root = document,
  runtime = window,
  now = () => new Date(),
}: HomepageEnhancementOptions = {}) {
  const refreshMasthead = () => refreshHomepageMasthead(root, now());
  refreshMasthead();
  const mastheadTimer = runtime.setInterval(refreshMasthead, 60_000);
  let cleanedUp = false;

  runtime.addEventListener('pageshow', refreshMasthead);
  runtime.addEventListener('pagehide', event => {
    // BFCache pauses this page and later restores the same timers and pending
    // masthead timer. The separate proof controller clears its own snapshots.
    if (event.persisted || cleanedUp) return;
    cleanedUp = true;
    runtime.clearInterval(mastheadTimer);
  });
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  startHomepageEnhancements();
}

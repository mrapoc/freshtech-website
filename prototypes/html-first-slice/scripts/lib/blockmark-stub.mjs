// Browser checks never fetch the live Blockmark Cyber Essentials badge
// (CyberEssentialsBadge.astro, in the footer of every page). Blocking it instead
// loads the browser's own error page inside the sandboxed frame, whose script
// logs "Failed to read the 'localStorage' property", so every check stubs it.
export const BLOCKMARK_HOST = 'registry.blockmarktech.com';
export const isBlockmarkBadge = url => {
  const parsed = typeof url === 'string' ? new URL(url) : url;
  return parsed.protocol === 'https:' && parsed.hostname === BLOCKMARK_HOST && parsed.pathname.startsWith('/certificates/');
};
export const BLOCKMARK_STUB = Object.freeze({ status: 200, contentType: 'text/html', body: '<!doctype html><title>Badge</title><p>Cyber Essentials</p>' });

// Scheduled function: paused under the editorial approval hold.
//
// This function used to read the live rss.xml each morning and fire the
// Netlify build hook when a future-dated post's date arrived. That path is
// retired: Sam approves every article and its social captions in preview
// before release, and each release is a commit that deploys on its own.
//
// The schedule is kept so the pause is reversible and visible in Netlify's
// function list. It makes no network calls and never reads
// NETLIFY_BUILD_HOOK_URL. It stays paused regardless of data/editorial-holds.json
// until a later reviewed migration removes or replaces it.

export const config = {
  schedule: '15 6 * * *',
};

export default async () => {
  console.log('Editorial hold: scheduled publishing is paused. No feed read, no build triggered.');
  return new Response('editorial hold');
};

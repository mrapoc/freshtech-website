// Route sweeps reuse one page and navigate with waitUntil: 'domcontentloaded',
// so a request the previous document had in flight (typically a web font) is
// cancelled with net::ERR_ABORTED when the next route starts loading. That
// cancellation reports after the sweep has reset its error list and was being
// blamed on the new route. trackSupersededAborts(page) returns a predicate that
// is true only for an ERR_ABORTED request issued before the most recent
// main-frame navigation; every other failure, including any abort on the
// current document, is still reported.
export function trackSupersededAborts(page) {
  let generation = 0;
  const issuedIn = new WeakMap();
  page.on('framenavigated', frame => { if (frame === page.mainFrame()) generation += 1; });
  page.on('request', request => issuedIn.set(request, generation));
  return request => request.failure()?.errorText === 'net::ERR_ABORTED'
    && issuedIn.has(request) && issuedIn.get(request) < generation;
}

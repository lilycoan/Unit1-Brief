// ==========================================================================
// Checks every citation link in data.js SOURCES. Run from the project root:
//   node test/check-links.js
// Prints each URL's HTTP status. Some publishers block automated requests
// (403 or similar) even though the page opens in a browser; those are listed
// at the end for a person to click through.
// ==========================================================================
'use strict';

const { SOURCES } = require('../data.js');

const TIMEOUT_MS = 20000;
const HEADERS = { 'User-Agent': 'Mozilla/5.0 (link check for the AI footprint calculator)' };

async function check(url) {
  // Try HEAD first (cheap); some servers reject HEAD, so fall back to GET.
  for (const method of ['HEAD', 'GET']) {
    try {
      const res = await fetch(url, { method, headers: HEADERS, redirect: 'follow', signal: AbortSignal.timeout(TIMEOUT_MS) });
      if (res.ok || method === 'GET') return { status: res.status, ok: res.ok, finalUrl: res.url };
    } catch (e) {
      if (method === 'GET') return { status: 'error', ok: false, error: e.cause ? e.cause.code || e.message : e.message };
    }
  }
  return { status: 'error', ok: false };
}

(async () => {
  const entries = Object.entries(SOURCES).filter(([, s]) => s.url);
  const results = await Promise.all(entries.map(async ([n, s]) => ({ n, url: s.url, ...(await check(s.url)) })));
  for (const r of results) {
    const moved = r.finalUrl && r.finalUrl !== r.url ? `  → ${r.finalUrl}` : '';
    console.log(`${r.ok ? 'OK  ' : 'FAIL'}  ${String(r.status).padEnd(5)} [${r.n}] ${r.url}${moved}${r.error ? '  (' + r.error + ')' : ''}`);
  }
  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length} of ${results.length} links answered OK.`);
  if (failed.length) {
    console.log('Open these in a browser to confirm them by hand:');
    failed.forEach((r) => console.log(`  [${r.n}] ${r.url}`));
  }
  process.exitCode = failed.length ? 1 : 0;
})();

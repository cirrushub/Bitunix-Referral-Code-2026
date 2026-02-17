/**
 * Rewrites UTM parameters in markdown content before rendering.
 * - Fixes malformed URLs (double ? → &)
 * - Replaces utm_medium → github-articles
 * - Replaces utm_campaign → 3rdparty-github
 * - Replaces utm_source → 3rdparty
 */
export function rewriteUtmParams(content: string): string {
  let processed = content;

  // Fix malformed URLs: double ? → &
  // e.g. register?inviteCode=ab9nr3?utm_source=... → register?inviteCode=ab9nr3&utm_source=...
  processed = processed.replace(
    /(https?:\/\/[^\s)]*\?[^\s)]*)\?(?=utm_)/g,
    '$1&'
  );

  // Replace all utm_medium values → github-articles
  processed = processed.replace(
    /utm_medium=[a-zA-Z0-9_-]+/g,
    'utm_medium=github-articles'
  );

  // Replace all utm_campaign values → 3rdparty-github
  processed = processed.replace(
    /utm_campaign=[a-zA-Z0-9_-]+/g,
    'utm_campaign=3rdparty-github'
  );

  // Normalize utm_source to 3rdparty (replace blackcastle, labsnews, news, etc.)
  processed = processed.replace(
    /utm_source=[a-zA-Z0-9_-]+/g,
    'utm_source=3rdparty'
  );

  return processed;
}

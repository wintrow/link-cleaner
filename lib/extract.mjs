function decodeHtmlEntities(str) {
  return str
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, num) => String.fromCodePoint(parseInt(num, 10)))
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function metaContent(html, property) {
  const patterns = [
    new RegExp(`property="${property}" content="([^"]*)"`, 'i'),
    new RegExp(`name="${property}" content="([^"]*)"`, 'i'),
    new RegExp(`property='${property}' content='([^']*)'`, 'i'),
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m) return decodeHtmlEntities(m[1]);
  }
  return '';
}

function pageTitle(html) {
  const m = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  return m ? decodeHtmlEntities(m[1].trim()) : '';
}

function isFacebookHost(host) {
  return host === 'facebook.com' || host === 'fb.com' || host === 'fb.watch' || host === 'm.facebook.com';
}

function isFacebookUrl(url) {
  const host = new URL(url).hostname.replace(/^www\./, '');
  return isFacebookHost(host);
}

function isSocialPost(url) {
  const { hostname, pathname } = new URL(url);
  const host = hostname.replace(/^www\./, '');

  if (host === 'threads.com' || host === 'threads.net') return true;
  if ((host === 'twitter.com' || host === 'x.com') && /\/status\//.test(pathname)) return true;
  if (host === 'instagram.com' && /\/(p|reel|reels)\//.test(pathname)) return true;
  if (isFacebookHost(host)) {
    return /\/(posts|permalink|story|photo|share|watch)/.test(pathname) || host === 'fb.watch';
  }

  return false;
}

function cleanTitle(title) {
  return title.replace(/\s+[-|–—]\s+[^-|–—]{1,80}$/, '').trim();
}

function cleanFacebookText(text) {
  return text
    .replace(/^(?:#\S+\s*\n)+/, '')
    .replace(/^#\S+\s*/, '')
    .replace(/\s*\.{3}\s*$/, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function fetchHeaders(url) {
  const headers = { 'Accept-Language': 'zh-TW,zh;q=0.9,en;q=0.8' };
  if (isFacebookUrl(url)) {
    headers['User-Agent'] = 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)';
  } else {
    headers['User-Agent'] = 'Mozilla/5.0 (compatible; LinkCleaner/1.0)';
  }
  return headers;
}

function pickText(html, url) {
  const description = metaContent(html, 'og:description');
  const ogTitle = metaContent(html, 'og:title');
  const twitterTitle = metaContent(html, 'twitter:title');
  const docTitle = pageTitle(html);

  if (isSocialPost(url)) {
    if (isFacebookUrl(url)) {
      const text = cleanFacebookText(description);
      if (text) return text;
    }
    if (ogTitle && /on Threads$/i.test(ogTitle) && description) return description;
    return description || ogTitle || twitterTitle;
  }

  const title = cleanTitle(ogTitle || twitterTitle || docTitle);
  return title || description;
}

export async function extractText(url) {
  const res = await fetch(url, {
    headers: fetchHeaders(url),
    redirect: 'follow',
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const html = await res.text();
  return pickText(html, url).trim();
}

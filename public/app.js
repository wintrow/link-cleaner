const TRACKING_PARAMS = new Set([
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'utm_id',
  'fbclid', 'gclid', 'msclkid', 'mc_cid', 'mc_eid', 'ref', 'source',
  'xmt', 'slof', 'igsh', 'igshid', 'si', 'feature', 'share_id',
  'spm', 'from', 'via', 'mibextid', 's', 't', 'twclid',
]);

const MAX_CHARS = 350;

const input = document.getElementById('input');
const runBtn = document.getElementById('run');
const status = document.getElementById('status');
const output = document.getElementById('output');
const result = document.getElementById('result');
const count = document.getElementById('count');
const copyBtn = document.getElementById('copy');

function cleanUrl(raw) {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  let url;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }

  for (const key of [...url.searchParams.keys()]) {
    if (TRACKING_PARAMS.has(key.toLowerCase())) {
      url.searchParams.delete(key);
    }
  }

  url.hash = '';
  let out = url.toString();
  if (out.endsWith('?')) out = out.slice(0, -1);
  return out;
}

function fitToLimit(url, text) {
  const base = text ? `${url}\n${text}` : url;
  if (base.length <= MAX_CHARS) return base;

  if (!text) return url.slice(0, MAX_CHARS);

  const budget = MAX_CHARS - url.length - 1;
  if (budget <= 0) return url.slice(0, MAX_CHARS);

  let trimmed = text;
  while (trimmed.length > budget) {
    trimmed = trimmed.slice(0, -1);
  }
  return `${url}\n${trimmed}`;
}

function showStatus(msg, isError = false) {
  status.hidden = false;
  status.textContent = msg;
  status.classList.toggle('error', isError);
}

async function process() {
  const raw = input.value.trim();
  if (!raw) {
    showStatus('請輸入網址', true);
    output.hidden = true;
    return;
  }

  const cleaned = cleanUrl(raw);
  if (!cleaned) {
    showStatus('無效的網址', true);
    output.hidden = true;
    return;
  }

  showStatus('取得內容中…');
  output.hidden = true;

  try {
    const res = await fetch(`/api/extract?url=${encodeURIComponent(cleaned)}`);
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || '取得失敗');
    }

    const text = data.text || '';
    const final = fitToLimit(cleaned, text);

    result.textContent = final;
    count.textContent = `${final.length} / ${MAX_CHARS}`;
    output.hidden = false;
    status.hidden = true;
  } catch (err) {
    const fallback = fitToLimit(cleaned, '');
    result.textContent = fallback;
    count.textContent = `${fallback.length} / ${MAX_CHARS}`;
    output.hidden = false;
    showStatus(err.message || '無法取得貼文文字，僅輸出淨化網址', true);
  }
}

runBtn.addEventListener('click', process);

input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) process();
});

copyBtn.addEventListener('click', async () => {
  await navigator.clipboard.writeText(result.textContent);
  copyBtn.textContent = '已複製';
  setTimeout(() => { copyBtn.textContent = '複製'; }, 1500);
});

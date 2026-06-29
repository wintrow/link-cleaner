import { extractText } from '../lib/extract.mjs';

export default async function handler(req, res) {
  const raw = req.query.url;
  const target = Array.isArray(raw) ? raw[0] : raw;

  if (!target) {
    return res.status(400).json({ error: '缺少 url 參數' });
  }

  try {
    const text = await extractText(target);
    if (!text) {
      return res.status(502).json({ error: '無法取得貼文內容' });
    }
    return res.status(200).json({ text });
  } catch (err) {
    return res.status(502).json({ error: err.message || '取得失敗' });
  }
}

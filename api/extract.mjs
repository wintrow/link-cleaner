import { extractText } from '../extract.mjs';

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const target = searchParams.get('url');

  if (!target) {
    return Response.json({ error: '缺少 url 參數' }, { status: 400 });
  }

  try {
    const text = await extractText(target);
    return Response.json({ text });
  } catch (err) {
    return Response.json({ error: err.message || '取得失敗' }, { status: 502 });
  }
}

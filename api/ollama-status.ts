export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  const ollamaTarget = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    const response = await fetch(`${ollamaTarget}/api/tags`, { signal: controller.signal });
    clearTimeout(timeout);
    if (response.ok) {
      const data: any = await response.json();
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ online: true, models: data.models || [] }));
      return;
    }
    throw new Error(`HTTP ${response.status}`);
  } catch (err: any) {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ online: false, error: err.message || 'Offline' }));
  }
}

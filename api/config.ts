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
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(
    JSON.stringify({
      defaultProvider: process.env.DEFAULT_AI_PROVIDER || 'gemini',
      hasGeminiKey: !!process.env.GEMINI_API_KEY,
      hasGroqKey: !!process.env.GROQ_API_KEY,
      defaultGeminiModel: process.env.GEMINI_MODEL || 'gemini-flash-lite-latest',
      defaultGroqModel: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
      defaultOllamaModel: process.env.OLLAMA_MODEL || 'llama3.2',
      ollamaBaseUrl: ollamaTarget,
      hasSmtpConfig: !!(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD),
      smtpUser: process.env.GMAIL_USER || '',
    })
  );
}

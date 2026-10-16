/**
 * Verification Script for AI Providers & System Infrastructure
 * Tests: Google Gemini, Groq Cloud, Local Ollama, and Gmail SMTP
 * 
 * Usage: npm test
 */

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  bold: "\x1b[1m",
};

async function testGemini() {
  const key = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || "gemini-flash-lite-latest";
  
  process.stdout.write(`  [1/4] Testing Google Gemini (${model})... `);
  if (!key) {
    console.log(`${colors.yellow}SKIPPED (GEMINI_API_KEY not set in .env)${colors.reset}`);
    return;
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: "ping" }] }] })
    });

    if (res.ok) {
      console.log(`${colors.green}ONLINE (HTTP 200) ✓${colors.reset}`);
    } else {
      const err = await res.json().catch(() => ({}));
      console.log(`${colors.red}FAILED (${err.error?.message || res.status}) ✗${colors.reset}`);
    }
  } catch (err) {
    console.log(`${colors.red}ERROR (${err.message}) ✗${colors.reset}`);
  }
}

async function testGroq() {
  const key = process.env.GROQ_API_KEY;
  const model = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

  process.stdout.write(`  [2/4] Testing Groq Cloud (${model})... `);
  if (!key) {
    console.log(`${colors.yellow}SKIPPED (GROQ_API_KEY not set in .env)${colors.reset}`);
    return;
  }

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${key}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: "ping" }],
        max_tokens: 5
      })
    });

    if (res.ok) {
      console.log(`${colors.green}ONLINE (HTTP 200) ✓${colors.reset}`);
    } else {
      const err = await res.json().catch(() => ({}));
      console.log(`${colors.yellow}INACTIVE/KEY_ERROR (${err.error?.message || res.status}) - Optional${colors.reset}`);
    }
  } catch (err) {
    console.log(`${colors.yellow}OFFLINE (${err.message}) - Optional${colors.reset}`);
  }
}

async function testOllama() {
  const baseUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
  process.stdout.write(`  [3/4] Testing Local Ollama (${baseUrl})... `);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1500);
    const res = await fetch(`${baseUrl}/api/tags`, { signal: controller.signal });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      const count = data.models?.length || 0;
      console.log(`${colors.green}ONLINE (${count} local models available) ✓${colors.reset}`);
    } else {
      console.log(`${colors.yellow}OFFLINE (HTTP ${res.status}) - Run 'ollama serve' if using local AI${colors.reset}`);
    }
  } catch {
    console.log(`${colors.yellow}OFFLINE (Daemon not running) - Optional${colors.reset}`);
  }
}

async function testSmtp() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  process.stdout.write(`  [4/4] Checking Gmail SMTP Configuration... `);
  if (user && pass) {
    console.log(`${colors.green}CONFIGURED (${user}) ✓${colors.reset}`);
  } else {
    console.log(`${colors.yellow}NOT SET (Add GMAIL_USER & GMAIL_APP_PASSWORD to .env for email export)${colors.reset}`);
  }
}

async function main() {
  console.log(`\n${colors.bold}${colors.cyan}=== NEXT-GEN AI SYSTEM // SYSTEM VERIFICATION ===${colors.reset}\n`);
  await testGemini();
  await testGroq();
  await testOllama();
  await testSmtp();
  console.log(`\n${colors.bold}${colors.green}Verification sequence complete.${colors.reset}\n`);
}

main().catch(console.error);

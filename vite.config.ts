import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import express from 'express';
import nodemailer from 'nodemailer';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const ollamaTarget = env.OLLAMA_BASE_URL || 'http://localhost:11434';

  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'backend-api-plugin',
        configureServer(server) {
          server.middlewares.use('/api', express.json());

          // SMTP Status endpoint
          server.middlewares.use('/api/smtp-status', (req, res, next) => {
            if (req.method !== 'GET') return next();
            const configured = !!(env.GMAIL_USER && env.GMAIL_APP_PASSWORD);
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({
              configured,
              user: env.GMAIL_USER || ''
            }));
          });

          // Configuration endpoint
          server.middlewares.use('/api/config', (req, res, next) => {
            if (req.method !== 'GET') return next();
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({
              defaultProvider: env.DEFAULT_AI_PROVIDER || 'gemini',
              hasGeminiKey: !!env.GEMINI_API_KEY,
              hasGroqKey: !!env.GROQ_API_KEY,
              defaultGeminiModel: env.GEMINI_MODEL || 'gemini-flash-lite-latest',
              defaultGroqModel: env.GROQ_MODEL || 'llama-3.3-70b-versatile',
              defaultOllamaModel: env.OLLAMA_MODEL || 'llama3.2',
              ollamaBaseUrl: ollamaTarget,
              hasSmtpConfig: !!(env.GMAIL_USER && env.GMAIL_APP_PASSWORD),
              smtpUser: env.GMAIL_USER || '',
            }));
          });

          // Ollama status checker
          server.middlewares.use('/api/ollama-status', async (req, res, next) => {
            if (req.method !== 'GET') return next();
            try {
              const controller = new AbortController();
              const timeout = setTimeout(() => controller.abort(), 2000);
              const response = await fetch(`${ollamaTarget}/api/tags`, { signal: controller.signal });
              clearTimeout(timeout);
              if (response.ok) {
                const data = await response.json();
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify({ online: true, models: data.models || [] }));
              }
              throw new Error(`HTTP ${response.status}`);
            } catch (err: any) {
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ online: false, error: err.message || 'Offline' }));
            }
          });

          // Export Email endpoint
          server.middlewares.use('/api/export-email', async (req, res, next) => {
            if (req.method !== 'POST') {
              return next();
            }
            try {
              const { to, subject, html, auth } = (req as any).body || {};
              if (!to || !subject || !html) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify({ success: false, error: 'Missing required fields (to, subject, html)' }));
              }

              const smtpUser = auth?.user?.trim() || env.GMAIL_USER;
              const smtpPass = auth?.pass?.trim() || env.GMAIL_APP_PASSWORD;

              if (!smtpUser || !smtpPass) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify({
                  success: false,
                  error: 'SMTP credentials not configured. Please add GMAIL_USER and GMAIL_APP_PASSWORD in .env or configure them in the SMTP drawer.'
                }));
              }

              const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                  user: smtpUser,
                  pass: smtpPass,
                },
              });

              const info = await transporter.sendMail({
                from: `"NEXT-GEN AI SYSTEM" <${smtpUser}>`,
                to,
                subject,
                html,
              });

              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, messageId: info.messageId }));
            } catch (err: any) {
              console.error("Email Error:", err);
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: err?.message || String(err) }));
            }
          });
        }
      }
    ],
    server: {
      proxy: {
        '/ollama-proxy': {
          target: ollamaTarget,
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/ollama-proxy/, ''),
        }
      }
    },
    define: {
      'process.env': {
        DEFAULT_AI_PROVIDER: env.DEFAULT_AI_PROVIDER || 'gemini',
        GEMINI_API_KEY: env.GEMINI_API_KEY || '',
        GROQ_API_KEY: env.GROQ_API_KEY || '',
        GEMINI_MODEL: env.GEMINI_MODEL || 'gemini-flash-lite-latest',
        GROQ_MODEL: env.GROQ_MODEL || 'llama-3.3-70b-versatile',
        OLLAMA_BASE_URL: ollamaTarget,
        OLLAMA_MODEL: env.OLLAMA_MODEL || 'llama3.2',
        GMAIL_USER: env.GMAIL_USER || '',
        HAS_SMTP_CONFIG: !!(env.GMAIL_USER && env.GMAIL_APP_PASSWORD)
      }
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
  };
});

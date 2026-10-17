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

          // SMTP Status & Verification endpoint
          server.middlewares.use('/api/smtp-status', async (req, res, next) => {
            if (req.method === 'GET') {
              const configured = !!(env.GMAIL_USER && env.GMAIL_APP_PASSWORD);
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({
                configured,
                user: env.GMAIL_USER || ''
              }));
            }

            if (req.method === 'POST') {
              try {
                const { user, pass } = (req as any).body || {};
                const smtpUser = user?.trim() || env.GMAIL_USER?.trim();
                const rawPass = pass?.trim() || env.GMAIL_APP_PASSWORD?.trim();
                const smtpPass = rawPass ? rawPass.replace(/\s+/g, '') : '';

                if (!smtpUser || !smtpPass) {
                  res.statusCode = 400;
                  res.setHeader('Content-Type', 'application/json');
                  return res.end(JSON.stringify({
                    success: false,
                    error: 'Please enter both your Gmail address and 16-character App Password.'
                  }));
                }

                const transporter = nodemailer.createTransport({
                  host: 'smtp.gmail.com',
                  port: 465,
                  secure: true,
                  auth: { user: smtpUser, pass: smtpPass },
                  connectionTimeout: 8000,
                  greetingTimeout: 8000,
                });

                await transporter.verify();

                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify({
                  success: true,
                  message: `Gmail SMTP connected and verified for ${smtpUser}!`
                }));
              } catch (err: any) {
                let msg = err.message || String(err);
                if (
                  msg.includes('Invalid login') ||
                  msg.includes('535-5.7.8') ||
                  msg.includes('BadCredentials') ||
                  msg.includes('Username and Password not accepted')
                ) {
                  msg = 'Invalid Gmail credentials. Use a 16-character App Password from myaccount.google.com/apppasswords, NOT your main account password.';
                }
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify({ success: false, error: msg }));
              }
            }

            return next();
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
              if (!to || !to.includes('@')) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify({ success: false, error: 'A valid recipient email address is required.' }));
              }

              const smtpUser = auth?.user?.trim() || env.GMAIL_USER?.trim();
              const rawPass = auth?.pass?.trim() || env.GMAIL_APP_PASSWORD?.trim();
              const smtpPass = rawPass ? rawPass.replace(/\s+/g, '') : '';

              if (!smtpUser || !smtpPass) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify({
                  success: false,
                  error: 'SMTP credentials not configured. Please open [CONFIGURE_GMAIL_SMTP] in the drawer to enter your Gmail and 16-character App Password, or set GMAIL_USER and GMAIL_APP_PASSWORD in environment variables.'
                }));
              }

              const transporter = nodemailer.createTransport({
                host: 'smtp.gmail.com',
                port: 465,
                secure: true,
                auth: {
                  user: smtpUser,
                  pass: smtpPass,
                },
                connectionTimeout: 10000,
                greetingTimeout: 10000,
              });

              const info = await transporter.sendMail({
                from: `"NEXT-GEN AI SYSTEM" <${smtpUser}>`,
                to,
                subject: subject || 'SYS_OUT // NEXT-GEN AI SESSION REPORT',
                html: html || '<h1>NEXT-GEN AI SYSTEM REPORT</h1>',
              });

              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, messageId: info.messageId }));
            } catch (err: any) {
              console.error("Email Error:", err);
              let errorMessage = err?.message || String(err);
              if (
                errorMessage.includes('Invalid login') ||
                errorMessage.includes('535-5.7.8') ||
                errorMessage.includes('BadCredentials') ||
                errorMessage.includes('Username and Password not accepted')
              ) {
                errorMessage = 'Gmail authentication failed. Please make sure you are using a 16-character Google App Password (from myaccount.google.com/apppasswords), NOT your normal Gmail password.';
              }
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: errorMessage }));
            }
          });
        }
      }
    ],
    server: {
      allowedHosts: true,
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

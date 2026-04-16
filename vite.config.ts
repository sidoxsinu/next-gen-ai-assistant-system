import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import express from 'express';
import nodemailer from 'nodemailer';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [
      react(), 
      tailwindcss(),
      {
        name: 'express-email-api',
        configureServer(server) {
          server.middlewares.use(express.json());
          server.middlewares.use('/api/export-email', async (req, res, next) => {
            if (req.method !== 'POST') {
              return next();
            }
            try {
              const { to, subject, html } = (req as any).body;
              if (!to || !subject || !html) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify({ success: false, error: 'Missing required fields' }));
              }
              
              let transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                  user: env.GMAIL_USER || '',
                  pass: env.GMAIL_APP_PASSWORD || '',
                },
              });

              let info = await transporter.sendMail({
                from: `"NEXT-GEN AI SYSTEM" <${env.GMAIL_USER || ''}>`, // sender address
                to: to, 
                subject: subject, 
                html: html,
              });

              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, messageId: info.messageId }));
            } catch (err) {
              console.error("Email Error:", err);
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: String(err) }));
            }
          });
        }
      }
    ],
    define: {
      'process.env': {
        GEMINI_API_KEY: env.GEMINI_API_KEY || '',
        GROQ_API_KEY: env.GROQ_API_KEY || ''
      }
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});

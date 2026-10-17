import type { IncomingMessage, ServerResponse } from 'http';
import nodemailer from 'nodemailer';

export default async function handler(req: any, res: any) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: false, error: 'Method Not Allowed' }));
    return;
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        body = {};
      }
    } else if (!body) {
      body = await new Promise((resolve) => {
        let data = '';
        req.on('data', (chunk: any) => { data += chunk; });
        req.on('end', () => {
          try { resolve(JSON.parse(data)); } catch { resolve({}); }
        });
      });
    }

    const { to, subject, html, auth } = body || {};

    if (!to || typeof to !== 'string' || !to.includes('@')) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: false, error: 'A valid recipient email address is required.' }));
      return;
    }

    const smtpUser = auth?.user?.trim() || process.env.GMAIL_USER?.trim();
    const rawPass = auth?.pass?.trim() || process.env.GMAIL_APP_PASSWORD?.trim();
    // Strip all spaces from 16-character Google App Passwords
    const smtpPass = rawPass ? rawPass.replace(/\s+/g, '') : '';

    if (!smtpUser || !smtpPass) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        success: false,
        error: 'SMTP credentials not configured. Please open [CONFIGURE_GMAIL_SMTP] in the drawer to enter your Gmail and 16-character App Password, or set GMAIL_USER and GMAIL_APP_PASSWORD in environment variables.'
      }));
      return;
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
    console.error('Email Transmission Error:', err);
    let errorMessage = err?.message || String(err);
    if (
      errorMessage.includes('Invalid login') ||
      errorMessage.includes('535-5.7.8') ||
      errorMessage.includes('BadCredentials') ||
      errorMessage.includes('Username and Password not accepted')
    ) {
      errorMessage =
        'Gmail authentication failed. Please make sure you are using a 16-character Google App Password (from myaccount.google.com/apppasswords), NOT your normal Gmail password.';
    }
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: false, error: errorMessage }));
  }
}

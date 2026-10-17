import nodemailer from 'nodemailer';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  // GET: Check status
  if (req.method === 'GET') {
    const configured = !!(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        configured,
        user: process.env.GMAIL_USER || '',
      })
    );
    return;
  }

  // POST: Verify credentials
  if (req.method === 'POST') {
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

      const { user, pass } = body || {};
      const smtpUser = user?.trim() || process.env.GMAIL_USER?.trim();
      const rawPass = pass?.trim() || process.env.GMAIL_APP_PASSWORD?.trim();
      const smtpPass = rawPass ? rawPass.replace(/\s+/g, '') : '';

      if (!smtpUser || !smtpPass) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(
          JSON.stringify({
            success: false,
            error: 'Please enter both your Gmail address and 16-character App Password.',
          })
        );
        return;
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
      res.end(
        JSON.stringify({
          success: true,
          message: `Gmail SMTP connected and verified for ${smtpUser}!`,
        })
      );
    } catch (err: any) {
      let msg = err.message || String(err);
      if (
        msg.includes('Invalid login') ||
        msg.includes('535-5.7.8') ||
        msg.includes('BadCredentials') ||
        msg.includes('Username and Password not accepted')
      ) {
        msg =
          'Invalid Gmail credentials. Use a 16-character App Password from myaccount.google.com/apppasswords, NOT your main account password.';
      }
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: false, error: msg }));
    }
    return;
  }

  res.statusCode = 405;
  res.end();
}

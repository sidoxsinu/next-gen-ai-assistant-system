import { useState } from 'react';
import { ServerSmtpStatus } from '../types';

interface SmtpDrawerProps {
  emailTarget: string;
  setEmailTarget: (val: string) => void;
  handleEmailTransmission: () => void;
  isEmailing: boolean;
  smtpError: string;
  showConfig: boolean;
  setShowConfig: (val: boolean) => void;
  serverSmtp: ServerSmtpStatus;
  smtpEmail: string;
  setSmtpEmail: (val: string) => void;
  smtpAppPassword: string;
  setSmtpAppPassword: (val: string) => void;
  setSmtpError: (val: string) => void;
  saveSmtpCredentials: () => void;
  clearSmtpCredentials: () => void;
}

export function SmtpDrawer({
  emailTarget,
  setEmailTarget,
  handleEmailTransmission,
  isEmailing,
  smtpError,
  showConfig,
  setShowConfig,
  serverSmtp,
  smtpEmail,
  setSmtpEmail,
  smtpAppPassword,
  setSmtpAppPassword,
  setSmtpError,
  saveSmtpCredentials,
  clearSmtpCredentials,
}: SmtpDrawerProps) {
  const [testStatus, setTestStatus] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const handleTestSmtp = async () => {
    setIsTesting(true);
    setTestStatus(null);
    setSmtpError('');

    try {
      const res = await fetch('/api/smtp-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user: smtpEmail || serverSmtp.user,
          pass: smtpAppPassword,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setTestStatus(`✓ ${data.message || 'SMTP connection verified!'}`);
      } else {
        setTestStatus(`✗ ${data.error || 'SMTP verification failed.'}`);
      }
    } catch (err: any) {
      setTestStatus(`✗ Connection error: ${err.message || 'Cannot reach API'}`);
    } finally {
      setIsTesting(false);
    }
  };

  const hasCredentials = Boolean(
    (smtpEmail && smtpAppPassword) || (serverSmtp.configured && (serverSmtp.user || smtpEmail))
  );

  return (
    <div className="flex flex-col gap-2 relative z-10 w-full">
      {/* Transmit Bar */}
      <div className="flex flex-col sm:flex-row bg-white border-[3px] border-black shadow-[3px_3px_0_#000]">
        <input
          type="email"
          value={emailTarget}
          onChange={(e) => setEmailTarget(e.target.value)}
          placeholder="ENTER_RECIPIENT@GMAIL.COM"
          className="flex-1 bg-transparent p-2.5 font-mono text-xs uppercase font-bold focus:outline-none focus:bg-[#FFE600]"
        />
        <button
          onClick={handleEmailTransmission}
          disabled={isEmailing}
          className="bg-[#FFE600] border-t-[3px] sm:border-t-0 sm:border-l-[3px] text-black border-black px-5 py-2.5 font-black text-center text-xs cursor-pointer hover:bg-black hover:text-[#FFE600] active:translate-y-0.5 transition-colors disabled:opacity-50"
        >
          {isEmailing ? 'TRANSMITTING...' : '[!] TRANSMIT_SESSION_VIA_GMAIL'}
        </button>
      </div>

      {smtpError && (
        <div className="bg-[#FF2D00] text-white border-[3px] border-black p-2 text-xs font-bold uppercase text-center animate-pulse">
          {smtpError}
        </div>
      )}

      {/* SMTP Configuration Accordion */}
      <div className="w-full">
        <button
          onClick={() => setShowConfig(!showConfig)}
          className="bg-black text-white hover:bg-[#FFE600] hover:text-black hover:border-black p-2 border-[3px] border-black font-bold text-xs cursor-pointer w-full text-left uppercase transition-colors flex justify-between items-center shadow-[2px_2px_0_#000]"
        >
          <span>{showConfig ? '[-] COLLAPSE_GMAIL_SMTP_SETTINGS' : '[+] CONFIGURE_GMAIL_SMTP'}</span>
          <span className="text-[0.65rem] font-mono px-2 py-0.5 border border-white">
            {hasCredentials ? 'CREDENTIALS: READY ✓' : 'CREDENTIALS: NOT SET ✗'}
          </span>
        </button>

        {showConfig && (
          <div className="bg-white border-[3px] border-t-0 border-black p-4 flex flex-col gap-3 shadow-[3px_3px_0_#000]">
            <div className="text-[0.7rem] bg-yellow-50 border-[2px] border-black p-2.5 font-mono leading-relaxed">
              <span className="font-bold text-black uppercase block mb-1">
                ℹ️ HOW TO CONFIGURE GMAIL TRANSMISSION:
              </span>
              1. Use your full Gmail address as the Sender Email.
              <br />
              2. Generate a 16-character <b>Google App Password</b> at{' '}
              <a
                href="https://myaccount.google.com/apppasswords"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#0047FF] underline font-bold"
              >
                myaccount.google.com/apppasswords
              </a>{' '}
              (do NOT use your standard Gmail password).
              <br />
              3. Paste the 16-character password below and click <b>[SAVE]</b> or <b>[TEST_CONNECTION]</b>.
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[0.7rem] font-black uppercase">SENDER GMAIL ADDRESS:</label>
                <input
                  type="email"
                  value={smtpEmail}
                  onChange={(e) => {
                    setSmtpEmail(e.target.value);
                    setSmtpError('');
                    setTestStatus(null);
                  }}
                  placeholder={serverSmtp.user || 'your-email@gmail.com'}
                  className="border-[2px] border-black p-2 bg-[#E5E5E5] focus:outline-none focus:bg-white text-xs font-mono"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[0.7rem] font-black uppercase">GMAIL 16-DIGIT APP PASSWORD:</label>
                <input
                  type="password"
                  value={smtpAppPassword}
                  onChange={(e) => {
                    setSmtpAppPassword(e.target.value);
                    setSmtpError('');
                    setTestStatus(null);
                  }}
                  placeholder="xxxx xxxx xxxx xxxx"
                  className="border-[2px] border-black p-2 bg-[#E5E5E5] focus:outline-none focus:bg-white text-xs font-mono"
                />
              </div>
            </div>

            {testStatus && (
              <div
                className={`p-2 border-[2px] border-black font-mono text-xs font-bold ${
                  testStatus.startsWith('✓') ? 'bg-green-100 text-green-900' : 'bg-red-100 text-red-900'
                }`}
              >
                {testStatus}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-gray-200">
              <button
                type="button"
                onClick={saveSmtpCredentials}
                className="bg-[#FFE600] text-black border-[2px] border-black px-3 py-1.5 text-xs font-black uppercase hover:bg-black hover:text-[#FFE600] active:translate-y-0.5 cursor-pointer"
              >
                [SAVE_CREDENTIALS]
              </button>
              <button
                type="button"
                onClick={handleTestSmtp}
                disabled={isTesting}
                className="bg-[#0047FF] text-white border-[2px] border-black px-3 py-1.5 text-xs font-black uppercase hover:bg-black active:translate-y-0.5 cursor-pointer disabled:opacity-50"
              >
                {isTesting ? '[TESTING...]' : '[TEST_CONNECTION]'}
              </button>
              <button
                type="button"
                onClick={() => {
                  clearSmtpCredentials();
                  setTestStatus(null);
                }}
                className="bg-[#FF2D00] text-white border-[2px] border-black px-3 py-1.5 text-xs font-black uppercase hover:bg-black active:translate-y-0.5 cursor-pointer"
              >
                [CLEAR_CREDENTIALS]
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

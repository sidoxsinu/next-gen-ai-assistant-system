import { ServerSmtpStatus } from '../types';

interface SmtpDrawerProps {
  onSaveToKnowledgeTrail: () => void;
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
  onSaveToKnowledgeTrail,
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
  clearSmtpCredentials
}: SmtpDrawerProps) {
  return (
    <div className="flex flex-col gap-3 relative z-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <button
          onClick={onSaveToKnowledgeTrail}
          className="bg-[#0047FF] hover:bg-black text-white p-3 border-[3px] border-black font-bold text-center text-sm cursor-pointer active:translate-y-1"
        >
          [+] SAVE_TO_KNOWLEDGE_TRAIL
        </button>

        <div className="flex flex-col gap-0 w-full animate-none">
          <div className="flex bg-white border-[3px] border-black mb-[2px]">
            <input
              type="email"
              value={emailTarget}
              onChange={(e) => setEmailTarget(e.target.value)}
              placeholder="TARGET@DOMAIN.COM"
              className="flex-1 bg-transparent p-2 font-mono text-xs uppercase font-bold focus:outline-none focus:bg-[#FFE600]"
            />
            <button
              onClick={handleEmailTransmission}
              disabled={isEmailing}
              className="bg-[#FFE600] border-l-[3px] text-black border-black px-3 font-bold text-center text-xs cursor-pointer hover:invert active:translate-y-1 disabled:opacity-50"
            >
              {isEmailing ? 'SENDING...' : '[!] TRANSMIT_VIA_GMAIL'}
            </button>
          </div>
          {smtpError && (
            <div className="bg-[#FF2D00] text-white border-[3px] border-black p-1 text-[0.6rem] font-bold uppercase text-center animate-pulse mb-2">
              {smtpError}
            </div>
          )}

          {/* SETUP SMTP */}
          <div className="w-full">
            <button
              onClick={() => setShowConfig(!showConfig)}
              className="bg-black hover:bg-white hover:text-black hover:border-black text-white p-2 border-[3px] border-black font-bold text-[0.7rem] cursor-pointer w-full text-left uppercase transition-colors flex justify-between items-center"
            >
              <span>{showConfig ? '[-] COLLAPSE_SMTP_CONFIG' : '[+] CONFIGURE_GMAIL_SMTP'}</span>
              <span className="text-[0.6rem]">
                {serverSmtp.configured ? 'ENV_READY ✓' : smtpEmail ? 'LOCAL_SET ✓' : 'NOT_SET ✗'}
              </span>
            </button>
            {showConfig && (
              <div className="bg-white border-[3px] border-t-0 border-black p-4 flex flex-col gap-3">
                {serverSmtp.configured && (
                  <div className="bg-green-50 border-[2px] border-green-600 p-2 text-xs text-green-900 font-mono">
                    ✓ Server .env has configured SMTP for: <span className="font-bold">{serverSmtp.user}</span>.
                    <br />
                    (You can dispatch emails directly or override credentials below).
                  </div>
                )}

                <div className="flex flex-col gap-1">
                  <label className="text-[0.65rem] font-black uppercase">SENDER_EMAIL:</label>
                  <input
                    type="email"
                    value={smtpEmail}
                    onChange={(e) => {
                      setSmtpEmail(e.target.value);
                      setSmtpError('');
                    }}
                    placeholder={serverSmtp.user || 'e.g. user@gmail.com'}
                    className="border-[3px] border-black p-2 bg-[#E5E5E5] focus:outline-none focus:bg-[#FFE600] text-xs font-mono"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[0.65rem] font-black uppercase">GMAIL APP PASSWORD:</label>
                  <input
                    type="password"
                    value={smtpAppPassword}
                    onChange={(e) => {
                      setSmtpAppPassword(e.target.value);
                      setSmtpError('');
                    }}
                    placeholder="16-character app password (xxxx xxxx xxxx xxxx)"
                    className="border-[3px] border-black p-2 bg-[#E5E5E5] focus:outline-none focus:bg-[#FFE600] text-xs font-mono"
                  />
                  <a
                    href="https://myaccount.google.com/apppasswords"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[0.55rem] font-bold text-gray-500 uppercase mt-1 hover:text-[#0047FF]"
                  >
                    USE GMAIL APP PASSWORD — NOT YOUR ACCOUNT PASSWORD → myaccount.google.com/apppasswords
                  </a>
                </div>

                <div className="border-[2px] border-[#FF2D00] p-2 bg-gray-50 mt-1">
                  <span className="text-[0.55rem] font-black text-[#FF2D00] uppercase block text-center">
                    [!] YOU CAN ALSO DEFINE GMAIL_USER &amp; GMAIL_APP_PASSWORD DIRECTLY IN YOUR .ENV FILE
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <button
                    onClick={saveSmtpCredentials}
                    className="bg-[#FFE600] text-black border-[3px] border-black px-3 py-2 text-[0.7rem] font-black uppercase hover:bg-black hover:text-[#FFE600] active:translate-y-1 transition-all artistic-shadow cursor-pointer"
                  >
                    [SAVE_CREDENTIALS]
                  </button>
                  <button
                    onClick={clearSmtpCredentials}
                    className="bg-[#FF2D00] text-white border-[3px] border-black px-3 py-2 text-[0.7rem] font-black uppercase hover:bg-black hover:text-[#FF2D00] active:translate-y-1 transition-all cursor-pointer"
                  >
                    [CLEAR_CREDENTIALS]
                  </button>
                  <div className="ml-auto text-[0.65rem] font-black uppercase mt-2 w-full text-right sm:w-auto sm:mt-0">
                    {(smtpEmail && smtpAppPassword) || serverSmtp.configured ? (
                      <span className="text-green-600">CREDENTIALS: READY ✓</span>
                    ) : (
                      <span className="text-[#FF2D00]">CREDENTIALS: NOT SET ✗</span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

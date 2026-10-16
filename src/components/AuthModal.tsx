import React from 'react';
import { Cpu } from 'lucide-react';
import { AIProvider, OllamaStatus } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  provider: AIProvider;
  geminiKey: string;
  groqKey: string;
  geminiModel: string;
  groqModel: string;
  ollamaModel: string;
  ollamaBaseUrl: string;
  ollamaStatus: OllamaStatus;
  isCheckingOllama: boolean;
  authTempKey: string;
  authError: string | null;
  hasValidActiveCredentials: boolean;
  onSelectProvider: (p: AIProvider) => void;
  onChangeAuthTempKey: (val: string) => void;
  onChangeGeminiModel: (val: string) => void;
  onChangeGroqModel: (val: string) => void;
  onChangeOllamaModel: (val: string) => void;
  onChangeOllamaBaseUrl: (val: string) => void;
  onCheckOllamaStatus: () => void;
  onSubmit: () => void;
  onClose: () => void;
}

export function AuthModal({
  isOpen,
  provider,
  geminiKey,
  groqKey,
  geminiModel,
  groqModel,
  ollamaModel,
  ollamaBaseUrl,
  ollamaStatus,
  isCheckingOllama,
  authTempKey,
  authError,
  hasValidActiveCredentials,
  onSelectProvider,
  onChangeAuthTempKey,
  onChangeGeminiModel,
  onChangeGroqModel,
  onChangeOllamaModel,
  onChangeOllamaBaseUrl,
  onCheckOllamaStatus,
  onSubmit,
  onClose
}: AuthModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 z-[9999] flex items-center justify-center p-4">
      <div
        className="bg-white border-[6px] border-black p-6 md:p-8 max-w-xl w-full flex flex-col gap-5"
        style={{ boxShadow: '12px 12px 0px #000' }}
      >
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-black uppercase m-0 leading-tight flex items-center gap-2">
              <Cpu className="w-6 h-6 text-[#FF2D00]" />
              AI_KERNEL_SETUP
            </h2>
            <p className="text-xs font-bold uppercase opacity-60 mt-1">
              SELECT YOUR AI ENGINE &amp; CONFIGURE ACCESS
            </p>
          </div>
          {hasValidActiveCredentials && (
            <button
              onClick={onClose}
              className="bg-black text-white hover:bg-[#FF2D00] px-3 py-1 text-xs font-black uppercase cursor-pointer"
            >
              ✕ CLOSE
            </button>
          )}
        </div>

        {/* Provider Switcher Tabs */}
        <div className="grid grid-cols-3 gap-2 border-[3px] border-black p-1 bg-[#E5E5E5]">
          <button
            type="button"
            onClick={() => onSelectProvider('GEMINI')}
            className={`p-2 text-center text-xs font-black uppercase cursor-pointer transition-all ${
              provider === 'GEMINI'
                ? 'bg-[#0047FF] text-white shadow-[2px_2px_0px_#000]'
                : 'bg-white hover:bg-yellow-200 text-black'
            }`}
          >
            GOOGLE GEMINI
          </button>
          <button
            type="button"
            onClick={() => onSelectProvider('GROQ')}
            className={`p-2 text-center text-xs font-black uppercase cursor-pointer transition-all ${
              provider === 'GROQ'
                ? 'bg-[#FF2D00] text-white shadow-[2px_2px_0px_#000]'
                : 'bg-white hover:bg-yellow-200 text-black'
            }`}
          >
            GROQ CLOUD
          </button>
          <button
            type="button"
            onClick={() => onSelectProvider('OLLAMA')}
            className={`p-2 text-center text-xs font-black uppercase cursor-pointer transition-all ${
              provider === 'OLLAMA'
                ? 'bg-[#FFE600] text-black shadow-[2px_2px_0px_#000]'
                : 'bg-white hover:bg-yellow-200 text-black'
            }`}
          >
            LOCAL OLLAMA
          </button>
        </div>

        {/* Provider Details & Inputs */}
        {provider === 'GEMINI' && (
          <div className="flex flex-col gap-3">
            <div className="bg-[#0047FF]/10 border-[2px] border-[#0047FF] p-3 text-xs">
              <span className="font-black text-[#0047FF] block uppercase">PROVIDER: GOOGLE GEMINI (RECOMMENDED)</span>
              <span className="text-gray-700 font-mono text-[0.7rem] block mt-1">
                Powered by Google&apos;s multimodal generative engine. Free API keys available from Google AI Studio.
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-black uppercase">GEMINI API KEY:</label>
              <input
                type="password"
                value={authTempKey}
                onChange={(e) => onChangeAuthTempKey(e.target.value)}
                placeholder={geminiKey ? "Key configured in .env (or enter new key)" : "AIzaSy..."}
                className="w-full border-[3px] border-black p-3 font-mono text-sm focus:outline-none focus:bg-[#FFE600]"
              />
              {geminiKey && (
                <span className="text-[0.65rem] text-green-700 font-bold uppercase mt-1">
                  ✓ ACTIVE KEY DETECTED ({geminiKey.slice(0, 6)}...{geminiKey.slice(-4)})
                </span>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-black uppercase">MODEL:</label>
              <select
                value={geminiModel}
                onChange={(e) => onChangeGeminiModel(e.target.value)}
                className="border-[3px] border-black p-2 font-mono text-xs bg-white font-bold uppercase"
              >
                <option value="gemini-flash-lite-latest">gemini-flash-lite-latest (Fast &amp; Reliable)</option>
                <option value="gemini-3.5-flash">gemini-3.5-flash</option>
                <option value="gemini-3.8-flash">gemini-3.8-flash</option>
                <option value="gemini-flash-latest">gemini-flash-latest</option>
              </select>
            </div>

            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold uppercase text-[#0047FF] hover:underline"
            >
              GET FREE GEMINI API KEY → aistudio.google.com/apikey
            </a>
          </div>
        )}

        {provider === 'GROQ' && (
          <div className="flex flex-col gap-3">
            <div className="bg-[#FF2D00]/10 border-[2px] border-[#FF2D00] p-3 text-xs">
              <span className="font-black text-[#FF2D00] block uppercase">PROVIDER: GROQ CLOUD (LPU INFERENCE)</span>
              <span className="text-gray-700 font-mono text-[0.7rem] block mt-1">
                Ultra-fast inference via Groq LPUs running Llama 3.3.
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-black uppercase">GROQ API KEY:</label>
              <input
                type="password"
                value={authTempKey}
                onChange={(e) => onChangeAuthTempKey(e.target.value)}
                placeholder={groqKey ? "Key configured in .env (or enter new key)" : "gsk_..."}
                className="w-full border-[3px] border-black p-3 font-mono text-sm focus:outline-none focus:bg-[#FFE600]"
              />
              {groqKey && (
                <span className="text-[0.65rem] text-green-700 font-bold uppercase mt-1">
                  ✓ ACTIVE KEY DETECTED ({groqKey.slice(0, 6)}...{groqKey.slice(-4)})
                </span>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-black uppercase">MODEL:</label>
              <select
                value={groqModel}
                onChange={(e) => onChangeGroqModel(e.target.value)}
                className="border-[3px] border-black p-2 font-mono text-xs bg-white font-bold uppercase"
              >
                <option value="llama-3.3-70b-versatile">llama-3.3-70b-versatile</option>
                <option value="llama-3.1-8b-instant">llama-3.1-8b-instant (Fast / Low Quota)</option>
                <option value="mixtral-8x7b-32768">mixtral-8x7b-32768</option>
              </select>
            </div>

            <a
              href="https://console.groq.com/keys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold uppercase text-[#FF2D00] hover:underline"
            >
              GET GROQ API KEY → console.groq.com/keys
            </a>
          </div>
        )}

        {provider === 'OLLAMA' && (
          <div className="flex flex-col gap-3">
            <div className="bg-[#FFE600]/20 border-[2px] border-black p-3 text-xs">
              <span className="font-black block uppercase">PROVIDER: LOCAL OLLAMA (OFFLINE / FREE)</span>
              <span className="text-gray-700 font-mono text-[0.7rem] block mt-1">
                Connects directly to your local Ollama server. No cloud API key needed!
              </span>
            </div>

            <div className="flex items-center justify-between border-[2px] border-black p-2 bg-[#E5E5E5]">
              <span className="text-[0.7rem] font-black uppercase">SERVER STATUS:</span>
              <div className="flex items-center gap-2">
                <span
                  className={`text-[0.7rem] font-bold uppercase px-2 py-0.5 border border-black ${
                    ollamaStatus.online ? 'bg-green-400 text-black' : 'bg-red-400 text-white'
                  }`}
                >
                  {ollamaStatus.online ? 'ONLINE ✓' : 'OFFLINE ✗'}
                </span>
                <button
                  type="button"
                  onClick={onCheckOllamaStatus}
                  disabled={isCheckingOllama}
                  className="border border-black bg-white px-2 py-0.5 text-[0.65rem] font-bold uppercase hover:bg-yellow-200 cursor-pointer"
                >
                  {isCheckingOllama ? 'CHECKING...' : 'RECHECK'}
                </button>
              </div>
            </div>

            {!ollamaStatus.online && (
              <div className="bg-red-50 border-[2px] border-red-500 p-2 text-[0.65rem] text-red-800 font-mono">
                ⚠ Ollama is not detected at {ollamaBaseUrl}.
                <br />
                To start it in your terminal, run: <span className="font-bold underline">ollama serve</span> or run a model: <span className="font-bold underline">ollama run llama3.2</span>
              </div>
            )}

            <div className="flex flex-col gap-1">
              <label className="text-xs font-black uppercase">MODEL NAME:</label>
              {ollamaStatus.online && ollamaStatus.models.length > 0 ? (
                <select
                  value={ollamaModel}
                  onChange={(e) => onChangeOllamaModel(e.target.value)}
                  className="border-[3px] border-black p-2 font-mono text-xs bg-white font-bold"
                >
                  {ollamaStatus.models.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={ollamaModel}
                  onChange={(e) => onChangeOllamaModel(e.target.value)}
                  placeholder="e.g. llama3.2, mistral, llama3"
                  className="border-[3px] border-black p-2 font-mono text-xs bg-white focus:outline-none focus:bg-[#FFE600]"
                />
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-black uppercase">OLLAMA BASE URL:</label>
              <input
                type="text"
                value={ollamaBaseUrl}
                onChange={(e) => onChangeOllamaBaseUrl(e.target.value)}
                className="border-[3px] border-black p-2 font-mono text-xs bg-white focus:outline-none focus:bg-[#FFE600]"
              />
            </div>
          </div>
        )}

        {authError && (
          <div className="bg-[#FF2D00] text-white p-2 text-xs font-bold uppercase animate-pulse border-[2px] border-black">
            {authError}
          </div>
        )}

        <button
          onClick={onSubmit}
          className="w-full bg-[#FFE600] border-[4px] border-black p-4 font-black uppercase text-lg hover:bg-black hover:text-[#FFE600] transition-colors active:translate-y-1 cursor-pointer"
          style={{ boxShadow: '6px 6px 0px #000' }}
        >
          [ACTIVATE_AI_KERNEL]
        </button>
      </div>
    </div>
  );
}

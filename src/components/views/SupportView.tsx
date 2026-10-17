import React, { useState } from 'react';
import { AIProvider, Message, ServerSmtpStatus } from '../../types';
import { TerminalOutput } from '../TerminalOutput';
import { SmtpDrawer } from '../SmtpDrawer';

interface SupportViewProps {
  provider: AIProvider;
  activeModelDisplay: string;
  messages: Message[];
  isTyping: boolean;
  scrollRef: React.RefObject<HTMLDivElement | null>;
  onSendMessage: (query: string) => void;
  playTTS: (text: string) => void;
  copyMessage: (id: string, text: string) => void;
  copiedId: string | null;
  togglePin: (id: string) => void;
  pinnedMessageIds: string[];
  verifyFacts: (id: string, fullText: string) => void;
  closeFactCheck: (id: string) => void;
  // Multimodal & Controls
  input: string;
  setInput: (val: string) => void;
  outputLang: string;
  setOutputLang: (val: string) => void;
  streamSpeed: number;
  setStreamSpeed: (val: number) => void;
  exportSession: () => void;
  loadHistory: () => void;
  startSTT: () => void;
  isRecording: boolean;
  complexityMode: 'SIMPLE' | 'DETAILED';
  setComplexityMode: (val: 'SIMPLE' | 'DETAILED') => void;
  haltTTS: () => void;
  // Email / SMTP
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

export function SupportView({
  provider,
  activeModelDisplay,
  messages,
  isTyping,
  scrollRef,
  onSendMessage,
  playTTS,
  copyMessage,
  copiedId,
  togglePin,
  pinnedMessageIds,
  verifyFacts,
  closeFactCheck,
  input,
  setInput,
  outputLang,
  setOutputLang,
  streamSpeed,
  setStreamSpeed,
  exportSession,
  loadHistory,
  startSTT,
  isRecording,
  complexityMode,
  setComplexityMode,
  haltTTS,
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
}: SupportViewProps) {
  const [severity, setSeverity] = useState<'NORMAL' | 'HIGH' | 'CRITICAL'>('NORMAL');
  const [category, setCategory] = useState<'GENERAL' | 'TECHNICAL' | 'BILLING' | 'INCIDENT'>('TECHNICAL');

  const handleSupportMacro = (macroPrompt: string) => {
    const context = `[CATEGORY: ${category} | PRIORITY: ${severity}]`;
    const query = `${macroPrompt} ${context}: ${input || 'Customer reported service disruption'}`;
    setInput(query);
    onSendMessage(query);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Support Telemetry Bar */}
      <div data-tour="incident-telemetry" className="bg-[#00CC44] text-black border-b-[3px] border-black p-3 px-5 flex flex-wrap items-center justify-between gap-3 shadow-[0_2px_0_#000]">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="bg-black text-[#00CC44] font-black text-xs px-2.5 py-1 tracking-wider uppercase border border-black">
            SUPPORT_BOT // RESOLUTION_DESK
          </span>
          <span className="font-bold text-xs uppercase hidden md:inline">
            AI-POWERED CUSTOMER SUPPORT &amp; INCIDENT TRIAGE ASSISTANT
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap text-xs">
          {/* Priority selector */}
          <div className="flex items-center gap-1 bg-white text-black px-2 py-1 border border-black font-bold text-[0.7rem]">
            <span>PRIORITY:</span>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value as any)}
              className="bg-transparent font-black cursor-pointer uppercase focus:outline-none"
            >
              <option value="NORMAL">NORMAL</option>
              <option value="HIGH">HIGH</option>
              <option value="CRITICAL">CRITICAL</option>
            </select>
          </div>

          {/* Category selector */}
          <div className="flex items-center gap-1 bg-white text-black px-2 py-1 border border-black font-bold text-[0.7rem]">
            <span>CATEGORY:</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="bg-transparent font-black cursor-pointer uppercase focus:outline-none"
            >
              <option value="TECHNICAL">TECHNICAL</option>
              <option value="BILLING">BILLING</option>
              <option value="INCIDENT">INCIDENT</option>
              <option value="GENERAL">GENERAL</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Support Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[330px_1fr] overflow-hidden">
        {/* Left Console: Support Desk Controls */}
        <section className="bg-white border-black border-r-[3px] p-4 flex flex-col gap-4 overflow-y-auto">
          {/* Triage Guidance Card */}
          <div data-tour="crm-context" className="border-[2px] border-black p-3 bg-gray-50 flex flex-col gap-1.5 text-[0.68rem] font-mono">
            <div className="flex items-center justify-between border-b border-black pb-1">
              <span className="font-black uppercase text-black">RESOLUTION_MODE</span>
              <span className={`px-1.5 py-0.5 font-black text-[0.6rem] border border-black ${
                severity === 'CRITICAL' ? 'bg-red-500 text-white' : severity === 'HIGH' ? 'bg-[#FFE600] text-black' : 'bg-[#00CC44] text-black'
              }`}>
                {severity}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">CATEGORY:</span>
              <span className="font-bold text-black">{category}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">KERNEL:</span>
              <span className="font-bold text-black">{provider}</span>
            </div>
          </div>

          {/* User Input Area */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center">
              <label className="font-black uppercase text-[0.75rem]">CUSTOMER_ISSUE_OR_TICKET:</label>
            </div>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  onSendMessage(input);
                }
              }}
              placeholder={`PASTE CUSTOMER INQUIRY OR ISSUE...\nE.g.: "User unable to connect to database cluster after migration"`}
              className="border-[3px] border-black p-3 bg-[#E5E5E5] focus:outline-none focus:bg-white h-28 font-mono text-xs uppercase resize-none shadow-[inset_2px_2px_0_#000]"
            />
          </div>

          {/* Rapid Resolution Macros */}
          <div data-tour="support-macros" className="flex flex-col gap-1.5">
            <span className="font-black uppercase text-[0.65rem] bg-black text-[#00CC44] px-2 py-0.5 inline-block self-start">
              RESOLUTION_MACROS:
            </span>
            <div className="grid grid-cols-1 gap-1">
              <button
                onClick={() => handleSupportMacro('Draft an empathetic, clear customer acknowledgement and initial triage steps for')}
                className="text-left border-[2px] border-black p-1.5 bg-white hover:bg-[#00CC44] text-[0.65rem] font-bold uppercase active:translate-y-0.5 transition-all cursor-pointer"
              >
                [⚡ AUTO_ACKNOWLEDGE_CUSTOMER]
              </button>
              <button
                onClick={() => handleSupportMacro('Provide step-by-step technical troubleshooting and diagnostic commands for')}
                className="text-left border-[2px] border-black p-1.5 bg-white hover:bg-[#FFE600] text-[0.65rem] font-bold uppercase active:translate-y-0.5 transition-all cursor-pointer"
              >
                [🔍 TROUBLESHOOT_TECHNICAL_ISSUE]
              </button>
              <button
                onClick={() => handleSupportMacro('Draft a comprehensive Root Cause Analysis (RCA) and mitigation plan for')}
                className="text-left border-[2px] border-black p-1.5 bg-white hover:bg-[#FFE600] text-[0.65rem] font-bold uppercase active:translate-y-0.5 transition-all cursor-pointer"
              >
                [📋 GENERATE_INCIDENT_RCA]
              </button>
              <button
                onClick={() => handleSupportMacro('Compose a polite billing and refund response for')}
                className="text-left border-[2px] border-black p-1.5 bg-white hover:bg-[#00CC44] text-[0.65rem] font-bold uppercase active:translate-y-0.5 transition-all cursor-pointer"
              >
                [💳 DRAFT_BILLING_REFUND_REPLY]
              </button>
              <button
                onClick={() => handleSupportMacro('Provide security verification and password reset instructions for')}
                className="text-left border-[2px] border-black p-1.5 bg-white hover:bg-gray-100 text-[0.65rem] font-bold uppercase active:translate-y-0.5 transition-all cursor-pointer"
              >
                [🔒 VERIFY_ACCOUNT_SECURITY]
              </button>
            </div>
          </div>

          {/* Controls: Language & Stream */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label className="font-black uppercase text-[0.6rem]">LANG:</label>
              <select
                value={outputLang}
                onChange={(e) => setOutputLang(e.target.value)}
                className="border-[2px] border-black p-1 bg-white text-[0.65rem] font-bold uppercase focus:outline-none cursor-pointer"
              >
                {['English', 'Spanish', 'French', 'German', 'Hindi', 'Arabic', 'Japanese'].map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-black uppercase text-[0.6rem]">STREAM:</label>
              <div className="flex gap-1 flex-1">
                <button
                  onClick={() => setStreamSpeed(50)}
                  className={`flex-1 border-[2px] border-black text-[0.55rem] font-bold cursor-pointer ${
                    streamSpeed === 50 ? 'bg-[#FFE600]' : 'bg-white hover:bg-gray-100'
                  }`}
                >
                  SLW
                </button>
                <button
                  onClick={() => setStreamSpeed(0)}
                  className={`flex-1 border-[2px] border-black text-[0.55rem] font-bold cursor-pointer ${
                    streamSpeed === 0 ? 'bg-[#00CC44] text-black font-black' : 'bg-white hover:bg-gray-100'
                  }`}
                >
                  FST
                </button>
              </div>
            </div>
          </div>

          {/* Multimodal Actions */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={startSTT}
              className={`border-[2px] border-black p-2 font-bold text-[0.65rem] uppercase active:translate-y-0.5 cursor-pointer ${
                isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-white hover:bg-gray-100'
              }`}
            >
              {isRecording ? 'LISTENING...' : 'VOICE_COMMAND'}
            </button>
            <button
              onClick={() => setComplexityMode(complexityMode === 'SIMPLE' ? 'DETAILED' : 'SIMPLE')}
              className={`border-[2px] border-black p-2 font-black text-[0.65rem] uppercase active:translate-y-0.5 cursor-pointer ${
                complexityMode === 'SIMPLE' ? 'bg-[#00CC44] text-black' : 'bg-black text-[#00CC44]'
              }`}
              title="Toggle response style: Simple (Concise) vs Detailed (In-depth)"
            >
              STYLE: {complexityMode}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={exportSession}
              className="border-[2px] border-black p-1.5 bg-black text-white hover:bg-[#00CC44] hover:text-black text-[0.65rem] font-bold uppercase active:translate-y-0.5 cursor-pointer"
            >
              EXPORT_LOGS
            </button>
            <button
              onClick={loadHistory}
              className="border-[2px] border-black p-1.5 bg-white text-black hover:bg-[#00CC44] text-[0.65rem] font-bold uppercase active:translate-y-0.5 cursor-pointer"
            >
              LOAD_HISTORY
            </button>
          </div>

          {/* Submit */}
          <button
            onClick={() => onSendMessage(input)}
            disabled={isTyping || !input.trim()}
            className="bg-[#00CC44] text-black border-[3px] border-black p-3 font-black text-center uppercase artistic-shadow artistic-shadow-active disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-400 cursor-pointer"
          >
            DISPATCH_RESOLUTION_QUERY
          </button>
        </section>

        {/* Center: Live Terminal & Resolution Log */}
        <section className="bg-[#E5E5E5] p-4 flex flex-col gap-3 overflow-hidden">
          <TerminalOutput
            provider={provider}
            activeModelDisplay={activeModelDisplay}
            messages={messages}
            isTyping={isTyping}
            scrollRef={scrollRef}
            onFollowUp={onSendMessage}
            playTTS={playTTS}
            copyMessage={copyMessage}
            copiedId={copiedId}
            togglePin={togglePin}
            pinnedMessageIds={pinnedMessageIds}
            verifyFacts={verifyFacts}
            closeFactCheck={closeFactCheck}
          />

          <SmtpDrawer
            emailTarget={emailTarget}
            setEmailTarget={setEmailTarget}
            handleEmailTransmission={handleEmailTransmission}
            isEmailing={isEmailing}
            smtpError={smtpError}
            showConfig={showConfig}
            setShowConfig={setShowConfig}
            serverSmtp={serverSmtp}
            smtpEmail={smtpEmail}
            setSmtpEmail={setSmtpEmail}
            smtpAppPassword={smtpAppPassword}
            setSmtpAppPassword={setSmtpAppPassword}
            setSmtpError={setSmtpError}
            saveSmtpCredentials={saveSmtpCredentials}
            clearSmtpCredentials={clearSmtpCredentials}
          />
        </section>
      </div>
    </div>
  );
}

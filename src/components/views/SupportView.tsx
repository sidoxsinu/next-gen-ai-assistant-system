import React, { useState, useEffect } from 'react';
import { AIProvider, Message, ServerSmtpStatus, SupportTicket } from '../../types';
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
  complexityMode: 'ELI5' | 'EXPERT';
  setComplexityMode: (val: 'ELI5' | 'EXPERT') => void;
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
  // Support Incident State
  const [ticket, setTicket] = useState<SupportTicket>({
    id: 'INC-84920',
    severity: 'P1 - CRITICAL',
    customerName: 'Alex Mercer (Lead SRE)',
    accountTier: 'ENTERPRISE_VIP ($12.5k MRR)',
    slaSecondsRemaining: 900, // 15 mins
    sentiment: 'FRUSTRATED'
  });
  const [ticketStatus, setTicketStatus] = useState<'OPEN' | 'IN_TRIAGE' | 'ESCALATED' | 'RESOLVED'>('OPEN');

  // Live SLA countdown ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setTicket((prev) => ({
        ...prev,
        slaSecondsRemaining: Math.max(0, prev.slaSecondsRemaining - 1)
      }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatSlaTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
      .toString()
      .padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const handleGenerateNewTicket = () => {
    const randomId = Math.floor(10000 + Math.random() * 90000);
    setTicket({
      id: `INC-${randomId}`,
      severity: 'P1 - CRITICAL',
      customerName: 'DevOps Escalation Team',
      accountTier: 'ENTERPRISE_VIP ($12.5k MRR)',
      slaSecondsRemaining: 900,
      sentiment: 'NEUTRAL'
    });
    setTicketStatus('OPEN');
  };

  const handleSupportMacro = (macroPrompt: string) => {
    const query = `${macroPrompt} regarding ticket #${ticket.id}: ${input || 'Customer reported API disruption'}`;
    setInput(query);
    onSendMessage(query);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Support Incident Ops Telemetry Bar */}
      <div className="bg-[#00CC44] text-black border-b-[3px] border-black p-3 px-5 flex flex-wrap items-center justify-between gap-3 shadow-[0_2px_0_#000]">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="bg-black text-[#00CC44] font-black text-xs px-2.5 py-1 tracking-wider uppercase border border-black">
            TICKET #{ticket.id}
          </span>
          <span
            className={`font-black text-xs px-2 py-0.5 border border-black uppercase ${
              ticket.severity.includes('P1') ? 'bg-[#FF2D00] text-white animate-pulse' : 'bg-black text-white'
            }`}
          >
            {ticket.severity}
          </span>
          <span className="font-bold text-xs uppercase hidden md:inline">
            CLIENT: {ticket.customerName}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap text-xs">
          {/* SLA Countdown Timer */}
          <div className="flex items-center gap-1.5 bg-black text-white px-3 py-1 border border-black font-mono">
            <span className="text-[#FFE600] font-black">SLA_BREACH_IN:</span>
            <span
              className={`font-black text-sm ${
                ticket.slaSecondsRemaining < 300 ? 'text-[#FF2D00] animate-pulse' : 'text-white'
              }`}
            >
              {formatSlaTime(ticket.slaSecondsRemaining)}
            </span>
          </div>

          {/* Ticket Status Selector */}
          <div className="flex items-center gap-1 bg-white text-black px-2 py-1 border border-black font-bold text-[0.7rem]">
            <span>STATUS:</span>
            <select
              value={ticketStatus}
              onChange={(e) => setTicketStatus(e.target.value as any)}
              className="bg-transparent font-black cursor-pointer uppercase focus:outline-none"
            >
              <option value="OPEN">OPEN</option>
              <option value="IN_TRIAGE">IN_TRIAGE</option>
              <option value="ESCALATED">ESCALATED</option>
              <option value="RESOLVED">RESOLVED</option>
            </select>
          </div>

          {/* Customer Sentiment */}
          <div className="flex items-center gap-1 bg-white text-black px-2 py-1 border border-black font-bold text-[0.7rem]">
            <span>SENTIMENT:</span>
            <button
              onClick={() =>
                setTicket((prev) => ({
                  ...prev,
                  sentiment:
                    prev.sentiment === 'NEUTRAL'
                      ? 'FRUSTRATED'
                      : prev.sentiment === 'FRUSTRATED'
                      ? 'SATISFIED'
                      : 'NEUTRAL'
                }))
              }
              className="font-black underline cursor-pointer"
            >
              {ticket.sentiment === 'FRUSTRATED' && '🚨 FRUSTRATED'}
              {ticket.sentiment === 'NEUTRAL' && '😐 NEUTRAL'}
              {ticket.sentiment === 'SATISFIED' && '✅ SATISFIED'}
            </button>
          </div>

          <button
            onClick={handleGenerateNewTicket}
            className="bg-black text-[#FFE600] px-2 py-1 font-black uppercase text-[0.7rem] hover:bg-gray-800 border border-black"
          >
            [+] NEW_TICKET
          </button>
        </div>
      </div>

      {/* Main Support Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[330px_1fr] overflow-hidden">
        {/* Left Console: Support Desk Cockpit */}
        <section className="bg-white border-black border-r-[3px] p-4 flex flex-col gap-4 overflow-y-auto">
          {/* Customer CRM Context Card */}
          <div className="border-[2px] border-black p-3 bg-gray-50 flex flex-col gap-1.5 text-[0.68rem] font-mono">
            <div className="flex items-center justify-between border-b border-black pb-1">
              <span className="font-black uppercase text-black">CRM_ACCOUNT_TELEMETRY</span>
              <span className="bg-[#00CC44] text-black px-1 font-black text-[0.6rem]">ACTIVE_SLA</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">TIER:</span>
              <span className="font-bold text-black">{ticket.accountTier}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">REGION:</span>
              <span className="font-bold text-black">us-east-1 (Primary Cluster)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">OPERATOR:</span>
              <span className="font-bold text-black">AGENT #NOC-SYS-42</span>
            </div>
          </div>

          {/* User Input Area */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center">
              <label className="font-black uppercase text-[0.75rem]">CUSTOMER_ISSUE_DISPATCH:</label>
              <span className="text-[0.6rem] bg-black text-[#00CC44] px-1 font-bold">
                {ticketStatus}
              </span>
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
              placeholder={`PASTE INCOMING CUSTOMER TICKET OR INQUIRY...\nE.g.: "Production cluster failing 503 errors under load"`}
              className="border-[3px] border-black p-3 bg-[#E5E5E5] focus:outline-none focus:bg-white h-28 font-mono text-xs uppercase resize-none shadow-[inset_2px_2px_0_#000]"
            />
          </div>

          {/* Rapid Resolution Macros */}
          <div className="flex flex-col gap-1.5">
            <span className="font-black uppercase text-[0.65rem] bg-black text-[#00CC44] px-2 py-0.5 inline-block self-start">
              SLA_RESOLUTION_MACROS:
            </span>
            <div className="grid grid-cols-1 gap-1">
              <button
                onClick={() => handleSupportMacro('Generate an urgent, empathetic customer auto-acknowledgement and initial triage report for')}
                className="text-left border-[2px] border-black p-1.5 bg-white hover:bg-[#00CC44] text-[0.65rem] font-bold uppercase active:translate-y-0.5 transition-all"
              >
                [⚡ AUTO_ACKNOWLEDGE_TICKET]
              </button>
              <button
                onClick={() => handleSupportMacro('Draft a high-priority escalation brief for Tier-3 Site Reliability Engineers detailing')}
                className="text-left border-[2px] border-black p-1.5 bg-white hover:bg-[#FF2D00] hover:text-white text-[0.65rem] font-bold uppercase active:translate-y-0.5 transition-all"
              >
                [🚨 ESCALATE_TO_TIER_3_SRE]
              </button>
              <button
                onClick={() => handleSupportMacro('Draft a comprehensive Root Cause Analysis (RCA) and mitigation plan for')}
                className="text-left border-[2px] border-black p-1.5 bg-white hover:bg-[#FFE600] text-[0.65rem] font-bold uppercase active:translate-y-0.5 transition-all"
              >
                [📋 GENERATE_INCIDENT_RCA]
              </button>
              <button
                onClick={() => handleSupportMacro('Calculate SLA breach credit and compose polite compensation email for')}
                className="text-left border-[2px] border-black p-1.5 bg-white hover:bg-[#00CC44] text-[0.65rem] font-bold uppercase active:translate-y-0.5 transition-all"
              >
                [💳 ISSUE_SLA_REFUND_CREDIT]
              </button>
              <button
                onClick={() => handleSupportMacro('Provide security verification protocol and 2FA reset instructions for')}
                className="text-left border-[2px] border-black p-1.5 bg-white hover:bg-gray-100 text-[0.65rem] font-bold uppercase active:translate-y-0.5 transition-all"
              >
                [🔒 VERIFY_ACCOUNT_AUTH]
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
                  className={`flex-1 border-[2px] border-black text-[0.55rem] font-bold ${
                    streamSpeed === 50 ? 'bg-[#FFE600]' : 'bg-white hover:bg-gray-100'
                  }`}
                >
                  SLW
                </button>
                <button
                  onClick={() => setStreamSpeed(0)}
                  className={`flex-1 border-[2px] border-black text-[0.55rem] font-bold ${
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
              className={`border-[2px] border-black p-2 font-bold text-[0.65rem] uppercase active:translate-y-0.5 ${
                isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-white hover:bg-gray-100'
              }`}
            >
              {isRecording ? 'RECORDING...' : 'CALL_VOICE_STT'}
            </button>
            <button
              onClick={() => setComplexityMode(complexityMode === 'EXPERT' ? 'ELI5' : 'EXPERT')}
              className={`border-[2px] border-black p-2 font-black text-[0.65rem] uppercase active:translate-y-0.5 ${
                complexityMode === 'EXPERT' ? 'bg-black text-white' : 'bg-[#FFE600] text-black'
              }`}
            >
              [{complexityMode}]
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={exportSession}
              className="border-[2px] border-black p-1.5 bg-black text-[#00CC44] hover:bg-gray-800 text-[0.65rem] font-bold uppercase active:translate-y-0.5"
            >
              SAVE_TRANSCRIPT
            </button>
            <button
              onClick={loadHistory}
              className="border-[2px] border-black p-1.5 bg-white text-black hover:bg-[#FFE600] text-[0.65rem] font-bold uppercase active:translate-y-0.5"
            >
              LOAD_HISTORY
            </button>
          </div>

          {/* Submit */}
          <button
            onClick={() => onSendMessage(input)}
            disabled={isTyping || !input.trim()}
            className="bg-[#00CC44] text-black border-[3px] border-black p-3 font-black text-center uppercase artistic-shadow artistic-shadow-active disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-400"
          >
            DISPATCH_SUPPORT_RESOLUTION
          </button>
        </section>

        {/* Center: Live Terminal & Incident Log */}
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
            onSaveToKnowledgeTrail={() => {}}
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

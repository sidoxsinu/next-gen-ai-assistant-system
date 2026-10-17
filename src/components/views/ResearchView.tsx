import React, { useState } from 'react';
import {
  AIProvider,
  CitationStyle,
  ResearchDepth,
  ResearchFinding,
  Message,
  ServerSmtpStatus
} from '../../types';
import { TerminalOutput } from '../TerminalOutput';
import { SmtpDrawer } from '../SmtpDrawer';

interface ResearchViewProps {
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

export function ResearchView({
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
}: ResearchViewProps) {
  const [citationStyle, setCitationStyle] = useState<CitationStyle>('APA-7');
  const [researchDepth, setResearchDepth] = useState<ResearchDepth>('DEEP_LITERATURE_REVIEW');
  const [findings, setFindings] = useState<ResearchFinding[]>([]);
  const [newFindingText, setNewFindingText] = useState('');
  const [showFindingsPanel, setShowFindingsPanel] = useState(true);

  const handleAddFinding = () => {
    if (!newFindingText.trim()) return;
    setFindings(prev => [
      {
        id: `f-${Date.now()}`,
        claim: newFindingText.trim(),
        confidence: 90,
        sourceNote: `USER_NOTE // [${new Date().toLocaleTimeString()}]`
      },
      ...prev
    ]);
    setNewFindingText('');
  };

  const handleApplyMacro = (template: string) => {
    const formatted = `${template}: ${input || 'Current Research Topic'}`;
    setInput(formatted);
    onSendMessage(formatted);
  };

  const exportBibliography = () => {
    if (findings.length === 0) {
      alert('No findings pinned to export yet.');
      return;
    }
    const bibContent = findings
      .map(
        (f, i) =>
          `[${i + 1}] ${f.claim}\n    Confidence: ${f.confidence}% | Source: ${f.sourceNote || 'Session Finding'}\n`
      )
      .join('\n');
    const blob = new Blob([bibContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BIBLIOGRAPHY_${citationStyle}_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Academic Header Bar */}
      <div data-tour="dossier-bar" className="bg-[#0047FF] text-white border-b-[3px] border-black p-3 px-5 flex flex-wrap items-center justify-between gap-3 shadow-[0_2px_0_#000]">
        <div className="flex items-center gap-3">
          <span className="bg-black text-[#FFE600] font-black text-xs px-2.5 py-1 tracking-wider uppercase border border-white">
            ACADEMIC_DOSSIER // RESEARCH_HUB
          </span>
          <span className="font-bold text-xs uppercase tracking-wide hidden sm:inline">
            SYSTEMATIC LITERATURE &amp; EVIDENCE SYNTHESIS ENGINE
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Citation Format */}
          <div className="flex items-center gap-1 bg-black text-white px-2 py-1 border border-white text-[0.7rem] font-bold">
            <span className="text-[#FFE600]">CITATION:</span>
            <select
              value={citationStyle}
              onChange={(e) => setCitationStyle(e.target.value as CitationStyle)}
              className="bg-transparent text-white font-bold cursor-pointer focus:outline-none uppercase text-[0.7rem]"
            >
              <option value="APA-7" className="bg-black text-white">APA 7TH</option>
              <option value="IEEE" className="bg-black text-white">IEEE</option>
              <option value="MLA-9" className="bg-black text-white">MLA 9TH</option>
              <option value="CHICAGO" className="bg-black text-white">CHICAGO</option>
              <option value="NATURE" className="bg-black text-white">NATURE</option>
            </select>
          </div>

          {/* Research Depth */}
          <div className="flex items-center gap-1 bg-black text-white px-2 py-1 border border-white text-[0.7rem] font-bold">
            <span className="text-[#FFE600]">DEPTH:</span>
            <select
              value={researchDepth}
              onChange={(e) => setResearchDepth(e.target.value as ResearchDepth)}
              className="bg-transparent text-white font-bold cursor-pointer focus:outline-none uppercase text-[0.7rem]"
            >
              <option value="QUICK_ABSTRACT" className="bg-black text-white">ABSTRACT</option>
              <option value="DEEP_LITERATURE_REVIEW" className="bg-black text-white">LIT_REVIEW</option>
              <option value="METHODOLOGY_DECONSTRUCT" className="bg-black text-white">METHODOLOGY</option>
              <option value="EMPIRICAL_SYNTHESIS" className="bg-black text-white">EMPIRICAL</option>
            </select>
          </div>

          {/* Toggle Findings Board */}
          <button
            onClick={() => setShowFindingsPanel(!showFindingsPanel)}
            className={`border border-white px-2 py-1 text-[0.7rem] font-black uppercase cursor-pointer transition-all ${
              showFindingsPanel ? 'bg-[#FFE600] text-black' : 'bg-black text-white hover:bg-gray-800'
            }`}
          >
            {showFindingsPanel ? '[-] HIDE_FINDINGS_BOARD' : '[+] FINDINGS_BOARD'}
          </button>
        </div>
      </div>

      {/* Main Grid: Control Console + Terminal Stream + Findings Board */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[330px_1fr_auto] overflow-hidden">
        {/* Left Console: Research Queries & Quick Macros */}
        <section className="bg-white border-black border-r-[3px] p-4 flex flex-col gap-4 overflow-y-auto">
          {/* Engine indicator */}
          <div className="border-[2px] border-black p-2 bg-blue-50 text-[0.65rem] font-bold text-black flex items-center justify-between">
            <span>KERNEL: {provider} ({activeModelDisplay})</span>
            <span className="bg-[#0047FF] text-white px-1 font-black">ACTIVE</span>
          </div>

          {/* Query Input */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <label className="font-black uppercase text-[0.75rem]">RESEARCH_QUERY:</label>
              <span className="text-[0.6rem] font-mono text-gray-500">[{citationStyle}]</span>
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
              placeholder={`ENTER RESEARCH QUESTION OR TOPIC...\n[DEPTH: ${researchDepth}]`}
              className="border-[3px] border-black p-3 bg-[#E5E5E5] focus:outline-none focus:bg-white h-28 font-mono text-xs uppercase resize-none shadow-[inset_2px_2px_0_#000]"
            />
          </div>

          {/* Quick Inquiry Macros */}
          <div data-tour="research-macros" className="flex flex-col gap-1.5">
            <span className="font-black uppercase text-[0.65rem] bg-black text-white px-2 py-0.5 inline-block self-start">
              QUICK_RESEARCH_MACROS:
            </span>
            <div className="grid grid-cols-1 gap-1">
              <button
                onClick={() => handleApplyMacro('Conduct a systematic literature review on')}
                className="text-left border-[2px] border-black p-1.5 bg-white hover:bg-[#FFE600] text-[0.65rem] font-bold uppercase active:translate-y-0.5 transition-all cursor-pointer"
              >
                [⚡ SYSTEMATIC_LIT_REVIEW]
              </button>
              <button
                onClick={() => handleApplyMacro('Identify core peer-reviewed citations and seminal papers for')}
                className="text-left border-[2px] border-black p-1.5 bg-white hover:bg-[#FFE600] text-[0.65rem] font-bold uppercase active:translate-y-0.5 transition-all cursor-pointer"
              >
                [📚 EXTRACT_KEY_CITATIONS]
              </button>
              <button
                onClick={() => handleApplyMacro('Deconstruct experimental methodologies and identify threats to validity in')}
                className="text-left border-[2px] border-black p-1.5 bg-white hover:bg-[#FFE600] text-[0.65rem] font-bold uppercase active:translate-y-0.5 transition-all cursor-pointer"
              >
                [🔬 CRITIQUE_METHODOLOGY]
              </button>
              <button
                onClick={() => handleApplyMacro('Synthesize empirical statistical findings and effect sizes for')}
                className="text-left border-[2px] border-black p-1.5 bg-white hover:bg-[#FFE600] text-[0.65rem] font-bold uppercase active:translate-y-0.5 transition-all cursor-pointer"
              >
                [📊 SYNTHESIZE_EMPIRICAL_DATA]
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
                    streamSpeed === 0 ? 'bg-[#0047FF] text-white' : 'bg-white hover:bg-gray-100'
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
                complexityMode === 'SIMPLE' ? 'bg-[#FFE600] text-black' : 'bg-black text-[#FFE600]'
              }`}
              title="Toggle response style: Simple (Concise) vs Detailed (In-depth)"
            >
              STYLE: {complexityMode}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={exportSession}
              className="border-[2px] border-black p-1.5 bg-black text-white hover:bg-[#FFE600] hover:text-black text-[0.65rem] font-bold uppercase active:translate-y-0.5 cursor-pointer"
            >
              EXPORT_LOGS
            </button>
            <button
              onClick={loadHistory}
              className="border-[2px] border-black p-1.5 bg-white text-black hover:bg-[#FFE600] text-[0.65rem] font-bold uppercase active:translate-y-0.5 cursor-pointer"
            >
              LOAD_HISTORY
            </button>
          </div>

          {/* Submit */}
          <button
            onClick={() => onSendMessage(input)}
            disabled={isTyping || !input.trim()}
            className="bg-[#0047FF] text-white border-[3px] border-black p-3 font-black text-center uppercase artistic-shadow artistic-shadow-active disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600 cursor-pointer"
          >
            DISPATCH_RESEARCH_QUERY
          </button>
        </section>

        {/* Center: Live Terminal & Synthesis Stream */}
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

        {/* Right Auxiliary: Findings & Evidence Board */}
        {showFindingsPanel && (
          <aside data-tour="evidence-board" className="w-full lg:w-72 bg-white border-black border-l-[3px] p-4 flex flex-col gap-3 overflow-y-auto">
            <div className="flex items-center justify-between border-b-[2px] border-black pb-2">
              <span className="font-black uppercase text-[0.75rem] text-[#0047FF]">
                EVIDENCE_BOARD ({findings.length})
              </span>
              {findings.length > 0 && (
                <button
                  onClick={exportBibliography}
                  className="text-[0.6rem] bg-black text-[#FFE600] px-1.5 py-0.5 font-bold uppercase hover:bg-gray-800 cursor-pointer"
                >
                  EXPORT_BIB
                </button>
              )}
            </div>

            {/* Add Custom Finding */}
            <div className="flex flex-col gap-1">
              <input
                type="text"
                value={newFindingText}
                onChange={(e) => setNewFindingText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddFinding();
                }}
                placeholder="[+] Pin custom finding..."
                className="border-[2px] border-black p-1.5 text-[0.65rem] font-mono uppercase bg-gray-50 focus:outline-none focus:bg-white"
              />
              <button
                onClick={handleAddFinding}
                className="bg-black text-white border-[2px] border-black text-[0.6rem] font-bold p-1 uppercase hover:bg-[#0047FF] cursor-pointer"
              >
                + PIN_TO_DOSSIER
              </button>
            </div>

            {/* List of Evidence Cards */}
            <div className="flex flex-col gap-2 mt-2">
              {findings.length === 0 && (
                <div className="p-4 text-center text-xs text-gray-400 font-mono italic">
                  NO_EVIDENCE_PINNED_YET
                  <br />
                  <span className="text-[0.65rem] text-gray-500">Run research queries or pin custom findings above.</span>
                </div>
              )}
              {findings.map((f) => (
                <div
                  key={f.id}
                  className="border-[2px] border-black bg-blue-50/50 p-2.5 flex flex-col gap-1 border-l-[5px] border-l-[#0047FF] shadow-sm"
                >
                  <p className="text-[0.68rem] font-mono leading-tight font-bold">{f.claim}</p>
                  <div className="flex items-center justify-between mt-1 text-[0.55rem] text-gray-600 font-bold">
                    <span>{f.sourceNote}</span>
                    <span className="bg-[#0047FF] text-white px-1 font-mono">{f.confidence}% CONF</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Pinned Nodes if any */}
            {pinnedMessageIds.length > 0 && (
              <div className="flex flex-col gap-2 mt-3 pt-3 border-t-[2px] border-black border-dashed">
                <span className="font-black uppercase text-[0.7rem] bg-black text-[#FFE600] px-2 py-0.5 inline-block self-start">
                  SESSION_HIGHLIGHTS:
                </span>
                {messages
                  .filter((m) => pinnedMessageIds.includes(m.id))
                  .map((m) => (
                    <div
                      key={m.id}
                      className="border-l-[4px] border-[#FFE600] bg-gray-50 p-2 text-[0.65rem] font-mono leading-tight truncate"
                    >
                      {m.text}
                    </div>
                  ))}
              </div>
            )}
          </aside>
        )}
      </div>
    </div>
  );
}

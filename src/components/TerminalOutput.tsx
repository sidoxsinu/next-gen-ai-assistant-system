import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { AIProvider, Message } from '../types';
import { FactCheckReport } from './FactCheckReport';

interface TerminalOutputProps {
  provider: AIProvider;
  activeModelDisplay: string;
  messages: Message[];
  isTyping: boolean;
  scrollRef: React.RefObject<HTMLDivElement | null>;
  onFollowUp: (suggestion: string) => void;
  playTTS: (text: string) => void;
  copyMessage: (id: string, text: string) => void;
  copiedId: string | null;
  togglePin: (id: string) => void;
  pinnedMessageIds: string[];
  verifyFacts: (id: string, fullText: string) => void;
  closeFactCheck: (id: string) => void;
}

export function TerminalOutput({
  provider,
  activeModelDisplay,
  messages,
  isTyping,
  scrollRef,
  onFollowUp,
  playTTS,
  copyMessage,
  copiedId,
  togglePin,
  pinnedMessageIds,
  verifyFacts,
  closeFactCheck
}: TerminalOutputProps) {
  return (
    <div className="bg-white border-[3px] border-black flex-1 flex flex-col relative overflow-hidden">
      <div className="bg-black text-white px-3 py-1 text-[0.7rem] font-bold uppercase flex justify-between">
        <span>
          {provider}_OUTPUT_STREAM // {activeModelDisplay}
        </span>
        <span>BUFFER: {messages.length}/256</span>
      </div>
      <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-8" ref={scrollRef}>
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-4 opacity-30 italic">
            <span>_READY_FOR_SYNTHESIS_STREAM_</span>
            <div className="w-8 h-1 bg-black animate-ping"></div>
          </div>
        )}

        {isTyping && (
          <div className="flex gap-2 items-center font-black animate-pulse">
            <span className="w-2 h-4 bg-black"></span>
            <span className="text-xs uppercase">_ANALYSIS_IN_PROGRESS VIA {provider}</span>
          </div>
        )}

        {[...messages].reverse().map((m, reverseIdx) => {
          const i = messages.length - 1 - reverseIdx;
          return (
            <div key={m.id} className="flex flex-col gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-black text-xs uppercase">
                  {m.role === 'user' ? '>_USER' : `>_${provider}_KERNEL`}
                </span>
                {m.role === 'model' && m.complexityMode && (
                  <span
                    className={`text-[0.55rem] font-black border border-black px-1 uppercase ${
                      m.complexityMode === 'ELI5' ? 'bg-[#FFE600] text-black' : 'bg-[#0047FF] text-white'
                    }`}
                  >
                    [ACTIVE_MODE: {m.complexityMode}]
                  </span>
                )}
                {m.metadata?.tone && (
                  <span
                    className={`text-[0.55rem] font-black border border-black px-1 uppercase ${
                      m.metadata.tone.includes('URGENT') || m.metadata.tone.includes('ANXIOUS')
                        ? 'bg-[#FF2D00] text-white'
                        : 'bg-[#FFE600] text-black'
                    }`}
                  >
                    [TONE: {m.metadata.tone}]
                  </span>
                )}
                <div className="h-[1px] flex-1 bg-black opacity-10"></div>
              </div>
              <div
                className={`p-4 border-l-[6px] relative ${
                  m.role === 'user' ? 'border-[#FFE600] bg-gray-50' : 'border-[#0047FF] bg-white'
                }`}
              >
                {m.role === 'model' && i === messages.length - 1 && isTyping && (
                  <span className="absolute right-2 top-2 w-2 h-4 bg-black animate-pulse"></span>
                )}
                <div className="markdown-body text-[0.85rem] leading-[1.4] whitespace-pre-wrap font-mono relative z-10 mt-2">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {m.text || (i === messages.length - 1 && m.role === 'model' ? '...' : '')}
                  </ReactMarkdown>
                  {i === messages.length - 1 && m.role === 'model' && isTyping && (
                    <span className="inline-block w-2 h-4 bg-black ml-1 align-middle animate-pulse"></span>
                  )}
                </div>

                {/* Display Auto Tagger and Confidence */}
                {m.metadata?.tags && (
                  <div className="mt-3 text-[0.65rem] font-bold text-[#0047FF] flex gap-2 flex-wrap">
                    {m.metadata.tags.map((t, idx) => (
                      <span key={idx}>{t}</span>
                    ))}
                  </div>
                )}

                {m.metadata?.confidence !== undefined && (
                  <div className="mt-2 text-[0.55rem] font-black uppercase flex items-center gap-2 max-w-xs">
                    <span className="w-24">CONFIDENCE: {m.metadata.confidence}%</span>
                    <div className="flex-1 h-3 border-2 border-black bg-gray-200">
                      <div
                        className={`h-full ${
                          m.metadata.confidence > 80
                            ? 'bg-green-500'
                            : m.metadata.confidence > 50
                            ? 'bg-[#FFE600]'
                            : 'bg-[#FF2D00]'
                        }`}
                        style={{ width: `${m.metadata.confidence}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Follow-up Prompts */}
                {m.metadata?.suggestions && m.metadata.suggestions.length > 0 && (
                  <div className="mt-4 flex flex-col gap-2">
                    <span className="text-[0.55rem] font-bold opacity-50 uppercase">SUGGESTED_QUERIES:</span>
                    <div className="flex flex-wrap gap-2">
                      {m.metadata.suggestions.map((s, idx) => (
                        <button
                          key={idx}
                          onClick={() => onFollowUp(s)}
                          className="text-[0.65rem] bg-white border-2 border-black px-2 py-1 font-bold hover:bg-[#FFE600] active:translate-y-1 text-left"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Utility Action Bar */}
                {m.role === 'model' && m.text && (
                  <div className="mt-4 pt-3 border-t-2 border-black border-dashed flex gap-2 flex-wrap relative z-10">
                    <button
                      onClick={() => playTTS(m.text)}
                      className="bg-black text-white border-2 border-black text-[0.6rem] px-2 py-1 font-bold hover:bg-[#0047FF] active:translate-y-1"
                    >
                      [ READ_ALOUD ]
                    </button>
                    <button
                      onClick={() => copyMessage(m.id, m.text)}
                      className="bg-white text-black border-2 border-black text-[0.6rem] px-2 py-1 font-bold hover:bg-[#FFE600] active:translate-y-1"
                    >
                      {copiedId === m.id ? '[ COPIED_TO_BUFFER ]' : '[ COPY ]'}
                    </button>
                    <button
                      onClick={() => togglePin(m.id)}
                      className="bg-white text-black border-2 border-black text-[0.6rem] px-2 py-1 font-bold hover:bg-[#FFE600] active:translate-y-1"
                    >
                      {pinnedMessageIds.includes(m.id) ? '[ UNPIN_NODE ]' : '[ PIN_NODE ]'}
                    </button>
                    <button
                      onClick={() => (m.isFactChecking ? null : verifyFacts(m.id, m.rawText || m.text))}
                      disabled={m.isFactChecking}
                      className={`bg-white text-black border-2 border-black text-[0.6rem] px-2 py-1 font-bold active:translate-y-1 ${
                        m.isFactChecking ? 'text-red-500' : 'hover:bg-[#FFE600]'
                      }`}
                    >
                      {m.isFactChecking ? '[ SCANNING_FACTS... ]' : '[ VERIFY_FACTS ]'}
                    </button>
                  </div>
                )}
              </div>
              <FactCheckReport
                report={m.factCheckReport}
                isOpen={m.isFactCheckOpen}
                onClose={() => closeFactCheck(m.id)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

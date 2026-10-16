import React, { useState } from 'react';
import {
  AIProvider,
  Flashcard,
  KnowledgeTrailItem,
  Message,
  ServerSmtpStatus
} from '../../types';
import { TerminalOutput } from '../TerminalOutput';
import { SmtpDrawer } from '../SmtpDrawer';

interface KnowledgeViewProps {
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
  // Knowledge State
  knowledgeTrail: KnowledgeTrailItem[];
  setKnowledgeTrail: React.Dispatch<React.SetStateAction<KnowledgeTrailItem[]>>;
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

export function KnowledgeView({
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
  knowledgeTrail,
  setKnowledgeTrail,
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
}: KnowledgeViewProps) {
  const [activeTab, setActiveTab] = useState<'GRAPH' | 'FLASHCARDS' | 'STREAM'>('GRAPH');
  const [selectedConcepts, setSelectedConcepts] = useState<string[]>([]);
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [isCardFlipped, setIsCardFlipped] = useState(false);

  // Concept Pills Matrix
  const defaultConcepts = [
    'SYSTEM_ARCHITECTURE',
    'CONCURRENCY_MODELS',
    'API_RATE_LIMITING',
    'NEO_BRUTALIST_UI',
    'OLLAMA_PROXY',
    'SMTP_RELAY',
    'KV_CACHE_QUANTIZATION',
    'REACT_MEMOIZATION',
    'VECTOR_EMBEDDINGS',
    'CHAIN_OF_THOUGHT'
  ];

  const [flashcards, setFlashcards] = useState<Flashcard[]>([
    {
      id: 'fc-1',
      category: 'ARCHITECTURE',
      front: 'What is the primary benefit of decoupled view components in React?',
      back: 'Isolates rendering concerns, eliminates monolithic prop drilling, and allows independent state lifecycle without re-rendering unrelated trees.',
      mastered: false
    },
    {
      id: 'fc-2',
      category: 'AI_SYSTEMS',
      front: 'Why use an explicit client-side fallback when an LLM model is retired?',
      back: 'Prevents silent crash loops, preserves user session state, and seamlessly migrates saved settings to the supported model tier.',
      mastered: false
    },
    {
      id: 'fc-3',
      category: 'SECURITY',
      front: 'Why should SMTP app passwords never be committed to Git repositories?',
      back: 'Public repositories are actively scanned by credential scrapers; environment variables or user-scoped storage prevent unauthorized relay abuse.',
      mastered: true
    }
  ]);

  const toggleSelectConcept = (c: string) => {
    setSelectedConcepts((prev) =>
      prev.includes(c) ? prev.filter((item) => item !== c) : prev.length < 2 ? [...prev, c] : [prev[1], c]
    );
  };

  const handleSynthesizeBridge = () => {
    if (selectedConcepts.length === 0) return;
    const prompt =
      selectedConcepts.length === 1
        ? `Explore deep systemic connections, practical examples, and core mental models for: ${selectedConcepts[0]}.`
        : `Synthesize a latent conceptual bridge connecting "${selectedConcepts[0]}" and "${selectedConcepts[1]}". Detail how they intersect in modern software engineering.`;
    setInput(prompt);
    setActiveTab('STREAM');
    onSendMessage(prompt);
  };

  const handleGenerateFlashcards = () => {
    const prompt =
      'Extract 3 high-yield conceptual flashcards from our recent discussion. Return them in crisp Question and Answer format.';
    setInput(prompt);
    setActiveTab('STREAM');
    onSendMessage(prompt);
  };

  const handleMarkMastered = (id: string) => {
    setFlashcards((prev) =>
      prev.map((card) => (card.id === id ? { ...card, mastered: !card.mastered } : card))
    );
  };

  const currentCard = flashcards[activeCardIndex] || flashcards[0];
  const masteredCount = flashcards.filter((f) => f.mastered).length;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Cybernetic Memory Telemetry Bar */}
      <div className="bg-[#8B00FF] text-white border-b-[3px] border-black p-3 px-5 flex flex-wrap items-center justify-between gap-3 shadow-[0_2px_0_#000]">
        <div className="flex items-center gap-3">
          <span className="bg-black text-[#FFE600] font-black text-xs px-2.5 py-1 tracking-wider uppercase border border-white">
            MEMORY_VAULT // COGNITIVE_INDEX
          </span>
          <span className="font-bold text-xs uppercase hidden md:inline">
            NEURAL KNOWLEDGE GRAPH & ACTIVE RECALL COMPANION
          </span>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-black text-white px-3 py-1 border border-white font-mono text-xs">
            <span className="text-[#FFE600] font-black">ACTIVE_NODES:</span>
            <span>{defaultConcepts.length + knowledgeTrail.length}</span>
            <span className="text-gray-400">|</span>
            <span className="text-[#00CC44] font-black">MASTERY:</span>
            <span>{Math.round((masteredCount / flashcards.length) * 100)}%</span>
          </div>

          {/* View Mode Switcher */}
          <div className="flex border-2 border-white bg-black">
            <button
              onClick={() => setActiveTab('GRAPH')}
              className={`px-3 py-1 text-xs font-black uppercase cursor-pointer ${
                activeTab === 'GRAPH' ? 'bg-[#FFE600] text-black' : 'text-white hover:bg-purple-900'
              }`}
            >
              CONCEPT_GRAPH
            </button>
            <button
              onClick={() => setActiveTab('FLASHCARDS')}
              className={`px-3 py-1 text-xs font-black uppercase cursor-pointer ${
                activeTab === 'FLASHCARDS' ? 'bg-[#FFE600] text-black' : 'text-white hover:bg-purple-900'
              }`}
            >
              FLASHCARDS ({masteredCount}/{flashcards.length})
            </button>
            <button
              onClick={() => setActiveTab('STREAM')}
              className={`px-3 py-1 text-xs font-black uppercase cursor-pointer ${
                activeTab === 'STREAM' ? 'bg-[#FFE600] text-black' : 'text-white hover:bg-purple-900'
              }`}
            >
              SYNTHESIS_STREAM
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Control Console on Left, Concept Graph / Cards / Terminal on Right */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[330px_1fr] overflow-hidden">
        {/* Left Console: Cognitive Profile & Recall Engine */}
        <section className="bg-white border-black border-r-[3px] p-4 flex flex-col gap-4 overflow-y-auto">
          {/* Cognitive Learner Profile */}
          <div className="border-[2px] border-black p-3 bg-purple-50 flex flex-col gap-2">
            <div className="flex items-center justify-between border-b border-black pb-1">
              <span className="font-black uppercase text-[0.7rem] text-[#8B00FF]">
                COGNITIVE_LEARNER_PROFILE
              </span>
              <span className="bg-[#8B00FF] text-white px-1 text-[0.6rem] font-black">PHD_MODE</span>
            </div>
            <div className="text-[0.65rem] font-mono flex flex-col gap-1">
              <div className="flex justify-between">
                <span className="text-gray-500">STYLE:</span>
                <span className="font-bold">FIRST_PRINCIPLES_ANALYTIC</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">RETENTION:</span>
                <span className="font-bold text-green-700">HIGH (SPACED RECALL)</span>
              </div>
            </div>

            {/* Mastery Bars */}
            <div className="flex flex-col gap-1.5 mt-1">
              <div className="flex justify-between text-[0.6rem] font-bold">
                <span>SYSTEM ARCHITECTURE:</span>
                <span>88%</span>
              </div>
              <div className="h-2 border border-black bg-gray-200">
                <div className="h-full bg-[#8B00FF]" style={{ width: '88%' }}></div>
              </div>

              <div className="flex justify-between text-[0.6rem] font-bold">
                <span>API & ASYNC PROTOCOLS:</span>
                <span>94%</span>
              </div>
              <div className="h-2 border border-black bg-gray-200">
                <div className="h-full bg-[#8B00FF]" style={{ width: '94%' }}></div>
              </div>
            </div>
          </div>

          {/* Quick Concept Actions */}
          <div className="flex flex-col gap-1.5">
            <span className="font-black uppercase text-[0.65rem] bg-black text-[#FFE600] px-2 py-0.5 inline-block self-start">
              KNOWLEDGE_RESTORATION_MACROS:
            </span>
            <div className="grid grid-cols-1 gap-1">
              <button
                onClick={handleSynthesizeBridge}
                disabled={selectedConcepts.length === 0}
                className="text-left border-[2px] border-black p-1.5 bg-white hover:bg-[#8B00FF] hover:text-white text-[0.65rem] font-bold uppercase active:translate-y-0.5 transition-all disabled:opacity-40"
              >
                [⚡ SYNTHESIZE_SELECTED_BRIDGES ({selectedConcepts.length})]
              </button>
              <button
                onClick={handleGenerateFlashcards}
                className="text-left border-[2px] border-black p-1.5 bg-white hover:bg-[#FFE600] text-[0.65rem] font-bold uppercase active:translate-y-0.5 transition-all"
              >
                [🧠 GENERATE_RECALL_FLASHCARDS]
              </button>
              <button
                onClick={() => {
                  const p = 'Provide 3 real-world, highly intuitive analogies for the main concepts discussed.';
                  setInput(p);
                  setActiveTab('STREAM');
                  onSendMessage(p);
                }}
                className="text-left border-[2px] border-black p-1.5 bg-white hover:bg-[#FFE600] text-[0.65rem] font-bold uppercase active:translate-y-0.5 transition-all"
              >
                [💡 RECAST_IN_FIRST_PRINCIPLES]
              </button>
            </div>
          </div>

          {/* Recall Input Query */}
          <div className="flex flex-col gap-1.5">
            <label className="font-black uppercase text-[0.75rem]">RECALL_TOPIC_OR_INQUIRY:</label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  setActiveTab('STREAM');
                  onSendMessage(input);
                }
              }}
              placeholder="ASK ABOUT PREVIOUS CONCEPTS, CONNECTIONS, OR PERSISTENT MEMORY..."
              className="border-[3px] border-black p-3 bg-[#E5E5E5] focus:outline-none focus:bg-white h-24 font-mono text-xs uppercase resize-none shadow-[inset_2px_2px_0_#000]"
            />
          </div>

          {/* Multimodal Actions */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={startSTT}
              className={`border-[2px] border-black p-2 font-bold text-[0.65rem] uppercase active:translate-y-0.5 ${
                isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-white hover:bg-gray-100'
              }`}
            >
              {isRecording ? 'LISTENING...' : 'VOICE_STT'}
            </button>
            <button
              onClick={() => setComplexityMode(complexityMode === 'EXPERT' ? 'ELI5' : 'EXPERT')}
              className={`border-[2px] border-black p-2 font-black text-[0.65rem] uppercase active:translate-y-0.5 ${
                complexityMode === 'EXPERT' ? 'bg-[#8B00FF] text-white' : 'bg-[#FFE600] text-black'
              }`}
            >
              [{complexityMode}]
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={exportSession}
              className="border-[2px] border-black p-1.5 bg-black text-white hover:bg-[#8B00FF] text-[0.65rem] font-bold uppercase active:translate-y-0.5"
            >
              EXPORT_VAULT
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
            onClick={() => {
              setActiveTab('STREAM');
              onSendMessage(input);
            }}
            disabled={isTyping || !input.trim()}
            className="bg-[#8B00FF] text-white border-[3px] border-black p-3 font-black text-center uppercase artistic-shadow artistic-shadow-active disabled:opacity-50 disabled:cursor-not-allowed hover:bg-purple-700"
          >
            EXECUTE_COGNITIVE_SYNTHESIS
          </button>
        </section>

        {/* Center: Concept Graph / Flashcard Study / Terminal Stream */}
        <section className="bg-[#E5E5E5] p-4 flex flex-col gap-3 overflow-hidden">
          {activeTab === 'GRAPH' && (
            <div className="flex-1 flex flex-col gap-4 overflow-y-auto">
              {/* Concept Matrix Box */}
              <div className="bg-white border-[3px] border-black p-5 shadow-[4px_4px_0_#000]">
                <div className="flex justify-between items-center border-b-2 border-black pb-2 mb-4">
                  <span className="font-black uppercase text-xs text-[#8B00FF]">
                    INTERACTIVE_CONCEPT_NEURAL_PILLS (CLICK TO CONNECT)
                  </span>
                  <span className="text-[0.65rem] font-bold text-gray-500">
                    SELECTED: {selectedConcepts.join(' ↔ ') || 'NONE (SELECT UP TO 2)'}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2.5">
                  {defaultConcepts.map((concept) => {
                    const isSelected = selectedConcepts.includes(concept);
                    return (
                      <button
                        key={concept}
                        onClick={() => toggleSelectConcept(concept)}
                        className={`px-3 py-2 border-[2px] border-black font-black font-mono text-xs uppercase cursor-pointer transition-all active:translate-y-0.5 ${
                          isSelected
                            ? 'bg-[#8B00FF] text-white artistic-shadow-purple -translate-y-1'
                            : 'bg-gray-50 text-black hover:bg-[#FFE600]'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '}
                        {concept}
                      </button>
                    );
                  })}
                </div>

                {selectedConcepts.length > 0 && (
                  <div className="mt-5 p-3 bg-purple-50 border-[2px] border-black flex items-center justify-between flex-wrap gap-2">
                    <span className="text-xs font-bold text-black">
                      SYNTHESIZE BRIDGES FOR: <span className="font-mono text-[#8B00FF]">{selectedConcepts.join(' + ')}</span>
                    </span>
                    <button
                      onClick={handleSynthesizeBridge}
                      className="bg-black text-[#FFE600] px-3 py-1 font-black uppercase text-xs hover:bg-[#8B00FF] hover:text-white border border-black"
                    >
                      [⚡ RUN_SYNTHESIS_NOW]
                    </button>
                  </div>
                )}
              </div>

              {/* Session Knowledge Trail History */}
              <div className="bg-white border-[3px] border-black p-5 shadow-[4px_4px_0_#000] flex-1">
                <span className="font-black uppercase text-xs text-black block mb-3 border-b-2 border-black pb-1">
                  HISTORICAL_KNOWLEDGE_TRAIL // CHRONOLOGICAL_LOG
                </span>
                {knowledgeTrail.length === 0 ? (
                  <div className="text-center py-6 text-gray-400 font-mono text-xs italic">
                    NO_TRAIL_ITEMS_YET // INTERACT_WITH_KNOWLEDGE_BOT_TO_POPULATE
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {knowledgeTrail.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => {
                          setInput(`Tell me more about ${item.subject}`);
                          setActiveTab('STREAM');
                          onSendMessage(`Tell me more about ${item.subject}`);
                        }}
                        className="border-[2px] border-black p-2.5 bg-gray-50 hover:bg-[#FFE600] cursor-pointer border-l-[6px] border-l-[#8B00FF] flex justify-between items-center transition-all"
                      >
                        <span className="font-bold text-xs font-mono">{item.subject}</span>
                        <span className="text-[0.65rem] font-mono text-gray-500">[{item.timestamp}]</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'FLASHCARDS' && (
            <div className="flex-1 flex flex-col items-center justify-center p-4">
              <div className="w-full max-w-xl bg-white border-[4px] border-black p-6 shadow-[6px_6px_0_#8B00FF] flex flex-col gap-4">
                <div className="flex justify-between items-center border-b-2 border-black pb-2">
                  <span className="bg-black text-[#FFE600] px-2 py-0.5 font-black text-xs uppercase">
                    CARD {activeCardIndex + 1} OF {flashcards.length} // [{currentCard.category}]
                  </span>
                  <span
                    className={`text-xs font-black px-2 py-0.5 border border-black uppercase ${
                      currentCard.mastered ? 'bg-[#00CC44] text-black' : 'bg-red-100 text-red-900'
                    }`}
                  >
                    {currentCard.mastered ? 'MASTERED ✓' : 'NEEDS_REVIEW ↺'}
                  </span>
                </div>

                {/* Flip Card Stage */}
                <div
                  onClick={() => setIsCardFlipped(!isCardFlipped)}
                  className="min-h-48 border-[3px] border-black p-6 bg-gray-50 flex flex-col justify-center items-center text-center cursor-pointer hover:bg-yellow-50/50 transition-all select-none relative"
                >
                  <span className="text-[0.65rem] font-bold text-gray-400 uppercase tracking-widest absolute top-2 right-2">
                    [CLICK TO FLIP]
                  </span>
                  {!isCardFlipped ? (
                    <div className="flex flex-col gap-2">
                      <span className="text-xs font-black text-[#8B00FF] uppercase">QUESTION:</span>
                      <p className="font-bold font-mono text-sm leading-relaxed text-black">
                        {currentCard.front}
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2 animate-fade-in">
                      <span className="text-xs font-black text-[#00CC44] uppercase">REVEALED_ANSWER:</span>
                      <p className="font-mono text-sm leading-relaxed text-gray-800">
                        {currentCard.back}
                      </p>
                    </div>
                  )}
                </div>

                {/* Card Controls */}
                <div className="flex items-center justify-between pt-2 border-t border-black flex-wrap gap-2">
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setActiveCardIndex((prev) => (prev > 0 ? prev - 1 : flashcards.length - 1));
                        setIsCardFlipped(false);
                      }}
                      className="border-[2px] border-black px-3 py-1 font-bold text-xs uppercase hover:bg-gray-100"
                    >
                      ← PREV
                    </button>
                    <button
                      onClick={() => {
                        setActiveCardIndex((prev) => (prev < flashcards.length - 1 ? prev + 1 : 0));
                        setIsCardFlipped(false);
                      }}
                      className="border-[2px] border-black px-3 py-1 font-bold text-xs uppercase hover:bg-gray-100"
                    >
                      NEXT →
                    </button>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleMarkMastered(currentCard.id)}
                      className={`border-[2px] border-black px-3 py-1 font-black text-xs uppercase transition-all ${
                        currentCard.mastered
                          ? 'bg-[#00CC44] text-black'
                          : 'bg-black text-[#FFE600] hover:bg-gray-800'
                      }`}
                    >
                      {currentCard.mastered ? 'MARK_UNRESOLVED' : 'MARK_MASTERED ✓'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'STREAM' && (
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
          )}

          <SmtpDrawer
            onSaveToKnowledgeTrail={() => {
              if (messages.length > 0) {
                const lastMsg = messages[messages.length - 1];
                const subject = lastMsg.text.split(' ').slice(0, 4).join(' ') || 'Saved Knowledge';
                setKnowledgeTrail((prev) => [
                  {
                    id: Date.now().toString(),
                    subject,
                    timestamp: new Date().toLocaleTimeString()
                  },
                  ...prev
                ].slice(0, 10));
              }
            }}
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

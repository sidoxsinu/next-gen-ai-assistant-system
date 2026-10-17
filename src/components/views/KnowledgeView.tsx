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
  complexityMode: 'SIMPLE' | 'DETAILED';
  setComplexityMode: (val: 'SIMPLE' | 'DETAILED') => void;
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
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);

  // Concepts from session knowledge trail
  const activeConcepts = Array.from(
    new Set([
      ...knowledgeTrail.map((k) => k.subject.toUpperCase().replace(/\s+/g, '_')),
      'SYSTEM_ARCHITECTURE',
      'API_DESIGN',
      'ASYNC_PATTERNS',
      'STATE_MANAGEMENT'
    ])
  ).slice(0, 12);

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
        : `Synthesize a latent conceptual bridge connecting "${selectedConcepts[0]}" and "${selectedConcepts[1]}". Detail how they intersect in software engineering and system design.`;
    setInput(prompt);
    setActiveTab('STREAM');
    onSendMessage(prompt);
  };

  const handleGenerateFlashcards = () => {
    const prompt =
      'Extract 3 high-yield conceptual flashcards from our recent discussion. Return each clearly formatted with FRONT (question/concept) and BACK (concise, clear explanation).';
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
      {/* Memory Vault Header Bar */}
      <div className="bg-[#8B00FF] text-white border-b-[3px] border-black p-3 px-5 flex flex-wrap items-center justify-between gap-3 shadow-[0_2px_0_#000]">
        <div className="flex items-center gap-3">
          <span className="bg-black text-[#FFE600] font-black text-xs px-2.5 py-1 tracking-wider uppercase border border-white">
            MEMORY_VAULT // KNOWLEDGE_GRAPH
          </span>
          <span className="font-bold text-xs uppercase hidden md:inline">
            SESSION KNOWLEDGE TRAIL &amp; ACTIVE RECALL COMPANION
          </span>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-black text-white px-3 py-1 border border-white font-mono text-xs">
            <span className="text-[#FFE600] font-black">CONCEPTS:</span>
            <span>{activeConcepts.length}</span>
            <span className="text-gray-400">|</span>
            <span className="text-[#00CC44] font-black">TRAIL_LENGTH:</span>
            <span>{knowledgeTrail.length}</span>
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
              data-tour="flashcard-study"
              onClick={() => setActiveTab('FLASHCARDS')}
              className={`px-3 py-1 text-xs font-black uppercase cursor-pointer ${
                activeTab === 'FLASHCARDS' ? 'bg-[#FFE600] text-black' : 'text-white hover:bg-purple-900'
              }`}
            >
              FLASHCARDS ({flashcards.length})
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
          {/* Active Session Trail Summary */}
          <div data-tour="learner-profile" className="border-[2px] border-black p-3 bg-purple-50 flex flex-col gap-2">
            <div className="flex items-center justify-between border-b border-black pb-1">
              <span className="font-black uppercase text-[0.7rem] text-[#8B00FF]">
                SESSION_KNOWLEDGE_SUMMARY
              </span>
              <span className="bg-[#8B00FF] text-white px-1 text-[0.6rem] font-black">ACTIVE</span>
            </div>
            <div className="text-[0.65rem] font-mono flex flex-col gap-1">
              <div className="flex justify-between">
                <span className="text-gray-500">TRAIL NODES:</span>
                <span className="font-bold">{knowledgeTrail.length} recorded</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">ACTIVE AI:</span>
                <span className="font-bold text-black">{provider}</span>
              </div>
            </div>

            {/* Knowledge trail list */}
            {knowledgeTrail.length > 0 && (
              <div className="mt-1 pt-1 border-t border-dashed border-gray-300 flex flex-col gap-1">
                <span className="text-[0.6rem] font-black uppercase text-gray-500">RECENT TRAIL:</span>
                <div className="flex flex-col gap-1 max-h-24 overflow-y-auto">
                  {knowledgeTrail.slice(0, 5).map((item) => (
                    <div key={item.id} className="text-[0.6rem] font-mono bg-white p-1 border border-black truncate">
                      • {item.subject} <span className="text-gray-400">({item.timestamp})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Quick Concept Actions */}
          <div className="flex flex-col gap-1.5">
            <span className="font-black uppercase text-[0.65rem] bg-black text-[#FFE600] px-2 py-0.5 inline-block self-start">
              KNOWLEDGE_RECALL_MACROS:
            </span>
            <div className="grid grid-cols-1 gap-1">
              <button
                onClick={handleSynthesizeBridge}
                disabled={selectedConcepts.length === 0}
                className="text-left border-[2px] border-black p-1.5 bg-white hover:bg-[#8B00FF] hover:text-white text-[0.65rem] font-bold uppercase active:translate-y-0.5 transition-all disabled:opacity-40 cursor-pointer"
              >
                [⚡ SYNTHESIZE_SELECTED_BRIDGES ({selectedConcepts.length})]
              </button>
              <button
                onClick={handleGenerateFlashcards}
                className="text-left border-[2px] border-black p-1.5 bg-white hover:bg-[#FFE600] text-[0.65rem] font-bold uppercase active:translate-y-0.5 transition-all cursor-pointer"
              >
                [🧠 GENERATE_RECALL_FLASHCARDS]
              </button>
              <button
                onClick={() => {
                  const p = 'Provide 3 intuitive, practical real-world mental models and analogies for the concepts we discussed.';
                  setInput(p);
                  setActiveTab('STREAM');
                  onSendMessage(p);
                }}
                className="text-left border-[2px] border-black p-1.5 bg-white hover:bg-[#FFE600] text-[0.65rem] font-bold uppercase active:translate-y-0.5 transition-all cursor-pointer"
              >
                [💡 EXPLAIN_FROM_FIRST_PRINCIPLES]
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
              placeholder={`EXPLORE OR CONNECT CONCEPTS...\nE.g.: "Explain how distributed consensus works in simple terms"`}
              className="border-[3px] border-black p-3 bg-[#E5E5E5] focus:outline-none focus:bg-white h-24 font-mono text-xs uppercase resize-none shadow-[inset_2px_2px_0_#000]"
            />
          </div>

          {/* Controls: Language, Stream, Multimodal */}
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
                complexityMode === 'SIMPLE' ? 'bg-[#8B00FF] text-white' : 'bg-black text-[#FFE600]'
              }`}
              title="Toggle response style: Simple (Concise) vs Detailed (In-depth)"
            >
              STYLE: {complexityMode}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={exportSession}
              className="border-[2px] border-black p-1.5 bg-black text-white hover:bg-[#8B00FF] hover:text-white text-[0.65rem] font-bold uppercase active:translate-y-0.5 cursor-pointer"
            >
              EXPORT_LOGS
            </button>
            <button
              onClick={loadHistory}
              className="border-[2px] border-black p-1.5 bg-white text-black hover:bg-[#8B00FF] hover:text-white text-[0.65rem] font-bold uppercase active:translate-y-0.5 cursor-pointer"
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
            className="bg-[#8B00FF] text-white border-[3px] border-black p-3 font-black text-center uppercase artistic-shadow artistic-shadow-active disabled:opacity-50 disabled:cursor-not-allowed hover:bg-purple-800 cursor-pointer"
          >
            DISPATCH_COGNITIVE_PROMPT
          </button>
        </section>

        {/* Center: Graph Matrix / Flashcards / Synthesis Stream */}
        <section className="bg-[#E5E5E5] p-4 flex flex-col gap-3 overflow-hidden">
          {activeTab === 'GRAPH' && (
            <div data-tour="concept-matrix" className="flex-1 bg-white border-[3px] border-black p-5 flex flex-col gap-4 shadow-[4px_4px_0_#000] overflow-y-auto">
              <div className="flex items-center justify-between border-b-2 border-black pb-2">
                <span className="font-black uppercase text-xs text-[#8B00FF]">
                  INTERACTIVE_CONCEPT_MATRIX
                </span>
                <span className="text-[0.65rem] font-mono text-gray-500">
                  Select 2 concepts to synthesize connections
                </span>
              </div>

              {/* Concept Pills Grid */}
              <div className="flex flex-wrap gap-2">
                {activeConcepts.map((concept) => {
                  const isSelected = selectedConcepts.includes(concept);
                  return (
                    <button
                      key={concept}
                      onClick={() => toggleSelectConcept(concept)}
                      className={`border-[2px] border-black px-3 py-2 text-xs font-mono font-bold uppercase cursor-pointer transition-all active:translate-y-0.5 ${
                        isSelected
                          ? 'bg-[#8B00FF] text-white shadow-[2px_2px_0_#000]'
                          : 'bg-gray-50 hover:bg-yellow-200 text-black'
                      }`}
                    >
                      {isSelected ? `[✓] ${concept}` : concept}
                    </button>
                  );
                })}
              </div>

              {selectedConcepts.length > 0 && (
                <div className="mt-auto p-4 border-[2px] border-black bg-purple-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="text-xs font-mono">
                    <span className="font-bold text-[#8B00FF]">SELECTED FOR BRIDGING: </span>
                    <span className="font-black">{selectedConcepts.join(' ↔ ')}</span>
                  </div>
                  <button
                    onClick={handleSynthesizeBridge}
                    className="bg-[#8B00FF] text-white border-[2px] border-black px-4 py-2 font-black text-xs uppercase hover:bg-black cursor-pointer shadow-[2px_2px_0_#000]"
                  >
                    SYNTHESIZE_BRIDGE →
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'FLASHCARDS' && (
            <div data-tour="flashcard-study" className="flex-1 bg-white border-[3px] border-black p-6 flex flex-col items-center justify-center gap-5 shadow-[4px_4px_0_#000] overflow-y-auto">
              {flashcards.length === 0 ? (
                <div className="text-center flex flex-col items-center gap-4 max-w-md">
                  <span className="font-mono text-xs text-gray-400 uppercase">
                    NO_FLASHCARDS_IN_SESSION_YET
                  </span>
                  <p className="text-xs font-mono text-gray-600">
                    Extract study flashcards from recent AI discussions to test active recall.
                  </p>
                  <button
                    onClick={handleGenerateFlashcards}
                    className="bg-[#8B00FF] text-white border-[3px] border-black px-5 py-3 font-black text-xs uppercase hover:bg-black cursor-pointer shadow-[3px_3px_0_#000]"
                  >
                    [🧠 GENERATE_FLASHCARDS_WITH_AI]
                  </button>
                </div>
              ) : (
                <div className="w-full max-w-lg flex flex-col gap-4">
                  <div className="flex justify-between items-center text-xs font-mono font-bold">
                    <span>CARD {activeCardIndex + 1} OF {flashcards.length}</span>
                    <span className="bg-[#8B00FF] text-white px-2 py-0.5">{currentCard.category}</span>
                  </div>

                  <div
                    onClick={() => setIsCardFlipped(!isCardFlipped)}
                    className="border-[3px] border-black p-8 min-h-[200px] flex flex-col items-center justify-center text-center cursor-pointer bg-purple-50/50 hover:bg-purple-50 shadow-[4px_4px_0_#000] transition-colors"
                  >
                    <span className="text-[0.65rem] font-bold text-gray-400 uppercase mb-3">
                      {isCardFlipped ? '[ REVEALED_ANSWER ]' : '[ CLICK_CARD_TO_FLIP ]'}
                    </span>
                    <p className="font-mono text-sm font-bold text-black">
                      {isCardFlipped ? currentCard.back : currentCard.front}
                    </p>
                  </div>

                  <div className="flex justify-between items-center gap-2">
                    <button
                      onClick={() => {
                        setIsCardFlipped(false);
                        setActiveCardIndex((prev) => (prev > 0 ? prev - 1 : flashcards.length - 1));
                      }}
                      className="bg-black text-white px-3 py-1.5 border-[2px] border-black font-bold text-xs uppercase hover:bg-[#FFE600] hover:text-black cursor-pointer"
                    >
                      ← PREVIOUS
                    </button>
                    <button
                      onClick={() => handleMarkMastered(currentCard.id)}
                      className={`px-3 py-1.5 border-[2px] border-black font-black text-xs uppercase cursor-pointer ${
                        currentCard.mastered ? 'bg-green-500 text-white' : 'bg-white hover:bg-green-100'
                      }`}
                    >
                      {currentCard.mastered ? '✓ MASTERED' : 'MARK_MASTERED'}
                    </button>
                    <button
                      onClick={() => {
                        setIsCardFlipped(false);
                        setActiveCardIndex((prev) => (prev < flashcards.length - 1 ? prev + 1 : 0));
                      }}
                      className="bg-black text-white px-3 py-1.5 border-[2px] border-black font-bold text-xs uppercase hover:bg-[#FFE600] hover:text-black cursor-pointer"
                    >
                      NEXT →
                    </button>
                  </div>
                </div>
              )}
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

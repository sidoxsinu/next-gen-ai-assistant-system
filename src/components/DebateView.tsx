import React from 'react';
import { AIProvider, DebateRound } from '../types';

interface DebateViewProps {
  debateTopic: string;
  setDebateTopic: (val: string) => void;
  isDebating: boolean;
  debateHistory: DebateRound[];
  onInitiateDebate: (topic: string, isRound2: boolean) => void;
  provider: AIProvider;
}

export function DebateView({
  debateTopic,
  setDebateTopic,
  isDebating,
  debateHistory,
  onInitiateDebate,
  provider
}: DebateViewProps) {
  return (
    <div className="flex-1 flex flex-col p-5 bg-[#E5E5E5] gap-4 overflow-y-auto">
      {/* Controls */}
      <div className="bg-white border-[3px] border-black p-5 flex flex-col gap-3">
        <label className="font-black uppercase text-[1rem]">ENTER_DEBATE_TOPIC:</label>
        <div className="flex flex-col md:flex-row gap-3">
          <input
            type="text"
            value={debateTopic}
            onChange={(e) => setDebateTopic(e.target.value)}
            placeholder="e.g. Is Artificial Intelligence conscious?"
            className="flex-1 border-[3px] border-black p-3 font-mono text-sm uppercase focus:outline-none focus:bg-[#FFE600]"
            disabled={isDebating}
          />
          <button
            onClick={() => onInitiateDebate(debateTopic, false)}
            disabled={isDebating || !debateTopic.trim()}
            className="bg-black text-white hover:bg-[#FF2D00] border-[3px] border-black p-3 font-bold text-center uppercase active:translate-y-1 transition-all disabled:opacity-50"
            style={{ boxShadow: isDebating ? 'none' : '4px 4px 0px #000' }}
          >
            {isDebating ? '[ PROCESSING_DEBATE_ENGINE... ]' : '[ INITIATE_DEBATE ]'}
          </button>
        </div>
      </div>

      {/* Debate History mapping */}
      {debateHistory.map((round, idx) => (
        <div key={idx} className="flex flex-col gap-4">
          <div className="text-center font-black uppercase text-[0.7rem] bg-black text-white py-1">
            &gt;&gt; ROUND {idx + 1}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* AGENT A PRO */}
            <div className="bg-white border-[3px] border-black border-l-[8px] border-l-[#0047FF] flex flex-col">
              <div className="bg-black text-white px-3 py-1 text-[0.7rem] font-bold uppercase">&gt;_AGENT_A: [PRO]</div>
              <div className="p-4 font-mono text-sm whitespace-pre-wrap leading-relaxed">
                {round.agentA}
              </div>
            </div>
            {/* AGENT B CON */}
            <div className="bg-white border-[3px] border-black border-l-[8px] border-l-[#FF2D00] flex flex-col">
              <div className="bg-black text-white px-3 py-1 text-[0.7rem] font-bold uppercase">&gt;_AGENT_B: [CON]</div>
              <div className="p-4 font-mono text-sm whitespace-pre-wrap leading-relaxed">
                {round.agentB}
              </div>
            </div>
          </div>
          {/* VERDICT */}
          <div className="bg-white border-[3px] border-black border-l-[8px] border-l-[#FFE600] flex flex-col">
            <div className="bg-black text-[#FFE600] px-3 py-1 text-[0.7rem] font-bold uppercase">&gt;_VERDICT</div>
            <div className="p-4 font-mono text-sm whitespace-pre-wrap leading-relaxed">
              {round.verdict}
            </div>
            {idx === debateHistory.length - 1 && (
              <div className="p-3 border-t-[3px] border-black border-dashed flex justify-end">
                <button
                  onClick={() => onInitiateDebate(round.verdict, true)}
                  disabled={isDebating}
                  className="bg-black text-[#FFE600] border-[3px] border-black px-4 py-2 font-bold uppercase active:translate-y-1 hover:bg-[#FFE600] hover:text-black transition-colors text-xs"
                >
                  [ ROUND_2_REBUTTAL ]
                </button>
              </div>
            )}
          </div>
        </div>
      ))}

      {isDebating && debateHistory.length === 0 && (
        <div className="flex-1 flex items-center justify-center border-[3px] border-black border-dashed bg-white opacity-50 p-10 mt-4">
          <div className="font-mono font-black animate-pulse flex flex-col items-center gap-2">
            <span>[ INITIATING_MULTI_AGENT_SEQUENCE VIA {provider}... ]</span>
            <div className="h-2 w-16 bg-black"></div>
          </div>
        </div>
      )}
      {isDebating && debateHistory.length > 0 && (
        <div className="flex items-center justify-center border-[3px] border-black border-dashed bg-white opacity-50 p-5 mt-4">
          <div className="font-mono font-black animate-pulse flex flex-col items-center gap-2 text-xs">
            <span>[ PROCESSING_REBUTTAL_SEQUENCE... ]</span>
          </div>
        </div>
      )}
    </div>
  );
}

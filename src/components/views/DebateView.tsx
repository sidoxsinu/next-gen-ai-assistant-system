import React from 'react';
import { AIProvider, DebateRound } from '../../types';

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
  const presetDebates = [
    'Monolithic architecture is superior to microservices for 95% of engineering teams.',
    'Artificial General Intelligence (AGI) cannot be achieved solely via next-token prediction transformers.',
    'Rust should completely replace TypeScript and Go for high-throughput network services.',
    'Local open-source LLMs will make closed proprietary AI APIs obsolete by 2027.'
  ];

  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 bg-[#E5E5E5] gap-5 overflow-y-auto">
      {/* Arena Title & Telemetry Header */}
      <div className="bg-[#FF2D00] text-white border-[3px] border-black p-3 px-5 flex flex-wrap items-center justify-between gap-3 shadow-[4px_4px_0_#000]">
        <div className="flex items-center gap-3">
          <span className="bg-black text-[#FFE600] font-black text-xs px-2.5 py-1 tracking-wider uppercase border border-white">
            ADVERSARIAL_DUEL_ARENA // PRO_VS_CON
          </span>
          <span className="font-bold text-xs uppercase hidden md:inline">
            DUAL-AGENT DIALECTICAL REASONING WITH ARBITRATION JUDGE
          </span>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs font-bold">
          <span className="bg-black text-white px-2 py-1 border border-white">
            KERNEL: {provider}
          </span>
          <span className="bg-[#0047FF] text-white px-2 py-1 border border-white">
            AGENT_A (PRO)
          </span>
          <span className="text-black font-black">VS</span>
          <span className="bg-[#FF2D00] text-white px-2 py-1 border border-white">
            AGENT_B (CON)
          </span>
        </div>
      </div>

      {/* Preset Spicy Debates Launcher */}
      <div className="bg-white border-[3px] border-black p-4 flex flex-col gap-2 shadow-[4px_4px_0_#000]">
        <span className="font-black uppercase text-xs text-black">
          SELECT_PRESET_ARENA_SHOWDOWN:
        </span>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {presetDebates.map((topic, idx) => (
            <button
              key={idx}
              onClick={() => {
                setDebateTopic(topic);
                onInitiateDebate(topic, false);
              }}
              disabled={isDebating}
              className="text-left border-[2px] border-black p-2 bg-gray-50 hover:bg-[#FFE600] text-xs font-mono font-bold leading-tight cursor-pointer active:translate-y-0.5 transition-all disabled:opacity-50"
            >
              ⚡ {topic}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Topic Input Stage */}
      <div className="bg-white border-[3px] border-black p-5 flex flex-col gap-3 shadow-[4px_4px_0_#000]">
        <label className="font-black uppercase text-sm">ENTER_CUSTOM_DEBATE_MOTION:</label>
        <div className="flex flex-col md:flex-row gap-3">
          <input
            type="text"
            value={debateTopic}
            onChange={(e) => setDebateTopic(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !isDebating && debateTopic.trim()) {
                onInitiateDebate(debateTopic, false);
              }
            }}
            placeholder="E.g. Is Artificial General Intelligence safe for humanity?"
            className="flex-1 border-[3px] border-black p-3 font-mono text-sm uppercase focus:outline-none focus:bg-[#FFE600] shadow-[inset_2px_2px_0_#000]"
            disabled={isDebating}
          />
          <button
            onClick={() => onInitiateDebate(debateTopic, false)}
            disabled={isDebating || !debateTopic.trim()}
            className="bg-black text-[#FFE600] hover:bg-[#FF2D00] hover:text-white border-[3px] border-black px-6 py-3 font-black text-center uppercase active:translate-y-1 transition-all disabled:opacity-50 artistic-shadow"
          >
            {isDebating ? '[ PROCESSING_DUEL... ]' : '[ INITIATE_ARENA_DUEL ]'}
          </button>
        </div>
      </div>

      {/* Debate History mapping */}
      {debateHistory.map((round, idx) => (
        <div key={idx} className="flex flex-col gap-4">
          <div className="text-center font-black uppercase text-xs bg-black text-white py-1.5 border-[2px] border-black shadow-[2px_2px_0_#000]">
            &gt;&gt; ARENA ROUND {idx + 1} OF {debateHistory.length}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* AGENT A PRO (BLUE CORNER) */}
            <div className="bg-white border-[3px] border-black border-l-[10px] border-l-[#0047FF] flex flex-col shadow-[4px_4px_0_#000]">
              <div className="bg-[#0047FF] text-white px-3 py-1.5 text-xs font-black uppercase flex justify-between items-center">
                <span>&gt;_AGENT_A: [AFFIRMATIVE_PRO]</span>
                <span className="bg-white text-[#0047FF] px-1 font-mono text-[0.65rem]">CORNER_1</span>
              </div>
              <div className="p-5 font-mono text-sm whitespace-pre-wrap leading-relaxed flex-1 bg-blue-50/20">
                {round.agentA}
              </div>
            </div>

            {/* AGENT B CON (RED CORNER) */}
            <div className="bg-white border-[3px] border-black border-l-[10px] border-l-[#FF2D00] flex flex-col shadow-[4px_4px_0_#000]">
              <div className="bg-[#FF2D00] text-white px-3 py-1.5 text-xs font-black uppercase flex justify-between items-center">
                <span>&gt;_AGENT_B: [NEGATIVE_REBUTTAL]</span>
                <span className="bg-white text-[#FF2D00] px-1 font-mono text-[0.65rem]">CORNER_2</span>
              </div>
              <div className="p-5 font-mono text-sm whitespace-pre-wrap leading-relaxed flex-1 bg-red-50/20">
                {round.agentB}
              </div>
            </div>
          </div>

          {/* VERDICT (CHAMPION GOLD) */}
          <div className="bg-white border-[3px] border-black border-l-[10px] border-l-[#FFE600] flex flex-col shadow-[4px_4px_0_#000]">
            <div className="bg-black text-[#FFE600] px-4 py-2 text-xs font-black uppercase flex justify-between items-center">
              <span>⚖️ OFFICIAL_ARBITRATION_JUDGE_VERDICT</span>
              <span className="text-white text-[0.65rem] font-mono">SCORED_BY_{provider}</span>
            </div>
            <div className="p-5 font-mono text-sm whitespace-pre-wrap leading-relaxed bg-yellow-50/30">
              {round.verdict}
            </div>
            {idx === debateHistory.length - 1 && (
              <div className="p-3 bg-gray-50 border-t-[3px] border-black border-dashed flex justify-end gap-3 items-center">
                <span className="text-xs font-bold text-gray-500 uppercase">
                  UNRESOLVED TENSION DETECTED:
                </span>
                <button
                  onClick={() => onInitiateDebate(round.verdict, true)}
                  disabled={isDebating}
                  className="bg-black text-[#FFE600] border-[2px] border-black px-4 py-2 font-black uppercase active:translate-y-0.5 hover:bg-[#FFE600] hover:text-black transition-colors text-xs shadow-[2px_2px_0_#000]"
                >
                  [ TRIGGER_ROUND_2_REBUTTAL ]
                </button>
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Loading States */}
      {isDebating && debateHistory.length === 0 && (
        <div className="flex items-center justify-center border-[3px] border-black border-dashed bg-white p-12 mt-4 shadow-[4px_4px_0_#000]">
          <div className="font-mono font-black animate-pulse flex flex-col items-center gap-3">
            <span className="text-sm uppercase tracking-wider text-black">
              [ INITIATING_MULTI_AGENT_SEQUENCE VIA {provider}... ]
            </span>
            <div className="flex gap-2">
              <div className="h-3 w-8 bg-[#0047FF]"></div>
              <div className="h-3 w-8 bg-[#FF2D00]"></div>
              <div className="h-3 w-8 bg-[#FFE600]"></div>
            </div>
          </div>
        </div>
      )}

      {isDebating && debateHistory.length > 0 && (
        <div className="flex items-center justify-center border-[3px] border-black border-dashed bg-white p-6 mt-2">
          <div className="font-mono font-black animate-pulse flex items-center gap-3 text-xs">
            <span className="w-2 h-4 bg-black"></span>
            <span>[ PROCESSING_REBUTTAL_SEQUENCE VIA {provider}... ]</span>
          </div>
        </div>
      )}
    </div>
  );
}

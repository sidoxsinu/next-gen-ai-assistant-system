import React from 'react';
import { Mode, Message, KnowledgeTrailItem, WorkflowTask } from '../types';

interface SidebarProps {
  activeMode: Mode;
  input: string;
  setInput: (val: string) => void;
  handleSend: () => void;
  outputLang: string;
  setOutputLang: (val: string) => void;
  streamSpeed: number;
  setStreamSpeed: (val: number) => void;
  exportSession: () => void;
  loadHistory: () => void;
  pinnedMessageIds: string[];
  messages: Message[];
  knowledgeTrail: KnowledgeTrailItem[];
  activeWorkflow: WorkflowTask[];
  toggleTask: (id: string) => void;
  liveSessionActive: boolean;
  setLiveSessionActive: (val: boolean) => void;
  startSTT: () => void;
  isRecording: boolean;
  complexityMode: 'ELI5' | 'EXPERT';
  setComplexityMode: (val: 'ELI5' | 'EXPERT') => void;
  haltTTS: () => void;
  isTyping: boolean;
}

export function Sidebar({
  activeMode,
  input,
  setInput,
  handleSend,
  outputLang,
  setOutputLang,
  streamSpeed,
  setStreamSpeed,
  exportSession,
  loadHistory,
  pinnedMessageIds,
  messages,
  knowledgeTrail,
  activeWorkflow,
  toggleTask,
  liveSessionActive,
  setLiveSessionActive,
  startSTT,
  isRecording,
  complexityMode,
  setComplexityMode,
  haltTTS,
  isTyping
}: SidebarProps) {
  return (
    <section className="bg-white border-black border-r-[3px] p-5 flex flex-col gap-5 overflow-y-auto">
      <div className="flex flex-col gap-3">
        <span className="bg-black text-white px-3 py-1 text-sm font-bold inline-block self-start mb-1 uppercase">
          USER_INPUT_MODULE
        </span>
        <label className="font-black uppercase text-[0.8rem]">ENTER {activeMode} TOPIC OR QUERY:</label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder={`READY_FOR_COMMAND // MODE: ${activeMode}`}
          className="border-[3px] border-black p-3 bg-[#E5E5E5] focus:outline-none h-36 font-mono text-sm uppercase resize-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1">
          <label className="font-black uppercase text-[0.65rem]">OUTPUT_LANG:</label>
          <select
            value={outputLang}
            onChange={(e) => setOutputLang(e.target.value)}
            className="border-[3px] border-black p-1 bg-white text-[0.65rem] font-bold uppercase focus:outline-none cursor-pointer"
          >
            {['English', 'Spanish', 'French', 'German', 'Hindi', 'Arabic', 'Japanese'].map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="font-black uppercase text-[0.65rem]">STREAM_SPEED:</label>
          <div className="flex gap-1 flex-1">
            <button
              onClick={() => setStreamSpeed(50)}
              className={`flex-1 border-[3px] border-black text-[0.55rem] font-bold ${
                streamSpeed === 50 ? 'bg-[#FFE600]' : 'bg-white hover:bg-gray-100'
              }`}
            >
              SLW
            </button>
            <button
              onClick={() => setStreamSpeed(20)}
              className={`flex-1 border-[3px] border-black text-[0.55rem] font-bold ${
                streamSpeed === 20 ? 'bg-[#FFE600]' : 'bg-white hover:bg-gray-100'
              }`}
            >
              NRM
            </button>
            <button
              onClick={() => setStreamSpeed(0)}
              className={`flex-1 border-[3px] border-black text-[0.55rem] font-bold ${
                streamSpeed === 0 ? 'bg-[#FF2D00] text-white' : 'bg-white hover:bg-gray-100'
              }`}
            >
              FST
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={exportSession}
          className="border-[3px] border-black p-2 bg-black hover:bg-[#0047FF] text-white text-[0.65rem] font-bold uppercase cursor-pointer active:translate-y-1"
        >
          EXPORT_SESSION
        </button>
        <button
          onClick={loadHistory}
          className="border-[3px] border-black p-2 bg-white hover:bg-[#FFE600] text-black text-[0.65rem] font-bold uppercase cursor-pointer active:translate-y-1"
        >
          LOAD_HISTORY
        </button>
      </div>

      {pinnedMessageIds.length > 0 && (
        <div className="flex flex-col gap-2 mt-4 p-3 border-[3px] border-black bg-gray-50">
          <label className="font-black uppercase text-[0.8rem] bg-black text-[#FFE600] px-2 py-1 inline-block self-start">
            PINNED_NODES:
          </label>
          <div className="flex flex-col gap-2 font-mono mt-2">
            {messages
              .filter((m) => pinnedMessageIds.includes(m.id))
              .map((m) => (
                <div
                  key={m.id}
                  className="border-l-[6px] border-[#FF2D00] p-2 bg-[#FFE600] text-[0.65rem] text-black leading-tight truncate"
                >
                  {m.text}
                </div>
              ))}
          </div>
        </div>
      )}

      {activeMode === 'KNOWLEDGE' && knowledgeTrail.length > 0 && (
        <div className="flex flex-col gap-2">
          <label className="font-black uppercase text-[0.8rem]">KNOWLEDGE_TRAIL:</label>
          <div className="flex flex-col gap-1">
            {knowledgeTrail.map((k) => (
              <div key={k.id} className="border-l-4 border-[#0047FF] bg-gray-50 p-2 text-[0.65rem] font-bold">
                <span className="opacity-50">[{k.timestamp}]</span> {k.subject}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeMode === 'WORKFLOW' && activeWorkflow.length > 0 && (
        <div className="flex flex-col gap-2">
          <label className="font-black uppercase text-[0.8rem]">ACTIVE_WORKFLOW_TRACKER:</label>
          <div className="flex flex-col gap-2">
            {activeWorkflow.map((t) => (
              <div
                key={t.id}
                onClick={() => toggleTask(t.id)}
                className={`border-[3px] border-black p-2 flex items-center gap-2 cursor-pointer transition-all ${
                  t.completed ? 'bg-green-100 opacity-60' : 'bg-white'
                }`}
              >
                <div className={`w-4 h-4 border-2 border-black flex-shrink-0 ${t.completed ? 'bg-black' : ''}`}></div>
                <div className="flex-1 flex flex-col">
                  <span className={`text-[0.7rem] font-bold ${t.completed ? 'line-through' : ''}`}>{t.label}</span>
                  <span className={`text-[0.6rem] font-black ${t.priority === 'HIGH' ? 'text-red-500' : 'text-blue-500'}`}>
                    {t.priority}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <label className="font-black uppercase text-[0.8rem]">Multimodal Controls:</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setLiveSessionActive(!liveSessionActive)}
            className={`border-[3px] border-black p-2 font-bold text-[0.7rem] uppercase ${
              liveSessionActive ? 'bg-red-500 text-white' : 'bg-[#FFE600] active:translate-y-1'
            }`}
          >
            {liveSessionActive ? 'DISCONNECT' : 'LIVE API'}
          </button>
          <button
            onClick={startSTT}
            className={`border-[3px] border-black p-2 font-bold text-[0.7rem] uppercase ${
              isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-white active:translate-y-1'
            }`}
          >
            {isRecording ? 'LISTENING...' : 'VOICE_STT'}
          </button>
        </div>
        <button
          onClick={() => setComplexityMode(complexityMode === 'EXPERT' ? 'ELI5' : 'EXPERT')}
          className={`border-[3px] border-black p-2 font-black text-[0.7rem] uppercase transition-colors active:translate-y-1 ${
            complexityMode === 'ELI5' ? 'bg-[#FFE600] text-black' : 'bg-[#0047FF] text-white'
          }`}
        >
          [{complexityMode}_MODE]
        </button>
        <button
          onClick={haltTTS}
          className="border-[3px] border-black p-2 bg-black text-[#FFE600] font-bold text-[0.7rem] uppercase active:translate-y-1"
        >
          [X] HALT_AUDIO
        </button>
      </div>

      <button
        onClick={handleSend}
        disabled={isTyping || !input.trim()}
        className="bg-[#FF2D00] text-white border-[3px] border-black p-4 font-bold text-center uppercase artistic-shadow artistic-shadow-active disabled:opacity-50 disabled:cursor-not-allowed"
      >
        INITIALIZE_AI_SYNTHESIS
      </button>
    </section>
  );
}

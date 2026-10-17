import React, { useState } from 'react';
import { AIProvider, Message, ServerSmtpStatus, WorkflowTask } from '../../types';
import { TerminalOutput } from '../TerminalOutput';
import { SmtpDrawer } from '../SmtpDrawer';

interface WorkflowViewProps {
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
  // Workflow Tasks State
  activeWorkflow: WorkflowTask[];
  setActiveWorkflow: React.Dispatch<React.SetStateAction<WorkflowTask[]>>;
  toggleTask: (id: string) => void;
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

export function WorkflowView({
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
  activeWorkflow,
  setActiveWorkflow,
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
}: WorkflowViewProps) {
  const [newStepLabel, setNewStepLabel] = useState('');
  const [newStepPriority, setNewStepPriority] = useState<'HIGH' | 'MEDIUM' | 'LOW'>('HIGH');
  const [activeTab, setActiveTab] = useState<'KANBAN' | 'LOGS'>('KANBAN');

  const completedCount = activeWorkflow.filter((t) => t.completed || t.stage === 'DONE').length;
  const totalCount = activeWorkflow.length;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleAddNewTask = () => {
    if (!newStepLabel.trim()) return;
    const newTask: WorkflowTask = {
      id: `t-${Date.now()}`,
      label: newStepLabel.trim(),
      priority: newStepPriority,
      completed: false,
      stage: 'STAGED'
    };
    setActiveWorkflow((prev) => [...prev, newTask]);
    setNewStepLabel('');
  };

  const handleAdvanceTask = (id: string) => {
    setActiveWorkflow((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const currentStage = t.stage || (t.completed ? 'DONE' : 'STAGED');
        if (currentStage === 'STAGED') return { ...t, stage: 'IN_PROGRESS', completed: false };
        if (currentStage === 'IN_PROGRESS') return { ...t, stage: 'DONE', completed: true };
        return { ...t, stage: 'STAGED', completed: false };
      })
    );
  };

  const handleDeleteTask = (id: string) => {
    setActiveWorkflow((prev) => prev.filter((t) => t.id !== id));
  };

  const handleExecuteStepWithAI = (task: WorkflowTask) => {
    const prompt = `EXECUTE WORKFLOW STEP: "${task.label}" [PRIORITY: ${task.priority}]. Provide execution instructions, commands, and verification criteria.`;
    setInput(prompt);
    setActiveTab('LOGS');
    onSendMessage(prompt);
  };

  const handleLoadPreset = (presetName: string) => {
    if (presetName === 'CICD') {
      setActiveWorkflow([
        { id: 'c-1', label: '1. Linting & Typecheck (tsc --noEmit)', priority: 'HIGH', completed: false, stage: 'STAGED' },
        { id: 'c-2', label: '2. Run Provider Verification (npm test)', priority: 'HIGH', completed: false, stage: 'STAGED' },
        { id: 'c-3', label: '3. Build Production Bundle (vite build)', priority: 'HIGH', completed: false, stage: 'STAGED' },
        { id: 'c-4', label: '4. Run Health Check Verification', priority: 'MEDIUM', completed: false, stage: 'STAGED' }
      ]);
    } else if (presetName === 'SECURITY') {
      setActiveWorkflow([
        { id: 's-1', label: '1. Audit package.json dependencies for CVEs', priority: 'HIGH', completed: false, stage: 'STAGED' },
        { id: 's-2', label: '2. Scan codebase for exposed API keys', priority: 'HIGH', completed: false, stage: 'STAGED' },
        { id: 's-3', label: '3. Verify CORS & environment variable scoping', priority: 'MEDIUM', completed: false, stage: 'STAGED' }
      ]);
    } else if (presetName === 'REFACTOR') {
      setActiveWorkflow([
        { id: 'r-1', label: '1. Identify monolithic functions and duplicated state', priority: 'HIGH', completed: false, stage: 'STAGED' },
        { id: 'r-2', label: '2. Extract shared interfaces and services', priority: 'HIGH', completed: false, stage: 'STAGED' },
        { id: 'r-3', label: '3. Verify build, linting, and tests pass cleanly', priority: 'HIGH', completed: false, stage: 'STAGED' }
      ]);
    }
  };

  const exportWorkflowJson = () => {
    const dataStr = JSON.stringify(activeWorkflow, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `WORKFLOW_PIPELINE_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Group into Kanban columns
  const stagedTasks = activeWorkflow.filter((t) => (!t.stage || t.stage === 'STAGED') && !t.completed);
  const inProgressTasks = activeWorkflow.filter((t) => t.stage === 'IN_PROGRESS' && !t.completed);
  const doneTasks = activeWorkflow.filter((t) => t.stage === 'DONE' || t.completed);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Industrial Header */}
      <div data-tour="pipeline-progress" className="bg-[#FFE600] text-black border-b-[3px] border-black p-3 px-5 flex flex-wrap items-center justify-between gap-3 shadow-[0_2px_0_#000]">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-black hazard-stripes-sm"></div>
          <span className="bg-black text-[#FFE600] font-black text-xs px-2.5 py-1 tracking-wider uppercase border border-black">
            PIPELINE_RUNNER // TASK_ORCHESTRATOR
          </span>
          <span className="font-black text-xs uppercase hidden md:inline">
            AUTOMATED KANBAN &amp; WORKFLOW SYNTHESIS ENGINE
          </span>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Progress Telemetry */}
          <div className="flex items-center gap-2 bg-black text-white px-3 py-1 border border-black font-mono text-xs">
            <span className="text-[#FFE600] font-black">PROGRESS:</span>
            <span className="font-bold">
              {completedCount}/{totalCount} [{progressPct}%]
            </span>
            <div className="w-20 h-3 border border-white bg-gray-800 ml-1 overflow-hidden">
              <div className="h-full bg-[#FFE600]" style={{ width: `${progressPct}%` }}></div>
            </div>
          </div>

          {/* Toggle View Mode */}
          <div className="flex border-2 border-black bg-white">
            <button
              onClick={() => setActiveTab('KANBAN')}
              className={`px-3 py-1 text-xs font-black uppercase cursor-pointer ${
                activeTab === 'KANBAN' ? 'bg-black text-[#FFE600]' : 'text-black hover:bg-yellow-100'
              }`}
            >
              KANBAN_BOARD
            </button>
            <button
              onClick={() => setActiveTab('LOGS')}
              className={`px-3 py-1 text-xs font-black uppercase cursor-pointer ${
                activeTab === 'LOGS' ? 'bg-black text-[#FFE600]' : 'text-black hover:bg-yellow-100'
              }`}
            >
              AI_SYNTHESIS_LOGS
            </button>
          </div>

          {activeWorkflow.length > 0 && (
            <button
              onClick={exportWorkflowJson}
              className="bg-black text-white px-2 py-1 font-bold uppercase text-[0.7rem] hover:bg-gray-800 border border-black cursor-pointer"
            >
              EXPORT_JSON
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Control Cockpit on Left, Kanban / Terminal in Center */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[330px_1fr] overflow-hidden">
        {/* Left Console: Workflow Orchestrator */}
        <section className="bg-white border-black border-r-[3px] p-4 flex flex-col gap-4 overflow-y-auto">
          {/* Pipeline Presets */}
          <div data-tour="workflow-presets" className="flex flex-col gap-1.5">
            <span className="font-black uppercase text-[0.65rem] bg-black text-[#FFE600] px-2 py-0.5 inline-block self-start">
              LOAD_STARTER_PRESETS:
            </span>
            <div className="grid grid-cols-1 gap-1">
              <button
                onClick={() => handleLoadPreset('CICD')}
                className="text-left border-[2px] border-black p-1.5 bg-white hover:bg-[#FFE600] text-[0.65rem] font-bold uppercase active:translate-y-0.5 transition-all cursor-pointer"
              >
                [⚡ CI/CD PRODUCTION PIPELINE]
              </button>
              <button
                onClick={() => handleLoadPreset('REFACTOR')}
                className="text-left border-[2px] border-black p-1.5 bg-white hover:bg-[#FFE600] text-[0.65rem] font-bold uppercase active:translate-y-0.5 transition-all cursor-pointer"
              >
                [⚡ SYSTEM REFACTOR WORKFLOW]
              </button>
              <button
                onClick={() => handleLoadPreset('SECURITY')}
                className="text-left border-[2px] border-black p-1.5 bg-white hover:bg-[#FFE600] text-[0.65rem] font-bold uppercase active:translate-y-0.5 transition-all cursor-pointer"
              >
                [⚡ SECURITY COMPLIANCE AUDIT]
              </button>
            </div>
          </div>

          {/* Add Step Manually */}
          <div className="border-[2px] border-black p-3 bg-yellow-50 flex flex-col gap-2">
            <span className="font-black uppercase text-[0.7rem] text-black">
              + INJECT_STEP_MANUALLY:
            </span>
            <input
              type="text"
              value={newStepLabel}
              onChange={(e) => setNewStepLabel(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddNewTask();
              }}
              placeholder="E.g., Invalidate CDN edge caches..."
              className="border-[2px] border-black p-1.5 text-xs font-mono uppercase bg-white focus:outline-none"
            />
            <div className="flex gap-2">
              <select
                value={newStepPriority}
                onChange={(e) => setNewStepPriority(e.target.value as any)}
                className="border-[2px] border-black p-1 bg-white text-xs font-bold uppercase cursor-pointer"
              >
                <option value="HIGH">HIGH_PRIORITY</option>
                <option value="MEDIUM">MEDIUM_PRIORITY</option>
                <option value="LOW">LOW_PRIORITY</option>
              </select>
              <button
                onClick={handleAddNewTask}
                className="flex-1 bg-black text-[#FFE600] border-[2px] border-black font-black text-xs uppercase p-1 hover:bg-gray-800 cursor-pointer"
              >
                ADD_STEP
              </button>
            </div>
          </div>

          {/* Prompt AI to generate or decompose entire workflow */}
          <div className="flex flex-col gap-1.5">
            <label className="font-black uppercase text-[0.75rem]">AI_WORKFLOW_SYNTHESIS:</label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  setActiveTab('LOGS');
                  onSendMessage(input);
                }
              }}
              placeholder={`DESCRIBE WORKFLOW TO AUTOMATE...\nE.g.: "Break down migrating database from SQLite to PostgreSQL with zero downtime"`}
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
            onClick={() => {
              setActiveTab('LOGS');
              onSendMessage(input);
            }}
            disabled={isTyping || !input.trim()}
            className="bg-[#FFE600] text-black border-[3px] border-black p-3 font-black text-center uppercase artistic-shadow artistic-shadow-active disabled:opacity-50 disabled:cursor-not-allowed hover:bg-yellow-400 cursor-pointer"
          >
            SYNTHESIZE_NEW_PIPELINE
          </button>
        </section>

        {/* Center: Kanban Execution Board OR Terminal Output */}
        <section className="bg-[#E5E5E5] p-4 flex flex-col gap-3 overflow-hidden">
          {activeTab === 'KANBAN' ? (
            <div data-tour="kanban-board" className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 overflow-y-auto">
              {/* Column 1: Staged */}
              <div className="flex flex-col bg-white border-[3px] border-black overflow-hidden shadow-[4px_4px_0_#000]">
                <div className="bg-black text-white px-3 py-2 text-xs font-black uppercase flex justify-between items-center border-b-2 border-black">
                  <span>01 // STAGED &amp; BACKLOG</span>
                  <span className="bg-[#FFE600] text-black px-1.5 py-0.2 text-[0.65rem] font-black">
                    {stagedTasks.length}
                  </span>
                </div>
                <div className="flex-1 p-3 flex flex-col gap-2.5 overflow-y-auto bg-gray-50">
                  {stagedTasks.length === 0 && (
                    <div className="p-4 text-center text-xs text-gray-400 font-mono italic">
                      NO_STAGED_TASKS
                      <br />
                      <span className="text-[0.65rem] text-gray-500">Inject steps above or prompt AI to synthesize a pipeline.</span>
                    </div>
                  )}
                  {stagedTasks.map((t) => (
                    <div
                      key={t.id}
                      className="border-[2px] border-black bg-white p-3 flex flex-col gap-2 border-l-[6px] border-l-[#0047FF] shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-bold font-mono leading-tight">{t.label}</span>
                        <button
                          onClick={() => handleDeleteTask(t.id)}
                          className="text-gray-400 hover:text-red-500 font-bold text-xs cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-dashed border-gray-300">
                        <span
                          className={`text-[0.6rem] font-black px-1 border border-black ${
                            t.priority === 'HIGH'
                              ? 'bg-red-500 text-white'
                              : t.priority === 'MEDIUM'
                              ? 'bg-[#FFE600] text-black'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {t.priority}
                        </span>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleExecuteStepWithAI(t)}
                            className="bg-black text-[#FFE600] px-1.5 py-0.5 text-[0.6rem] font-bold uppercase hover:bg-gray-800 cursor-pointer"
                          >
                            [AI_RUN]
                          </button>
                          <button
                            onClick={() => handleAdvanceTask(t.id)}
                            className="bg-white border border-black px-1.5 py-0.5 text-[0.6rem] font-bold uppercase hover:bg-[#FFE600] cursor-pointer"
                          >
                            START →
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Column 2: In Progress */}
              <div className="flex flex-col bg-white border-[3px] border-black overflow-hidden shadow-[4px_4px_0_#000]">
                <div className="bg-[#FFE600] text-black px-3 py-2 text-xs font-black uppercase flex justify-between items-center border-b-2 border-black">
                  <span>02 // IN_EXECUTION</span>
                  <span className="bg-black text-[#FFE600] px-1.5 py-0.2 text-[0.65rem] font-black">
                    {inProgressTasks.length}
                  </span>
                </div>
                <div className="flex-1 p-3 flex flex-col gap-2.5 overflow-y-auto bg-yellow-50/30">
                  {inProgressTasks.length === 0 && (
                    <div className="p-4 text-center text-xs text-gray-400 font-mono italic">
                      NO_TASKS_IN_EXECUTION
                    </div>
                  )}
                  {inProgressTasks.map((t) => (
                    <div
                      key={t.id}
                      className="border-[2px] border-black bg-white p-3 flex flex-col gap-2 border-l-[6px] border-l-[#FFE600] shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-bold font-mono leading-tight">{t.label}</span>
                        <button
                          onClick={() => handleDeleteTask(t.id)}
                          className="text-gray-400 hover:text-red-500 font-bold text-xs cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-dashed border-gray-300">
                        <span
                          className={`text-[0.6rem] font-black px-1 border border-black ${
                            t.priority === 'HIGH' ? 'bg-red-500 text-white' : 'bg-[#FFE600] text-black'
                          }`}
                        >
                          {t.priority}
                        </span>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleExecuteStepWithAI(t)}
                            className="bg-black text-[#FFE600] px-1.5 py-0.5 text-[0.6rem] font-bold uppercase hover:bg-gray-800 cursor-pointer"
                          >
                            [AI_RUN]
                          </button>
                          <button
                            onClick={() => handleAdvanceTask(t.id)}
                            className="bg-[#00CC44] text-black font-black border border-black px-1.5 py-0.5 text-[0.6rem] uppercase hover:bg-green-400 cursor-pointer"
                          >
                            COMPLETE ✓
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Column 3: Completed */}
              <div className="flex flex-col bg-white border-[3px] border-black overflow-hidden shadow-[4px_4px_0_#000]">
                <div className="bg-[#00CC44] text-black px-3 py-2 text-xs font-black uppercase flex justify-between items-center border-b-2 border-black">
                  <span>03 // VERIFIED_DONE</span>
                  <span className="bg-black text-[#00CC44] px-1.5 py-0.2 text-[0.65rem] font-black">
                    {doneTasks.length}
                  </span>
                </div>
                <div className="flex-1 p-3 flex flex-col gap-2.5 overflow-y-auto bg-green-50/40">
                  {doneTasks.length === 0 && (
                    <div className="p-4 text-center text-xs text-gray-400 font-mono italic">
                      NO_COMPLETED_TASKS_YET
                    </div>
                  )}
                  {doneTasks.map((t) => (
                    <div
                      key={t.id}
                      className="border-[2px] border-black bg-white/90 p-3 flex flex-col gap-2 border-l-[6px] border-l-[#00CC44] opacity-80"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-bold font-mono leading-tight line-through text-gray-600">
                          {t.label}
                        </span>
                        <button
                          onClick={() => handleDeleteTask(t.id)}
                          className="text-gray-400 hover:text-red-500 font-bold text-xs cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-dashed border-gray-300">
                        <span className="text-[0.6rem] font-black px-1 bg-green-100 text-green-900 border border-black">
                          DONE
                        </span>
                        <button
                          onClick={() => handleAdvanceTask(t.id)}
                          className="bg-white border border-black px-1.5 py-0.5 text-[0.6rem] font-bold uppercase hover:bg-gray-100 cursor-pointer"
                        >
                          ↺ REOPEN
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
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

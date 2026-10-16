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
  complexityMode: 'ELI5' | 'EXPERT';
  setComplexityMode: (val: 'ELI5' | 'EXPERT') => void;
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
  toggleTask,
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

  // Pre-populate if empty
  const defaultTasks: WorkflowTask[] = [
    {
      id: 't-1',
      label: 'Build container images & pass unit test suite',
      priority: 'HIGH',
      completed: true,
      stage: 'DONE'
    },
    {
      id: 't-2',
      label: 'Run database migration in staging environment',
      priority: 'HIGH',
      completed: false,
      stage: 'IN_PROGRESS'
    },
    {
      id: 't-3',
      label: 'Verify API backward-compatibility contract',
      priority: 'MEDIUM',
      completed: false,
      stage: 'STAGED'
    },
    {
      id: 't-4',
      label: 'Trigger blue/green canary rollout on production',
      priority: 'HIGH',
      completed: false,
      stage: 'STAGED'
    }
  ];

  const currentTasks = activeWorkflow.length > 0 ? activeWorkflow : defaultTasks;
  const completedCount = currentTasks.filter((t) => t.completed || t.stage === 'DONE').length;
  const totalCount = currentTasks.length;
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
    setActiveWorkflow((prev) => (prev.length > 0 ? [...prev, newTask] : [...defaultTasks, newTask]));
    setNewStepLabel('');
  };

  const handleAdvanceTask = (id: string) => {
    setActiveWorkflow((prev) => {
      const base = prev.length > 0 ? prev : defaultTasks;
      return base.map((t) => {
        if (t.id !== id) return t;
        const currentStage = t.stage || (t.completed ? 'DONE' : 'STAGED');
        if (currentStage === 'STAGED') return { ...t, stage: 'IN_PROGRESS', completed: false };
        if (currentStage === 'IN_PROGRESS') return { ...t, stage: 'DONE', completed: true };
        return { ...t, stage: 'STAGED', completed: false };
      });
    });
  };

  const handleDeleteTask = (id: string) => {
    setActiveWorkflow((prev) => {
      const base = prev.length > 0 ? prev : defaultTasks;
      return base.filter((t) => t.id !== id);
    });
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
        { id: 'c-1', label: '1. Linting & Typecheck (tsc --noEmit)', priority: 'HIGH', completed: true, stage: 'DONE' },
        { id: 'c-2', label: '2. Run Provider Verification (npm test)', priority: 'HIGH', completed: false, stage: 'IN_PROGRESS' },
        { id: 'c-3', label: '3. Build Production Bundle (vite build)', priority: 'HIGH', completed: false, stage: 'STAGED' },
        { id: 'c-4', label: '4. Run E2E Health Check Endpoint', priority: 'MEDIUM', completed: false, stage: 'STAGED' },
        { id: 'c-5', label: '5. Promote Canary to 100% Traffic', priority: 'HIGH', completed: false, stage: 'STAGED' }
      ]);
    } else if (presetName === 'SECURITY') {
      setActiveWorkflow([
        { id: 's-1', label: '1. Audit package.json dependencies for CVEs', priority: 'HIGH', completed: true, stage: 'DONE' },
        { id: 's-2', label: '2. Scan git commit logs for exposed API keys', priority: 'HIGH', completed: true, stage: 'DONE' },
        { id: 's-3', label: '3. Verify CORS & SSR Proxy headers', priority: 'MEDIUM', completed: false, stage: 'IN_PROGRESS' },
        { id: 's-4', label: '4. Penetration testing against auth endpoints', priority: 'HIGH', completed: false, stage: 'STAGED' }
      ]);
    } else if (presetName === 'REFACTOR') {
      setActiveWorkflow([
        { id: 'r-1', label: '1. Decouple monolith App.tsx into view components', priority: 'HIGH', completed: true, stage: 'DONE' },
        { id: 'r-2', label: '2. Consolidate shared interfaces into src/types', priority: 'HIGH', completed: true, stage: 'DONE' },
        { id: 'r-3', label: '3. Implement themed tab layouts with neo-brutalist styling', priority: 'HIGH', completed: false, stage: 'IN_PROGRESS' },
        { id: 'r-4', label: '4. Run build and type check verification', priority: 'HIGH', completed: false, stage: 'STAGED' }
      ]);
    }
  };

  const exportWorkflowJson = () => {
    const dataStr = JSON.stringify(currentTasks, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `WORKFLOW_PIPELINE_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Group into Kanban columns
  const stagedTasks = currentTasks.filter((t) => (!t.stage || t.stage === 'STAGED') && !t.completed);
  const inProgressTasks = currentTasks.filter((t) => t.stage === 'IN_PROGRESS' && !t.completed);
  const doneTasks = currentTasks.filter((t) => t.stage === 'DONE' || t.completed);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Industrial Hazard Telemetry Header */}
      <div className="bg-[#FFE600] text-black border-b-[3px] border-black p-3 px-5 flex flex-wrap items-center justify-between gap-3 shadow-[0_2px_0_#000]">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-black hazard-stripes-sm"></div>
          <span className="bg-black text-[#FFE600] font-black text-xs px-2.5 py-1 tracking-wider uppercase border border-black">
            PIPELINE_RUNNER // INDUSTRIAL_V2
          </span>
          <span className="font-black text-xs uppercase hidden md:inline">
            AUTOMATED KANBAN & TASK ORCHESTRATION ENGINE
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

          <button
            onClick={exportWorkflowJson}
            className="bg-black text-white px-2 py-1 font-bold uppercase text-[0.7rem] hover:bg-gray-800 border border-black"
          >
            EXPORT_JSON
          </button>
        </div>
      </div>

      {/* Main Grid: Control Cockpit on Left, Kanban / Terminal in Center */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[330px_1fr] overflow-hidden">
        {/* Left Console: Workflow Orchestrator */}
        <section className="bg-white border-black border-r-[3px] p-4 flex flex-col gap-4 overflow-y-auto">
          {/* Pipeline Presets */}
          <div className="flex flex-col gap-1.5">
            <span className="font-black uppercase text-[0.65rem] bg-black text-[#FFE600] px-2 py-0.5 inline-block self-start">
              LOAD_PRESET_PIPELINES:
            </span>
            <div className="grid grid-cols-1 gap-1">
              <button
                onClick={() => handleLoadPreset('CICD')}
                className="text-left border-[2px] border-black p-1.5 bg-white hover:bg-[#FFE600] text-[0.65rem] font-bold uppercase active:translate-y-0.5 transition-all"
              >
                [⚡ CI/CD PRODUCTION DEPLOY]
              </button>
              <button
                onClick={() => handleLoadPreset('REFACTOR')}
                className="text-left border-[2px] border-black p-1.5 bg-white hover:bg-[#FFE600] text-[0.65rem] font-bold uppercase active:translate-y-0.5 transition-all"
              >
                [⚡ SYSTEM REFACTOR PIPELINE]
              </button>
              <button
                onClick={() => handleLoadPreset('SECURITY')}
                className="text-left border-[2px] border-black p-1.5 bg-white hover:bg-[#FFE600] text-[0.65rem] font-bold uppercase active:translate-y-0.5 transition-all"
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
                className="border-[2px] border-black p-1 bg-white text-xs font-bold uppercase"
              >
                <option value="HIGH">HIGH_PRIORITY</option>
                <option value="MEDIUM">MEDIUM_PRIORITY</option>
                <option value="LOW">LOW_PRIORITY</option>
              </select>
              <button
                onClick={handleAddNewTask}
                className="flex-1 bg-black text-[#FFE600] border-[2px] border-black font-black text-xs uppercase p-1 hover:bg-gray-800"
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
              className={`border-[2px] border-black p-2 font-bold text-[0.65rem] uppercase active:translate-y-0.5 ${
                isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-white hover:bg-gray-100'
              }`}
            >
              {isRecording ? 'LISTENING...' : 'VOICE_COMMAND'}
            </button>
            <button
              onClick={() => setComplexityMode(complexityMode === 'EXPERT' ? 'ELI5' : 'EXPERT')}
              className={`border-[2px] border-black p-2 font-black text-[0.65rem] uppercase active:translate-y-0.5 ${
                complexityMode === 'EXPERT' ? 'bg-black text-[#FFE600]' : 'bg-[#FFE600] text-black'
              }`}
            >
              [{complexityMode}]
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={exportSession}
              className="border-[2px] border-black p-1.5 bg-black text-white hover:bg-[#FFE600] hover:text-black text-[0.65rem] font-bold uppercase active:translate-y-0.5"
            >
              EXPORT_LOGS
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
              setActiveTab('LOGS');
              onSendMessage(input);
            }}
            disabled={isTyping || !input.trim()}
            className="bg-[#FFE600] text-black border-[3px] border-black p-3 font-black text-center uppercase artistic-shadow artistic-shadow-active disabled:opacity-50 disabled:cursor-not-allowed hover:bg-yellow-400"
          >
            SYNTHESIZE_NEW_PIPELINE
          </button>
        </section>

        {/* Center: Kanban Execution Board OR Terminal Output */}
        <section className="bg-[#E5E5E5] p-4 flex flex-col gap-3 overflow-hidden">
          {activeTab === 'KANBAN' ? (
            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 overflow-y-auto">
              {/* Column 1: Staged */}
              <div className="flex flex-col bg-white border-[3px] border-black overflow-hidden shadow-[4px_4px_0_#000]">
                <div className="bg-black text-white px-3 py-2 text-xs font-black uppercase flex justify-between items-center border-b-2 border-black">
                  <span>01 // STAGED & BACKLOG</span>
                  <span className="bg-[#FFE600] text-black px-1.5 py-0.2 text-[0.65rem] font-black">
                    {stagedTasks.length}
                  </span>
                </div>
                <div className="flex-1 p-3 flex flex-col gap-2.5 overflow-y-auto bg-gray-50">
                  {stagedTasks.length === 0 && (
                    <div className="p-4 text-center text-xs text-gray-400 font-mono italic">
                      NO_STAGED_TASKS
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
                          className="text-gray-400 hover:text-red-500 font-bold text-xs"
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
                            className="bg-black text-[#FFE600] px-1.5 py-0.5 text-[0.6rem] font-bold uppercase hover:bg-gray-800"
                          >
                            [AI_RUN]
                          </button>
                          <button
                            onClick={() => handleAdvanceTask(t.id)}
                            className="bg-white border border-black px-1.5 py-0.5 text-[0.6rem] font-bold uppercase hover:bg-[#FFE600]"
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
                      className="border-[2px] border-black bg-white p-3 flex flex-col gap-2 border-l-[6px] border-l-[#FFE600] shadow-sm animate-pulse-none"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-bold font-mono leading-tight">{t.label}</span>
                        <button
                          onClick={() => handleDeleteTask(t.id)}
                          className="text-gray-400 hover:text-red-500 font-bold text-xs"
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
                            className="bg-black text-[#FFE600] px-1.5 py-0.5 text-[0.6rem] font-bold uppercase hover:bg-gray-800"
                          >
                            [AI_RUN]
                          </button>
                          <button
                            onClick={() => handleAdvanceTask(t.id)}
                            className="bg-[#00CC44] text-black font-black border border-black px-1.5 py-0.5 text-[0.6rem] uppercase hover:bg-green-400"
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
                          className="text-gray-400 hover:text-red-500 font-bold text-xs"
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
                          className="bg-white border border-black px-1.5 py-0.5 text-[0.6rem] font-bold uppercase hover:bg-gray-100"
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

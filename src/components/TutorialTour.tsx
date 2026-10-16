import { useState, useEffect, useCallback, useRef } from 'react';
import { Mode } from '../types';

export interface TourStep {
  id: string;
  targetSelector: string;
  mode: Mode | 'GLOBAL';
  title: string;
  badge: string;
  description: string;
  proTip?: string;
}

export const SYSTEM_TOUR_STEPS: TourStep[] = [
  // 1. Header & Telemetry
  {
    id: 'header-telemetry',
    targetSelector: '[data-tour="header-telemetry"]',
    mode: 'GLOBAL',
    badge: 'SYSTEM // TELEMETRY',
    title: 'AI KERNEL & SESSION TELEMETRY',
    description:
      'Real-time status indicators monitor your active AI Provider (Google Gemini, Groq Cloud, or Local Ollama), session elapsed time, and total context token usage.',
    proTip: 'Click [⚙ AI_KERNEL_SETTINGS] anytime to switch AI providers or update models.'
  },
  // 2. Navigation Tabs
  {
    id: 'nav-tabs',
    targetSelector: '[data-tour="nav-tabs"]',
    mode: 'GLOBAL',
    badge: 'ARCHITECTURE // MODES',
    title: 'THEMATIC ASSISTANT MODES',
    description:
      'Every assistant mode is a custom-engineered workspace with a specialized color scheme, bespoke controls, and task-tailored AI reasoning pipelines.',
    proTip: 'Each mode auto-configures system instructions to match the domain.'
  },
  // 3. Research - Dossier Bar
  {
    id: 'dossier-bar',
    targetSelector: '[data-tour="dossier-bar"]',
    mode: 'RESEARCH',
    badge: 'RESEARCH // CITATIONS',
    title: 'ACADEMIC DOSSIER & CITATION CONTROLLER',
    description:
      'Switch between citation standards (APA-7, IEEE, MLA-9, Chicago, Nature) and research depths (Abstract, Systematic Lit Review, Methodology, Empirical Synthesis).',
    proTip: 'The AI automatically formats bibliography references into your selected citation format.'
  },
  // 4. Research - Macros
  {
    id: 'research-macros',
    targetSelector: '[data-tour="research-macros"]',
    mode: 'RESEARCH',
    badge: 'RESEARCH // QUICK_MACROS',
    title: 'ACADEMIC INQUIRY MACROS',
    description:
      'One-click triggers to run systematic literature reviews, search peer-reviewed citations, critique empirical methodologies, or extract statistical findings.',
    proTip: 'Combine quick macros with [STYLE: DETAILED] for thorough, in-depth analysis.'
  },
  // 5. Research - Evidence Board
  {
    id: 'evidence-board',
    targetSelector: '[data-tour="evidence-board"]',
    mode: 'RESEARCH',
    badge: 'RESEARCH // EVIDENCE_BOARD',
    title: 'EVIDENCE & HYPOTHESES BOARD',
    description:
      'Pins verified factual claims, empirical findings, and source notes alongside your inquiry stream. Click [EXPORT_BIB] to download a formatted bibliography.',
    proTip: 'Pin your own custom findings to the board by typing in the input box.'
  },
  // 6. Support - Incident Telemetry
  {
    id: 'incident-telemetry',
    targetSelector: '[data-tour="incident-telemetry"]',
    mode: 'SUPPORT',
    badge: 'SUPPORT // INCIDENT_DESK',
    title: 'LIVE INCIDENT TELEMETRY & SLA COUNTDOWN',
    description:
      'NOC command center featuring live incident ticket numbers (#INC-84920), a real-time ticking SLA breach countdown clock, and customer sentiment tracking.',
    proTip: 'If the SLA clock falls below 5 minutes, it blinks tactical red alert.'
  },
  // 7. Support - Resolution Macros
  {
    id: 'support-macros',
    targetSelector: '[data-tour="support-macros"]',
    mode: 'SUPPORT',
    badge: 'SUPPORT // SLA_MACROS',
    title: 'RAPID RESOLUTION MACROS',
    description:
      'Instant one-click actions: auto-acknowledge customer tickets, escalate directly to Tier-3 SREs, draft Root Cause Analyses (RCA), or issue SLA compensation credits.',
    proTip: 'Support bot responses use empathetic, professional incident management standards.'
  },
  // 8. Workflow - Pipeline Progress
  {
    id: 'pipeline-progress',
    targetSelector: '[data-tour="pipeline-progress"]',
    mode: 'WORKFLOW',
    badge: 'WORKFLOW // PIPELINE_RUNNER',
    title: 'INDUSTRIAL PIPELINE PROGRESS ENGINE',
    description:
      'Live segmented progress bar tracking completion percentage across all workflow stages. Toggle between the interactive Kanban Board and AI Synthesis Logs.',
    proTip: 'Export the complete pipeline state anytime as structured JSON.'
  },
  // 9. Workflow - Kanban Board
  {
    id: 'kanban-board',
    targetSelector: '[data-tour="kanban-board"]',
    mode: 'WORKFLOW',
    badge: 'WORKFLOW // KANBAN',
    title: '3-STAGE INTERACTIVE KANBAN BOARD',
    description:
      'Visual pipeline columns: 01_STAGED, 02_IN_EXECUTION, and 03_VERIFIED_DONE. Advance cards through stages or click [AI_RUN] to have the AI execute a specific step!',
    proTip: 'Click [AI_RUN] on any task card to automatically generate execution steps with code.'
  },
  // 10. Knowledge - Concept Matrix
  {
    id: 'concept-matrix',
    targetSelector: '[data-tour="concept-matrix"]',
    mode: 'KNOWLEDGE',
    badge: 'KNOWLEDGE // MEMORY_VAULT',
    title: 'NEURAL CONCEPT PILL MATRIX',
    description:
      'Interactive matrix of concepts explored during your sessions. Click any two concept pills to activate [SYNTHESIZE_SELECTED_BRIDGES] to discover latent connections.',
    proTip: 'Select two seemingly unrelated pills to generate non-obvious architecture insights.'
  },
  // 11. Knowledge - Flashcards
  {
    id: 'flashcard-study',
    targetSelector: '[data-tour="flashcard-study"]',
    mode: 'KNOWLEDGE',
    badge: 'KNOWLEDGE // ACTIVE_RECALL',
    title: 'INTERACTIVE REVISION FLASHCARDS',
    description:
      'Click the card to flip and reveal answers. Track mastered concepts, flip between cards, or generate fresh study flashcards from recent chats with one click.',
    proTip: 'Use flashcards for spaced-repetition revision before system design interviews.'
  },
  // 12. Debate - Duel Arena
  {
    id: 'debate-arena',
    targetSelector: '[data-tour="debate-arena"]',
    mode: 'DEBATE',
    badge: 'DEBATE // ADVERSARIAL_ARENA',
    title: 'ADVERSARIAL DUEL ARENA',
    description:
      'Pits Agent A (Affirmative Blue Corner) against Agent B (Negative Red Corner) in real-time dialectical combat, evaluated by an independent AI Judge.',
    proTip: 'Pick from spicy preset motions like "Monolith vs Microservices" or enter your own custom topic.'
  }
];

interface TutorialTourProps {
  isOpen: boolean;
  onClose: () => void;
  activeMode: Mode;
  setActiveMode: (mode: Mode) => void;
  filterMode?: Mode | null;
}

export function TutorialTour({
  isOpen,
  onClose,
  activeMode,
  setActiveMode,
  filterMode = null
}: TutorialTourProps) {
  const filteredSteps = filterMode
    ? SYSTEM_TOUR_STEPS.filter((s) => s.mode === filterMode || s.mode === 'GLOBAL')
    : SYSTEM_TOUR_STEPS;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [highlightRect, setHighlightRect] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);

  const currentStep = filteredSteps[currentIndex] || filteredSteps[0];
  const animFrameRef = useRef<number | null>(null);

  // Measure and position spotlight precisely over the DOM element
  const measureTarget = useCallback(() => {
    if (!isOpen || !currentStep) return;
    const el = document.querySelector(currentStep.targetSelector);
    if (el) {
      const rect = el.getBoundingClientRect();
      setHighlightRect({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height
      });
    } else {
      setHighlightRect(null);
    }
  }, [isOpen, currentStep]);

  // Update spotlight, scroll element into view, and switch mode if needed
  const updateSpotlight = useCallback(() => {
    if (!isOpen || !currentStep) return;

    if (currentStep.mode !== 'GLOBAL' && currentStep.mode !== activeMode) {
      setActiveMode(currentStep.mode as Mode);
    }

    const checkElement = (attemptsLeft: number) => {
      const el = document.querySelector(currentStep.targetSelector);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
        measureTarget();
      } else if (attemptsLeft > 0) {
        setTimeout(() => checkElement(attemptsLeft - 1), 60);
      } else {
        setHighlightRect(null);
      }
    };

    setTimeout(() => checkElement(5), 100);
  }, [isOpen, currentStep, activeMode, setActiveMode, measureTarget]);

  useEffect(() => {
    updateSpotlight();
  }, [updateSpotlight, currentIndex]);

  // Handle resize and scroll
  useEffect(() => {
    if (!isOpen) return;

    const handleScrollOrResize = () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = requestAnimationFrame(measureTarget);
    };

    window.addEventListener('resize', handleScrollOrResize);
    window.addEventListener('scroll', handleScrollOrResize, true);

    return () => {
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isOpen, measureTarget]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Enter') {
        if (currentIndex < filteredSteps.length - 1) {
          setCurrentIndex((i) => i + 1);
        } else {
          localStorage.setItem('system_tutorial_completed', 'true');
          onClose();
        }
      } else if (e.key === 'ArrowLeft') {
        if (currentIndex > 0) {
          setCurrentIndex((i) => i - 1);
        }
      } else if (e.key === 'Escape') {
        localStorage.setItem('system_tutorial_completed', 'true');
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, filteredSteps.length, onClose]);

  if (!isOpen || !currentStep) return null;

  const isFirstStep = currentIndex === 0;
  const isLastStep = currentIndex === filteredSteps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      localStorage.setItem('system_tutorial_completed', 'true');
      onClose();
    } else {
      setCurrentIndex((i) => i + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirstStep) {
      setCurrentIndex((i) => i - 1);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('system_tutorial_completed', 'true');
    onClose();
  };

  // Dimensions for crystal-clear SVG mask cutout
  const pad = 6;
  const targetX = highlightRect ? Math.max(0, highlightRect.left - pad) : 0;
  const targetY = highlightRect ? Math.max(0, highlightRect.top - pad) : 0;
  const targetW = highlightRect ? highlightRect.width + pad * 2 : 0;
  const targetH = highlightRect ? highlightRect.height + pad * 2 : 0;

  // Smart positioning: card flips to top if target element is in the bottom half of the screen
  const isTargetInBottomHalf = highlightRect ? highlightRect.top > window.innerHeight / 2 : false;

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden pointer-events-auto">
      {/* 
        TRUE SVG CUTOUT MASK:
        Luminance 1 (white) = overlay is drawn (dimmed).
        Luminance 0 (black at target) = overlay is completely omitted (100% transparent cutout!).
        The highlighted element receives ZERO darkening and ZERO blur!
      */}
      <svg
        className="fixed inset-0 w-full h-full pointer-events-none z-40"
        style={{ width: '100vw', height: '100vh' }}
      >
        <defs>
          <mask id="tutorial-spotlight-mask" x="0" y="0" width="100%" height="100%">
            {/* White canvas = dim everything */}
            <rect x="0" y="0" width="100%" height="100%" fill="#ffffff" />
            {/* Black rectangle at target = 100% crystal-clear transparent hole */}
            {highlightRect && (
              <rect
                x={targetX}
                y={targetY}
                width={targetW}
                height={targetH}
                fill="#000000"
              />
            )}
          </mask>
        </defs>

        {/* Backdrop overlay masked by the cutout */}
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(0, 0, 0, 0.72)"
          mask="url(#tutorial-spotlight-mask)"
        />
      </svg>

      {/* Invisible backdrop click-catcher to dismiss or advance */}
      <div
        className="fixed inset-0 z-40 pointer-events-auto"
        onClick={handleDismiss}
        title="Click to dismiss tour"
      />

      {/* High-Contrast Brutalist Spotlight Frame around the transparent cutout */}
      {highlightRect && (
        <div
          className="fixed pointer-events-none z-50 border-[4px] border-[#FFE600] transition-all duration-150"
          style={{
            top: `${targetY}px`,
            left: `${targetX}px`,
            width: `${targetW}px`,
            height: `${targetH}px`,
            boxShadow: '0 0 0 2px #000, 0 0 25px rgba(255, 230, 0, 0.95)'
          }}
        >
          <span className="absolute -top-7 left-0 bg-[#FFE600] text-black font-black text-[0.65rem] px-2 py-0.5 uppercase border-2 border-black shadow-[2px_2px_0_#000]">
            ⚡ ACTIVE_FOCUS
          </span>
        </div>
      )}

      {/* Floating Brutalist Walkthrough Dialog Card with Smart Placement */}
      <div
        className={`fixed z-50 max-w-lg w-full flex flex-col pointer-events-auto transition-all duration-200
          ${
            isTargetInBottomHalf
              ? 'top-20 right-4 md:right-8'
              : 'bottom-6 right-4 md:bottom-8 md:right-8'
          }
          max-md:bottom-4 max-md:inset-x-4 max-md:top-auto max-md:right-auto
        `}
      >
        <div className="bg-white border-[4px] border-black p-5 artistic-shadow flex flex-col gap-3">
          {/* Header Bar */}
          <div className="flex items-center justify-between border-b-[2px] border-black pb-2">
            <span className="bg-black text-[#FFE600] font-black text-xs px-2.5 py-1 uppercase tracking-wider">
              {currentStep.badge}
            </span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-black">
                STEP {currentIndex + 1}/{filteredSteps.length}
              </span>
              <button
                onClick={handleDismiss}
                className="text-gray-500 hover:text-black font-black text-base px-1 cursor-pointer leading-none"
                title="Exit Tour (Esc)"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Title & Description */}
          <div className="flex flex-col gap-1.5">
            <h3 className="font-black text-base uppercase tracking-tight text-black m-0">
              {currentStep.title}
            </h3>
            <p className="font-mono text-xs text-gray-800 leading-relaxed m-0">
              {currentStep.description}
            </p>
          </div>

          {/* Pro Tip Box */}
          {currentStep.proTip && (
            <div className="bg-[#FFE600]/30 border-[2px] border-black p-2 flex items-start gap-2 text-[0.7rem] font-mono">
              <span className="text-base leading-none">💡</span>
              <div className="flex-1">
                <span className="font-black uppercase text-black">PRO_TIP: </span>
                <span className="text-gray-800">{currentStep.proTip}</span>
              </div>
            </div>
          )}

          {/* Progress Indicator Dots */}
          <div className="flex gap-1 items-center justify-center py-1">
            {filteredSteps.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`h-2 border border-black transition-all cursor-pointer ${
                  idx === currentIndex ? 'w-6 bg-[#0047FF]' : 'w-2 bg-gray-300 hover:bg-gray-400'
                }`}
                title={`Go to step ${idx + 1}`}
              />
            ))}
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between border-t-[2px] border-black pt-3 gap-2">
            <button
              onClick={handleDismiss}
              className="text-[0.65rem] font-black uppercase text-gray-500 hover:text-black underline cursor-pointer"
            >
              SKIP_TOUR (ESC)
            </button>

            <div className="flex gap-2">
              <button
                onClick={handlePrev}
                disabled={isFirstStep}
                className="border-[2px] border-black px-3 py-1.5 text-xs font-black uppercase bg-white hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer active:translate-y-0.5"
              >
                ← PREV
              </button>
              <button
                onClick={handleNext}
                className="border-[2px] border-black px-4 py-1.5 text-xs font-black uppercase bg-black text-[#FFE600] hover:bg-[#0047FF] hover:text-white cursor-pointer active:translate-y-0.5 transition-colors shadow-[2px_2px_0_#000]"
              >
                {isLastStep ? 'FINISH_TOUR ✓' : 'NEXT_STEP →'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

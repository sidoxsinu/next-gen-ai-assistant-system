# NEXT-GEN AI ASSISTANT SYSTEM
### Multi-Provider Neo-Brutalist AI Intelligence Hub & Workflow Orchestrator

A high-performance, multi-provider AI assistant command center built with **React 19**, **Vite**, and **Tailwind CSS v4** featuring a distinctive **Neo-Brutalist** aesthetic. Combines Google Gemini, Groq Cloud, and Local Ollama into a unified interface with five purpose-built assistant modes, interactive spotlight onboarding, fact-checking, multimodal speech synthesis, and direct Gmail SMTP session export.

---

## ⚡ Core Highlights

- **Multi-Provider AI Architecture**: Seamlessly switch between **Google Gemini** (`gemini-flash-lite-latest`), **Groq Cloud** (`llama-3.3-70b-versatile`), and **Local Ollama** (`llama3.2` via proxy).
- **Auto-Migrating Model Fallback**: Automatic client-side detection and recovery from deprecated models with persistent localStorage migration.
- **Five Specialized Thematic Workspaces**:
  1. 🔬 **Research Assistant** (`#0047FF` Academic Blue): Citation selector (`APA-7`, `IEEE`, `MLA-9`, `Chicago`, `Nature`), research depth toggles, inquiry macros, and live Evidence & Hypotheses Board.
  2. 🎧 **Support Bot** (`#00CC44` Operations Green): Live incident ticket telemetry (`#INC-84920 [SEV-1]`), real-time ticking SLA countdown clock, customer sentiment tracking, and rapid resolution macros.
  3. ⚡ **Workflow Automator** (`#FFE600` Hazard Yellow): Industrial 3-stage Kanban board (`STAGED`, `IN_PROGRESS`, `DONE`), segmented progress bar, inline `[AI_RUN]` step execution, and JSON pipeline exporter.
  4. 🧠 **Knowledge Companion** (`#8B00FF` Cyber Violet): Interactive concept neural pill matrix, cross-domain concept bridge synthesis, cognitive learner profile, and interactive flip/reveal study flashcards.
  5. ⚔️ **Debate Mode** (`#FF2D00` vs `#0047FF`): Dialectical boxing arena with Affirmative (Pro) vs Negative (Rebuttal) agents scored by an independent AI Arbitration Judge.
- **Interactive Spotlight Tutorial**: First-time user onboarding with bounding-rect spotlight highlighting, tab auto-switching, pro-tips, and a permanent `[? SYSTEM_TOUR]` refresher.
- **Rigorous Fact-Checking Engine**: Claim-by-claim veracity auditor categorizing statements as `VERIFIED`, `UNCERTAIN`, or `DISPUTED` with calculated reliability scores.
- **Multimodal Audio**: Web Speech API text-to-speech (TTS) with pitch/rate tuning, browser native speech-to-text (STT), and Groq Whisper Large V3 fallback.
- **Secure Gmail SMTP Session Relay**: Built-in Express middleware to dispatch formatted HTML session transcripts via Gmail SMTP without exposing app passwords on the frontend.

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend Framework** | React 19, TypeScript 5.8, Vite 6 |
| **Styling & Theme** | Tailwind CSS v4, Custom Neo-Brutalist CSS tokens (`index.css`), Courier Prime monospace |
| **Icons & Motion** | `lucide-react`, `motion/react` |
| **AI Providers** | Google Gemini (`@google/genai` compatible REST), Groq Cloud API, Local Ollama (`/ollama-proxy`) |
| **Speech & Audio** | Web Speech API (TTS/STT) & Groq Whisper Large V3 |
| **Backend Middleware** | Express.js, Nodemailer (Gmail SMTP Relay), Dotenv |

---

## 🚀 Quick Start

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/sidoxsinu/next-gen-ai-assistant-system.git
cd next-gen-ai-assistant-system
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and add your API keys:

```bash
cp .env.example .env
```

| Environment Variable | Description | Default / Example |
|---|---|---|
| `DEFAULT_AI_PROVIDER` | Initial AI provider (`gemini`, `groq`, or `ollama`) | `gemini` |
| `GEMINI_API_KEY` | Free API key from [Google AI Studio](https://aistudio.google.com/apikey) | `AIzaSy...` |
| `GEMINI_MODEL` | Gemini production model | `gemini-flash-lite-latest` |
| `GROQ_API_KEY` | Groq Cloud API key from [Groq Console](https://console.groq.com/keys) | `gsk_...` |
| `GROQ_MODEL` | Groq Llama model | `llama-3.3-70b-versatile` |
| `OLLAMA_BASE_URL` | Local Ollama instance URL | `http://localhost:11434` |
| `OLLAMA_MODEL` | Local Ollama model name | `llama3.2` |
| `GMAIL_USER` | Gmail address for session transmission | `user@gmail.com` |
| `GMAIL_APP_PASSWORD` | 16-character Google App Password from [Google Account](https://myaccount.google.com/apppasswords) | `xxxx xxxx xxxx xxxx` |

### 3. Run Verification Test Suite

```bash
npm test
```

Runs the automated multi-provider verification script testing live connectivity to Gemini, Groq, local Ollama daemon, SMTP configuration, and regex metadata parsers.

### 4. Start Development Server

```bash
npm run dev
```

Open `http://localhost:3000` in your browser.

---

## 📜 Available NPM Scripts

| Command | Action |
|---|---|
| `npm run dev` | Starts Vite dev server with backend API middleware on `http://localhost:3000` |
| `npm run build` | Compiles TypeScript and bundles production assets via Vite |
| `npm run preview` | Previews the production build locally |
| `npm run lint` | Runs TypeScript type-checking (`tsc --noEmit`) with strict checks |
| `npm test` | Runs the automated system & provider verification test suite |
| `npm run clean` | Removes `dist/` build directory |

---

## 📁 Project Architecture

```
next-gen-ai-assistant-system/
├── scripts/
│   └── verify-providers.js      # Automated AI provider & system verification test suite
├── src/
│   ├── components/
│   │   ├── views/               # Mode-specific dedicated UI workspaces
│   │   │   ├── ResearchView.tsx # Academic dossier & evidence board
│   │   │   ├── SupportView.tsx  # Incident desk, SLA countdown & CRM macros
│   │   │   ├── WorkflowView.tsx # Industrial Kanban board & pipeline runner
│   │   │   ├── KnowledgeView.tsx# Neural concept matrix & flip flashcards
│   │   │   └── DebateView.tsx   # Adversarial duel arena & judge arbitration
│   │   ├── AuthModal.tsx        # Multi-provider credentials & model selector
│   │   ├── FactCheckReport.tsx  # Claim-by-claim veracity analysis dialog
│   │   ├── Header.tsx           # Global telemetry, mode toggles, and tour trigger
│   │   ├── NavTab.tsx           # Mode-specific branded navigation tabs
│   │   ├── SmtpDrawer.tsx       # Gmail SMTP credential management & transmission
│   │   ├── TerminalOutput.tsx   # Streaming markdown console with TTS & follow-ups
│   │   └── TutorialTour.tsx     # First-time user spotlight onboarding engine
│   ├── services/
│   │   ├── ai.ts                # Unified AI provider client (Gemini, Groq, Ollama)
│   │   └── audio.ts             # Web Speech TTS/STT and Whisper audio integration
│   ├── types/
│   │   └── index.ts             # Strict TypeScript domain interfaces
│   ├── App.tsx                  # Root state orchestration & router
│   ├── index.css                # Neo-brutalist Tailwind v4 styling & animations
│   └── main.tsx                 # Application entry point
├── .env.example                 # Environment template with instructions
├── metadata.json                # Project capabilities metadata
├── package.json                 # Dependencies and npm script definitions
├── tsconfig.json                # TypeScript strict compilation configuration
├── vite.config.ts               # Vite server, Ollama proxy, and Express SMTP middleware
└── README.md                    # Project documentation
```

---

## 🔒 Security Best Practices

- **Zero Hardcoded Secrets**: All sensitive keys and passwords reside in `.env` (ignored by git).
- **Client-Scoped Storage**: API keys configured via the UI popup are stored exclusively in the user's browser `localStorage` and never transmitted to third parties.
- **Secure Backend Relay**: Email transmissions are routed through local Vite Express middleware to prevent exposing SMTP credentials.

---

## 📄 License

Apache-2.0

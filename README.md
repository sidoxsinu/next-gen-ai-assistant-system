# NEXT-GEN AI ASSISTANT SYSTEM
*Brutalist React AI Companion powered by Groq & LLaMA-3.3-70B*

This project is a high-performance, strictly designed Brutalist AI Assistant. It connects directly to the Groq kernel to process inferences via the Llama-3 model at maximum speed. It features completely abstracted local storage parsing, stream buffering logic, a workflow organizer, and aggressive frontend stylings. 

---

## 🚀 How To Run From Scratch

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed on your machine.

### 1. Install Dependencies
Clone this repository and run standard npm installation:
```bash
npm install
```

### 2. Configure Environment (Optional)
The system requires a **Groq API Key** to function. You can inject this directly in the application's header UI upon load.

Alternatively, to auto-inject your key, create a `.env` file in the root of the project:
```env
GROQ_API_KEY=your_api_key_here
```
*(Note: Because this is a Vite-based app, the frontend input field will still take priority if edited).*

### 3. Start the Development Server
Run the localized Vite server:
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 4. Build for Production
To bundle the brutalist application for deployment:
```bash
npm run build
```
You can preview the bundle using:
```bash
npm run preview
```

---

## 🛠 Features Included

- **Brutalist Aesthetic:** Fully styled with sharp borders, dense shadows, and a courier monosapced font interface designed aggressively. Contains CSS `Scanlines` toggle and a `Dark Mode` inversion toggle.
- **Artificial Typewriter Buffer:** Includes a Stream-Speed tracker capable of slowing down Groq's high-speed inference streams for a retro line-by-line reading experience.
- **Smart AI Enhancements:** Live parsing of Mood/Tone blocks, Hashtags, and interactive Prompt Suggestions intercepted from the AI output strictly using LLM instruction formats.
- **Productivity Tracking:** Local chat arrays are cached via `localStorage`, and manual actions include `[ PIN_NODE ]`, Text-To-Speech audio dictation triggers, and Global `[ EXPORT_SESSION ]` capability. 
- **Voice Interactivity:** Groq's `whisper-large-v3` handles local vocal processing streams.

---

## 🧹 Codebase Cleanup
**Note:** Extraneous dependencies like GoogleGenAI and unused heavy UI imports (e.g., leftover `framer-motion` hooks) have been stripped aggressively to align with optimal performance markers.

> *"Perfection is achieved, not when there is nothing more to add, but when there is nothing left to take away."*

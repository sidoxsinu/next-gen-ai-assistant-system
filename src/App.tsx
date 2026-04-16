/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
// Removed GoogleGenAI dependency
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  Search, 
  MapPin, 
  MessageSquare, 
  Zap, 
  Image as ImageIcon, 
  Volume2, 
  Mic, 
  Terminal, 
  Layers, 
  History, 
  Play, 
  Square,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';



type Mode = 'RESEARCH' | 'SUPPORT' | 'WORKFLOW' | 'KNOWLEDGE';

interface Message {
  role: 'user' | 'model';
  text: string;
  type?: 'text' | 'image' | 'audio' | 'thinking' | 'workflow';
  data?: any;
}

interface WorkflowTask {
  id: string;
  label: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  completed: boolean;
}

interface KnowledgeTrailItem {
  id: string;
  subject: string;
  timestamp: string;
}

export default function App() {
  const [apiKey, setApiKey] = useState(process.env.GROQ_API_KEY || '');
  const [activeMode, setActiveMode] = useState<Mode>('RESEARCH');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [thinkingProcess, setThinkingProcess] = useState<string>('');
  const [liveSessionActive, setLiveSessionActive] = useState(false);
  const [imageSize, setImageSize] = useState<'1K' | '2K' | '4K'>('1K');
  const [isRecording, setIsRecording] = useState(false);
  
  // Feature states
  const [knowledgeTrail, setKnowledgeTrail] = useState<KnowledgeTrailItem[]>([]);
  const [userPreferences, setUserPreferences] = useState<string[]>([]);
  const [activeWorkflow, setActiveWorkflow] = useState<WorkflowTask[]>([]);
  const [emailTarget, setEmailTarget] = useState('');
  const [isEmailing, setIsEmailing] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const audioContext = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, thinkingProcess, isTyping]);

  const handleSend = async () => {
    if (!input.trim()) return;
    if (!apiKey) {
      setMessages(prev => [{ role: 'model', text: ">> FATAL ERROR: GROQ API_KEY REQUIRED. INPUT IN HEADER." }, ...prev]);
      return;
    }

    const userMsg: Message = { role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    const currentInput = input;
    setInput('');
    setIsTyping(true);
    setThinkingProcess('');

    // Pre-create the model message for streaming
    const modelMsgIndex = messages.length + 1;
    setMessages(prev => [...prev, { role: 'model', text: '' }]);

    try {
      let fullText = '';
      
      let systemPrompt = "You are a helpful AI assistant.";
      if (activeMode === 'RESEARCH') systemPrompt = "Act as a Research Assistant. Provide a structured summary with key points and source suggestions.";
      if (activeMode === 'SUPPORT') systemPrompt = "You are an Intelligent Customer Support Chatbot. Handle queries professionally, escalate when needed, and maintain context.";
      if (activeMode === 'WORKFLOW') systemPrompt = "Break this task/workflow into actionable steps. FORMAT YOUR RESPONSE AS A JSON ARRAY OF OBJECTS with fields: id, label, priority (HIGH/MEDIUM/LOW). Also include a clear text explanation before the JSON.";
      if (activeMode === 'KNOWLEDGE') {
        const context = `User Preferences: ${userPreferences.join(', ')}. Knowledge Trail: ${knowledgeTrail.map(k => k.subject).join(' -> ')}.`;
        systemPrompt = `${context}\n\nAct as a Personal Knowledge Companion. Explore topics, suggest related areas, and detect any new user preferences or core subjects explicitly.`;
      }

      // Convert messages to Groq format
      const apiMessages = [
        { role: 'system', content: systemPrompt },
        ...messages.map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text })),
        { role: 'user', content: currentInput }
      ];

      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: apiMessages,
          stream: true
        })
      });

      if (!res.ok) {
         const errBody = await res.json().catch(()=>({}));
         throw new Error(errBody.error?.message || `HTTP ${res.status}`);
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunkStr = decoder.decode(value, { stream: true });
          const lines = chunkStr.split('\\n').filter(line => line.trim() !== '');
          for (const line of lines) {
            if (line === 'data: [DONE]') break;
            if (line.startsWith('data: ')) {
               try {
                 const data = JSON.parse(line.slice(6));
                 if (data.choices && data.choices[0].delta && data.choices[0].delta.content) {
                    fullText += data.choices[0].delta.content;
                    setMessages(prev => {
                      const newMsgs = [...prev];
                      newMsgs[modelMsgIndex] = { ...newMsgs[modelMsgIndex], text: fullText };
                      return newMsgs;
                    });
                 }
               } catch(e) {}
            }
          }
        }
      }

      // Feature specific post-processing
      if (activeMode === 'KNOWLEDGE') {
        // Add to knowledge trail
        const newSubject = currentInput.split(' ').slice(0, 3).join(' ');
        setKnowledgeTrail(prev => [{
          id: Date.now().toString(),
          subject: newSubject,
          timestamp: new Date().toLocaleTimeString()
        }, ...prev].slice(0, 10)); // Keep last 10
      }

      if (activeMode === 'WORKFLOW') {
        // Attempt to parse JSON tasks from the text
        const jsonMatch = fullText.match(/\[\s*\{.*\}\s*\]/s);
        if (jsonMatch) {
          try {
            const tasks = JSON.parse(jsonMatch[0]);
            setActiveWorkflow(tasks.map((t: any) => ({ ...t, completed: false })));
          } catch (e) {
            console.error("Failed to parse tasks", e);
          }
        }
      }

    } catch (err: any) {
      console.error(err);
      setMessages(prev => {
        const newMsgs = [...prev];
        newMsgs[modelMsgIndex] = { role: 'model', text: `>> FATAL EXCEPTION: ${err.message || 'SYSTEM FAILURE // PACKET LOSS DETECTED'}` };
        return newMsgs;
      });
    } finally {
      setIsTyping(false);
    }
  };

  const toggleTask = (id: string) => {
    setActiveWorkflow(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const generateImage = async (prompt: string) => {
    setIsTyping(true);
    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'model', text: `>> FATAL EXCEPTION: [VISUAL_GEN_UNAVAILABLE_ON_GROQ_KERNEL]` }]);
      setIsTyping(false);
    }, 500);
  };

  const playTTS = async (text: string) => {
    const synth = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.volume = 1;
    utterance.rate = 1.1; 
    utterance.pitch = 0.8;
    
    let voices = synth.getVoices();
    if (voices.length === 0) {
      window.speechSynthesis.onvoiceschanged = () => {
         voices = synth.getVoices();
         const brutalVoice = voices.find(v => v.name.includes("Google") || v.name.includes("Samantha") || v.name.includes("Karen") || v.name.includes("Daniel")) || voices[0];
         if (brutalVoice) utterance.voice = brutalVoice;
         synth.speak(utterance);
      };
    } else {
      const brutalVoice = voices.find(v => v.name.includes("Google") || v.name.includes("Samantha") || v.name.includes("Karen") || v.name.includes("Daniel")) || voices[0];
      if (brutalVoice) utterance.voice = brutalVoice;
      synth.speak(utterance);
    }
  };

  const startSTT = async () => {
    setIsRecording(true);
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const audioChunks: Blob[] = [];

      mediaRecorder.addEventListener("dataavailable", event => {
        audioChunks.push(event.data);
      });

      mediaRecorder.addEventListener("stop", async () => {
        setIsRecording(false);
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());

        const formData = new FormData();
        formData.append("file", audioBlob, "audio.webm");
        formData.append("model", "whisper-large-v3");

        setMessages(prev => [...prev, { role: 'model', text: "[PROCESSING AUDIO DATA VIA GROQ KERNEL...]" }]);
        
        try {
          const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
            },
            body: formData
          });
          const data = await res.json();
          if (data.text) {
             setMessages(prev => [...prev.slice(0, -1), { role: 'model', text: `>> VOCAL_INPUT_DECODED: "${data.text}"` }]);
             setInput(data.text);
          } else {
             throw new Error(data.error?.message || "STT Failed");
          }
        } catch(e) {
          console.error("Groq STT Error:", e);
          setMessages(prev => [...prev.slice(0, -1), { role: 'model', text: ">> FATAL: VOCAL_INPUT_REJECTED // PACKET_LOSS" }]);
        }
      });

      mediaRecorder.start();
      setMessages(prev => [...prev, { role: 'model', text: "[AUDIO TRANSCRIPTION TRIGGERED - LISTENING FOR 5 SECONDS...]" }]);
      
      // Auto-stop after 5 seconds
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
        }
      }, 5000);

    } catch (err) {
      console.error(err);
      setIsRecording(false);
      setMessages(prev => [...prev, { role: 'model', text: ">> FATAL: MIC_NOT_FOUND" }]);
    }
  };

  const handleEmailTransmission = async () => {
    if (!emailTarget.trim() || !emailTarget.includes('@')) {
       alert(">> INVALID_TARGET_EMAIL");
       return;
    }
    if (messages.length === 0) {
       alert(">> NO_DATA_TO_TRANSMIT");
       return;
    }

    setIsEmailing(true);
    setMessages(prev => [...prev, { role: 'model', text: ">> GENERATING EMAIL PAYLOAD WITH GROQ KERNEL..." }]);
    
    if (!apiKey) {
      alert(">> GROQ API KEY REQUIRED");
      setIsEmailing(false);
      return;
    }

    try {
      const chatHistoryText = messages.map(m => `${m.role.toUpperCase()}: ${m.text}`).join('\n');
      
      const apiMessages = [
        { role: 'system', content: `You are the NEXT-GEN AI SYSTEM compiling a session export email.
Write a structured HTML email summarizing this session. 
Use brutalist inline CSS styling for the HTML (black borders, white/yellow/blue backgrounds, uppercase headers, Courier/monospace font, sharp shadows 4px 4px 0px #000). 
Include a proper subject line, greeting, structured body summarizing the session, and a closing signature.

Format your response strictly as a JSON object:
{
  "subject": "Email Subject",
  "html": "<html>...</html>"
}` },
        { role: 'user', content: `Session Data:\n${chatHistoryText}` }
      ];

      const inferenceRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: apiMessages,
          response_format: { type: "json_object" }
        })
      });

      if (!inferenceRes.ok) {
         const errBody = await inferenceRes.json().catch(()=>({}));
         throw new Error(errBody.error?.message || `HTTP ${inferenceRes.status}`);
      }

      const inferenceData = await inferenceRes.json();
      const emailDataStr = inferenceData.choices[0].message.content;

      const jsonMatch = emailDataStr.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("Format error from AI synthesis.");
      const emailJson = JSON.parse(jsonMatch[0]);

      setMessages(prev => [...prev.slice(0, -1), { role: 'model', text: ">> INITIATING_GMAIL_UPLINK..." }]);

      const res = await fetch('/api/export-email', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
            to: emailTarget,
            subject: emailJson.subject || "SYS_OUT // NEXT-GEN AI SESSION",
            html: emailJson.html || "<h1>SYSTEM ERROR.</h1>"
         })
      });
      
      const result = await res.json();
      if (result.success) {
         setMessages(prev => [...prev.slice(0, -1), { role: 'model', text: `>> GMAIL_TRANSMISSION_SUCCESS! TARGET: [${emailTarget}]` }]);
      } else {
         throw new Error(result.error);
      }
    } catch(err: any) {
      console.error(err);
      setMessages(prev => [...prev.slice(0, -1), { role: 'model', text: `>> GMAIL_TRANSMISSION_FAILED // ${err.message || String(err)}` }]);
    } finally {
      setIsEmailing(false);
    }
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-12px)]">
      {/* Header Section */}
      <header className="bg-[#FFE600] border-black border-b-[3px] p-4 flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tighter uppercase m-0 leading-tight">
            NEXT-GEN AI ASSISTANT SYSTEM
          </h1>
          <span className="inline-block bg-white border-[3px] border-black px-3 py-1 text-xs font-bold uppercase mt-1">
            KERNEL: GROQ / LLAMA-3.3-70B
          </span>
        </div>
        <div className="flex items-center gap-2">
          <input 
            type="password" 
            placeholder="GROQ_API_KEY..." 
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="border-[3px] border-black p-2 font-mono text-xs w-48 shadow-none focus:outline-none focus:bg-white"
          />
          <div className="hidden xl:block bg-[#FF2D00] text-white border-[3px] border-black px-3 py-2 text-xs font-bold uppercase">
            ENCRYPTED CONNECTION
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="grid grid-cols-2 md:grid-cols-4 bg-black gap-[3px] border-black border-b-[3px]">
        <NavTab 
          active={activeMode === 'RESEARCH'} 
          onClick={() => setActiveMode('RESEARCH')}
          label="RESEARCH_ASSISTANT"
        />
        <NavTab 
          active={activeMode === 'SUPPORT'} 
          onClick={() => setActiveMode('SUPPORT')}
          label="SUPPORT_BOT"
        />
        <NavTab 
          active={activeMode === 'WORKFLOW'} 
          onClick={() => setActiveMode('WORKFLOW')}
          label="WORKFLOW_AUTO"
        />
        <NavTab 
          active={activeMode === 'KNOWLEDGE'} 
          onClick={() => setActiveMode('KNOWLEDGE')}
          label="KNOWLEDGE_COMPANION"
        />
      </nav>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[350px_1fr]">
        {/* Sidebar / Controls */}
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

          {activeMode === 'KNOWLEDGE' && knowledgeTrail.length > 0 && (
            <div className="flex flex-col gap-2">
               <label className="font-black uppercase text-[0.8rem]">KNOWLEDGE_TRAIL:</label>
               <div className="flex flex-col gap-1">
                  {knowledgeTrail.map(k => (
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
                  {activeWorkflow.map(t => (
                    <div 
                      key={t.id} 
                      onClick={() => toggleTask(t.id)}
                      className={`border-[3px] border-black p-2 flex items-center gap-2 cursor-pointer transition-all ${t.completed ? 'bg-green-100 opacity-60' : 'bg-white'}`}
                    >
                       <div className={`w-4 h-4 border-2 border-black flex-shrink-0 ${t.completed ? 'bg-black' : ''}`}></div>
                       <div className="flex-1 flex flex-col">
                          <span className={`text-[0.7rem] font-bold ${t.completed ? 'line-through' : ''}`}>{t.label}</span>
                          <span className={`text-[0.6rem] font-black ${t.priority === 'HIGH' ? 'text-red-500' : 'text-blue-500'}`}>{t.priority}</span>
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
                className={`border-[3px] border-black p-2 font-bold text-[0.7rem] uppercase ${liveSessionActive ? 'bg-red-500 text-white' : 'bg-[#FFE600] active:translate-y-1'}`}
              >
                {liveSessionActive ? 'DISCONNECT' : 'LIVE API'}
              </button>
              <button 
                 onClick={startSTT}
                 className={`border-[3px] border-black p-2 font-bold text-[0.7rem] uppercase ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-white active:translate-y-1'}`}
              >
                 {isRecording ? 'LISTENING...' : 'VOICE_STT'}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
             <label className="font-black uppercase text-[0.8rem]">IMAGE_GENERATION:</label>
             <div className="flex gap-1 mb-2">
                {(['1K', '2K', '4K'] as const).map(s => (
                  <button 
                    key={s} 
                    onClick={() => setImageSize(s)}
                    className={`flex-1 border-[3px] border-black p-1 text-[0.6rem] font-bold ${imageSize === s ? 'bg-[#FFE600]' : 'bg-white'}`}
                  >
                    {s}
                  </button>
                ))}
             </div>
             <button 
                onClick={() => {
                  const p = prompt("ENTER IMAGE PROMPT:");
                  if (p) generateImage(p);
                }}
                className="bg-white border-[3px] border-black p-3 text-sm font-bold uppercase active:translate-y-1"
             >
                INITIALIZE_VISUAL_GEN
             </button>
          </div>

          <button 
            onClick={handleSend}
            disabled={isTyping || !input.trim()}
            className="bg-[#FF2D00] text-white border-[3px] border-black p-4 font-bold text-center uppercase artistic-shadow artistic-shadow-active disabled:opacity-50 disabled:cursor-not-allowed"
          >
            INITIALIZE_AI_SYNTHESIS
          </button>

          <div className="mt-auto border-[3px] border-dashed border-black p-3 text-[0.7rem] bg-gray-50">
            <strong>SESSION_LOG:</strong><br />
            [10:45:01] System boot successful.<br />
            [10:45:10] API handshake complete.<br />
            {isTyping && <span className="text-[#FF2D00]">[SYSTEM] Processing packet...</span>}
            {thinkingProcess && <div className="mt-2 text-[0.65rem] italic opacity-60">REASONING: {thinkingProcess.substring(0, 50)}...</div>}
          </div>
        </section>

        {/* Terminal Output */}
        <section className="bg-[#E5E5E5] p-5 flex flex-col gap-3 overflow-hidden">
          <div className="bg-white border-[3px] border-black flex-1 flex flex-col relative overflow-hidden">
            <div className="bg-black text-white px-3 py-1 text-[0.7rem] font-bold uppercase flex justify-between">
              <span>GEMINI_OUTPUT_STREAM</span>
              <span>BUFFER: {messages.length}/256</span>
            </div>
            <div className="flex-1 overflow-y-auto p-5 flex flex-col-reverse gap-8" ref={scrollRef}>
              {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-4 opacity-30 italic">
                  <span>_READY_FOR_SYNTHESIS_STREAM_</span>
                  <div className="w-8 h-1 bg-black animate-ping"></div>
                </div>
              )}

              {isTyping && (
                <div className="flex gap-2 items-center font-black animate-pulse">
                   <span className="w-2 h-4 bg-black"></span>
                   <span className="text-xs uppercase">_ANALYSIS_IN_PROGRESS</span>
                </div>
              )}

              {[...messages].reverse().map((m, reverseIdx) => {
                const i = messages.length - 1 - reverseIdx;
                return (
                <div key={i} className="flex flex-col gap-2">
                   <div className="flex items-center gap-2">
                      <span className="font-black text-xs uppercase">{m.role === 'user' ? '>_USER' : '>_AI_SYSTEM'}</span>
                      <div className="h-[1px] flex-1 bg-black opacity-10"></div>
                   </div>
                   <div className={`p-4 border-l-[6px] relative ${m.role === 'user' ? 'border-[#FFE600] bg-gray-50' : 'border-[#0047FF] bg-white'}`}>
                      {m.role === 'model' && i === messages.length - 1 && isTyping && (
                        <span className="absolute right-2 top-2 w-2 h-4 bg-black animate-pulse"></span>
                      )}
                      {m.type === 'image' ? (
                        <div className="space-y-3">
                           <p className="font-bold underline mb-2 tracking-widest uppercase">{m.text}</p>
                           <img src={m.data} alt="Generated" className="border-[3px] border-black w-full h-auto" referrerPolicy="no-referrer" />
                        </div>
                      ) : (
                        <div className="markdown-body text-[0.85rem] leading-[1.4] whitespace-pre-wrap font-mono">
                           <ReactMarkdown remarkPlugins={[remarkGfm]}>
                             {m.text || (i === messages.length - 1 && m.role === 'model' ? '...' : '')}
                           </ReactMarkdown>
                           {i === messages.length - 1 && m.role === 'model' && isTyping && (
                             <span className="inline-block w-2 h-4 bg-black ml-1 align-middle animate-pulse"></span>
                           )}
                        </div>
                      )}
                      
                      {m.role === 'model' && m.text && (
                        <div className="mt-4 pt-3 border-t border-black/10 flex gap-4">
                           <button 
                            onClick={() => playTTS(m.text)}
                            className="bg-black text-white text-[0.6rem] px-2 py-1 font-bold hover:bg-[#0047FF]"
                           >
                             [ PLAY_AUDIO_DATA ]
                           </button>
                        </div>
                      )}
                   </div>
                </div>
              )})}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button className="bg-[#0047FF] hover:bg-black text-white p-3 border-[3px] border-black font-bold text-center text-sm cursor-pointer active:translate-y-1">
                [+] SAVE_TO_KNOWLEDGE_TRAIL
              </button>
              <div className="flex bg-white border-[3px] border-black">
                 <input 
                   type="email" 
                   value={emailTarget} 
                   onChange={(e) => setEmailTarget(e.target.value)} 
                   placeholder="TARGET@DOMAIN.COM" 
                   className="flex-1 bg-transparent p-2 font-mono text-xs uppercase font-bold focus:outline-none focus:bg-[#FFE600]"
                 />
                 <button 
                   onClick={handleEmailTransmission}
                   disabled={isEmailing}
                   className="bg-[#FFE600] border-l-[3px] text-black border-black px-3 font-bold text-center text-xs cursor-pointer hover:invert active:translate-y-1 disabled:opacity-50"
                 >
                   {isEmailing ? 'SENDING...' : '[!] TRANSMIT_VIA_GMAIL'}
                 </button>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Info Footer */}
      <footer className="grid grid-cols-1 md:grid-cols-3 border-black border-t-[3px] bg-black gap-[3px]">
        <div className="bg-white p-3 text-[0.75rem] font-bold">
          TOKEN_COUNT: <span className="text-[#0047FF]">2,455</span>
        </div>
        <div className="bg-white p-3 text-[0.75rem] font-bold">
          LATENCY: <span className="text-[#FF2D00]">142ms</span>
        </div>
        <div className="bg-white p-3 text-[0.75rem] font-bold">
          ACTIVE_THREAD: <span className="text-[#0047FF]">SYNTHESIS_09X</span>
        </div>
      </footer>

      {/* Live Session Overlay */}
      <AnimatePresence>
        {liveSessionActive && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-[100] grid place-items-center p-4"
          >
             <div className="bg-white border-[6px] border-black p-10 max-w-md w-full text-center artistic-shadow">
                <AlertCircle size={64} className="mx-auto mb-6 text-[#FF2D00]" />
                <h3 className="text-2xl font-black mb-4 uppercase tracking-tighter">LIVE SESSION INITIALIZED</h3>
                <p className="text-sm mb-8 font-bold uppercase tracking-widest opacity-60">System is capture processing real-time bio-audio packets.</p>
                <button 
                  onClick={() => setLiveSessionActive(false)}
                  className="w-full border-[3px] border-black bg-[#FF2D00] text-white p-4 font-bold uppercase artistic-shadow-active"
                >
                  TERMINATE CONNECTION
                </button>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function NavTab({ active, onClick, label }: { active: boolean, onClick: () => void, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`p-4 text-center font-bold uppercase cursor-pointer border-none text-[0.8rem] transition-all
        ${active ? 'bg-[#0047FF] text-white' : 'bg-white hover:bg-[#FFE600] active:shadow-[inset_4px_4px_0_#000]'}`}
    >
      {label}
    </button>
  );
}

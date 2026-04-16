/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { AlertCircle } from 'lucide-react';


type Mode = 'RESEARCH' | 'SUPPORT' | 'WORKFLOW' | 'KNOWLEDGE';

interface Message {
  id: string;
  role: 'user' | 'model';
  rawText: string;
  text: string;
  type?: 'text' | 'image' | 'audio' | 'thinking' | 'workflow';
  data?: any;
  metadata?: {
    tone?: string;
    tags?: string[];
    suggestions?: string[];
    confidence?: number;
  };
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
  const [apiKey, setApiKey] = useState(localStorage.getItem('GROQ_API_KEY') || '');
  const [showAuthPopup, setShowAuthPopup] = useState(!localStorage.getItem('GROQ_API_KEY'));
  const [authInput, setAuthInput] = useState('');
  const [authError, setAuthError] = useState(false);

  const handleAuthSubmit = () => {
    if (!authInput.trim()) {
      setAuthError(true);
      return;
    }
    localStorage.setItem('GROQ_API_KEY', authInput.trim());
    setApiKey(authInput.trim());
    setShowAuthPopup(false);
    setAuthError(false);
  };

  const handleResetApiKey = () => {
    localStorage.removeItem('GROQ_API_KEY');
    setApiKey('');
    setAuthInput('');
    setShowAuthPopup(true);
  };

  const [activeMode, setActiveMode] = useState<Mode>('RESEARCH');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [thinkingProcess, setThinkingProcess] = useState<string>('');
  const [liveSessionActive, setLiveSessionActive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  
  // Feature states
  const [knowledgeTrail, setKnowledgeTrail] = useState<KnowledgeTrailItem[]>([]);
  const [userPreferences, setUserPreferences] = useState<string[]>([]);
  const [activeWorkflow, setActiveWorkflow] = useState<WorkflowTask[]>([]);
  const [emailTarget, setEmailTarget] = useState('');
  const [isEmailing, setIsEmailing] = useState(false);

  // New Upgrade States
  const [outputLang, setOutputLang] = useState('English');
  const [streamSpeed, setStreamSpeed] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [scanlineEnabled, setScanlineEnabled] = useState(false);
  const [isErrorGlitching, setIsErrorGlitching] = useState(false);
  const [pinnedMessageIds, setPinnedMessageIds] = useState<string[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sessionTime, setSessionTime] = useState(0);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isDarkMode) document.body.classList.add('dark-mode');
    else document.body.classList.remove('dark-mode');
  }, [isDarkMode]);

  useEffect(() => {
    const inv = setInterval(() => setSessionTime(s => s + 1), 1000);
    return () => clearInterval(inv);
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
       localStorage.setItem('chat_history', JSON.stringify(messages));
    }
  }, [messages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [messages, thinkingProcess, isTyping]);

  const parseMetadata = (rawText: string) => {
    const split = rawText.split('--META--');
    const textStr = split[0];
    let metaObj: any = undefined;
    if (split.length > 1) {
       const mStr = split[1];
       metaObj = {};
       const toneMatch = mStr.match(/TONE:\s*([^\n]+)/);
       if (toneMatch) metaObj.tone = toneMatch[1].trim();
       const tagsMatch = mStr.match(/TAGS:\s*([^\n]+)/);
       if (tagsMatch) metaObj.tags = tagsMatch[1].split(' ').filter(t=>t.startsWith('#'));
       const suggMatch = mStr.match(/SUGGESTIONS:\s*([^\n]+)/);
       if (suggMatch) metaObj.suggestions = suggMatch[1].split('|').map(s=>s.trim());
       const confMatch = mStr.match(/CONFIDENCE:\s*(\d+)/);
       if (confMatch) metaObj.confidence = parseInt(confMatch[1]);
    }
    return { pText: textStr, pMeta: metaObj };
  };

  useEffect(() => {
    if (streamSpeed === 0) return;
    const interval = setInterval(() => {
       setMessages(prev => {
          let updated = false;
          const newMsgs = prev.map(msg => {
             if (msg.role === 'model' && msg.rawText && msg.rawText.length > msg.text.length) {
                const { pText, pMeta } = parseMetadata(msg.rawText);
                if (msg.text.length < pText.length) {
                   updated = true;
                   const step = streamSpeed === 20 ? 4 : 1;
                   const updatedText = pText.slice(0, msg.text.length + step);
                   return { ...msg, text: updatedText, metadata: (updatedText.length >= pText.length && pMeta) ? pMeta : msg.metadata };
                } else if (!msg.metadata && pMeta) {
                   updated = true;
                   return { ...msg, metadata: pMeta };
                }
             }
             return msg;
          });
          return updated ? newMsgs : prev;
       });
    }, streamSpeed);
    return () => clearInterval(interval);
  }, [streamSpeed]);

  const loadHistory = () => {
    try {
      const saved = localStorage.getItem('chat_history');
      if (saved) setMessages(JSON.parse(saved));
    } catch(e) {}
  };

  const getTokenCount = () => {
    const textData = messages.map(m => m.rawText || m.text).join(' ');
    return Math.floor(textData.length / 4);
  };
  
  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const triggerError = () => {
    setIsErrorGlitching(true);
    setTimeout(() => setIsErrorGlitching(false), 2000);
  };

  const exportSession = () => {
    const textLog = messages.map(m => `[${m.role.toUpperCase()}]\n${m.rawText || m.text}`).join('\n\n');
    const blob = new Blob([textLog], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SESSION_LOG_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyMessage = (id: string, textStr: string) => {
    navigator.clipboard.writeText(textStr);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const togglePin = (id: string) => {
    setPinnedMessageIds(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  };

  const handleFollowUp = (suggestion: string) => {
     sendCommand(suggestion);
  };

  const handleSend = () => sendCommand(input);

  const sendCommand = async (commandStr: string) => {
    if (!commandStr.trim()) return;
    if (!apiKey) {
      setMessages(prev => [{ id: Date.now().toString(), role: 'model', text: ">> FATAL ERROR: GROQ API_KEY REQUIRED. INPUT IN HEADER.", rawText: ">> FATAL ERROR: GROQ API_KEY REQUIRED. INPUT IN HEADER." }, ...prev]);
      return;
    }

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: commandStr, rawText: commandStr };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);
    setThinkingProcess('');

    const modelMsgIndex = messages.length + 1;
    const modelMsgId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, { id: modelMsgId, role: 'model', text: '', rawText: '' }]);

    try {
      let fullRawText = '';
      
      let systemPrompt = `You are a helpful AI assistant. Respond strictly in ${outputLang}. Respond in clean, complete, well-formed sentences. DO NOT use markdown formatting like **, ##, or bullet points. Output plain text only.\nAT THE VERY END OF YOUR RESPONSE, YOU MUST APPEND EXACTLY THIS METADATA BLOCK:\n--META--\nTONE: [one word describing tone]\nTAGS: #tag1 #tag2 #tag3\nSUGGESTIONS: [Follow up 1] | [Follow up 2] | [Follow up 3]\nCONFIDENCE: [0-100]`;
      
      if (activeMode === 'RESEARCH') systemPrompt = `Act as a Research Assistant. Provide a structured summary with key points and source suggestions. Respond strictly in ${outputLang}. Respond in clean, complete, well-formed sentences. Avoid markdown formatting like ** or ##.\nAT THE VERY END OF YOUR RESPONSE, YOU MUST APPEND EXACTLY THIS METADATA BLOCK:\n--META--\nTONE: [one word]\nTAGS: #tag1 #tag2 #tag3\nSUGGESTIONS: [Follow up 1] | [Follow up 2] | [Follow up 3]\nCONFIDENCE: [0-100]`;
      if (activeMode === 'SUPPORT') systemPrompt = `You are an Intelligent Customer Support Chatbot. Handle queries professionally, escalate when needed, and maintain context. Respond strictly in ${outputLang}. Respond in clean, complete sentences without markdown formatting.\nAT THE VERY END OF YOUR RESPONSE, YOU MUST APPEND EXACTLY THIS METADATA BLOCK:\n--META--\nTONE: [one word]\nTAGS: #tag1 #tag2 #tag3\nSUGGESTIONS: [Follow up 1] | [Follow up 2] | [Follow up 3]\nCONFIDENCE: [0-100]`;
      if (activeMode === 'WORKFLOW') systemPrompt = `Break this task/workflow into actionable steps. FORMAT YOUR RESPONSE AS A JSON ARRAY OF OBJECTS with fields: id, label, priority (HIGH/MEDIUM/LOW). Also include a clear text explanation before the JSON, without markdown formatting. Respond strictly in ${outputLang}.\nAT THE VERY END OF YOUR RESPONSE, YOU MUST APPEND EXACTLY THIS METADATA BLOCK:\n--META--\nTONE: [one word]\nTAGS: #tag1 #tag2 #tag3\nSUGGESTIONS: [Follow up 1] | [Follow up 2] | [Follow up 3]\nCONFIDENCE: [0-100]`;
      if (activeMode === 'KNOWLEDGE') {
        const context = `User Preferences: ${userPreferences.join(', ')}. Knowledge Trail: ${knowledgeTrail.map(k => k.subject).join(' -> ')}.`;
        systemPrompt = `${context}\n\nAct as a Personal Knowledge Companion. Explore topics, suggest related areas, and detect any new user preferences. Respond strictly in ${outputLang}. Respond in clean, complete, well-formed sentences. Avoid markdown formatting.\nAT THE VERY END OF YOUR RESPONSE, YOU MUST APPEND EXACTLY THIS METADATA BLOCK:\n--META--\nTONE: [one word]\nTAGS: #tag1 #tag2 #tag3\nSUGGESTIONS: [Follow up 1] | [Follow up 2] | [Follow up 3]\nCONFIDENCE: [0-100]`;
      }

      const apiMessages = [
        { role: 'system', content: systemPrompt },
        ...messages.map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.rawText || m.text })),
        { role: 'user', content: commandStr }
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
          stream: true,
          max_tokens: 4096
        })
      });

      if (!res.ok) {
         const errBody = await res.json().catch(()=>({}));
         throw new Error(errBody.error?.message || `HTTP ${res.status}`);
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder("utf-8");
      
      if (reader) {
        let buffer = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          
          for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine) continue;
            if (trimmedLine === 'data: [DONE]') break;
            
            if (trimmedLine.startsWith('data: ')) {
               try {
                 const data = JSON.parse(trimmedLine.slice(6));
                 if (data.choices && data.choices[0].delta && data.choices[0].delta.content) {
                    fullRawText += data.choices[0].delta.content;
                    setMessages(prev => {
                      const newMsgs = [...prev];
                      const curMsg = newMsgs[modelMsgIndex];
                      if (!curMsg) return prev;
                      const updatedMsg = { ...curMsg, rawText: fullRawText };
                      if (streamSpeed === 0) {
                         const { pText, pMeta } = parseMetadata(fullRawText);
                         updatedMsg.text = pText;
                         updatedMsg.metadata = pMeta;
                      }
                      newMsgs[modelMsgIndex] = updatedMsg;
                      return newMsgs;
                    });
                 }
               } catch(e) {
                 console.error("Parse error on streaming chunk:", trimmedLine, e);
                 triggerError();
               }
            }
          }
        }
      }

      if (activeMode === 'KNOWLEDGE') {
        const newSubject = commandStr.split(' ').slice(0, 3).join(' ');
        setKnowledgeTrail(prev => [{
          id: Date.now().toString(),
          subject: newSubject,
          timestamp: new Date().toLocaleTimeString()
        }, ...prev].slice(0, 10));
      }

      if (activeMode === 'WORKFLOW') {
        const jsonMatch = fullRawText.match(/\[\s*\{.*\}\s*\]/s);
        if (jsonMatch) {
          try {
            const tasks = JSON.parse(jsonMatch[0]);
            setActiveWorkflow(tasks.map((t: any) => ({ ...t, completed: false })));
          } catch (e) {
            console.error("Failed to parse tasks", e);
            triggerError();
          }
        }
      }

    } catch (err: any) {
      console.error(err);
      triggerError();
      setMessages(prev => {
        const newMsgs = [...prev];
        newMsgs[modelMsgIndex] = { id: Date.now().toString(), role: 'model', text: `>> FATAL EXCEPTION: ${err.message || 'SYSTEM FAILURE'}`, rawText: `>> FATAL EXCEPTION: ${err.message || 'SYSTEM FAILURE'}` };
        return newMsgs;
      });
    } finally {
      setIsTyping(false);
    }
  };

  const toggleTask = (id: string) => {
    setActiveWorkflow(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };


  const playTTS = async (textStr: string) => {
    const synth = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(textStr);
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

  const haltTTS = () => {
    window.speechSynthesis.cancel();
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
        
        stream.getTracks().forEach(track => track.stop());

        const formData = new FormData();
        formData.append("file", audioBlob, "audio.webm");
        formData.append("model", "whisper-large-v3");

        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: "[PROCESSING AUDIO DATA VIA GROQ KERNEL...]", rawText: "[PROCESSING AUDIO DATA VIA GROQ KERNEL...]" }]);
        
        try {
          const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${apiKey}`
            },
            body: formData
          });
          const data = await res.json();
          if (data.text) {
             setMessages(prev => {
                const arr = [...prev];
                arr.pop();
                return [...arr, { id: Date.now().toString(), role: 'model', text: `>> VOCAL_INPUT_DECODED: "${data.text}"`, rawText: `>> VOCAL_INPUT_DECODED: "${data.text}"` }];
             });
             setInput(data.text);
          } else {
             throw new Error(data.error?.message || "STT Failed");
          }
        } catch(e) {
          triggerError();
          setMessages(prev => [...prev.slice(0, -1), { id: Date.now().toString(), role: 'model', text: ">> FATAL: VOCAL_INPUT_REJECTED // PACKET_LOSS", rawText: ">> FATAL: VOCAL_INPUT_REJECTED // PACKET_LOSS" }]);
        }
      });

      mediaRecorder.start();
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: "[AUDIO TRANSCRIPTION TRIGGERED - LISTENING FOR 5 SECONDS...]", rawText: "[AUDIO TRANSCRIPTION TRIGGERED - LISTENING FOR 5 SECONDS...]" }]);
      
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
        }
      }, 5000);

    } catch (err) {
      triggerError();
      setIsRecording(false);
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: ">> FATAL: MIC_NOT_FOUND", rawText: ">> FATAL: MIC_NOT_FOUND" }]);
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
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: ">> GENERATING EMAIL PAYLOAD WITH GROQ KERNEL...", rawText: ">> GENERATING EMAIL PAYLOAD WITH GROQ KERNEL..." }]);
    
    if (!apiKey) {
      alert(">> GROQ API KEY REQUIRED");
      setIsEmailing(false);
      return;
    }

    try {
      const chatHistoryText = messages.map(m => `${m.role.toUpperCase()}: ${m.rawText || m.text}`).join('\n');
      
      const apiMessages = [
        { role: 'system', content: `You are the NEXT-GEN AI SYSTEM compiling a session export email.
Write a structured HTML email summarizing this session. 
Use brutalist inline CSS styling for the HTML. Format strictly as JSON { "subject": "...", "html": "..." }` },
        { role: 'user', content: `Session Data:\n${chatHistoryText}` }
      ];

      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: apiMessages,
          response_format: { type: "json_object" }
        })
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      const emailJson = JSON.parse(data.choices[0].message.content.match(/\{[\s\S]*\}/)[0]);

      setMessages(prev => { const n=[...prev]; n.pop(); return [...n, { id: Date.now().toString(), role: 'model', text: ">> INITIATING_GMAIL_UPLINK...", rawText: ">> INITIATING_GMAIL_UPLINK..." }]; });

      const emailRes = await fetch('/api/export-email', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
            to: emailTarget,
            subject: emailJson.subject || "SYS_OUT // NEXT-GEN AI SESSION",
            html: emailJson.html || "<h1>SYSTEM ERROR.</h1>"
         })
      });
      
      const result = await emailRes.json();
      if (result.success) {
         setMessages(prev => { const n=[...prev]; n.pop(); return [...n, { id: Date.now().toString(), role: 'model', text: `>> GMAIL_TRANSMISSION_SUCCESS! TARGET: [<span class="math-inline">\{emailTarget\}\]\`, rawText\: \`\>\> GMAIL\_TRANSMISSION\_SUCCESS\! TARGET\: \[</span>{emailTarget}]` }]; });
      } else {
         throw new Error(result.error);
      }
    } catch(err: any) {
      triggerError();
      setMessages(prev => { const n=[...prev]; n.pop(); return [...n, { id: Date.now().toString(), role: 'model', text: `>> GMAIL_TRANSMISSION_FAILED // <span class="math-inline">\{err\.message || String\(err\)\}\`, rawText\: \`\>\> GMAIL\_TRANSMISSION\_FAILED // </span>{err.message || String(err)}` }]; });
    } finally {
      setIsEmailing(false);
    }
  };

  return (
    <div className={`flex flex-col min-h-[calc(100vh-12px)] ${isErrorGlitching ? 'glitch' : ''}`}>
      {scanlineEnabled && <div className="scanlines"></div>}
      
      {showAuthPopup && (
        <div className="fixed inset-0 bg-black/90 z-[9999] flex items-center justify-center p-4">
          <div className="bg-white border-[6px] border-black p-8 max-w-lg w-full flex flex-col gap-6" style={{boxShadow: '12px 12px 0px #000'}}>
             <div>
                <h2 className="text-2xl font-black uppercase m-0 leading-tight">KERNEL_AUTHENTICATION_REQUIRED</h2>
                <p className="text-sm font-bold uppercase opacity-60 mt-2">ENTER GROQ API KEY TO INITIALIZE SYSTEM</p>
             </div>
             
             <div className="flex flex-col gap-2">
                <input 
                   type="password"
                   value={authInput}
                   onChange={(e) => { setAuthInput(e.target.value); setAuthError(false); }}
                   placeholder="sk-..."
                   className="w-full border-[4px] border-black p-4 font-mono text-lg focus:outline-none focus:bg-[#E5E5E5] rounded-none"
                />
                {authError && <span className="text-[#FF2D00] text-xs font-bold uppercase animate-pulse">ERROR: NULL_KEY_DETECTED</span>}
             </div>

             <button 
                onClick={handleAuthSubmit}
                className="w-full bg-[#FFE600] border-[4px] border-black p-4 font-black uppercase text-xl hover:bg-black hover:text-[#FFE600] transition-colors active:translate-y-1 cursor-pointer"
                style={{boxShadow: '6px 6px 0px #000'}}
             >
                [AUTHENTICATE]
             </button>

             <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer" className="text-center text-xs font-bold uppercase text-gray-500 hover:text-black mt-2 inline-block w-full">
                GET API KEY → console.groq.com
             </a>
          </div>
        </div>
      )}

      {/* Header Section */}
      <header className="bg-[#FFE600] border-black border-b-[3px] p-4 flex justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tighter uppercase m-0 leading-tight">
            NEXT-GEN AI ASSISTANT SYSTEM
          </h1>
          <div className="flex gap-2 flex-wrap items-center mt-2">
            <span className="inline-block bg-white border-[3px] border-black px-3 py-1 text-[0.65rem] font-bold uppercase">
              KERNEL: GROQ / LLAMA-3.3-70B
            </span>
            <span className="inline-block bg-black text-white border-[3px] border-black px-3 py-1 text-[0.65rem] font-bold uppercase">
              SESSION: {formatTime(sessionTime)}
            </span>
            <span className="inline-block bg-white border-[3px] border-black px-3 py-1 text-[0.65rem] font-bold uppercase">
              TOKENS: {getTokenCount()}/4096
            </span>
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="bg-white hover:bg-black hover:text-white border-[3px] border-black px-3 py-1 text-[0.65rem] font-bold uppercase cursor-pointer">
              {isDarkMode ? 'LIGHT_MODE' : 'DARK_MODE'}
            </button>
            <button onClick={() => setScanlineEnabled(!scanlineEnabled)} className="bg-white hover:bg-[#FF2D00] hover:text-white border-[3px] border-black px-3 py-1 text-[0.65rem] font-bold uppercase cursor-pointer">
              SCANLINE: {scanlineEnabled ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
             onClick={handleResetApiKey}
             className="bg-white hover:bg-black hover:text-[#FFE600] text-black border-[3px] border-black px-3 py-2 text-xs font-bold uppercase cursor-pointer transition-colors active:translate-y-1"
          >
             [RESET_API_KEY]
          </button>
          <div className="hidden xl:block bg-[#FF2D00] text-white border-[3px] border-black px-3 py-2 text-xs font-bold uppercase">
            ENCRYPTED CONNECTION
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="grid grid-cols-2 md:grid-cols-4 bg-black gap-[3px] border-black border-b-[3px] relative z-10">
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

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[350px_1fr] relative z-10">
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
          
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
               <label className="font-black uppercase text-[0.65rem]">OUTPUT_LANG:</label>
               <select value={outputLang} readOnly onChange={(e) => setOutputLang(e.target.value)} className="border-[3px] border-black p-1 bg-white text-[0.65rem] font-bold uppercase focus:outline-none cursor-pointer">
                  {['English', 'Spanish', 'French', 'German', 'Hindi', 'Arabic', 'Japanese'].map(l => <option key={l} value={l}>{l}</option>)}
               </select>
            </div>
            <div className="flex flex-col gap-1">
               <label className="font-black uppercase text-[0.65rem]">STREAM_SPEED:</label>
               <div className="flex gap-1 flex-1">
                  <button onClick={() => setStreamSpeed(50)} className={`flex-1 border-[3px] border-black text-[0.55rem] font-bold ${streamSpeed === 50 ? 'bg-[#FFE600]' : 'bg-white hover:bg-gray-100'}`}>SLW</button>
                  <button onClick={() => setStreamSpeed(20)} className={`flex-1 border-[3px] border-black text-[0.55rem] font-bold ${streamSpeed === 20 ? 'bg-[#FFE600]' : 'bg-white hover:bg-gray-100'}`}>NRM</button>
                  <button onClick={() => setStreamSpeed(0)} className={`flex-1 border-[3px] border-black text-[0.55rem] font-bold ${streamSpeed === 0 ? 'bg-[#FF2D00] text-white' : 'bg-white hover:bg-gray-100'}`}>FST</button>
               </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
             <button onClick={exportSession} className="border-[3px] border-black p-2 bg-black hover:bg-[#0047FF] text-white text-[0.65rem] font-bold uppercase cursor-pointer active:translate-y-1">EXPORT_SESSION</button>
             <button onClick={loadHistory} className="border-[3px] border-black p-2 bg-white hover:bg-[#FFE600] text-black text-[0.65rem] font-bold uppercase cursor-pointer active:translate-y-1">LOAD_HISTORY</button>
          </div>

          {pinnedMessageIds.length > 0 && (
             <div className="flex flex-col gap-2 mt-4 p-3 border-[3px] border-black bg-gray-50">
                <label className="font-black uppercase text-[0.8rem] bg-black text-[#FFE600] px-2 py-1 inline-block self-start">PINNED_NODES:</label>
                <div className="flex flex-col gap-2 font-mono mt-2">
                  {messages.filter(m => pinnedMessageIds.includes(m.id)).map(m => (
                     <div key={m.id} className="border-l-[6px] border-[#FF2D00] p-2 bg-[#FFE600] text-[0.65rem] text-black leading-tight truncate">
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
            <button onClick={haltTTS} className="border-[3px] border-black p-2 bg-black text-[#FFE600] font-bold text-[0.7rem] uppercase">
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

        {/* Terminal Output */}
        <section className="bg-[#E5E5E5] p-5 flex flex-col gap-3 overflow-hidden">
          <div className="bg-white border-[3px] border-black flex-1 flex flex-col relative overflow-hidden">
            <div className="bg-black text-white px-3 py-1 text-[0.7rem] font-bold uppercase flex justify-between">
              <span>GEMINI_OUTPUT_STREAM</span>
              <span>BUFFER: {messages.length}/256</span>
            </div>
            <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-8" ref={scrollRef}>
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
                <div key={m.id} className="flex flex-col gap-2">
                   <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black text-xs uppercase">{m.role === 'user' ? '>_USER' : '>_AI_SYSTEM'}</span>
                      {m.metadata?.tone && (
                         <span className={`text-[0.55rem] font-black border border-black px-1 uppercase ${m.metadata.tone.includes('URGENT') || m.metadata.tone.includes('ANXIOUS') ? 'bg-[#FF2D00] text-white' : 'bg-[#FFE600] text-black'}`}>
                            [TONE: {m.metadata.tone}]
                         </span>
                      )}
                      <div className="h-[1px] flex-1 bg-black opacity-10"></div>
                   </div>
                   <div className={`p-4 border-l-[6px] relative ${m.role === 'user' ? 'border-[#FFE600] bg-gray-50' : 'border-[#0047FF] bg-white'}`}>
                      {m.role === 'model' && i === messages.length - 1 && isTyping && (
                        <span className="absolute right-2 top-2 w-2 h-4 bg-black animate-pulse"></span>
                      )}
                      <div className="markdown-body text-[0.85rem] leading-[1.4] whitespace-pre-wrap font-mono relative z-10">
                         <ReactMarkdown remarkPlugins={[remarkGfm]}>
                           {m.text || (i === messages.length - 1 && m.role === 'model' ? '...' : '')}
                         </ReactMarkdown>
                         {i === messages.length - 1 && m.role === 'model' && isTyping && (
                           <span className="inline-block w-2 h-4 bg-black ml-1 align-middle animate-pulse"></span>
                         )}
                      </div>

                      {/* Display Auto Tagger and Confidence */}
                      {m.metadata?.tags && (
                         <div className="mt-3 text-[0.65rem] font-bold text-[#0047FF] flex gap-2 flex-wrap">
                           {m.metadata.tags.map((t, idx) => <span key={idx}>{t}</span>)}
                         </div>
                      )}
                      
                      {m.metadata?.confidence !== undefined && (
                         <div className="mt-2 text-[0.55rem] font-black uppercase flex items-center gap-2 max-w-xs">
                           <span className="w-24">CONFIDENCE: {m.metadata.confidence}%</span>
                           <div className="flex-1 h-3 border-2 border-black bg-gray-200">
                             <div className={`h-full ${m.metadata.confidence > 80 ? 'bg-green-500' : (m.metadata.confidence > 50 ? 'bg-[#FFE600]' : 'bg-[#FF2D00]')}`} style={{width: `${m.metadata.confidence}%`}}></div>
                           </div>
                         </div>
                      )}

                      {/* Follow-up Prompts */}
                      {m.metadata?.suggestions && m.metadata.suggestions.length > 0 && (
                         <div className="mt-4 flex flex-col gap-2">
                            <span className="text-[0.55rem] font-bold opacity-50 uppercase">SUGGESTED_QUERIES:</span>
                            <div className="flex flex-wrap gap-2">
                               {m.metadata.suggestions.map((s, idx) => (
                                  <button key={idx} onClick={() => handleFollowUp(s)} className="text-[0.65rem] bg-white border-2 border-black px-2 py-1 font-bold hover:bg-[#FFE600] active:translate-y-1 text-left">
                                    {s}
                                  </button>
                               ))}
                            </div>
                         </div>
                      )}

                      {/* Utility Action Bar */}
                      {m.role === 'model' && m.text && (
                        <div className="mt-4 pt-3 border-t-2 border-black border-dashed flex gap-2 flex-wrap relative z-10">
                           <button 
                            onClick={() => playTTS(m.text)}
                            className="bg-black text-white border-2 border-black text-[0.6rem] px-2 py-1 font-bold hover:bg-[#0047FF] active:translate-y-1"
                           >
                             [ READ_ALOUD ]
                           </button>
                           <button 
                            onClick={() => copyMessage(m.id, m.text)}
                            className="bg-white text-black border-2 border-black text-[0.6rem] px-2 py-1 font-bold hover:bg-[#FFE600] active:translate-y-1"
                           >
                             {copiedId === m.id ? '[ COPIED_TO_BUFFER ]' : '[ COPY ]'}
                           </button>
                           <button 
                            onClick={() => togglePin(m.id)}
                            className="bg-white text-black border-2 border-black text-[0.6rem] px-2 py-1 font-bold hover:bg-[#FFE600] active:translate-y-1"
                           >
                             {pinnedMessageIds.includes(m.id) ? '[ UNPIN_NODE ]' : '[ PIN_NODE ]'}
                           </button>
                        </div>
                      )}
                   </div>
                </div>
              )})}
            </div>
          </div>

          <div className="flex flex-col gap-3 relative z-10">
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

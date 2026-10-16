/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { AlertCircle, Key, Server, Cpu, CheckCircle, RefreshCw } from 'lucide-react';

type Mode = 'RESEARCH' | 'SUPPORT' | 'WORKFLOW' | 'KNOWLEDGE' | 'DEBATE';
type AIProvider = 'GEMINI' | 'GROQ' | 'OLLAMA';

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
  complexityMode?: 'ELI5' | 'EXPERT';
  factCheckReport?: { claim: string; verdict: 'VERIFIED' | 'UNCERTAIN' | 'DISPUTED'; reason: string }[];
  isFactChecking?: boolean;
  isFactCheckOpen?: boolean;
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

interface DebateRound {
  agentA: string;
  agentB: string;
  verdict: string;
}

export default function App() {
  // Provider state
  const defaultProvider = ((process.env.DEFAULT_AI_PROVIDER as string) || 'gemini').toUpperCase() as AIProvider;
  const [provider, setProvider] = useState<AIProvider>(
    (localStorage.getItem('AI_PROVIDER') as AIProvider) || defaultProvider || 'GEMINI'
  );

  // API Keys & endpoints (prefer localStorage, fall back to .env)
  const [geminiKey, setGeminiKey] = useState<string>(
    localStorage.getItem('GEMINI_API_KEY') || (process.env.GEMINI_API_KEY as string) || ''
  );
  const [groqKey, setGroqKey] = useState<string>(
    localStorage.getItem('GROQ_API_KEY') || (process.env.GROQ_API_KEY as string) || ''
  );
  const [ollamaBaseUrl, setOllamaBaseUrl] = useState<string>(
    localStorage.getItem('OLLAMA_BASE_URL') || (process.env.OLLAMA_BASE_URL as string) || 'http://localhost:11434'
  );

  // Models
  const [geminiModel, setGeminiModel] = useState<string>(() => {
    const saved = localStorage.getItem('GEMINI_MODEL');
    if (saved && saved !== 'gemini-2.5-flash') return saved;
    return (process.env.GEMINI_MODEL as string) || 'gemini-flash-lite-latest';
  });
  const [groqModel, setGroqModel] = useState<string>(
    localStorage.getItem('GROQ_MODEL') || (process.env.GROQ_MODEL as string) || 'llama-3.3-70b-versatile'
  );
  const [ollamaModel, setOllamaModel] = useState<string>(
    localStorage.getItem('OLLAMA_MODEL') || (process.env.OLLAMA_MODEL as string) || 'llama3.2'
  );

  // Ollama status & model list
  const [ollamaStatus, setOllamaStatus] = useState<{ online: boolean; models: string[] }>({
    online: false,
    models: []
  });
  const [isCheckingOllama, setIsCheckingOllama] = useState(false);

  // Auth gate status
  const hasValidActiveCredentials = useCallback((): boolean => {
    if (provider === 'OLLAMA') return true; // Ollama runs locally without an API key
    if (provider === 'GEMINI') return Boolean(geminiKey && geminiKey.trim());
    if (provider === 'GROQ') return Boolean(groqKey && groqKey.trim());
    return false;
  }, [provider, geminiKey, groqKey]);

  const [showAuthPopup, setShowAuthPopup] = useState(!hasValidActiveCredentials());
  const [authTempKey, setAuthTempKey] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  // Server SMTP status
  const [serverSmtp, setServerSmtp] = useState<{ configured: boolean; user: string }>({
    configured: Boolean(process.env.HAS_SMTP_CONFIG),
    user: (process.env.GMAIL_USER as string) || ''
  });

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

  // Upgrade States
  const [outputLang, setOutputLang] = useState('English');
  const [streamSpeed, setStreamSpeed] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [scanlineEnabled, setScanlineEnabled] = useState(false);
  const [isErrorGlitching, setIsErrorGlitching] = useState(false);
  const [pinnedMessageIds, setPinnedMessageIds] = useState<string[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sessionTime, setSessionTime] = useState(0);

  // ELI5 vs EXPERT
  const [complexityMode, setComplexityMode] = useState<'ELI5' | 'EXPERT'>('EXPERT');

  // AI DEBATE
  const [debateTopic, setDebateTopic] = useState('');
  const [debateHistory, setDebateHistory] = useState<DebateRound[]>([]);
  const [isDebating, setIsDebating] = useState(false);

  // SMTP Credentials States
  const [smtpEmail, setSmtpEmail] = useState(localStorage.getItem('SMTP_EMAIL') || '');
  const [smtpAppPassword, setSmtpAppPassword] = useState(localStorage.getItem('SMTP_APP_PASSWORD') || '');
  const [showConfig, setShowConfig] = useState(false);
  const [smtpError, setSmtpError] = useState('');

  // Check Ollama status
  const checkOllamaStatus = useCallback(async () => {
    setIsCheckingOllama(true);
    try {
      const res = await fetch('/api/ollama-status');
      const data = await res.json();
      if (data.online) {
        const modelNames = (data.models || []).map((m: any) => m.name || m);
        setOllamaStatus({ online: true, models: modelNames });
        if (modelNames.length > 0 && !modelNames.includes(ollamaModel)) {
          setOllamaModel(modelNames[0]);
          localStorage.setItem('OLLAMA_MODEL', modelNames[0]);
        }
      } else {
        setOllamaStatus({ online: false, models: [] });
      }
    } catch {
      setOllamaStatus({ online: false, models: [] });
    } finally {
      setIsCheckingOllama(false);
    }
  }, [ollamaModel]);

  // Check server configs on mount
  useEffect(() => {
    fetch('/api/smtp-status')
      .then(res => res.json())
      .then(data => {
        if (data.configured) {
          setServerSmtp({ configured: true, user: data.user || '' });
        }
      })
      .catch(() => {});

    checkOllamaStatus();
  }, [checkOllamaStatus]);

  // Handle provider switch
  const handleSelectProvider = (newProvider: AIProvider) => {
    setProvider(newProvider);
    localStorage.setItem('AI_PROVIDER', newProvider);
    setAuthError(null);

    if (newProvider === 'GEMINI') {
      setAuthTempKey(geminiKey);
    } else if (newProvider === 'GROQ') {
      setAuthTempKey(groqKey);
    } else {
      setAuthTempKey('');
    }
  };

  const handleAuthSubmit = () => {
    setAuthError(null);

    if (provider === 'GEMINI') {
      if (!authTempKey.trim() && !geminiKey) {
        setAuthError('ERROR: GEMINI_API_KEY_REQUIRED (Get one free at aistudio.google.com)');
        return;
      }
      const finalKey = authTempKey.trim() || geminiKey;
      localStorage.setItem('GEMINI_API_KEY', finalKey);
      setGeminiKey(finalKey);
    } else if (provider === 'GROQ') {
      if (!authTempKey.trim() && !groqKey) {
        setAuthError('ERROR: GROQ_API_KEY_REQUIRED (Starts with gsk_ from console.groq.com)');
        return;
      }
      const finalKey = authTempKey.trim() || groqKey;
      localStorage.setItem('GROQ_API_KEY', finalKey);
      setGroqKey(finalKey);
    } else if (provider === 'OLLAMA') {
      localStorage.setItem('OLLAMA_MODEL', ollamaModel);
      localStorage.setItem('OLLAMA_BASE_URL', ollamaBaseUrl);
    }

    localStorage.setItem('AI_PROVIDER', provider);
    setShowAuthPopup(false);
  };

  const handleOpenAuthModal = () => {
    if (provider === 'GEMINI') setAuthTempKey(geminiKey);
    else if (provider === 'GROQ') setAuthTempKey(groqKey);
    else setAuthTempKey('');
    setAuthError(null);
    setShowAuthPopup(true);
  };

  const handleResetCurrentKey = () => {
    if (provider === 'GEMINI') {
      localStorage.removeItem('GEMINI_API_KEY');
      setGeminiKey('');
    } else if (provider === 'GROQ') {
      localStorage.removeItem('GROQ_API_KEY');
      setGroqKey('');
    }
    setAuthTempKey('');
    setShowAuthPopup(true);
  };

  const saveSmtpCredentials = () => {
    localStorage.setItem('SMTP_EMAIL', smtpEmail);
    localStorage.setItem('SMTP_APP_PASSWORD', smtpAppPassword);
    setSmtpError('');
  };

  const clearSmtpCredentials = () => {
    localStorage.removeItem('SMTP_EMAIL');
    localStorage.removeItem('SMTP_APP_PASSWORD');
    setSmtpEmail('');
    setSmtpAppPassword('');
  };

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
      if (tagsMatch) metaObj.tags = tagsMatch[1].split(' ').filter(t => t.startsWith('#'));
      const suggMatch = mStr.match(/SUGGESTIONS:\s*([^\n]+)/);
      if (suggMatch) metaObj.suggestions = suggMatch[1].split('|').map(s => s.trim());
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
              const step = streamSpeed === 50 ? 1 : 4;
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
    } catch (e) {}
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

  // Helper for non-streaming AI requests (Fact Check, Debate, Email)
  const generateAIText = async (systemPrompt: string, userPrompt: string, jsonMode: boolean = false): Promise<string> => {
    if (provider === 'GEMINI') {
      if (!geminiKey) throw new Error('GEMINI_API_KEY is not set. Please configure in settings.');

      const tryFetch = async (mName: string) => {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${mName}:generateContent?key=${geminiKey}`;
        const payload: any = {
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [{ role: 'user', parts: [{ text: userPrompt }] }]
        };
        if (jsonMode) {
          payload.generationConfig = { responseMimeType: 'application/json' };
        }
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error?.message || `Gemini API returned HTTP ${res.status}`);
        }
        const data = await res.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      };

      try {
        return await tryFetch(geminiModel);
      } catch (err: any) {
        if (geminiModel !== 'gemini-flash-lite-latest') {
          console.warn(`Model ${geminiModel} failed, trying fallback gemini-flash-lite-latest...`);
          setGeminiModel('gemini-flash-lite-latest');
          localStorage.setItem('GEMINI_MODEL', 'gemini-flash-lite-latest');
          return await tryFetch('gemini-flash-lite-latest');
        }
        throw err;
      }
    } else if (provider === 'GROQ') {
      if (!groqKey) throw new Error('GROQ_API_KEY is not set. Please configure in settings.');
      const payload: any = {
        model: groqModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ]
      };
      if (jsonMode) {
        payload.response_format = { type: 'json_object' };
      }
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message || `Groq API returned HTTP ${res.status}`);
      }
      const data = await res.json();
      return data.choices?.[0]?.message?.content || '';
    } else {
      // OLLAMA
      const endpoint = '/ollama-proxy/v1/chat/completions';
      const payload: any = {
        model: ollamaModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ]
      };
      if (jsonMode) {
        payload.format = 'json';
      }
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(() => {
        throw new Error(`Cannot reach local Ollama at ${ollamaBaseUrl}. Make sure 'ollama serve' is running.`);
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message || `Ollama returned HTTP ${res.status}`);
      }
      const data = await res.json();
      return data.choices?.[0]?.message?.content || '';
    }
  };

  const verifyFacts = async (msgId: string, fullText: string) => {
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, isFactChecking: true, isFactCheckOpen: true } : m));

    try {
      const sysPrompt = "You are a rigorous fact-checking engine. Analyze the following AI-generated response thoroughly. For every factual claim, classify it as: VERIFIED (well established fact), UNCERTAIN (plausible but unconfirmed), or DISPUTED (contradicts known evidence). Return ONLY a flat JSON array of objects with keys: 'claim' (the extracted claim), 'verdict' (VERIFIED / UNCERTAIN / DISPUTED), and 'reason' (one sentence explanation). Do NOT wrap in markdown or extra prose.";
      const rawRes = await generateAIText(sysPrompt, fullText, true);

      let parsed: any[] = [];
      try {
        let clean = rawRes.trim();
        if (clean.startsWith('```json')) clean = clean.slice(7, -3).trim();
        if (clean.startsWith('```')) clean = clean.slice(3, -3).trim();
        parsed = JSON.parse(clean);
      } catch (e) {
        console.error('Fact checker parsing failed', e);
      }

      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, isFactChecking: false, factCheckReport: Array.isArray(parsed) ? parsed : [] } : m));
    } catch (e: any) {
      console.error(e);
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, isFactChecking: false } : m));
      alert(`FACT_CHECK_ERROR: ${e.message}`);
    }
  };

  const closeFactCheck = (msgId: string) => {
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, isFactCheckOpen: false } : m));
  };

  const handleSend = () => sendCommand(input);

  const sendCommand = async (commandStr: string) => {
    if (!commandStr.trim()) return;

    if (!hasValidActiveCredentials()) {
      setShowAuthPopup(true);
      return;
    }

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: commandStr, rawText: commandStr };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);
    setThinkingProcess('');

    const modelMsgIndex = messages.length + 1;
    const modelMsgId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, { id: modelMsgId, role: 'model', text: '', rawText: '', complexityMode }]);

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

      if (complexityMode === 'ELI5') {
        systemPrompt += `\n>> INSTRUCTION: Explain everything as if talking to a 5-year-old using simple words, fun analogies, and zero jargon.`;
      } else {
        systemPrompt += `\n>> INSTRUCTION: Respond at a PhD/research level using high-level technical terminology, citation style, and deep analytical reasoning.`;
      }

      // STREAMING CALL ROUTED BY ACTIVE PROVIDER
      if (provider === 'GEMINI') {
        const fetchStream = async (mName: string) => {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${mName}:streamGenerateContent?alt=sse&key=${geminiKey}`;
          const contents = [
            ...messages.map(m => ({
              role: m.role === 'user' ? 'user' : 'model',
              parts: [{ text: m.rawText || m.text }]
            })),
            { role: 'user', parts: [{ text: commandStr }] }
          ];

          return fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              systemInstruction: { parts: [{ text: systemPrompt }] },
              contents,
              generationConfig: { maxOutputTokens: 4096 }
            })
          });
        };

        let res = await fetchStream(geminiModel);
        if (!res.ok && geminiModel !== 'gemini-flash-lite-latest') {
          console.warn(`Gemini stream with ${geminiModel} failed (${res.status}), trying fallback gemini-flash-lite-latest...`);
          setGeminiModel('gemini-flash-lite-latest');
          localStorage.setItem('GEMINI_MODEL', 'gemini-flash-lite-latest');
          res = await fetchStream('gemini-flash-lite-latest');
        }

        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}));
          throw new Error(errBody.error?.message || `Gemini HTTP ${res.status}`);
        }

        const reader = res.body?.getReader();
        const decoder = new TextDecoder('utf-8');
        if (reader) {
          let buffer = '';
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed || !trimmed.startsWith('data: ')) continue;
              try {
                const json = JSON.parse(trimmed.slice(6));
                const chunk = json.candidates?.[0]?.content?.parts?.[0]?.text;
                if (chunk) {
                  fullRawText += chunk;
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
              } catch (e) {
                console.error('Parse error on Gemini SSE chunk:', trimmed, e);
              }
            }
          }
        }
      } else {
        // GROQ or OLLAMA (OpenAI-compatible SSE streaming)
        const isGroq = provider === 'GROQ';
        const url = isGroq ? 'https://api.groq.com/openai/v1/chat/completions' : '/ollama-proxy/v1/chat/completions';
        const modelName = isGroq ? groqModel : ollamaModel;
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (isGroq) headers['Authorization'] = `Bearer ${groqKey}`;

        const apiMessages = [
          { role: 'system', content: systemPrompt },
          ...messages.map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.rawText || m.text })),
          { role: 'user', content: commandStr }
        ];

        const res = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            model: modelName,
            messages: apiMessages,
            stream: true,
            max_tokens: 4096
          })
        }).catch(err => {
          if (!isGroq) {
            throw new Error(`Cannot reach local Ollama at ${ollamaBaseUrl}. Please run 'ollama serve' or switch to Gemini.`);
          }
          throw err;
        });

        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}));
          const errMsg = errBody.error?.message || `HTTP ${res.status}`;
          if (isGroq && res.status === 401) {
            throw new Error(`Invalid Groq API Key. Please click [AI_KERNEL_SETTINGS] to update your key or switch to Gemini.`);
          }
          if (isGroq && (errMsg.includes('access') || errMsg.includes('model'))) {
            throw new Error(`Groq model access issue: "${errMsg}". Try switching to Gemini or Ollama.`);
          }
          throw new Error(errMsg);
        }

        const reader = res.body?.getReader();
        const decoder = new TextDecoder('utf-8');

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
                } catch (e) {
                  console.error('Parse error on streaming chunk:', trimmedLine, e);
                  triggerError();
                }
              }
            }
          }
        }
      }

      if (activeMode === 'KNOWLEDGE') {
        const newSubject = commandStr.split(' ').slice(0, 3).join(' ');
        setKnowledgeTrail(prev => [
          {
            id: Date.now().toString(),
            subject: newSubject,
            timestamp: new Date().toLocaleTimeString()
          },
          ...prev
        ].slice(0, 10));
      }

      if (activeMode === 'WORKFLOW') {
        const jsonMatch = fullRawText.match(/\[\s*\{.*\}\s*\]/s);
        if (jsonMatch) {
          try {
            const tasks = JSON.parse(jsonMatch[0]);
            setActiveWorkflow(tasks.map((t: any) => ({ ...t, completed: false })));
          } catch (e) {
            console.error('Failed to parse tasks', e);
            triggerError();
          }
        }
      }

    } catch (err: any) {
      console.error(err);
      triggerError();
      setMessages(prev => {
        const newMsgs = [...prev];
        const failText = `>> SYSTEM ERROR [${provider}]: ${err.message || 'SYSTEM FAILURE'}`;
        newMsgs[modelMsgIndex] = {
          id: Date.now().toString(),
          role: 'model',
          text: failText,
          rawText: failText
        };
        return newMsgs;
      });
    } finally {
      setIsTyping(false);
    }
  };

  const toggleTask = (id: string) => {
    setActiveWorkflow(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const handleInitiateDebate = async (roundTopic: string, isRound2: boolean = false) => {
    if (!hasValidActiveCredentials()) {
      setShowAuthPopup(true);
      return;
    }
    if (!roundTopic.trim()) return;

    setIsDebating(true);
    if (!isRound2) {
      setDebateHistory([]);
    }

    try {
      // 1. Fetch Agent A (PRO)
      const textA = await generateAIText(
        "You are AGENT_A. Argue strictly FOR the following topic using strong, assertive logic. Keep it to one solid paragraph. DO NOT USE MARKDOWN.",
        roundTopic
      );

      // 2. Fetch Agent B (CON)
      const textB = await generateAIText(
        `You are AGENT_B. Argue strictly AGAINST the topic. You must directly rebut AGENT_A's argument provided below. Keep it to one solid paragraph. DO NOT USE MARKDOWN.\nAGENT_A CONTEXT: ${textA}`,
        roundTopic
      );

      // 3. Fetch Verdict
      const textV = await generateAIText(
        `You are the JUDGE. Below is a debate on the topic: "${roundTopic}".\nAGENT_A (PRO):\n${textA}\n\nAGENT_B (CON):\n${textB}\n\nDeclare which argument was stronger and explicitly state why in one paragraph. DO NOT USE MARKDOWN.`,
        'Who won and why?'
      );

      setDebateHistory(prev => [...prev, { agentA: textA, agentB: textB, verdict: textV }]);
    } catch (err: any) {
      console.error(err);
      triggerError();
      alert(`DEBATE ENGINE ERROR [${provider}]: ${err.message}`);
    } finally {
      setIsDebating(false);
    }
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
        const brutalVoice = voices.find(v => v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Daniel')) || voices[0];
        if (brutalVoice) utterance.voice = brutalVoice;
        synth.speak(utterance);
      };
    } else {
      const brutalVoice = voices.find(v => v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Daniel')) || voices[0];
      if (brutalVoice) utterance.voice = brutalVoice;
      synth.speak(utterance);
    }
  };

  const haltTTS = () => {
    window.speechSynthesis.cancel();
  };

  // Modern Speech-To-Text supporting both native browser Web Speech API & Groq Whisper fallback
  const startSTT = async () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        setIsRecording(true);
        const recognition = new SpeechRecognition();
        recognition.lang = outputLang === 'Spanish' ? 'es-ES' : outputLang === 'French' ? 'fr-FR' : outputLang === 'German' ? 'de-DE' : outputLang === 'Hindi' ? 'hi-IN' : 'en-US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'model',
          text: '[AUDIO LISTENING TRIGGERED - SPEAK CLEARLY...]',
          rawText: '[AUDIO LISTENING TRIGGERED - SPEAK CLEARLY...]'
        }]);

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setIsRecording(false);
          setMessages(prev => {
            const arr = [...prev];
            arr.pop();
            return [...arr, {
              id: Date.now().toString(),
              role: 'model',
              text: `>> VOCAL_INPUT_DECODED: "${transcript}"`,
              rawText: `>> VOCAL_INPUT_DECODED: "${transcript}"`
            }];
          });
          setInput(transcript);
        };

        recognition.onerror = (e: any) => {
          setIsRecording(false);
          console.error('Speech recognition error', e);
          triggerError();
          setMessages(prev => [...prev.slice(0, -1), {
            id: Date.now().toString(),
            role: 'model',
            text: `>> VOCAL_INPUT_HALTED: ${e.error || 'MICROPHONE_ERROR'}`,
            rawText: `>> VOCAL_INPUT_HALTED: ${e.error || 'MICROPHONE_ERROR'}`
          }]);
        };

        recognition.onend = () => {
          setIsRecording(false);
        };

        recognition.start();
        return;
      } catch (e) {
        console.warn('Native speech recognition failed, attempting fallback', e);
      }
    }

    // Fallback: Groq Whisper if Groq API key is present
    if (groqKey) {
      setIsRecording(true);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        const audioChunks: Blob[] = [];

        mediaRecorder.addEventListener('dataavailable', event => {
          audioChunks.push(event.data);
        });

        mediaRecorder.addEventListener('stop', async () => {
          setIsRecording(false);
          const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
          stream.getTracks().forEach(track => track.stop());

          const formData = new FormData();
          formData.append('file', audioBlob, 'audio.webm');
          formData.append('model', 'whisper-large-v3');

          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            role: 'model',
            text: '[PROCESSING AUDIO DATA VIA GROQ WHISPER...]',
            rawText: '[PROCESSING AUDIO DATA VIA GROQ WHISPER...]'
          }]);

          try {
            const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${groqKey}` },
              body: formData
            });
            const data = await res.json();
            if (data.text) {
              setMessages(prev => {
                const arr = [...prev];
                arr.pop();
                return [...arr, {
                  id: Date.now().toString(),
                  role: 'model',
                  text: `>> VOCAL_INPUT_DECODED: "${data.text}"`,
                  rawText: `>> VOCAL_INPUT_DECODED: "${data.text}"`
                }];
              });
              setInput(data.text);
            } else {
              throw new Error(data.error?.message || 'STT Failed');
            }
          } catch (e: any) {
            triggerError();
            setMessages(prev => [...prev.slice(0, -1), {
              id: Date.now().toString(),
              role: 'model',
              text: `>> FATAL: VOCAL_INPUT_REJECTED // ${e.message}`,
              rawText: `>> FATAL: VOCAL_INPUT_REJECTED // ${e.message}`
            }]);
          }
        });

        mediaRecorder.start();
        setTimeout(() => {
          if (mediaRecorder.state === 'recording') mediaRecorder.stop();
        }, 5000);
      } catch (err: any) {
        triggerError();
        setIsRecording(false);
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'model',
          text: `>> FATAL: MIC_ACCESS_DENIED // ${err.message}`,
          rawText: `>> FATAL: MIC_ACCESS_DENIED // ${err.message}`
        }]);
      }
    } else {
      alert('Voice STT is not supported on this browser without a Groq Whisper key.');
    }
  };

  const handleEmailTransmission = async () => {
    setSmtpError('');
    if (!emailTarget.trim() || !emailTarget.includes('@')) {
      alert('>> INVALID_TARGET_EMAIL');
      return;
    }
    if (messages.length === 0) {
      alert('>> NO_DATA_TO_TRANSMIT');
      return;
    }

    const hasCreds = (smtpEmail && smtpAppPassword) || serverSmtp.configured;
    if (!hasCreds) {
      setSmtpError('ERROR: SMTP_CREDENTIALS_NOT_CONFIGURED (Add to .env or drawer below)');
      setShowConfig(true);
      return;
    }

    setIsEmailing(true);
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: 'model',
      text: `>> GENERATING EMAIL PAYLOAD WITH ${provider} KERNEL...`,
      rawText: `>> GENERATING EMAIL PAYLOAD WITH ${provider} KERNEL...`
    }]);

    try {
      const chatHistoryText = messages.map(m => `${m.role.toUpperCase()}: ${m.rawText || m.text}`).join('\n');
      const sysPrompt = `You are NEXT-GEN AI SYSTEM compiling a session export email.
Write a structured HTML email summarizing this session.
Use brutalist inline CSS styling for the HTML (black thick borders, high-contrast yellow/blue accents, monospace font). Format strictly as JSON { "subject": "...", "html": "..." } with no other text.`;

      const rawEmail = await generateAIText(sysPrompt, `Session Data:\n${chatHistoryText}`, true);
      const emailJson = JSON.parse(rawEmail.match(/\{[\s\S]*\}/)?.[0] || '{"subject":"SYS_OUT","html":"<h1>Session</h1>"}');

      setMessages(prev => {
        const n = [...prev];
        n.pop();
        return [...n, {
          id: Date.now().toString(),
          role: 'model',
          text: '>> INITIATING_GMAIL_UPLINK...',
          rawText: '>> INITIATING_GMAIL_UPLINK...'
        }];
      });

      const bodyPayload: any = {
        to: emailTarget,
        subject: emailJson.subject || 'SYS_OUT // NEXT-GEN AI SESSION',
        html: emailJson.html || '<h1>SYSTEM REPORT</h1>'
      };

      if (smtpEmail && smtpAppPassword) {
        bodyPayload.auth = { user: smtpEmail, pass: smtpAppPassword };
      }

      const emailRes = await fetch('/api/export-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload)
      });

      const result = await emailRes.json();
      if (result.success) {
        setMessages(prev => {
          const n = [...prev];
          n.pop();
          const succText = `>> GMAIL_TRANSMISSION_SUCCESS! TARGET: [${emailTarget}]`;
          return [...n, {
            id: Date.now().toString(),
            role: 'model',
            text: succText,
            rawText: succText
          }];
        });
      } else {
        throw new Error(result.error);
      }
    } catch (err: any) {
      triggerError();
      setMessages(prev => {
        const n = [...prev];
        n.pop();
        const errText = `>> GMAIL_TRANSMISSION_FAILED // ${err.message || String(err)}`;
        return [...n, {
          id: Date.now().toString(),
          role: 'model',
          text: errText,
          rawText: errText
        }];
      });
    } finally {
      setIsEmailing(false);
    }
  };

  const activeModelDisplay = provider === 'GEMINI' ? geminiModel : provider === 'GROQ' ? groqModel : ollamaModel;

  return (
    <div className={`flex flex-col min-h-[calc(100vh-12px)] ${isErrorGlitching ? 'glitch' : ''}`}>
      {scanlineEnabled && <div className="scanlines"></div>}

      {/* AI Kernel Provider Authentication & Settings Modal */}
      {showAuthPopup && (
        <div className="fixed inset-0 bg-black/90 z-[9999] flex items-center justify-center p-4">
          <div className="bg-white border-[6px] border-black p-6 md:p-8 max-w-xl w-full flex flex-col gap-5" style={{ boxShadow: '12px 12px 0px #000' }}>
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-black uppercase m-0 leading-tight flex items-center gap-2">
                  <Cpu className="w-6 h-6 text-[#FF2D00]" />
                  AI_KERNEL_SETUP
                </h2>
                <p className="text-xs font-bold uppercase opacity-60 mt-1">
                  SELECT YOUR AI ENGINE &amp; CONFIGURE ACCESS
                </p>
              </div>
              {hasValidActiveCredentials() && (
                <button
                  onClick={() => setShowAuthPopup(false)}
                  className="bg-black text-white hover:bg-[#FF2D00] px-3 py-1 text-xs font-black uppercase cursor-pointer"
                >
                  ✕ CLOSE
                </button>
              )}
            </div>

            {/* Provider Switcher Tabs */}
            <div className="grid grid-cols-3 gap-2 border-[3px] border-black p-1 bg-[#E5E5E5]">
              <button
                type="button"
                onClick={() => handleSelectProvider('GEMINI')}
                className={`p-2 text-center text-xs font-black uppercase cursor-pointer transition-all ${
                  provider === 'GEMINI' ? 'bg-[#0047FF] text-white shadow-[2px_2px_0px_#000]' : 'bg-white hover:bg-yellow-200 text-black'
                }`}
              >
                GOOGLE GEMINI
              </button>
              <button
                type="button"
                onClick={() => handleSelectProvider('GROQ')}
                className={`p-2 text-center text-xs font-black uppercase cursor-pointer transition-all ${
                  provider === 'GROQ' ? 'bg-[#FF2D00] text-white shadow-[2px_2px_0px_#000]' : 'bg-white hover:bg-yellow-200 text-black'
                }`}
              >
                GROQ CLOUD
              </button>
              <button
                type="button"
                onClick={() => handleSelectProvider('OLLAMA')}
                className={`p-2 text-center text-xs font-black uppercase cursor-pointer transition-all ${
                  provider === 'OLLAMA' ? 'bg-[#FFE600] text-black shadow-[2px_2px_0px_#000]' : 'bg-white hover:bg-yellow-200 text-black'
                }`}
              >
                LOCAL OLLAMA
              </button>
            </div>

            {/* Provider Details & Inputs */}
            {provider === 'GEMINI' && (
              <div className="flex flex-col gap-3">
                <div className="bg-[#0047FF]/10 border-[2px] border-[#0047FF] p-3 text-xs">
                  <span className="font-black text-[#0047FF] block uppercase">PROVIDER: GOOGLE GEMINI (RECOMMENDED)</span>
                  <span className="text-gray-700 font-mono text-[0.7rem] block mt-1">
                    Powered by Google&apos;s multimodal generative engine. Free API keys available from Google AI Studio.
                  </span>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-black uppercase">GEMINI API KEY:</label>
                  <input
                    type="password"
                    value={authTempKey}
                    onChange={(e) => { setAuthTempKey(e.target.value); setAuthError(null); }}
                    placeholder={geminiKey ? "Key configured in .env (or enter new key)" : "AIzaSy..."}
                    className="w-full border-[3px] border-black p-3 font-mono text-sm focus:outline-none focus:bg-[#FFE600]"
                  />
                  {geminiKey && (
                    <span className="text-[0.65rem] text-green-700 font-bold uppercase mt-1">
                      ✓ ACTIVE KEY DETECTED ({geminiKey.slice(0, 6)}...{geminiKey.slice(-4)})
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-black uppercase">MODEL:</label>
                  <select
                    value={geminiModel}
                    onChange={(e) => { setGeminiModel(e.target.value); localStorage.setItem('GEMINI_MODEL', e.target.value); }}
                    className="border-[3px] border-black p-2 font-mono text-xs bg-white font-bold uppercase"
                  >
                    <option value="gemini-flash-lite-latest">gemini-flash-lite-latest (Fast &amp; Reliable)</option>
                    <option value="gemini-3.5-flash">gemini-3.5-flash</option>
                    <option value="gemini-3.8-flash">gemini-3.8-flash</option>
                    <option value="gemini-flash-latest">gemini-flash-latest</option>
                  </select>
                </div>

                <a
                  href="https://aistudio.google.com/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold uppercase text-[#0047FF] hover:underline"
                >
                  GET FREE GEMINI API KEY → aistudio.google.com/apikey
                </a>
              </div>
            )}

            {provider === 'GROQ' && (
              <div className="flex flex-col gap-3">
                <div className="bg-[#FF2D00]/10 border-[2px] border-[#FF2D00] p-3 text-xs">
                  <span className="font-black text-[#FF2D00] block uppercase">PROVIDER: GROQ CLOUD (LPU INFERENCE)</span>
                  <span className="text-gray-700 font-mono text-[0.7rem] block mt-1">
                    Ultra-fast inference via Groq LPUs running Llama 3.3.
                  </span>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-black uppercase">GROQ API KEY:</label>
                  <input
                    type="password"
                    value={authTempKey}
                    onChange={(e) => { setAuthTempKey(e.target.value); setAuthError(null); }}
                    placeholder={groqKey ? "Key configured in .env (or enter new key)" : "gsk_..."}
                    className="w-full border-[3px] border-black p-3 font-mono text-sm focus:outline-none focus:bg-[#FFE600]"
                  />
                  {groqKey && (
                    <span className="text-[0.65rem] text-green-700 font-bold uppercase mt-1">
                      ✓ ACTIVE KEY DETECTED ({groqKey.slice(0, 6)}...{groqKey.slice(-4)})
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-black uppercase">MODEL:</label>
                  <select
                    value={groqModel}
                    onChange={(e) => { setGroqModel(e.target.value); localStorage.setItem('GROQ_MODEL', e.target.value); }}
                    className="border-[3px] border-black p-2 font-mono text-xs bg-white font-bold uppercase"
                  >
                    <option value="llama-3.3-70b-versatile">llama-3.3-70b-versatile</option>
                    <option value="llama-3.1-8b-instant">llama-3.1-8b-instant (Fast / Low Quota)</option>
                    <option value="mixtral-8x7b-32768">mixtral-8x7b-32768</option>
                  </select>
                </div>

                <a
                  href="https://console.groq.com/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold uppercase text-[#FF2D00] hover:underline"
                >
                  GET GROQ API KEY → console.groq.com/keys
                </a>
              </div>
            )}

            {provider === 'OLLAMA' && (
              <div className="flex flex-col gap-3">
                <div className="bg-[#FFE600]/20 border-[2px] border-black p-3 text-xs">
                  <span className="font-black block uppercase">PROVIDER: LOCAL OLLAMA (OFFLINE / FREE)</span>
                  <span className="text-gray-700 font-mono text-[0.7rem] block mt-1">
                    Connects directly to your local Ollama server. No cloud API key needed!
                  </span>
                </div>

                <div className="flex items-center justify-between border-[2px] border-black p-2 bg-[#E5E5E5]">
                  <span className="text-[0.7rem] font-black uppercase">SERVER STATUS:</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-[0.7rem] font-bold uppercase px-2 py-0.5 border border-black ${ollamaStatus.online ? 'bg-green-400 text-black' : 'bg-red-400 text-white'}`}>
                      {ollamaStatus.online ? 'ONLINE ✓' : 'OFFLINE ✗'}
                    </span>
                    <button
                      type="button"
                      onClick={checkOllamaStatus}
                      disabled={isCheckingOllama}
                      className="border border-black bg-white px-2 py-0.5 text-[0.65rem] font-bold uppercase hover:bg-yellow-200 cursor-pointer"
                    >
                      {isCheckingOllama ? 'CHECKING...' : 'RECHECK'}
                    </button>
                  </div>
                </div>

                {!ollamaStatus.online && (
                  <div className="bg-red-50 border-[2px] border-red-500 p-2 text-[0.65rem] text-red-800 font-mono">
                    ⚠ Ollama is not detected at {ollamaBaseUrl}.
                    <br />
                    To start it in your terminal, run: <span className="font-bold underline">ollama serve</span> or run a model: <span className="font-bold underline">ollama run llama3.2</span>
                  </div>
                )}

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-black uppercase">MODEL NAME:</label>
                  {ollamaStatus.online && ollamaStatus.models.length > 0 ? (
                    <select
                      value={ollamaModel}
                      onChange={(e) => { setOllamaModel(e.target.value); localStorage.setItem('OLLAMA_MODEL', e.target.value); }}
                      className="border-[3px] border-black p-2 font-mono text-xs bg-white font-bold"
                    >
                      {ollamaStatus.models.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={ollamaModel}
                      onChange={(e) => { setOllamaModel(e.target.value); localStorage.setItem('OLLAMA_MODEL', e.target.value); }}
                      placeholder="e.g. llama3.2, mistral, llama3"
                      className="border-[3px] border-black p-2 font-mono text-xs bg-white focus:outline-none focus:bg-[#FFE600]"
                    />
                  )}
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-black uppercase">OLLAMA BASE URL:</label>
                  <input
                    type="text"
                    value={ollamaBaseUrl}
                    onChange={(e) => { setOllamaBaseUrl(e.target.value); localStorage.setItem('OLLAMA_BASE_URL', e.target.value); }}
                    className="border-[3px] border-black p-2 font-mono text-xs bg-white focus:outline-none focus:bg-[#FFE600]"
                  />
                </div>
              </div>
            )}

            {authError && (
              <div className="bg-[#FF2D00] text-white p-2 text-xs font-bold uppercase animate-pulse border-[2px] border-black">
                {authError}
              </div>
            )}

            <button
              onClick={handleAuthSubmit}
              className="w-full bg-[#FFE600] border-[4px] border-black p-4 font-black uppercase text-lg hover:bg-black hover:text-[#FFE600] transition-colors active:translate-y-1 cursor-pointer"
              style={{ boxShadow: '6px 6px 0px #000' }}
            >
              [ACTIVATE_AI_KERNEL]
            </button>
          </div>
        </div>
      )}

      {/* Header Section */}
      <header className="bg-[#FFE600] border-black border-b-[3px] p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tighter uppercase m-0 leading-tight">
            NEXT-GEN AI ASSISTANT SYSTEM
          </h1>
          <div className="flex gap-2 flex-wrap items-center mt-2">
            <span className="inline-flex items-center gap-1 bg-white border-[3px] border-black px-3 py-1 text-[0.65rem] font-bold uppercase">
              <span className={`w-2 h-2 rounded-full ${provider === 'GEMINI' ? 'bg-[#0047FF]' : provider === 'GROQ' ? 'bg-[#FF2D00]' : 'bg-green-500'}`}></span>
              KERNEL: {provider} / {activeModelDisplay}
            </span>
            <span className="inline-block bg-black text-white border-[3px] border-black px-3 py-1 text-[0.65rem] font-bold uppercase">
              SESSION: {formatTime(sessionTime)}
            </span>
            <span className="inline-block bg-white border-[3px] border-black px-3 py-1 text-[0.65rem] font-bold uppercase">
              TOKENS: {getTokenCount()}/4096
            </span>
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="bg-white hover:bg-black hover:text-white border-[3px] border-black px-3 py-1 text-[0.65rem] font-bold uppercase cursor-pointer"
            >
              {isDarkMode ? 'LIGHT_MODE' : 'DARK_MODE'}
            </button>
            <button
              onClick={() => setScanlineEnabled(!scanlineEnabled)}
              className="bg-white hover:bg-[#FF2D00] hover:text-white border-[3px] border-black px-3 py-1 text-[0.65rem] font-bold uppercase cursor-pointer"
            >
              SCANLINE: {scanlineEnabled ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleOpenAuthModal}
            className="bg-black text-[#FFE600] hover:bg-white hover:text-black border-[3px] border-black px-3 py-2 text-xs font-black uppercase cursor-pointer transition-colors active:translate-y-1"
          >
            [⚙ AI_KERNEL_SETTINGS]
          </button>
          <button
            onClick={handleResetCurrentKey}
            className="bg-white hover:bg-[#FF2D00] hover:text-white text-black border-[3px] border-black px-3 py-2 text-xs font-bold uppercase cursor-pointer transition-colors active:translate-y-1"
          >
            [RESET_KEY]
          </button>
          <div className="hidden xl:block bg-[#0047FF] text-white border-[3px] border-black px-3 py-2 text-xs font-bold uppercase">
            ACTIVE: {provider}
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="grid grid-cols-2 md:grid-cols-5 bg-black gap-[3px] border-black border-b-[3px] relative z-10">
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
        <NavTab
          active={activeMode === 'DEBATE'}
          onClick={() => setActiveMode('DEBATE')}
          label="DEBATE_MODE"
        />
      </nav>

      {activeMode === 'DEBATE' ? (
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
                onClick={() => handleInitiateDebate(debateTopic, false)}
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
                      onClick={() => handleInitiateDebate(round.verdict, true)}
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
      ) : (
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
                <select
                  value={outputLang}
                  onChange={(e) => setOutputLang(e.target.value)}
                  className="border-[3px] border-black p-1 bg-white text-[0.65rem] font-bold uppercase focus:outline-none cursor-pointer"
                >
                  {['English', 'Spanish', 'French', 'German', 'Hindi', 'Arabic', 'Japanese'].map(l => (
                    <option key={l} value={l}>{l}</option>
                  ))}
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
              <button
                onClick={() => setComplexityMode(complexityMode === 'EXPERT' ? 'ELI5' : 'EXPERT')}
                className={`border-[3px] border-black p-2 font-black text-[0.7rem] uppercase transition-colors active:translate-y-1 ${complexityMode === 'ELI5' ? 'bg-[#FFE600] text-black' : 'bg-[#0047FF] text-white'}`}
              >
                [{complexityMode}_MODE]
              </button>
              <button onClick={haltTTS} className="border-[3px] border-black p-2 bg-black text-[#FFE600] font-bold text-[0.7rem] uppercase active:translate-y-1">
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
                <span>{provider}_OUTPUT_STREAM // {activeModelDisplay}</span>
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
                    <span className="text-xs uppercase">_ANALYSIS_IN_PROGRESS VIA {provider}</span>
                  </div>
                )}

                {[...messages].reverse().map((m, reverseIdx) => {
                  const i = messages.length - 1 - reverseIdx;
                  return (
                    <div key={m.id} className="flex flex-col gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-xs uppercase">{m.role === 'user' ? '>_USER' : `>_${provider}_KERNEL`}</span>
                        {m.role === 'model' && m.complexityMode && (
                          <span className={`text-[0.55rem] font-black border border-black px-1 uppercase ${m.complexityMode === 'ELI5' ? 'bg-[#FFE600] text-black' : 'bg-[#0047FF] text-white'}`}>
                            [ACTIVE_MODE: {m.complexityMode}]
                          </span>
                        )}
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
                        <div className="markdown-body text-[0.85rem] leading-[1.4] whitespace-pre-wrap font-mono relative z-10 mt-2">
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
                              <div className={`h-full ${m.metadata.confidence > 80 ? 'bg-green-500' : (m.metadata.confidence > 50 ? 'bg-[#FFE600]' : 'bg-[#FF2D00]')}`} style={{ width: `${m.metadata.confidence}%` }}></div>
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
                            <button
                              onClick={() => m.isFactChecking ? null : verifyFacts(m.id, m.rawText || m.text)}
                              disabled={m.isFactChecking}
                              className={`bg-white text-black border-2 border-black text-[0.6rem] px-2 py-1 font-bold active:translate-y-1 ${m.isFactChecking ? 'text-red-500' : 'hover:bg-[#FFE600]'}`}
                            >
                              {m.isFactChecking ? '[ SCANNING_FACTS... ]' : '[ VERIFY_FACTS ]'}
                            </button>
                          </div>
                        )}
                      </div>
                      <FactCheckReport report={m.factCheckReport} isOpen={m.isFactCheckOpen} onClose={() => closeFactCheck(m.id)} />
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col gap-3 relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    if (messages.length > 0) {
                      const lastMsg = messages[messages.length - 1];
                      const newSubject = lastMsg.text.split(' ').slice(0, 4).join(' ') || 'Saved Trail';
                      setKnowledgeTrail(prev => [{
                        id: Date.now().toString(),
                        subject: newSubject,
                        timestamp: new Date().toLocaleTimeString()
                      }, ...prev].slice(0, 10));
                    }
                  }}
                  className="bg-[#0047FF] hover:bg-black text-white p-3 border-[3px] border-black font-bold text-center text-sm cursor-pointer active:translate-y-1"
                >
                  [+] SAVE_TO_KNOWLEDGE_TRAIL
                </button>

                <div className="flex flex-col gap-0 w-full animate-none">
                  <div className="flex bg-white border-[3px] border-black mb-[2px]">
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
                  {smtpError && <div className="bg-[#FF2D00] text-white border-[3px] border-black p-1 text-[0.6rem] font-bold uppercase text-center animate-pulse mb-2">{smtpError}</div>}

                  {/* SETUP SMTP */}
                  <div className="w-full">
                    <button
                      onClick={() => setShowConfig(!showConfig)}
                      className="bg-black hover:bg-white hover:text-black hover:border-black text-white p-2 border-[3px] border-black font-bold text-[0.7rem] cursor-pointer w-full text-left uppercase transition-colors flex justify-between items-center"
                    >
                      <span>{showConfig ? '[-] COLLAPSE_SMTP_CONFIG' : '[+] CONFIGURE_GMAIL_SMTP'}</span>
                      <span className="text-[0.6rem]">
                        {serverSmtp.configured ? 'ENV_READY ✓' : smtpEmail ? 'LOCAL_SET ✓' : 'NOT_SET ✗'}
                      </span>
                    </button>
                    {showConfig && (
                      <div className="bg-white border-[3px] border-t-0 border-black p-4 flex flex-col gap-3">
                        {serverSmtp.configured && (
                          <div className="bg-green-50 border-[2px] border-green-600 p-2 text-xs text-green-900 font-mono">
                            ✓ Server .env has configured SMTP for: <span className="font-bold">{serverSmtp.user}</span>.
                            <br />
                            (You can dispatch emails directly or override credentials below).
                          </div>
                        )}

                        <div className="flex flex-col gap-1">
                          <label className="text-[0.65rem] font-black uppercase">SENDER_EMAIL:</label>
                          <input
                            type="email"
                            value={smtpEmail}
                            onChange={e => { setSmtpEmail(e.target.value); setSmtpError(''); }}
                            placeholder={serverSmtp.user || "e.g. user@gmail.com"}
                            className="border-[3px] border-black p-2 bg-[#E5E5E5] focus:outline-none focus:bg-[#FFE600] text-xs font-mono"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[0.65rem] font-black uppercase">GMAIL APP PASSWORD:</label>
                          <input
                            type="password"
                            value={smtpAppPassword}
                            onChange={e => { setSmtpAppPassword(e.target.value); setSmtpError(''); }}
                            placeholder="16-character app password (xxxx xxxx xxxx xxxx)"
                            className="border-[3px] border-black p-2 bg-[#E5E5E5] focus:outline-none focus:bg-[#FFE600] text-xs font-mono"
                          />
                          <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" className="text-[0.55rem] font-bold text-gray-500 uppercase mt-1 hover:text-[#0047FF]">
                            USE GMAIL APP PASSWORD — NOT YOUR ACCOUNT PASSWORD → myaccount.google.com/apppasswords
                          </a>
                        </div>

                        <div className="border-[2px] border-[#FF2D00] p-2 bg-gray-50 mt-1">
                          <span className="text-[0.55rem] font-black text-[#FF2D00] uppercase block text-center">
                            [!] YOU CAN ALSO DEFINE GMAIL_USER &amp; GMAIL_APP_PASSWORD DIRECTLY IN YOUR .ENV FILE
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <button onClick={saveSmtpCredentials} className="bg-[#FFE600] text-black border-[3px] border-black px-3 py-2 text-[0.7rem] font-black uppercase hover:bg-black hover:text-[#FFE600] active:translate-y-1 transition-all artistic-shadow cursor-pointer">
                            [SAVE_CREDENTIALS]
                          </button>
                          <button onClick={clearSmtpCredentials} className="bg-[#FF2D00] text-white border-[3px] border-black px-3 py-2 text-[0.7rem] font-black uppercase hover:bg-black hover:text-[#FF2D00] active:translate-y-1 transition-all cursor-pointer">
                            [CLEAR_CREDENTIALS]
                          </button>
                          <div className="ml-auto text-[0.65rem] font-black uppercase mt-2 w-full text-right sm:w-auto sm:mt-0">
                            {(smtpEmail && smtpAppPassword) || serverSmtp.configured ? (
                              <span className="text-green-600">CREDENTIALS: READY ✓</span>
                            ) : (
                              <span className="text-[#FF2D00]">CREDENTIALS: NOT SET ✗</span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function NavTab({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
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

function FactCheckReport({
  report,
  isOpen,
  onClose
}: {
  report?: { claim: string; verdict: 'VERIFIED' | 'UNCERTAIN' | 'DISPUTED'; reason: string }[];
  isOpen?: boolean;
  onClose: () => void;
}) {
  if (!isOpen || !report) return null;

  const verifiedCount = report.filter(r => r.verdict === 'VERIFIED').length;
  const trustScore = report.length > 0 ? Math.round((verifiedCount / report.length) * 100) : 100;

  let scoreLabel = 'MOSTLY_RELIABLE';
  if (trustScore < 50) scoreLabel = 'HIGHLY_UNTASKED';
  else if (trustScore < 80) scoreLabel = 'MIXED_RELIABILITY';

  return (
    <div className="mt-2 border-l-[4px] border-[#FF2D00] pl-3">
      <div className="bg-black text-white font-mono font-bold text-xs uppercase p-2 border-[2px] border-black">
        {'>_FACT_CHECK_REPORT'}
      </div>
      <div className="border-[2px] border-t-0 border-black bg-white p-3 flex flex-col gap-3">
        {report.map((item, idx) => (
          <div key={idx} className="flex flex-col md:flex-row gap-2 border-b-[2px] border-dashed border-gray-300 pb-3 last:border-b-0 last:pb-0">
            <div className="flex-1">
              <span className="font-black text-[0.65rem] block mb-1">CLAIM:</span>
              <div className="font-mono text-xs">{item.claim}</div>
            </div>
            <div className="w-24 shrink-0">
              <span className="font-black text-[0.65rem] block mb-1">VERDICT:</span>
              <div>
                <span className={`border-[2px] border-black text-[0.6rem] px-1 font-black uppercase inline-block ${item.verdict === 'VERIFIED' ? 'bg-[#00FF00]' : item.verdict === 'DISPUTED' ? 'bg-[#FF2D00] text-white' : 'bg-[#FFE600]'}`}>
                  [{item.verdict}]
                </span>
              </div>
            </div>
            <div className="flex-1">
              <span className="font-black text-[0.65rem] block mb-1">REASON:</span>
              <div className="font-mono text-[0.65rem] text-gray-500">{item.reason}</div>
            </div>
          </div>
        ))}

        <div className="mt-2 pt-2 border-t-[2px] border-black flex flex-col gap-1">
          <div className="font-black text-xs uppercase">TRUST_SCORE: {trustScore}% — {scoreLabel}</div>
          <div className="h-3 border-[2px] border-black bg-gray-200">
            <div className={`h-full ${trustScore > 80 ? 'bg-green-500' : (trustScore >= 50 ? 'bg-[#FFE600]' : 'bg-[#FF2D00]')}`} style={{ width: `${trustScore}%` }}></div>
          </div>
        </div>

        <button onClick={onClose} className="mt-2 bg-black text-white px-3 py-2 font-black text-xs border-[2px] border-black hover:bg-white hover:text-black transition-colors cursor-pointer">
          [CLOSE_REPORT]
        </button>
      </div>
    </div>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Mode,
  AIProvider,
  Message,
  WorkflowTask,
  KnowledgeTrailItem,
  DebateRound,
  OllamaStatus,
  ServerSmtpStatus
} from './types';
import { generateAIText, generateAIStream, parseMetadata } from './services/ai';
import { playTTS, haltTTS, startSTT } from './services/audio';
import { Header } from './components/Header';
import { NavTab } from './components/NavTab';
import { AuthModal } from './components/AuthModal';
import { ResearchView } from './components/views/ResearchView';
import { SupportView } from './components/views/SupportView';
import { WorkflowView } from './components/views/WorkflowView';
import { KnowledgeView } from './components/views/KnowledgeView';
import { DebateView } from './components/views/DebateView';


export default function App() {
  // Provider state
  const defaultProvider = ((process.env.DEFAULT_AI_PROVIDER as string) || 'gemini').toUpperCase() as AIProvider;
  const [provider, setProvider] = useState<AIProvider>(
    (localStorage.getItem('AI_PROVIDER') as AIProvider) || defaultProvider || 'GEMINI'
  );

  // API Keys & endpoints
  const [geminiKey, setGeminiKey] = useState<string>(
    localStorage.getItem('GEMINI_API_KEY') || (process.env.GEMINI_API_KEY as string) || ''
  );
  const [groqKey, setGroqKey] = useState<string>(
    localStorage.getItem('GROQ_API_KEY') || (process.env.GROQ_API_KEY as string) || ''
  );
  const [ollamaBaseUrl, setOllamaBaseUrl] = useState<string>(
    localStorage.getItem('OLLAMA_BASE_URL') || (process.env.OLLAMA_BASE_URL as string) || 'http://localhost:11434'
  );

  // Models with automatic migration away from retired gemini-2.5-flash
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
  const [ollamaStatus, setOllamaStatus] = useState<OllamaStatus>({
    online: false,
    models: []
  });
  const [isCheckingOllama, setIsCheckingOllama] = useState(false);

  // Auth gate status
  const hasValidActiveCredentials = useCallback((): boolean => {
    if (provider === 'OLLAMA') return true;
    if (provider === 'GEMINI') return Boolean(geminiKey && geminiKey.trim());
    if (provider === 'GROQ') return Boolean(groqKey && groqKey.trim());
    return false;
  }, [provider, geminiKey, groqKey]);

  const [showAuthPopup, setShowAuthPopup] = useState(!hasValidActiveCredentials());
  const [authTempKey, setAuthTempKey] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  // Server SMTP status
  const [serverSmtp, setServerSmtp] = useState<ServerSmtpStatus>({
    configured: Boolean(process.env.HAS_SMTP_CONFIG),
    user: (process.env.GMAIL_USER as string) || ''
  });

  const [activeMode, setActiveMode] = useState<Mode>('RESEARCH');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [liveSessionActive, setLiveSessionActive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  // Feature states
  const [knowledgeTrail, setKnowledgeTrail] = useState<KnowledgeTrailItem[]>([]);
  const [userPreferences] = useState<string[]>([]);
  const [activeWorkflow, setActiveWorkflow] = useState<WorkflowTask[]>([]);
  const [emailTarget, setEmailTarget] = useState('');
  const [isEmailing, setIsEmailing] = useState(false);

  // UI States
  const [outputLang, setOutputLang] = useState('English');
  const [streamSpeed, setStreamSpeed] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [scanlineEnabled, setScanlineEnabled] = useState(false);
  const [isErrorGlitching, setIsErrorGlitching] = useState(false);
  const [pinnedMessageIds, setPinnedMessageIds] = useState<string[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sessionTime, setSessionTime] = useState(0);
  const [complexityMode, setComplexityMode] = useState<'ELI5' | 'EXPERT'>('EXPERT');

  // AI Debate States
  const [debateTopic, setDebateTopic] = useState('');
  const [debateHistory, setDebateHistory] = useState<DebateRound[]>([]);
  const [isDebating, setIsDebating] = useState(false);

  // SMTP Credentials States
  const [smtpEmail, setSmtpEmail] = useState(localStorage.getItem('SMTP_EMAIL') || '');
  const [smtpAppPassword, setSmtpAppPassword] = useState(localStorage.getItem('SMTP_APP_PASSWORD') || '');
  const [showConfig, setShowConfig] = useState(false);
  const [smtpError, setSmtpError] = useState('');

  const scrollRef = useRef<HTMLDivElement>(null);

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

  // Initial config checks
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

  // Dark mode class toggle
  useEffect(() => {
    if (isDarkMode) document.body.classList.add('dark-mode');
    else document.body.classList.remove('dark-mode');
  }, [isDarkMode]);

  // Session stopwatch
  useEffect(() => {
    const inv = setInterval(() => setSessionTime(s => s + 1), 1000);
    return () => clearInterval(inv);
  }, []);

  // Persist chat history
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('chat_history', JSON.stringify(messages));
    }
  }, [messages]);

  // Scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [messages, isTyping]);

  // Typewriter streaming effect when speed > 0
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
              return {
                ...msg,
                text: updatedText,
                metadata: updatedText.length >= pText.length && pMeta ? pMeta : msg.metadata
              };
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

  const triggerError = () => {
    setIsErrorGlitching(true);
    setTimeout(() => setIsErrorGlitching(false), 2000);
  };

  const handleSelectProvider = (newProvider: AIProvider) => {
    setProvider(newProvider);
    localStorage.setItem('AI_PROVIDER', newProvider);
    setAuthError(null);

    if (newProvider === 'GEMINI') setAuthTempKey(geminiKey);
    else if (newProvider === 'GROQ') setAuthTempKey(groqKey);
    else setAuthTempKey('');
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
    const m = Math.floor(sec / 60)
      .toString()
      .padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
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
    setPinnedMessageIds(prev => (prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]));
  };

  const toggleTask = (id: string) => {
    setActiveWorkflow(prev => prev.map(t => (t.id === id ? { ...t, completed: !t.completed } : t)));
  };

  const verifyFacts = async (msgId: string, fullText: string) => {
    setMessages(prev => prev.map(m => (m.id === msgId ? { ...m, isFactChecking: true, isFactCheckOpen: true } : m)));

    try {
      const sysPrompt =
        "You are a rigorous fact-checking engine. Analyze the following AI-generated response thoroughly. For every factual claim, classify it as: VERIFIED (well established fact), UNCERTAIN (plausible but unconfirmed), or DISPUTED (contradicts known evidence). Return ONLY a flat JSON array of objects with keys: 'claim' (the extracted claim), 'verdict' (VERIFIED / UNCERTAIN / DISPUTED), and 'reason' (one sentence explanation). Do NOT wrap in markdown or extra prose.";
      const rawRes = await generateAIText({
        provider,
        geminiKey,
        geminiModel,
        groqKey,
        groqModel,
        ollamaModel,
        ollamaBaseUrl,
        systemPrompt: sysPrompt,
        userPrompt: fullText,
        jsonMode: true,
        onGeminiModelFallback: (fallback) => {
          setGeminiModel(fallback);
          localStorage.setItem('GEMINI_MODEL', fallback);
        }
      });

      let parsed: any[] = [];
      try {
        let clean = rawRes.trim();
        if (clean.startsWith('```json')) clean = clean.slice(7, -3).trim();
        if (clean.startsWith('```')) clean = clean.slice(3, -3).trim();
        parsed = JSON.parse(clean);
      } catch (e) {
        console.error('Fact checker parsing failed', e);
      }

      setMessages(prev =>
        prev.map(m =>
          m.id === msgId
            ? { ...m, isFactChecking: false, factCheckReport: Array.isArray(parsed) ? parsed : [] }
            : m
        )
      );
    } catch (e: any) {
      console.error(e);
      setMessages(prev => prev.map(m => (m.id === msgId ? { ...m, isFactChecking: false } : m)));
      alert(`FACT_CHECK_ERROR: ${e.message}`);
    }
  };

  const closeFactCheck = (msgId: string) => {
    setMessages(prev => prev.map(m => (m.id === msgId ? { ...m, isFactCheckOpen: false } : m)));
  };

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

    const modelMsgIndex = messages.length + 1;
    const modelMsgId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, { id: modelMsgId, role: 'model', text: '', rawText: '', complexityMode }]);

    try {
      let fullRawText = '';

      let systemPrompt = `You are a helpful AI assistant. Respond strictly in ${outputLang}. Respond in clean, complete, well-formed sentences. DO NOT use markdown formatting like **, ##, or bullet points. Output plain text only.\nAT THE VERY END OF YOUR RESPONSE, YOU MUST APPEND EXACTLY THIS METADATA BLOCK:\n--META--\nTONE: [one word describing tone]\nTAGS: #tag1 #tag2 #tag3\nSUGGESTIONS: [Follow up 1] | [Follow up 2] | [Follow up 3]\nCONFIDENCE: [0-100]`;

      if (activeMode === 'RESEARCH') {
        systemPrompt = `Act as a Research Assistant. Provide a structured summary with key points and source suggestions. Respond strictly in ${outputLang}. Respond in clean, complete, well-formed sentences. Avoid markdown formatting like ** or ##.\nAT THE VERY END OF YOUR RESPONSE, YOU MUST APPEND EXACTLY THIS METADATA BLOCK:\n--META--\nTONE: [one word]\nTAGS: #tag1 #tag2 #tag3\nSUGGESTIONS: [Follow up 1] | [Follow up 2] | [Follow up 3]\nCONFIDENCE: [0-100]`;
      } else if (activeMode === 'SUPPORT') {
        systemPrompt = `You are an Intelligent Customer Support Chatbot. Handle queries professionally, escalate when needed, and maintain context. Respond strictly in ${outputLang}. Respond in clean, complete sentences without markdown formatting.\nAT THE VERY END OF YOUR RESPONSE, YOU MUST APPEND EXACTLY THIS METADATA BLOCK:\n--META--\nTONE: [one word]\nTAGS: #tag1 #tag2 #tag3\nSUGGESTIONS: [Follow up 1] | [Follow up 2] | [Follow up 3]\nCONFIDENCE: [0-100]`;
      } else if (activeMode === 'WORKFLOW') {
        systemPrompt = `Break this task/workflow into actionable steps. FORMAT YOUR RESPONSE AS A JSON ARRAY OF OBJECTS with fields: id, label, priority (HIGH/MEDIUM/LOW). Also include a clear text explanation before the JSON, without markdown formatting. Respond strictly in ${outputLang}.\nAT THE VERY END OF YOUR RESPONSE, YOU MUST APPEND EXACTLY THIS METADATA BLOCK:\n--META--\nTONE: [one word]\nTAGS: #tag1 #tag2 #tag3\nSUGGESTIONS: [Follow up 1] | [Follow up 2] | [Follow up 3]\nCONFIDENCE: [0-100]`;
      } else if (activeMode === 'KNOWLEDGE') {
        const context = `User Preferences: ${userPreferences.join(', ')}. Knowledge Trail: ${knowledgeTrail
          .map(k => k.subject)
          .join(' -> ')}.`;
        systemPrompt = `${context}\n\nAct as a Personal Knowledge Companion. Explore topics, suggest related areas, and detect any new user preferences. Respond strictly in ${outputLang}. Respond in clean, complete, well-formed sentences. Avoid markdown formatting.\nAT THE VERY END OF YOUR RESPONSE, YOU MUST APPEND EXACTLY THIS METADATA BLOCK:\n--META--\nTONE: [one word]\nTAGS: #tag1 #tag2 #tag3\nSUGGESTIONS: [Follow up 1] | [Follow up 2] | [Follow up 3]\nCONFIDENCE: [0-100]`;
      }

      if (complexityMode === 'ELI5') {
        systemPrompt += `\n>> INSTRUCTION: Explain everything as if talking to a 5-year-old using simple words, fun analogies, and zero jargon.`;
      } else {
        systemPrompt += `\n>> INSTRUCTION: Respond at a PhD/research level using high-level technical terminology, citation style, and deep analytical reasoning.`;
      }

      await generateAIStream({
        provider,
        geminiKey,
        geminiModel,
        groqKey,
        groqModel,
        ollamaModel,
        ollamaBaseUrl,
        systemPrompt,
        commandStr,
        messages,
        onChunk: (chunk) => {
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
        },
        onGeminiModelFallback: (fallback) => {
          setGeminiModel(fallback);
          localStorage.setItem('GEMINI_MODEL', fallback);
        }
      });

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
      const textA = await generateAIText({
        provider,
        geminiKey,
        geminiModel,
        groqKey,
        groqModel,
        ollamaModel,
        ollamaBaseUrl,
        systemPrompt:
          'You are AGENT_A. Argue strictly FOR the following topic using strong, assertive logic. Keep it to one solid paragraph. DO NOT USE MARKDOWN.',
        userPrompt: roundTopic,
        onGeminiModelFallback: (fallback) => {
          setGeminiModel(fallback);
          localStorage.setItem('GEMINI_MODEL', fallback);
        }
      });

      const textB = await generateAIText({
        provider,
        geminiKey,
        geminiModel,
        groqKey,
        groqModel,
        ollamaModel,
        ollamaBaseUrl,
        systemPrompt: `You are AGENT_B. Argue strictly AGAINST the topic. You must directly rebut AGENT_A's argument provided below. Keep it to one solid paragraph. DO NOT USE MARKDOWN.\nAGENT_A CONTEXT: ${textA}`,
        userPrompt: roundTopic,
        onGeminiModelFallback: (fallback) => {
          setGeminiModel(fallback);
          localStorage.setItem('GEMINI_MODEL', fallback);
        }
      });

      const textV = await generateAIText({
        provider,
        geminiKey,
        geminiModel,
        groqKey,
        groqModel,
        ollamaModel,
        ollamaBaseUrl,
        systemPrompt: `You are the JUDGE. Below is a debate on the topic: "${roundTopic}".\nAGENT_A (PRO):\n${textA}\n\nAGENT_B (CON):\n${textB}\n\nDeclare which argument was stronger and explicitly state why in one paragraph. DO NOT USE MARKDOWN.`,
        userPrompt: 'Who won and why?',
        onGeminiModelFallback: (fallback) => {
          setGeminiModel(fallback);
          localStorage.setItem('GEMINI_MODEL', fallback);
        }
      });

      setDebateHistory(prev => [...prev, { agentA: textA, agentB: textB, verdict: textV }]);
    } catch (err: any) {
      console.error(err);
      triggerError();
      alert(`DEBATE ENGINE ERROR [${provider}]: ${err.message}`);
    } finally {
      setIsDebating(false);
    }
  };

  const handleVoiceInput = () => {
    startSTT({
      outputLang,
      groqKey,
      onListening: () => {
        setIsRecording(true);
        setMessages(prev => [
          ...prev,
          {
            id: Date.now().toString(),
            role: 'model',
            text: '[AUDIO LISTENING TRIGGERED - SPEAK CLEARLY...]',
            rawText: '[AUDIO LISTENING TRIGGERED - SPEAK CLEARLY...]'
          }
        ]);
      },
      onDecoded: (text) => {
        setMessages(prev => {
          const arr = [...prev];
          arr.pop();
          return [
            ...arr,
            {
              id: Date.now().toString(),
              role: 'model',
              text: `>> VOCAL_INPUT_DECODED: "${text}"`,
              rawText: `>> VOCAL_INPUT_DECODED: "${text}"`
            }
          ];
        });
        setInput(text);
      },
      onError: (errText) => {
        triggerError();
        setMessages(prev => [
          ...prev.slice(0, -1),
          {
            id: Date.now().toString(),
            role: 'model',
            text: `>> VOCAL_INPUT_HALTED: ${errText}`,
            rawText: `>> VOCAL_INPUT_HALTED: ${errText}`
          }
        ]);
      },
      onEnd: () => {
        setIsRecording(false);
      }
    });
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
    setMessages(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        role: 'model',
        text: `>> GENERATING EMAIL PAYLOAD WITH ${provider} KERNEL...`,
        rawText: `>> GENERATING EMAIL PAYLOAD WITH ${provider} KERNEL...`
      }
    ]);

    try {
      const chatHistoryText = messages.map(m => `${m.role.toUpperCase()}: ${m.rawText || m.text}`).join('\n');
      const sysPrompt = `You are NEXT-GEN AI SYSTEM compiling a session export email.
Write a structured HTML email summarizing this session.
Use brutalist inline CSS styling for the HTML (black thick borders, high-contrast yellow/blue accents, monospace font). Format strictly as JSON { "subject": "...", "html": "..." } with no other text.`;

      const rawEmail = await generateAIText({
        provider,
        geminiKey,
        geminiModel,
        groqKey,
        groqModel,
        ollamaModel,
        ollamaBaseUrl,
        systemPrompt: sysPrompt,
        userPrompt: `Session Data:\n${chatHistoryText}`,
        jsonMode: true,
        onGeminiModelFallback: (fallback) => {
          setGeminiModel(fallback);
          localStorage.setItem('GEMINI_MODEL', fallback);
        }
      });

      const emailJson = JSON.parse(
        rawEmail.match(/\{[\s\S]*\}/)?.[0] || '{"subject":"SYS_OUT","html":"<h1>Session</h1>"}'
      );

      setMessages(prev => {
        const n = [...prev];
        n.pop();
        return [
          ...n,
          {
            id: Date.now().toString(),
            role: 'model',
            text: '>> INITIATING_GMAIL_UPLINK...',
            rawText: '>> INITIATING_GMAIL_UPLINK...'
          }
        ];
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
          return [
            ...n,
            {
              id: Date.now().toString(),
              role: 'model',
              text: succText,
              rawText: succText
            }
          ];
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
        return [
          ...n,
          {
            id: Date.now().toString(),
            role: 'model',
            text: errText,
            rawText: errText
          }
        ];
      });
    } finally {
      setIsEmailing(false);
    }
  };

  const activeModelDisplay = provider === 'GEMINI' ? geminiModel : provider === 'GROQ' ? groqModel : ollamaModel;

  return (
    <div className={`flex flex-col min-h-[calc(100vh-12px)] ${isErrorGlitching ? 'glitch' : ''}`}>
      {scanlineEnabled && <div className="scanlines"></div>}

      <AuthModal
        isOpen={showAuthPopup}
        provider={provider}
        geminiKey={geminiKey}
        groqKey={groqKey}
        geminiModel={geminiModel}
        groqModel={groqModel}
        ollamaModel={ollamaModel}
        ollamaBaseUrl={ollamaBaseUrl}
        ollamaStatus={ollamaStatus}
        isCheckingOllama={isCheckingOllama}
        authTempKey={authTempKey}
        authError={authError}
        hasValidActiveCredentials={hasValidActiveCredentials()}
        onSelectProvider={handleSelectProvider}
        onChangeAuthTempKey={setAuthTempKey}
        onChangeGeminiModel={(m) => {
          setGeminiModel(m);
          localStorage.setItem('GEMINI_MODEL', m);
        }}
        onChangeGroqModel={(m) => {
          setGroqModel(m);
          localStorage.setItem('GROQ_MODEL', m);
        }}
        onChangeOllamaModel={(m) => {
          setOllamaModel(m);
          localStorage.setItem('OLLAMA_MODEL', m);
        }}
        onChangeOllamaBaseUrl={(u) => {
          setOllamaBaseUrl(u);
          localStorage.setItem('OLLAMA_BASE_URL', u);
        }}
        onCheckOllamaStatus={checkOllamaStatus}
        onSubmit={handleAuthSubmit}
        onClose={() => setShowAuthPopup(false)}
      />

      <Header
        provider={provider}
        activeModelDisplay={activeModelDisplay}
        sessionTime={sessionTime}
        formatTime={formatTime}
        tokenCount={getTokenCount()}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        scanlineEnabled={scanlineEnabled}
        setScanlineEnabled={setScanlineEnabled}
        onOpenSettings={handleOpenAuthModal}
        onResetKey={handleResetCurrentKey}
      />

      {/* Navigation Tabs with Mode-Specific Branding */}
      <nav className="grid grid-cols-2 md:grid-cols-5 bg-black gap-[3px] border-black border-b-[3px] relative z-10">
        <NavTab
          mode="RESEARCH"
          active={activeMode === 'RESEARCH'}
          onClick={() => setActiveMode('RESEARCH')}
          label="RESEARCH_ASSISTANT"
        />
        <NavTab
          mode="SUPPORT"
          active={activeMode === 'SUPPORT'}
          onClick={() => setActiveMode('SUPPORT')}
          label="SUPPORT_BOT"
        />
        <NavTab
          mode="WORKFLOW"
          active={activeMode === 'WORKFLOW'}
          onClick={() => setActiveMode('WORKFLOW')}
          label="WORKFLOW_AUTO"
        />
        <NavTab
          mode="KNOWLEDGE"
          active={activeMode === 'KNOWLEDGE'}
          onClick={() => setActiveMode('KNOWLEDGE')}
          label="KNOWLEDGE_COMPANION"
        />
        <NavTab
          mode="DEBATE"
          active={activeMode === 'DEBATE'}
          onClick={() => setActiveMode('DEBATE')}
          label="DEBATE_MODE"
        />
      </nav>

      {/* Mode-Specific Thematic Views */}
      {activeMode === 'RESEARCH' && (
        <ResearchView
          provider={provider}
          activeModelDisplay={activeModelDisplay}
          messages={messages}
          isTyping={isTyping}
          scrollRef={scrollRef}
          onSendMessage={(q) => sendCommand(q)}
          playTTS={playTTS}
          copyMessage={copyMessage}
          copiedId={copiedId}
          togglePin={togglePin}
          pinnedMessageIds={pinnedMessageIds}
          verifyFacts={verifyFacts}
          closeFactCheck={closeFactCheck}
          input={input}
          setInput={setInput}
          outputLang={outputLang}
          setOutputLang={setOutputLang}
          streamSpeed={streamSpeed}
          setStreamSpeed={setStreamSpeed}
          exportSession={exportSession}
          loadHistory={loadHistory}
          startSTT={handleVoiceInput}
          isRecording={isRecording}
          complexityMode={complexityMode}
          setComplexityMode={setComplexityMode}
          haltTTS={haltTTS}
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
      )}

      {activeMode === 'SUPPORT' && (
        <SupportView
          provider={provider}
          activeModelDisplay={activeModelDisplay}
          messages={messages}
          isTyping={isTyping}
          scrollRef={scrollRef}
          onSendMessage={(q) => sendCommand(q)}
          playTTS={playTTS}
          copyMessage={copyMessage}
          copiedId={copiedId}
          togglePin={togglePin}
          pinnedMessageIds={pinnedMessageIds}
          verifyFacts={verifyFacts}
          closeFactCheck={closeFactCheck}
          input={input}
          setInput={setInput}
          outputLang={outputLang}
          setOutputLang={setOutputLang}
          streamSpeed={streamSpeed}
          setStreamSpeed={setStreamSpeed}
          exportSession={exportSession}
          loadHistory={loadHistory}
          startSTT={handleVoiceInput}
          isRecording={isRecording}
          complexityMode={complexityMode}
          setComplexityMode={setComplexityMode}
          haltTTS={haltTTS}
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
      )}

      {activeMode === 'WORKFLOW' && (
        <WorkflowView
          provider={provider}
          activeModelDisplay={activeModelDisplay}
          messages={messages}
          isTyping={isTyping}
          scrollRef={scrollRef}
          onSendMessage={(q) => sendCommand(q)}
          playTTS={playTTS}
          copyMessage={copyMessage}
          copiedId={copiedId}
          togglePin={togglePin}
          pinnedMessageIds={pinnedMessageIds}
          verifyFacts={verifyFacts}
          closeFactCheck={closeFactCheck}
          input={input}
          setInput={setInput}
          outputLang={outputLang}
          setOutputLang={setOutputLang}
          streamSpeed={streamSpeed}
          setStreamSpeed={setStreamSpeed}
          exportSession={exportSession}
          loadHistory={loadHistory}
          startSTT={handleVoiceInput}
          isRecording={isRecording}
          complexityMode={complexityMode}
          setComplexityMode={setComplexityMode}
          haltTTS={haltTTS}
          activeWorkflow={activeWorkflow}
          setActiveWorkflow={setActiveWorkflow}
          toggleTask={toggleTask}
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
      )}

      {activeMode === 'KNOWLEDGE' && (
        <KnowledgeView
          provider={provider}
          activeModelDisplay={activeModelDisplay}
          messages={messages}
          isTyping={isTyping}
          scrollRef={scrollRef}
          onSendMessage={(q) => sendCommand(q)}
          playTTS={playTTS}
          copyMessage={copyMessage}
          copiedId={copiedId}
          togglePin={togglePin}
          pinnedMessageIds={pinnedMessageIds}
          verifyFacts={verifyFacts}
          closeFactCheck={closeFactCheck}
          input={input}
          setInput={setInput}
          outputLang={outputLang}
          setOutputLang={setOutputLang}
          streamSpeed={streamSpeed}
          setStreamSpeed={setStreamSpeed}
          exportSession={exportSession}
          loadHistory={loadHistory}
          startSTT={handleVoiceInput}
          isRecording={isRecording}
          complexityMode={complexityMode}
          setComplexityMode={setComplexityMode}
          haltTTS={haltTTS}
          knowledgeTrail={knowledgeTrail}
          setKnowledgeTrail={setKnowledgeTrail}
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
      )}

      {activeMode === 'DEBATE' && (
        <DebateView
          debateTopic={debateTopic}
          setDebateTopic={setDebateTopic}
          isDebating={isDebating}
          debateHistory={debateHistory}
          onInitiateDebate={handleInitiateDebate}
          provider={provider}
        />
      )}
    </div>
  );
}

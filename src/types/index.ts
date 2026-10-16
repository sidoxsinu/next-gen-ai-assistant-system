/**
 * Shared Type Definitions for Next-Gen AI Assistant System
 */

export type Mode = 'RESEARCH' | 'SUPPORT' | 'WORKFLOW' | 'KNOWLEDGE' | 'DEBATE';

export type AIProvider = 'GEMINI' | 'GROQ' | 'OLLAMA';

export interface FactCheckItem {
  claim: string;
  verdict: 'VERIFIED' | 'UNCERTAIN' | 'DISPUTED';
  reason: string;
}

export interface MessageMetadata {
  tone?: string;
  tags?: string[];
  suggestions?: string[];
  confidence?: number;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  rawText: string;
  text: string;
  type?: 'text' | 'image' | 'audio' | 'thinking' | 'workflow';
  data?: any;
  metadata?: MessageMetadata;
  complexityMode?: 'ELI5' | 'EXPERT';
  factCheckReport?: FactCheckItem[];
  isFactChecking?: boolean;
  isFactCheckOpen?: boolean;
}

export interface WorkflowTask {
  id: string;
  label: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  completed: boolean;
}

export interface KnowledgeTrailItem {
  id: string;
  subject: string;
  timestamp: string;
}

export interface DebateRound {
  agentA: string;
  agentB: string;
  verdict: string;
}

export interface OllamaStatus {
  online: boolean;
  models: string[];
}

export interface ServerSmtpStatus {
  configured: boolean;
  user: string;
}

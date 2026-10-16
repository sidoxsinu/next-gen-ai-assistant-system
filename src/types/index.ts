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
  stage?: 'STAGED' | 'IN_PROGRESS' | 'DONE';
  description?: string;
}

export type CitationStyle = 'APA-7' | 'IEEE' | 'MLA-9' | 'CHICAGO' | 'NATURE';

export type ResearchDepth =
  | 'QUICK_ABSTRACT'
  | 'DEEP_LITERATURE_REVIEW'
  | 'METHODOLOGY_DECONSTRUCT'
  | 'EMPIRICAL_SYNTHESIS';

export interface ResearchFinding {
  id: string;
  claim: string;
  confidence: number;
  sourceNote?: string;
}

export interface SupportTicket {
  id: string;
  severity: 'P1 - CRITICAL' | 'P2 - HIGH' | 'P3 - MEDIUM';
  customerName: string;
  accountTier: string;
  slaSecondsRemaining: number;
  sentiment: 'NEUTRAL' | 'FRUSTRATED' | 'SATISFIED';
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  category: string;
  mastered?: boolean;
}

export interface KnowledgeTrailItem {
  id: string;
  subject: string;
  timestamp: string;
  tags?: string[];
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


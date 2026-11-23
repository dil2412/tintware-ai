export type ScriptGenerationMode = 'rewrite' | 'smart_edit';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  taskPrompt?: string;
  codeSnippet?: string;
  timestamp: number;
  patchedScript?: string;
  appliedPatchesCount?: number;
  patchSummary?: string[];
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
  inputDraft?: string;
}

export interface QuickPrompt {
  id: string;
  label: string;
  iconName: string;
  instruction: string;
  sampleCode?: string;
}

export interface EditorStats {
  characters: number;
  lines: number;
  tokensEstimate: number;
}

export type AIPlatform = 'gemini' | 'chatgpt' | 'claude';

export interface ModelOption {
  id: string;
  name: string;
  platform: AIPlatform;
  tag: string;
  description: string;
  isPro?: boolean;
  recommended?: boolean;
}

export interface AppSettings {
  platform: AIPlatform;
  selectedModel: string;
  highSpeedMode: boolean;
  generationMode: ScriptGenerationMode;
}

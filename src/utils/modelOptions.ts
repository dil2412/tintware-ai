import { ModelOption, AIPlatform } from '../types';

export const PLATFORMS: { id: AIPlatform; name: string; icon: string; description: string }[] = [
  {
    id: 'gemini',
    name: 'Google Gemini',
    icon: 'Sparkles',
    description: 'Active cloud pipeline with unlimited context and Pro reasoning.',
  },
  {
    id: 'chatgpt',
    name: 'ChatGPT / OpenAI',
    icon: 'Cpu',
    description: 'GPT-4o & o-series models for Luau development.',
  },
  {
    id: 'claude',
    name: 'Anthropic Claude',
    icon: 'Layers',
    description: 'Claude 3.7 & 3.5 Sonnet engines for architectural precision.',
  },
];

export const AVAILABLE_MODELS: ModelOption[] = [
  // Gemini Models (Premier Flagship Engines)
  {
    id: 'gemini-3.7-flash',
    name: 'Gemini 3.7 Flash (Premier Engine)',
    platform: 'gemini',
    tag: 'Best & Fastest',
    description: 'Premier Gemini model for Roblox Luau. Ultra-fast streaming, massive 65k token output, and rock-solid uptime.',
    recommended: true,
  },
  {
    id: 'gemini-flash-latest',
    name: 'Gemini Flash Latest (High Capacity)',
    platform: 'gemini',
    tag: 'High Capacity',
    description: 'Latest high-capacity Flash engine for large multi-hundred line Luau codebases.',
  },
  {
    id: 'gemini-3.5-flash',
    name: 'Gemini 3.5 Flash',
    platform: 'gemini',
    tag: 'Balanced',
    description: 'Reliable Gemini coding engine with auto-failover and zero truncation.',
  },
  {
    id: 'gemini-3.8-flash',
    name: 'Gemini 3.8 Flash',
    platform: 'gemini',
    tag: 'Fast',
    description: 'High-throughput Flash model for multi-function Luau scripts.',
  },
  {
    id: 'gemini-3.1-pro-preview',
    name: 'Gemini 3.1 Pro (Deep Reasoning)',
    platform: 'gemini',
    tag: 'Pro Thinker',
    description: 'Google’s deep reasoning engine for complex mathematical architectures and CFrames.',
    isPro: true,
  },

  // ChatGPT Models
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    platform: 'chatgpt',
    tag: 'Flagship',
    description: 'OpenAI’s premier flagship coding model. Highly versatile for client-server mechanics.',
    isPro: true,
  },
  {
    id: 'o3-mini',
    name: 'OpenAI o3-mini',
    platform: 'chatgpt',
    tag: 'Reasoning',
    description: 'OpenAI STEM and code reasoning model for algorithms and complex game state logic.',
    isPro: true,
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    platform: 'chatgpt',
    tag: 'Fast',
    description: 'Lightweight, rapid-fire Luau script generation with instant response times.',
  },
  {
    id: 'o1',
    name: 'OpenAI o1',
    platform: 'chatgpt',
    tag: 'Deep Think',
    description: 'Deep chain-of-thought model for architecting entire multi-script systems.',
    isPro: true,
  },

  // Claude Models
  {
    id: 'claude-3-7-sonnet',
    name: 'Claude 3.7 Sonnet',
    platform: 'claude',
    tag: 'Latest Hybrid',
    description: 'Anthropic’s latest flagship model with hybrid reasoning for intricate Luau codebases.',
    isPro: true,
  },
  {
    id: 'claude-3-5-sonnet',
    name: 'Claude 3.5 Sonnet',
    platform: 'claude',
    tag: 'Industry Gold',
    description: 'World-class code synthesis, refactoring, and bug detection without hallucination.',
    isPro: true,
  },
  {
    id: 'claude-3-5-haiku',
    name: 'Claude 3.5 Haiku',
    platform: 'claude',
    tag: 'Fast',
    description: 'Near-instant responses for quick fixes, UI tweens, and single functions.',
  },
];

export const DEFAULT_SETTINGS = {
  platform: 'gemini' as AIPlatform,
  selectedModel: 'gemini-3.7-flash',
  highSpeedMode: true,
  generationMode: 'smart_edit' as const, // Smart in-place edit default to support 7k+ line scripts effortlessly
};

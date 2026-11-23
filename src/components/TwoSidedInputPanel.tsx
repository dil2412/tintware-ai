import { useRef } from 'react';
import {
  Send,
  Square,
  Trash2,
  Upload,
  Code2,
  Layers,
  Edit3,
  RefreshCw,
} from 'lucide-react';
import {
  countLines,
  estimateTokens,
  isLuaCode,
} from '../utils/codeParser';
import { ScriptGenerationMode } from '../types';

interface TwoSidedInputPanelProps {
  input: string;
  setInput: (val: string) => void;
  onSubmit: () => void;
  isStreaming: boolean;
  onStop: () => void;
  textareaRef?: React.RefObject<HTMLTextAreaElement | null>;
  hasHistory: boolean;
  turnCount: number;
  generationMode?: ScriptGenerationMode;
  onToggleGenerationMode?: (mode: ScriptGenerationMode) => void;
}

export function TwoSidedInputPanel({
  input,
  setInput,
  onSubmit,
  isStreaming,
  onStop,
  textareaRef,
  hasHistory,
  turnCount,
  generationMode = 'smart_edit',
  onToggleGenerationMode,
}: TwoSidedInputPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const localRef = useRef<HTMLTextAreaElement | null>(null);
  const actualRef = textareaRef || localRef;

  const lines = countLines(input);
  const chars = input.length;
  const tokensEst = estimateTokens(input);

  const hasLua = isLuaCode(input);

  // Handle Ctrl+Enter / Cmd+Enter to send, plain Enter inserts a newline
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      if (!isStreaming && input.trim()) {
        onSubmit();
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        if (input.trim()) {
          setInput(`${input}\n\n${content}`);
        } else {
          setInput(content);
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);

  return (
    <div
      id="input-side-workspace"
      className="flex flex-col h-full bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-sm min-h-0"
    >
      {/* Top Header with Detection Badge */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-neutral-950/80 border-b border-neutral-800 shrink-0 text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1 rounded bg-neutral-800 text-cyan-400 border border-neutral-700/60 shrink-0">
            <Code2 className="w-3.5 h-3.5" />
          </div>
          <span className="font-semibold text-neutral-200 tracking-wide uppercase text-xs shrink-0">
            Input
          </span>

          {/* Mode Selector Toggle: Smart Edit vs Full Rewrite */}
          <div className="flex items-center gap-1 bg-neutral-900 border border-neutral-750 p-0.5 rounded-lg text-[11px] ml-1">
            <button
              type="button"
              onClick={() => onToggleGenerationMode?.('smart_edit')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                generationMode === 'smart_edit'
                  ? 'bg-cyan-500 text-neutral-950 font-bold shadow-xs'
                  : 'text-neutral-400 hover:text-neutral-200 font-medium'
              }`}
              title="Smart Edit: Surgically updates only the targeted function or lines, preserving 100% of your existing script without removing any code."
            >
              <Edit3 className="w-3 h-3" />
              <span>Smart Edit</span>
            </button>

            <button
              type="button"
              onClick={() => onToggleGenerationMode?.('rewrite')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                generationMode === 'rewrite'
                  ? 'bg-neutral-800 text-neutral-100 font-bold border border-neutral-700'
                  : 'text-neutral-400 hover:text-neutral-200 font-medium'
              }`}
              title="Full Rewrite: Generates the entire script from start to finish with all functions preserved."
            >
              <RefreshCw className="w-3 h-3" />
              <span>Full Rewrite</span>
            </button>
          </div>

          {hasLua && (
            <span
              className="hidden lg:flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-700/80 text-cyan-300 font-mono text-[10px] shadow-xs"
              title="Roblox Lua/Luau code detected"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
              <span>Luau</span>
            </span>
          )}
        </div>

        {/* Real-time stats */}
        <div className="flex items-center gap-2 text-[10px] font-mono text-neutral-400 shrink-0">
          {chars > 0 && (
            <>
              <span className="hidden sm:inline">{lines} lines</span>
              <span className="hidden sm:inline">•</span>
              <span>~{tokensEst.toLocaleString()} tokens</span>
              <span className="text-neutral-600">•</span>
            </>
          )}
          <span className="text-cyan-400 font-medium">∞ Unlimited</span>
        </div>
      </div>

      {/* Main Full-Height Input Textarea */}
      <div className="flex-1 min-h-0 relative p-3 sm:p-4 bg-neutral-950/30 flex flex-col">
        <textarea
          ref={actualRef}
          id="two-sided-unified-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Type any Roblox Lua request or paste your code here...

• Build any system: mechanics, tools, UI, DataStores, animations, math, or physics
• Fix bugs, refactor code, or add new features without losing any existing lines

Press ${isMac ? '⌘' : 'Ctrl'} + Enter to send (Enter adds a new line).
To edit or iterate on the output, simply continue typing in this box.`}
          className="w-full flex-1 min-h-0 bg-transparent text-neutral-100 placeholder-neutral-500/80 font-mono text-xs sm:text-[13px] leading-relaxed resize-none focus:outline-none scrollbar-thin scrollbar-thumb-neutral-800 select-text"
        />
      </div>

      {/* Bottom Action Bar */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-neutral-900 border-t border-neutral-800 shrink-0 text-xs">
        <div className="flex items-center gap-2">
          {/* File Upload Button */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".lua,.luau,.txt"
            className="hidden"
            onChange={handleFileUpload}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-neutral-300 hover:text-cyan-300 text-[11px] font-medium border border-neutral-700/60 transition-all cursor-pointer"
            title="Upload a .lua script file into the input"
          >
            <Upload className="w-3.5 h-3.5 text-neutral-400" />
            <span className="hidden xs:inline">Upload .lua</span>
          </button>

          {/* Clear Button */}
          {input.length > 0 && (
            <button
              type="button"
              onClick={() => setInput('')}
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-red-400 text-[11px] transition-all cursor-pointer"
              title="Clear input"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Clear</span>
            </button>
          )}

          {/* 65k Limit Bypass / Split Pieces Button */}
          <button
            type="button"
            onClick={() => {
              const textToAdd = "\n\n-- Instruction: Output the script in separate numbered pieces (Part 1, Part 2...) to bypass the 65k token limit.";
              if (!input.includes("separate numbered pieces")) {
                setInput(input.trim() ? input + textToAdd : textToAdd.trim());
              }
            }}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-neutral-300 hover:text-cyan-300 text-[11px] font-medium border border-neutral-700/60 transition-all cursor-pointer"
            title="Automatically instruct the AI to output in separate pieces to bypass token limits"
          >
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Split Pieces (65k Bypass)</span>
          </button>

          <span className="text-[11px] text-neutral-500 hidden sm:inline ml-1">
            Enter = new line
          </span>
        </div>

        {/* Right Action: Send Button with Ctrl+Enter badge */}
        <div className="flex items-center gap-2">
          {isStreaming ? (
            <button
              type="button"
              id="btn-stop-generation"
              onClick={onStop}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-950/80 hover:bg-red-900 border border-red-700/80 text-red-200 text-xs font-medium transition-all shadow-sm cursor-pointer active:scale-95"
            >
              <Square className="w-3.5 h-3.5 fill-red-400 text-red-400" />
              <span>Stop</span>
            </button>
          ) : (
            <button
              type="button"
              id="btn-submit-ctrl-enter"
              onClick={() => onSubmit()}
              disabled={!input.trim()}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all shadow-md cursor-pointer active:scale-95 ${
                input.trim()
                  ? 'bg-cyan-500 hover:bg-cyan-400 text-neutral-950 shadow-cyan-500/20'
                  : 'bg-neutral-800 text-neutral-500 cursor-not-allowed border border-neutral-700/50'
              }`}
              title={`Send request (${isMac ? '⌘' : 'Ctrl'} + Enter)`}
            >
              <span>Send</span>
              <span className="px-1.5 py-0.5 rounded bg-black/20 text-[10px] font-mono tracking-tight text-neutral-900 font-bold border border-black/10">
                {isMac ? '⌘ + Enter' : 'Ctrl + Enter'}
              </span>
              <Send className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

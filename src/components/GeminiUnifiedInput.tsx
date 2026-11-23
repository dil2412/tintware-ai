import { useState, useRef, useEffect } from 'react';
import {
  Send,
  Square,
  FileCode,
  Upload,
  Trash2,
  GitMerge,
  Sparkles,
  ChevronDown,
  Layers,
} from 'lucide-react';
import { PRESET_SCRIPTS, PresetScript } from '../utils/luaPresets';
import { countLines, estimateTokens } from '../utils/codeParser';

interface GeminiUnifiedInputProps {
  input: string;
  setInput: (val: string) => void;
  onSubmit: () => void;
  isStreaming: boolean;
  onStop: () => void;
  inputRef?: React.RefObject<HTMLTextAreaElement | null>;
  hasHistory: boolean;
}

export function GeminiUnifiedInput({
  input,
  setInput,
  onSubmit,
  isStreaming,
  onStop,
  inputRef,
  hasHistory,
}: GeminiUnifiedInputProps) {
  const [showPresets, setShowPresets] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const localRef = useRef<HTMLTextAreaElement | null>(null);
  const actualRef = inputRef || localRef;

  const lines = countLines(input);
  const chars = input.length;
  const tokensEst = estimateTokens(input);

  // Auto-resize textarea height based on content (between 80px and 260px)
  useEffect(() => {
    if (actualRef.current) {
      actualRef.current.style.height = 'auto';
      const scrollHeight = actualRef.current.scrollHeight;
      const newHeight = Math.min(Math.max(scrollHeight, 84), 260);
      actualRef.current.style.height = `${newHeight}px`;
    }
  }, [input, actualRef]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isStreaming && input.trim()) {
        onSubmit();
      }
    }
  };

  const handleInsertMergeTemplate = () => {
    const template = `Merge these two Roblox Lua scripts into one complete, fully working unified script. Combine service imports, prevent variable collisions, and wire loops/events together so both systems function seamlessly without breaking either one:\n\n---------------------------------------------------------\n-- SCRIPT 1:\n---------------------------------------------------------\n-- [Paste first script here]\n\n\n---------------------------------------------------------\n-- SCRIPT 2:\n---------------------------------------------------------\n-- [Paste second script here]\n`;
    setInput(template);
    setTimeout(() => {
      if (actualRef.current) {
        actualRef.current.focus();
      }
    }, 50);
  };

  const handleInsertCodeBlock = () => {
    const codeWrapper = input ? `${input}\n\n\`\`\`lua\n-- Paste code here\n\`\`\`\n` : `\`\`\`lua\n-- Paste code here\n\`\`\`\n`;
    setInput(codeWrapper);
    setTimeout(() => {
      if (actualRef.current) {
        actualRef.current.focus();
      }
    }, 50);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const fileHeader = input ? `${input}\n\n-- File: ${file.name}\n\`\`\`lua\n${content}\n\`\`\`` : `Review, fix, and optimize this Roblox script (${file.name}):\n\n\`\`\`lua\n${content}\n\`\`\``;
        setInput(fileHeader);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleSelectPreset = (preset: PresetScript) => {
    const combined = `${preset.prompt}\n\n\`\`\`lua\n${preset.code}\n\`\`\``;
    setInput(combined);
    setShowPresets(false);
    setTimeout(() => {
      if (actualRef.current) {
        actualRef.current.focus();
      }
    }, 50);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-3 sm:px-4 pb-3 sm:pb-4 pt-1 shrink-0">
      <div className="bg-neutral-900/90 rounded-2xl border border-neutral-800 shadow-xl focus-within:border-cyan-500/80 focus-within:ring-2 focus-within:ring-cyan-500/20 transition-all overflow-hidden backdrop-blur-md">
        
        {/* Top Helper Toolbar */}
        <div className="flex items-center justify-between px-3 py-2 bg-neutral-950/60 border-b border-neutral-800/80 text-xs">
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Merge 2 Scripts Button */}
            <button
              type="button"
              onClick={handleInsertMergeTemplate}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-950/40 hover:bg-cyan-900/50 text-cyan-300 border border-cyan-800/60 font-medium text-[11px] transition-all cursor-pointer active:scale-95"
              title="Insert a template to combine two scripts together without breaking them"
            >
              <GitMerge className="w-3.5 h-3.5 text-cyan-400" />
              <span>Merge 2 Scripts</span>
            </button>

            {/* Code block helper */}
            <button
              type="button"
              onClick={handleInsertCodeBlock}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-neutral-300 text-[11px] font-medium border border-neutral-700/60 transition-all cursor-pointer"
              title="Insert a Lua code block wrapper"
            >
              <FileCode className="w-3.5 h-3.5 text-neutral-400" />
              <span className="hidden xs:inline">+ Code Block</span>
            </button>

            {/* Upload file */}
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
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-neutral-300 text-[11px] font-medium border border-neutral-700/60 transition-all cursor-pointer"
              title="Upload a .lua or .txt script file"
            >
              <Upload className="w-3.5 h-3.5 text-neutral-400" />
              <span className="hidden sm:inline">Upload File</span>
            </button>

            {/* Presets dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowPresets(!showPresets)}
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-neutral-300 text-[11px] font-medium border border-neutral-700/60 transition-all cursor-pointer"
                title="Select from pre-configured Roblox scripts"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Presets</span>
                <ChevronDown className="w-3 h-3 text-neutral-400" />
              </button>

              {showPresets && (
                <>
                  <div
                    className="fixed inset-0 z-20"
                    onClick={() => setShowPresets(false)}
                  />
                  <div className="absolute bottom-full left-0 mb-2 w-80 max-h-72 overflow-y-auto bg-neutral-900 border border-neutral-700 rounded-xl shadow-2xl z-30 p-1.5 space-y-1">
                    <div className="px-2 py-1 text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
                      Roblox Script Presets
                    </div>
                    {PRESET_SCRIPTS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectPreset(preset)}
                        className="w-full text-left p-2 rounded-lg hover:bg-neutral-800 transition-colors text-xs cursor-pointer group"
                      >
                        <div className="font-medium text-neutral-200 group-hover:text-cyan-300 flex items-center justify-between">
                          <span>{preset.title}</span>
                          <span className="text-[10px] text-cyan-400/80 font-mono">{preset.category}</span>
                        </div>
                        <div className="text-[11px] text-neutral-400 truncate mt-0.5">
                          {preset.description}
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Clear Button */}
            {input.length > 0 && (
              <button
                type="button"
                onClick={() => setInput('')}
                className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-red-400 text-[11px] transition-all cursor-pointer"
                title="Clear input"
              >
                <Trash2 className="w-3 h-3" />
                <span className="hidden xs:inline">Clear</span>
              </button>
            )}
          </div>

          {/* Stats & Unlimited Badge */}
          <div className="flex items-center gap-2 text-[10px] font-mono text-neutral-400">
            {chars > 0 && (
              <>
                <span className="hidden sm:inline">{lines} lines</span>
                <span className="hidden sm:inline">•</span>
                <span>~{tokensEst.toLocaleString()} tok</span>
                <span>•</span>
              </>
            )}
            <span className="text-cyan-400/90 font-medium">∞ Unlimited Input</span>
          </div>
        </div>

        {/* The One Big Unified Input Textarea */}
        <div className="relative p-2.5 sm:p-3">
          <textarea
            ref={actualRef}
            id="gemini-unified-input-box"
            rows={3}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              hasHistory
                ? "Continue typing here to edit, fix, or add to the output... or paste another script to merge (Shift+Enter for newline)"
                : "Tell Tintware what to do, paste your code, or paste two scripts to merge... (Shift+Enter for new line)"
            }
            className="w-full bg-transparent text-neutral-100 placeholder-neutral-500 font-mono text-xs sm:text-[13px] leading-relaxed resize-none focus:outline-none scrollbar-thin scrollbar-thumb-neutral-800"
          />

          {/* Bottom Action Area */}
          <div className="flex items-center justify-between pt-1.5 mt-1 border-t border-neutral-800/40">
            <div className="text-[11px] text-neutral-500 flex items-center gap-1.5 truncate pr-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400/80"></span>
              <span className="truncate hidden sm:inline">
                {hasHistory
                  ? "Tintware remembers this entire chat. Ask follow-up fixes or paste code to combine."
                  : "All-in-one input: Type instructions & paste code in this single box."}
              </span>
              <span className="truncate sm:hidden">Enter to send • Shift+Enter for new line</span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {isStreaming ? (
                <button
                  type="button"
                  id="btn-stop-stream"
                  onClick={onStop}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-950/80 hover:bg-red-900 border border-red-700/80 text-red-200 text-xs font-medium transition-all shadow-sm cursor-pointer active:scale-95"
                >
                  <Square className="w-3.5 h-3.5 fill-red-400 text-red-400" />
                  <span>Stop</span>
                </button>
              ) : (
                <button
                  type="button"
                  id="btn-submit-unified"
                  onClick={onSubmit}
                  disabled={!input.trim()}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all shadow-md cursor-pointer active:scale-95 ${
                    input.trim()
                      ? 'bg-cyan-500 hover:bg-cyan-400 text-neutral-950 shadow-cyan-500/20'
                      : 'bg-neutral-800 text-neutral-500 cursor-not-allowed border border-neutral-700/50'
                  }`}
                  title="Send message (Enter)"
                >
                  <span>Send</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

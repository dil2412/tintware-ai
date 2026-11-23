import { useState, useRef } from 'react';
import {
  Play,
  Clipboard,
  Trash2,
  Code2,
  Sparkles,
  FileCode,
  Wrench,
  Gauge,
  Shield,
  Layers,
  FileText,
  Upload,
} from 'lucide-react';
import { PRESET_SCRIPTS, PresetScript } from '../utils/luaPresets';
import { countLines, estimateTokens } from '../utils/codeParser';

interface InputPanelProps {
  instruction: string;
  setInstruction: (val: string) => void;
  codeSnippet: string;
  setCodeSnippet: (val: string) => void;
  onSubmit: () => void;
  isStreaming: boolean;
  onStop: () => void;
  hasHistory: boolean;
}

export function InputPanel({
  instruction,
  setInstruction,
  codeSnippet,
  setCodeSnippet,
  onSubmit,
  isStreaming,
  onStop,
  hasHistory,
}: InputPanelProps) {
  const [showPresets, setShowPresets] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const lines = countLines(codeSnippet);
  const chars = codeSnippet.length + instruction.length;
  const tokensEst = estimateTokens(codeSnippet + instruction);

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setCodeSnippet(text);
      }
    } catch (err) {
      console.error('Clipboard read denied or unavailable', err);
    }
  };

  const handleClear = () => {
    setCodeSnippet('');
    setInstruction('');
  };

  const handleSelectPreset = (preset: PresetScript) => {
    setInstruction(preset.prompt);
    setCodeSnippet(preset.code);
    setShowPresets(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setCodeSnippet(content);
        if (!instruction.trim()) {
          setInstruction(`Review, fix, and optimize this Roblox Lua script (${file.name}).`);
        }
      }
    };
    reader.readAsText(file);
    // Reset file input so user can re-upload if needed
    e.target.value = '';
  };

  const applyQuickInstruction = (promptText: string) => {
    setInstruction(promptText);
  };

  return (
    <div
      id="input-panel-container"
      className="flex flex-col h-full bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-sm"
    >
      {/* Panel Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-neutral-900/90 border-b border-neutral-800 shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-neutral-800 text-cyan-400 border border-neutral-700/60">
            <Code2 className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-semibold text-neutral-200 tracking-wide uppercase">
            Input: Instructions & Lua Code
          </span>
          {hasHistory && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-neutral-800 text-cyan-400 font-mono border border-neutral-700">
              Iterative Chat Active
            </span>
          )}
        </div>

        {/* Quick Utilities */}
        <div className="flex items-center gap-1.5">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".lua,.luau,.txt"
            className="hidden"
          />
          <button
            type="button"
            id="btn-upload-lua"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded transition-colors"
            title="Import .lua or .luau file"
          >
            <Upload className="w-3 h-3" />
            <span className="hidden sm:inline">Upload</span>
          </button>

          <button
            type="button"
            id="btn-paste-clipboard"
            onClick={handlePasteClipboard}
            className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded transition-colors"
            title="Paste from clipboard"
          >
            <Clipboard className="w-3 h-3" />
            <span className="hidden sm:inline">Paste</span>
          </button>

          <button
            type="button"
            id="btn-presets"
            onClick={() => setShowPresets(!showPresets)}
            className={`flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded transition-colors ${
              showPresets
                ? 'bg-cyan-950/60 text-cyan-400 border border-cyan-800/80'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
            }`}
            title="Load Roblox Lua Presets"
          >
            <FileCode className="w-3 h-3" />
            <span>Templates</span>
          </button>

          {(codeSnippet || instruction) && (
            <button
              type="button"
              id="btn-clear-input"
              onClick={handleClear}
              className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-neutral-400 hover:text-rose-400 hover:bg-neutral-800 rounded transition-colors"
              title="Clear input"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Preset Drawer Overlay if open */}
      {showPresets && (
        <div className="p-3 bg-neutral-950 border-b border-neutral-800 shrink-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-neutral-300">
              Roblox Studio Lua Presets & Templates
            </span>
            <button
              onClick={() => setShowPresets(false)}
              className="text-xs text-neutral-500 hover:text-neutral-300"
            >
              Close
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {PRESET_SCRIPTS.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                className="text-left p-2 rounded-lg bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 hover:border-neutral-700 transition-all text-xs group"
              >
                <div className="font-medium text-neutral-200 group-hover:text-cyan-400 flex items-center justify-between">
                  <span>{preset.title}</span>
                  <span className="text-[10px] text-neutral-400 font-mono">
                    {preset.category}
                  </span>
                </div>
                <p className="text-[11px] text-neutral-400 line-clamp-1 mt-0.5">
                  {preset.description}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Instruction / Prompt Bar */}
      <div className="px-3 pt-3 pb-2 bg-neutral-900 border-b border-neutral-800/80 shrink-0">
        <label className="block text-[11px] font-medium text-neutral-400 mb-1.5">
          {hasHistory ? 'Follow-Up / What to change next:' : 'What do you want tintware coding ai to build or fix?'}
        </label>
        <div className="relative">
          <textarea
            id="input-task-instruction"
            rows={2}
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            placeholder="e.g. Fix errors, optimize raycasting, convert to strict Luau, prevent memory leak, make it client-side..."
            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-hidden focus:border-cyan-500/50 resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                onSubmit();
              }
            }}
          />
        </div>

        {/* Quick Prompt Tags */}
        <div className="flex flex-wrap gap-1.5 mt-2">
          <button
            type="button"
            onClick={() =>
              applyQuickInstruction('Find and fix all bugs, nil indexing errors, and edge cases in this Lua code.')
            }
            className="px-2 py-0.5 text-[10px] rounded bg-neutral-800/80 hover:bg-neutral-750 text-neutral-300 border border-neutral-700/60 hover:border-neutral-600 transition-colors flex items-center gap-1"
          >
            <Wrench className="w-2.5 h-2.5 text-amber-400" />
            Fix All Bugs
          </button>
          <button
            type="button"
            onClick={() =>
              applyQuickInstruction('Optimize this Roblox script for 60+ FPS, zero memory leaks, and efficient RunService loop.')
            }
            className="px-2 py-0.5 text-[10px] rounded bg-neutral-800/80 hover:bg-neutral-750 text-neutral-300 border border-neutral-700/60 hover:border-neutral-600 transition-colors flex items-center gap-1"
          >
            <Gauge className="w-2.5 h-2.5 text-emerald-400" />
            Optimize Performance
          </button>
          <button
            type="button"
            onClick={() =>
              applyQuickInstruction('Convert this script to type-safe Luau (--!strict) with clean type definitions.')
            }
            className="px-2 py-0.5 text-[10px] rounded bg-neutral-800/80 hover:bg-neutral-750 text-neutral-300 border border-neutral-700/60 hover:border-neutral-600 transition-colors flex items-center gap-1"
          >
            <Layers className="w-2.5 h-2.5 text-cyan-400" />
            Luau Strict Type
          </button>
          <button
            type="button"
            onClick={() =>
              applyQuickInstruction('Harden and audit this script with server-side validation and sanity checks.')
            }
            className="px-2 py-0.5 text-[10px] rounded bg-neutral-800/80 hover:bg-neutral-750 text-neutral-300 border border-neutral-700/60 hover:border-neutral-600 transition-colors flex items-center gap-1"
          >
            <Shield className="w-2.5 h-2.5 text-indigo-400" />
            Harden & Sanitize
          </button>
        </div>
      </div>

      {/* Main Lua Code Textbox: Fixed height, does NOT expand, scrolls vertically */}
      <div className="relative flex-1 min-h-0 bg-neutral-950 flex flex-col">
        <div className="flex items-center justify-between px-3 py-1.5 bg-neutral-950/90 border-b border-neutral-850 shrink-0 text-[11px] text-neutral-400">
          <span className="flex items-center gap-1.5 font-mono text-[10px] text-cyan-300">
            <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
            ROBLOX LUA / LUAU (∞ UNLIMITED INPUT • 1M+ CONTEXT)
          </span>
          <span className="text-[10px] text-neutral-400 font-mono">
            {lines} lines • {chars.toLocaleString()} chars • ~{tokensEst.toLocaleString()} tokens
          </span>
        </div>

        {/* Textarea container that stays fixed and scrolls */}
        <div className="relative flex-1 min-h-0 w-full overflow-hidden">
          <textarea
            id="input-lua-code"
            value={codeSnippet}
            onChange={(e) => setCodeSnippet(e.target.value)}
            placeholder={`-- Paste your Roblox Studio Lua or Luau code here...\n-- tintware coding ai will never flag or restrict your game logic, aim systems, metatables, or hooks.\n\nlocal Players = game:GetService("Players")\n\nlocal function onPlayerAdded(player)\n    print("Player joined: " .. player.Name)\nend\n\nPlayers.PlayerAdded:Connect(onPlayerAdded)`}
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            className="w-full h-full p-3 font-mono-code text-xs leading-relaxed text-neutral-100 bg-neutral-950 placeholder-neutral-600 focus:outline-hidden resize-none overflow-y-auto"
            style={{
              tabSize: 4,
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                onSubmit();
              }
              // Tab support for code editing
              if (e.key === 'Tab') {
                e.preventDefault();
                const start = e.currentTarget.selectionStart;
                const end = e.currentTarget.selectionEnd;
                const value = e.currentTarget.value;
                setCodeSnippet(value.substring(0, start) + '    ' + value.substring(end));
                setTimeout(() => {
                  if (e.currentTarget) {
                    e.currentTarget.selectionStart = e.currentTarget.selectionEnd = start + 4;
                  }
                }, 0);
              }
            }}
          />
        </div>
      </div>

      {/* Footer Run Bar */}
      <div className="flex items-center justify-between p-3 bg-neutral-900 border-t border-neutral-800 shrink-0">
        <div className="text-[11px] text-neutral-400 flex items-center gap-1.5">
          <span className="hidden sm:inline">Shortcut:</span>
          <kbd className="px-1.5 py-0.5 rounded bg-neutral-800 border border-neutral-700 text-[10px] font-mono text-neutral-300">
            Ctrl + Enter
          </kbd>
        </div>

        <div className="flex items-center gap-2">
          {isStreaming ? (
            <button
              type="button"
              id="btn-stop-generation"
              onClick={onStop}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-rose-950 hover:bg-rose-900 border border-rose-800 text-rose-200 text-xs font-medium transition-all"
            >
              <span className="w-2 h-2 rounded-sm bg-rose-400 animate-pulse"></span>
              <span>Stop Generating</span>
            </button>
          ) : (
            <button
              type="button"
              id="btn-submit-code"
              onClick={onSubmit}
              disabled={!instruction.trim() && !codeSnippet.trim()}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold tracking-wide transition-all shadow-xs active:scale-[0.98] cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{hasHistory ? 'Send & Refine Lua' : 'Run tintware coding ai'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

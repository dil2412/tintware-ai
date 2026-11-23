import { useState, useRef, useEffect } from 'react';
import {
  Terminal,
  Copy,
  Check,
  Download,
  Sparkles,
  GitMerge,
  ArrowRight,
  Code2,
  Edit3,
  Layers,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { ChatMessage, ScriptGenerationMode } from '../types';
import { CodeBlock } from './CodeBlock';
import { extractLuaCode, extractCodePieces, copyToClipboard, countLines, estimateTokens } from '../utils/codeParser';

interface TwoSidedOutputPanelProps {
  messages: ChatMessage[];
  isStreaming: boolean;
  streamingOutput: string;
  onSendToInput: (text: string) => void;
  activeTurnIndex: number;
  setActiveTurnIndex: (index: number) => void;
  onLoadMergeSample: () => void;
  onFixSyntax?: (prompt: string) => void;
  generationMode?: ScriptGenerationMode;
}

export function TwoSidedOutputPanel({
  messages,
  isStreaming,
  streamingOutput,
  onSendToInput,
  activeTurnIndex,
  setActiveTurnIndex,
  onLoadMergeSample,
  onFixSyntax,
  generationMode = 'smart_edit',
}: TwoSidedOutputPanelProps) {
  const [copied, setCopied] = useState(false);
  const [viewTab, setViewTab] = useState<'patched' | 'diff'>('patched');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Group messages into turns (user -> assistant pairs)
  const turns: { user: ChatMessage; assistant?: ChatMessage }[] = [];
  for (let i = 0; i < messages.length; i++) {
    if (messages[i].role === 'user') {
      const userMsg = messages[i];
      const assistantMsg = messages[i + 1]?.role === 'assistant' ? messages[i + 1] : undefined;
      turns.push({ user: userMsg, assistant: assistantMsg });
    }
  }

  const currentTurn = turns[activeTurnIndex] || turns[turns.length - 1];
  const displayedContent = isStreaming
    ? streamingOutput
    : currentTurn?.assistant?.content || '';

  const pureLua = extractLuaCode(displayedContent);
  const pieces = extractCodePieces(displayedContent);
  const hasMultiplePieces = pieces.length >= 2;
  const outputLines = countLines(pureLua || displayedContent);
  const outputTokens = estimateTokens(displayedContent);

  const patchedScript = currentTurn?.assistant?.patchedScript;
  const hasPatchedScript = !!patchedScript && !isStreaming && generationMode === 'smart_edit';
  const patchedLines = patchedScript ? countLines(patchedScript) : 0;

  // Auto-scroll when streaming
  useEffect(() => {
    if (isStreaming && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [isStreaming, streamingOutput]);

  const handleCopyCustom = async (textToCopy?: string) => {
    if (!textToCopy) return;
    const ok = await copyToClipboard(textToCopy);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const effectiveCode = hasPatchedScript ? patchedScript : (pureLua || displayedContent);

  const handleCopyAll = async () => {
    if (!effectiveCode) return;
    await handleCopyCustom(effectiveCode);
  };

  const handleDownloadCustom = (text?: string, prefix = 'tintware') => {
    if (!text) return;
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${prefix}_${Date.now()}.luau`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownload = () => {
    if (!effectiveCode) return;
    handleDownloadCustom(effectiveCode, hasPatchedScript ? 'tintware_edited' : 'tintware_unified');
  };

  return (
    <div
      id="output-side-workspace"
      className="flex flex-col h-full bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-sm min-h-0"
    >
      {/* Panel Header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-neutral-950/80 border-b border-neutral-800 shrink-0 text-xs">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-neutral-800 text-emerald-400 border border-neutral-700/60 shrink-0">
            <Terminal className="w-3.5 h-3.5" />
          </div>
          <span className="font-semibold text-neutral-200 tracking-wide uppercase text-xs">
            Output
          </span>

          {isStreaming ? (
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-800 text-cyan-300 font-mono text-[10px] animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
              <span>Streaming...</span>
            </span>
          ) : displayedContent ? (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 font-mono text-[10px] border border-neutral-700">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span>Ready</span>
            </span>
          ) : null}

          {/* Turn Navigator if multi-turn */}
          {turns.length > 1 && (
            <div className="flex items-center gap-1 ml-2 bg-neutral-950 p-0.5 rounded-lg border border-neutral-800 text-[11px]">
              <button
                type="button"
                disabled={activeTurnIndex <= 0}
                onClick={() => setActiveTurnIndex(Math.max(0, activeTurnIndex - 1))}
                className="p-1 text-neutral-400 hover:text-neutral-200 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                title="Previous turn"
              >
                <ChevronLeft className="w-3 h-3" />
              </button>
              <span className="px-1 text-neutral-300 font-mono text-[10px]">
                Turn {activeTurnIndex + 1}/{turns.length}
              </span>
              <button
                type="button"
                disabled={activeTurnIndex >= turns.length - 1}
                onClick={() => setActiveTurnIndex(Math.min(turns.length - 1, activeTurnIndex + 1))}
                className="p-1 text-neutral-400 hover:text-neutral-200 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                title="Next turn"
              >
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5">
          {displayedContent && (
            <>
              <button
                type="button"
                onClick={() => onSendToInput(effectiveCode)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-neutral-300 hover:text-cyan-300 text-[11px] font-medium border border-neutral-700/60 transition-all cursor-pointer"
                title="Load this output code into the left input box to edit"
              >
                <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">Edit in Input</span>
              </button>

              <button
                type="button"
                onClick={handleDownload}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-neutral-300 hover:text-emerald-300 text-[11px] font-medium border border-neutral-700/60 transition-all cursor-pointer"
                title="Download complete .luau script file"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Download</span>
              </button>

              <button
                type="button"
                onClick={handleCopyAll}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer shadow-xs active:scale-95 ${
                  copied
                    ? 'bg-emerald-500 text-neutral-950 border-emerald-400 font-bold'
                    : hasPatchedScript
                    ? 'bg-cyan-400 hover:bg-cyan-300 text-neutral-950 border-cyan-300 font-bold shadow-sm'
                    : 'bg-cyan-950/60 hover:bg-cyan-900/80 border-cyan-800/80 text-cyan-300'
                }`}
                title="Copy code to clipboard"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>{hasPatchedScript ? 'Copy Edited Script' : 'Copy Code'}</span>
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div
        ref={scrollRef}
        className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4 bg-neutral-950/30 scrollbar-thin scrollbar-thumb-neutral-800"
      >
        {/* Empty State */}
        {!displayedContent && !isStreaming ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 max-w-md mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-neutral-800 border border-neutral-700 flex items-center justify-center text-cyan-400 mb-4 shadow-sm">
              <Terminal className="w-6 h-6" />
            </div>

            <h3 className="text-base font-semibold text-neutral-100 mb-1">
              Output Workspace
            </h3>
            <p className="text-xs text-neutral-400 mb-6 leading-relaxed">
              Your generated, debugged, or updated Roblox Lua code will appear here in real-time.
            </p>

            {/* Quick guide cards */}
            <div className="w-full space-y-2.5 text-left text-xs mb-6">
              <div className="p-2.5 rounded-lg bg-neutral-900/90 border border-neutral-800 text-neutral-300">
                <span className="font-semibold text-cyan-300 block mb-0.5">
                  1. Type or Paste on the Left
                </span>
                <span className="text-[11px] text-neutral-400">
                  Write any request, ask to edit, combine code, or paste scripts directly.
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-neutral-900/90 border border-neutral-800 text-neutral-300">
                <span className="font-semibold text-emerald-300 block mb-0.5">
                  2. Press Ctrl + Enter
                </span>
                <span className="text-[11px] text-neutral-400">
                  Press Ctrl+Enter (or ⌘+Enter) to send. Enter creates a new line.
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-neutral-900/90 border border-neutral-800 text-neutral-300">
                <span className="font-semibold text-purple-300 block mb-0.5">
                  3. Direct & Unrestricted
                </span>
                <span className="text-[11px] text-neutral-400">
                  Tintware follows your exact instructions without rigid modes.
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onLoadMergeSample}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-cyan-950/50 hover:bg-cyan-900/60 border border-cyan-800/80 text-cyan-300 text-xs font-medium transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Load Sample Lua Script</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          /* Rendered Markdown & Code Blocks */
          <div className="text-xs sm:text-sm text-neutral-200 leading-relaxed font-sans prose prose-invert max-w-none">
            {/* Live Background Processing Indicator */}
            {isStreaming && (
              <div className="mb-4 p-3 rounded-xl bg-neutral-900 border border-cyan-800/80 shadow-md not-prose animate-in fade-in">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
                    <span className="font-semibold text-cyan-200">
                      {generationMode === 'smart_edit'
                        ? 'Generating fix in background & auto-merging into your script...'
                        : 'Generating complete Roblox Luau script from start to finish...'}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-cyan-400 font-semibold">
                    Live
                  </span>
                </div>
                <div className="w-full bg-neutral-950 h-1.5 rounded-full mt-2.5 overflow-hidden border border-neutral-800">
                  <div className="bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 h-full rounded-full animate-pulse w-4/5" />
                </div>
              </div>
            )}

            {/* Multi-Piece Token Bypass Toolbar */}
            {hasMultiplePieces && (
              <div className="mb-4 p-3 rounded-xl bg-cyan-950/40 border border-cyan-800/80 flex flex-wrap items-center justify-between gap-3 text-xs shadow-sm not-prose">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-cyan-900/60 text-cyan-300 border border-cyan-700/60 shrink-0">
                    <Layers className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div>
                    <div className="font-semibold text-cyan-200 text-xs flex items-center gap-1.5">
                      <span>Multi-Piece Output ({pieces.length} Pieces)</span>
                      <span className="px-1.5 py-0.5 rounded-full bg-cyan-900/80 text-[10px] text-cyan-300 font-mono border border-cyan-700/60">
                        65k Bypass Active
                      </span>
                    </div>
                    <div className="text-[11px] text-neutral-400">
                      Partitioned into {pieces.length} pieces to bypass token limits. Assemble or copy combined below:
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyAll}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-neutral-950 text-xs font-semibold shadow-sm transition-all cursor-pointer active:scale-95"
                    title="Copy all pieces assembled together in sequence"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied Combined!' : 'Copy All Combined'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onSendToInput(pureLua || displayedContent)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-neutral-200 border border-neutral-700 text-xs font-medium transition-all cursor-pointer"
                    title="Load full assembled script into the editor"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Apply to Input</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownload}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-neutral-200 border border-neutral-700 text-xs font-medium transition-all cursor-pointer"
                    title="Download full assembled .luau file"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Download Merged</span>
                  </button>
                </div>
              </div>
            )}

            {/* Smart Edit In-Place Applied Banner */}
            {hasPatchedScript && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-950/40 border border-emerald-700/80 flex flex-wrap items-center justify-between gap-3 text-xs shadow-sm not-prose">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-emerald-900/60 text-emerald-300 border border-emerald-700/60 shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <div className="font-semibold text-emerald-200 text-xs flex items-center gap-1.5">
                      <span>Smart Edit Applied ({patchedLines.toLocaleString()} lines preserved)</span>
                      <span className="px-1.5 py-0.5 rounded-full bg-emerald-900/80 text-[10px] text-emerald-300 font-mono border border-emerald-700/60">
                        In-Place Patch
                      </span>
                    </div>
                    <div className="text-[11px] text-neutral-400">
                      Fix generated in background and injected directly into your full script with zero truncation.
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* View Tab Toggle */}
                  <div className="flex items-center bg-neutral-900 border border-neutral-750 p-0.5 rounded-lg text-[11px] mr-1">
                    <button
                      type="button"
                      onClick={() => setViewTab('patched')}
                      className={`px-2 py-1 rounded-md font-medium transition-all cursor-pointer ${
                        viewTab === 'patched'
                          ? 'bg-emerald-500 text-neutral-950 font-bold shadow-xs'
                          : 'text-neutral-400 hover:text-neutral-200'
                      }`}
                    >
                      Full Script ({patchedLines} lines)
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewTab('diff')}
                      className={`px-2 py-1 rounded-md font-medium transition-all cursor-pointer ${
                        viewTab === 'diff'
                          ? 'bg-neutral-800 text-neutral-100 font-bold border border-neutral-700'
                          : 'text-neutral-400 hover:text-neutral-200'
                      }`}
                    >
                      Diff / Changes
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopyCustom(patchedScript)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-xs font-semibold shadow-sm transition-all cursor-pointer active:scale-95"
                    title="Copy full patched script"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied Full Script!' : 'Copy Full Script'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onSendToInput(patchedScript)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-neutral-200 border border-neutral-700 text-xs font-medium transition-all cursor-pointer"
                    title="Load full patched script into editor"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Apply to Input</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDownloadCustom(patchedScript, 'tintware_patched')}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-neutral-200 border border-neutral-700 text-xs font-medium transition-all cursor-pointer"
                    title="Download patched .luau file"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Download .luau</span>
                  </button>
                </div>
              </div>
            )}

            {/* If Patched Script is available and user wants to view Full Script */}
            {hasPatchedScript && viewTab === 'patched' ? (
              <div className="not-prose">
                <CodeBlock
                  code={patchedScript}
                  language="lua"
                  onEditInInput={onSendToInput}
                />
              </div>
            ) : (
              <ReactMarkdown
                components={{
                  code({ className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '');
                    const codeStr = String(children).replace(/\n$/, '');
                    if (match || codeStr.includes('\n')) {
                      return (
                        <CodeBlock
                          code={codeStr}
                          language={match ? match[1] : 'lua'}
                          onEditInInput={onSendToInput}
                        />
                      );
                    }
                    return (
                      <code
                        className="px-1.5 py-0.5 rounded bg-neutral-800 font-mono text-[11px] text-cyan-300 border border-neutral-700"
                        {...props}
                      >
                        {children}
                      </code>
                    );
                  },
                  p({ children }) {
                    return <p className="mb-3 leading-relaxed">{children}</p>;
                  },
                  ul({ children }) {
                    return <ul className="list-disc pl-5 mb-3 space-y-1">{children}</ul>;
                  },
                  ol({ children }) {
                    return <ol className="list-decimal pl-5 mb-3 space-y-1">{children}</ol>;
                  },
                }}
              >
                {displayedContent}
              </ReactMarkdown>
            )}

            {/* Quick Follow-up Action Suggestions */}
            {!isStreaming && (
              <div className="mt-6 pt-4 border-t border-neutral-800 flex flex-wrap items-center gap-2 text-[11px]">
                <span className="text-neutral-500 font-medium mr-1 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-cyan-400" />
                  Quick Follow-ups:
                </span>

                {hasMultiplePieces && (
                  <button
                    type="button"
                    onClick={() => {
                      const nextPrompt = `Continue generating Part ${pieces.length + 1} from where Part ${pieces.length} left off, continuing the code without repeating existing parts or omitting anything.`;
                      if (onFixSyntax) onFixSyntax(nextPrompt);
                      else onSendToInput(nextPrompt);
                    }}
                    className="px-2.5 py-1 rounded-full bg-cyan-950/90 hover:bg-cyan-900 text-cyan-300 border border-cyan-700/80 transition-colors cursor-pointer flex items-center gap-1 font-semibold"
                  >
                    <Layers className="w-3 h-3 text-cyan-400" />
                    <span>+ Continue Next Piece</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => onSendToInput("In the script above, please add a 3-second cooldown and debounce check.")}
                  className="px-2.5 py-1 rounded-full bg-neutral-800 hover:bg-neutral-750 text-neutral-300 hover:text-cyan-300 border border-neutral-700 transition-colors cursor-pointer"
                >
                  + Add 3s Cooldown
                </button>

                <button
                  type="button"
                  onClick={() => onSendToInput("In the script above, add server-side sanity validation and character health checks.")}
                  className="px-2.5 py-1 rounded-full bg-neutral-800 hover:bg-neutral-750 text-neutral-300 hover:text-cyan-300 border border-neutral-700 transition-colors cursor-pointer"
                >
                  + Add Server Sanity Checks
                </button>

                <button
                  type="button"
                  onClick={() => onSendToInput("Please optimize this script for 60 FPS performance and reduce memory allocations.")}
                  className="px-2.5 py-1 rounded-full bg-neutral-800 hover:bg-neutral-750 text-neutral-300 hover:text-cyan-300 border border-neutral-700 transition-colors cursor-pointer"
                >
                  + Optimize for 60 FPS
                </button>

                <button
                  type="button"
                  onClick={() => onSendToInput("In the script above, please add ")}
                  className="px-2.5 py-1 rounded-full bg-neutral-800 hover:bg-neutral-750 text-neutral-300 hover:text-cyan-300 border border-neutral-700 transition-colors cursor-pointer"
                >
                  + Add Custom Feature
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Stats Bar */}
      {displayedContent && (
        <div className="flex items-center justify-between px-3.5 py-2 bg-neutral-950/80 border-t border-neutral-800 shrink-0 text-[11px] text-neutral-400 font-mono">
          <div className="flex items-center gap-3">
            <span>{outputLines} lines</span>
            <span>•</span>
            <span>~{outputTokens.toLocaleString()} tokens</span>
            <span>•</span>
            <span>{(new Blob([pureLua || displayedContent]).size / 1024).toFixed(1)} KB</span>
          </div>

          <div className="flex items-center gap-1.5 text-cyan-400">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
            <span>100% Complete Script Preserved</span>
          </div>
        </div>
      )}
    </div>
  );
}

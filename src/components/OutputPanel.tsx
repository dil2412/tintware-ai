import { useState, useRef, useEffect } from 'react';
import {
  Copy,
  Check,
  Download,
  Terminal,
  FileCode,
  Eye,
  AlignLeft,
  Sparkles,
  ArrowDownCircle,
  RefreshCw,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { extractLuaCode, copyToClipboard, countLines, estimateTokens } from '../utils/codeParser';

interface OutputPanelProps {
  outputMarkdown: string;
  isStreaming: boolean;
  onRegenerate?: () => void;
  turnNumber?: number;
  totalTurns?: number;
}

export function OutputPanel({
  outputMarkdown,
  isStreaming,
  onRegenerate,
  turnNumber,
  totalTurns,
}: OutputPanelProps) {
  const [activeTab, setActiveTab] = useState<'formatted' | 'pureLua'>('formatted');
  const [copiedType, setCopiedType] = useState<'all' | 'lua' | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const pureLua = extractLuaCode(outputMarkdown);
  const lines = countLines(activeTab === 'pureLua' ? pureLua : outputMarkdown);
  const tokens = estimateTokens(outputMarkdown);

  const handleCopy = async (type: 'all' | 'lua') => {
    const textToCopy = type === 'lua' ? pureLua || outputMarkdown : outputMarkdown;
    const ok = await copyToClipboard(textToCopy);
    if (ok) {
      setCopiedType(type);
      setTimeout(() => setCopiedType(null), 2000);
    }
  };

  const handleDownloadLua = () => {
    const content = pureLua || outputMarkdown;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tintware_script_${Date.now()}.luau`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Auto-scroll to bottom while streaming if near bottom
  useEffect(() => {
    if (isStreaming && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [outputMarkdown, isStreaming]);

  return (
    <div
      id="output-panel-container"
      className="flex flex-col h-full bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-sm"
    >
      {/* Panel Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-neutral-900/90 border-b border-neutral-800 shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-neutral-800 text-emerald-400 border border-neutral-700/60">
            <Terminal className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-semibold text-neutral-200 tracking-wide uppercase">
            tintware coding ai output
          </span>
          {turnNumber !== undefined && totalTurns && totalTurns > 1 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400 font-mono border border-neutral-700">
              Turn {turnNumber} of {totalTurns}
            </span>
          )}
          {isStreaming && (
            <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 font-mono border border-cyan-800 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
              Streaming...
            </span>
          )}
        </div>

        {/* View Switcher Tabs & Actions */}
        <div className="flex items-center gap-1.5">
          <div className="flex bg-neutral-950 p-0.5 rounded-lg border border-neutral-800">
            <button
              type="button"
              onClick={() => setActiveTab('formatted')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                activeTab === 'formatted'
                  ? 'bg-neutral-800 text-neutral-100 shadow-xs'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Eye className="w-3 h-3" />
              <span>Formatted</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('pureLua')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                activeTab === 'pureLua'
                  ? 'bg-neutral-800 text-neutral-100 shadow-xs'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <FileCode className="w-3 h-3 text-cyan-400" />
              <span>Pure Lua</span>
            </button>
          </div>

          {outputMarkdown && (
            <>
              {/* Copy Pure Lua Button */}
              <button
                type="button"
                id="btn-copy-lua"
                onClick={() => handleCopy('lua')}
                className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-md bg-neutral-800 hover:bg-neutral-750 text-neutral-200 border border-neutral-700 transition-all cursor-pointer shadow-xs active:scale-95"
                title="Copy ready-to-use Lua script directly for Roblox Studio"
              >
                {copiedType === 'lua' ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400">Lua Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 text-cyan-400" />
                    <span>Copy Lua</span>
                  </>
                )}
              </button>

              {/* Copy Full Output Button */}
              <button
                type="button"
                id="btn-copy-all"
                onClick={() => handleCopy('all')}
                className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-md bg-neutral-800 hover:bg-neutral-750 text-neutral-300 border border-neutral-700 transition-all cursor-pointer shadow-xs active:scale-95"
                title="Copy full explanation and code"
              >
                {copiedType === 'all' ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span className="hidden sm:inline">Copy All</span>
                  </>
                )}
              </button>

              <button
                type="button"
                id="btn-download-lua"
                onClick={handleDownloadLua}
                className="p-1.5 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded-md transition-colors"
                title="Download .luau file"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Content Area: Fixed height, does NOT expand, scrolls vertically */}
      <div
        ref={scrollRef}
        id="output-scroll-container"
        className="relative flex-1 min-h-0 bg-neutral-950 overflow-y-auto p-4 text-xs leading-relaxed"
      >
        {!outputMarkdown && !isStreaming ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-neutral-400 select-none">
            <div className="w-12 h-12 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-cyan-400 mb-3 shadow-inner">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="font-medium text-neutral-200 text-sm mb-1">
              Ready for Roblox Studio Luau & Lua
            </h3>
            <p className="text-xs text-neutral-400 max-w-sm mb-4">
              Paste any script on the left. tintware coding ai will optimize, repair bugs, add strict typing, or rewrite your system without false cheat warnings.
            </p>
            <div className="flex flex-wrap gap-2 justify-center max-w-md text-[11px]">
              <span className="px-2.5 py-1 rounded bg-neutral-900 border border-cyan-800/50 text-cyan-300 font-mono">
                ∞ Unlimited Input & Output
              </span>
              <span className="px-2.5 py-1 rounded bg-neutral-900 border border-neutral-800 text-neutral-300 font-mono">
                1M+ Token Context Window
              </span>
              <span className="px-2.5 py-1 rounded bg-neutral-900 border border-neutral-800 text-neutral-300 font-mono">
                65,536 Output Tokens
              </span>
            </div>
          </div>
        ) : activeTab === 'pureLua' ? (
          <div className="h-full flex flex-col">
            <div className="mb-2 flex items-center justify-between text-[11px] text-neutral-400 font-mono pb-2 border-b border-neutral-800">
              <span>PURE LUA SCRIPT (READY FOR ROBLOX STUDIO)</span>
              <span>{pureLua.length} characters</span>
            </div>
            <pre className="font-mono-code text-xs text-emerald-300 leading-relaxed whitespace-pre-wrap selection:bg-emerald-500/20 select-text">
              {pureLua || outputMarkdown}
            </pre>
          </div>
        ) : (
          <div className="prose prose-invert max-w-none space-y-3 select-text text-neutral-200">
            <ReactMarkdown
              components={{
                code({ node, className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || '');
                  const isInline = !match && !String(children).includes('\n');
                  const codeString = String(children).replace(/\n$/, '');

                  if (isInline) {
                    return (
                      <code
                        className="px-1.5 py-0.5 rounded bg-neutral-800 text-cyan-300 font-mono-code text-[11px] border border-neutral-700/60"
                        {...props}
                      >
                        {children}
                      </code>
                    );
                  }

                  return (
                    <div className="my-3 rounded-lg overflow-hidden border border-neutral-800 bg-neutral-900/90">
                      <div className="flex items-center justify-between px-3 py-1.5 bg-neutral-850 border-b border-neutral-800 text-[11px] text-neutral-400 font-mono">
                        <span className="flex items-center gap-1.5 text-neutral-300">
                          <FileCode className="w-3 h-3 text-cyan-400" />
                          {match ? match[1].toUpperCase() : 'LUA'}
                        </span>
                        <button
                          type="button"
                          onClick={async () => {
                            await copyToClipboard(codeString);
                          }}
                          className="flex items-center gap-1 px-2 py-0.5 rounded hover:bg-neutral-750 text-neutral-300 hover:text-white transition-colors"
                          title="Copy this code block"
                        >
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </button>
                      </div>
                      <pre className="p-3.5 overflow-x-auto font-mono-code text-xs text-neutral-100 bg-neutral-950 leading-relaxed">
                        <code>{children}</code>
                      </pre>
                    </div>
                  );
                },
                h1: ({ children }) => (
                  <h1 className="text-base font-semibold text-neutral-100 border-b border-neutral-800 pb-1.5 mt-2 mb-2">
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-sm font-semibold text-neutral-200 mt-3 mb-1.5 flex items-center gap-1.5">
                    <span className="w-1 h-3 rounded-full bg-cyan-400"></span>
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-xs font-semibold text-neutral-300 mt-2 mb-1">
                    {children}
                  </h3>
                ),
                p: ({ children }) => (
                  <p className="text-xs text-neutral-300 leading-relaxed mb-2">
                    {children}
                  </p>
                ),
                ul: ({ children }) => (
                  <ul className="list-disc list-inside space-y-1 my-2 text-xs text-neutral-300">
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal list-inside space-y-1 my-2 text-xs text-neutral-300">
                    {children}
                  </ol>
                ),
                li: ({ children }) => <li className="text-xs leading-relaxed">{children}</li>,
              }}
            >
              {outputMarkdown}
            </ReactMarkdown>

            {isStreaming && (
              <span className="inline-block w-2 h-4 ml-1 bg-cyan-400 animate-pulse align-middle"></span>
            )}
          </div>
        )}
      </div>

      {/* Output Panel Footer */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-neutral-900 border-t border-neutral-800 shrink-0 text-[11px] text-neutral-400">
        <div className="flex items-center gap-2.5">
          <span className="text-cyan-400 font-mono text-[10px] font-medium flex items-center gap-1">
            <span className="font-bold">∞</span>
            <span>Unlimited Output</span>
          </span>
          <span className="text-neutral-600">•</span>
          <span className="font-mono text-[10px]">{lines} lines</span>
          <span className="text-neutral-600">•</span>
          <span className="font-mono text-[10px]">~{tokens.toLocaleString()} tokens</span>
        </div>

        <div className="flex items-center gap-2">
          {onRegenerate && outputMarkdown && !isStreaming && (
            <button
              type="button"
              id="btn-regenerate-response"
              onClick={onRegenerate}
              className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded transition-colors"
              title="Regenerate code response"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Regenerate</span>
            </button>
          )}

          {outputMarkdown && (
            <button
              type="button"
              onClick={() => handleCopy('lua')}
              className="flex items-center gap-1.5 px-3 py-1 text-[11px] font-semibold text-cyan-400 bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-800/80 rounded-md transition-all shadow-xs cursor-pointer active:scale-98"
            >
              <Copy className="w-3 h-3" />
              <span>Copy for Roblox Studio</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

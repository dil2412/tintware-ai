import { useState } from 'react';
import { Copy, Check, Download, Edit3, Code2 } from 'lucide-react';
import { copyToClipboard, countLines } from '../utils/codeParser';

interface CodeBlockProps {
  code: string;
  language?: string;
  onEditInInput?: (code: string) => void;
  onFixSyntax?: (prompt: string) => void;
}

export function CodeBlock({ code, language = 'lua', onEditInInput }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const lines = countLines(code);
  const codeLines = code.split('\n');

  const handleCopy = async () => {
    const success = await copyToClipboard(code);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tintware_${language}_${Date.now()}.luau`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="my-3 rounded-xl border border-neutral-800 bg-neutral-950 overflow-hidden shadow-md">
      {/* Code Block Header */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-neutral-900/90 border-b border-neutral-800 text-xs text-neutral-300">
        <div className="flex items-center gap-2 font-mono">
          <Code2 className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-cyan-300 font-semibold tracking-wide uppercase text-[11px]">
            {language === 'lua' || language === 'luau' ? 'Roblox Luau Script' : language}
          </span>
          <span className="text-neutral-600">•</span>
          <span className="text-neutral-400 text-[11px]">{lines} lines</span>
          <span className="text-neutral-600 hidden sm:inline">•</span>
          <span className="text-neutral-400 text-[11px] hidden sm:inline">
            {(new Blob([code]).size / 1024).toFixed(1)} KB
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {onEditInInput && (
            <button
              type="button"
              onClick={() => onEditInInput(code)}
              className="flex items-center gap-1 px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-750 text-neutral-300 hover:text-cyan-300 text-[11px] font-medium border border-neutral-700/80 transition-all cursor-pointer"
              title="Insert into input textbox to instruct changes"
            >
              <Edit3 className="w-3 h-3 text-cyan-400" />
              <span>Edit Code</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleDownload}
            className="flex items-center gap-1 px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-750 text-neutral-300 hover:text-emerald-300 text-[11px] font-medium border border-neutral-700/80 transition-all cursor-pointer"
            title="Download as .luau file"
          >
            <Download className="w-3 h-3 text-emerald-400" />
            <span className="hidden xs:inline">Download</span>
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium transition-all border cursor-pointer ${
              copied
                ? 'bg-emerald-950/80 border-emerald-600/80 text-emerald-300'
                : 'bg-cyan-950/60 hover:bg-cyan-900/80 border-cyan-800/80 text-cyan-300'
            }`}
            title="Copy script to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3 text-cyan-400" />
                <span>Copy Code</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Code Editor view with Line Numbers */}
      <div className="flex font-mono text-xs overflow-auto max-h-[540px] scrollbar-thin scrollbar-thumb-neutral-800">
        {/* Line Numbers gutter */}
        <div className="select-none py-3 px-3 text-right text-neutral-600 bg-neutral-950/90 border-r border-neutral-800/80 shrink-0 font-mono text-[11px] leading-relaxed">
          {codeLines.map((_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>

        {/* Code Content */}
        <pre className="p-3 text-neutral-200 font-mono text-xs leading-relaxed overflow-x-auto flex-1 select-text">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
}

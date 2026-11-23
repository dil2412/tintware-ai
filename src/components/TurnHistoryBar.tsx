import { MessageSquare, ArrowRight, CornerDownRight, CheckCircle2 } from 'lucide-react';
import { ChatMessage } from '../types';

interface TurnHistoryBarProps {
  messages: ChatMessage[];
  activeTurnIndex: number;
  onSelectTurn: (index: number) => void;
}

export function TurnHistoryBar({
  messages,
  activeTurnIndex,
  onSelectTurn,
}: TurnHistoryBarProps) {
  // Group messages into user -> assistant turns
  const turns: { user: ChatMessage; assistant?: ChatMessage; index: number }[] = [];

  for (let i = 0; i < messages.length; i++) {
    if (messages[i].role === 'user') {
      const userMsg = messages[i];
      const assistantMsg = messages[i + 1]?.role === 'assistant' ? messages[i + 1] : undefined;
      turns.push({
        user: userMsg,
        assistant: assistantMsg,
        index: turns.length,
      });
    }
  }

  if (turns.length <= 1) {
    return null;
  }

  return (
    <div
      id="turn-history-strip"
      className="flex items-center gap-2 px-4 py-2 bg-neutral-900/95 border-b border-neutral-800 text-xs overflow-x-auto shrink-0"
    >
      <span className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
        <MessageSquare className="w-3 h-3 text-cyan-400" />
        Thread Turns ({turns.length}):
      </span>

      <div className="flex items-center gap-1.5 min-w-0">
        {turns.map((turn, idx) => {
          const isActive = idx === activeTurnIndex;
          const summary =
            turn.user.taskPrompt ||
            (turn.user.content.length > 30
              ? turn.user.content.substring(0, 28) + '...'
              : turn.user.content) ||
            `Prompt ${idx + 1}`;

          return (
            <button
              key={idx}
              type="button"
              onClick={() => onSelectTurn(idx)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] shrink-0 transition-all cursor-pointer ${
                isActive
                  ? 'bg-neutral-800 text-cyan-300 border border-neutral-700 font-medium shadow-xs'
                  : 'bg-neutral-950 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-850 border border-neutral-800'
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-neutral-800 text-[10px] flex items-center justify-center font-mono text-neutral-300">
                {idx + 1}
              </span>
              <span className="truncate max-w-[140px]">{summary}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

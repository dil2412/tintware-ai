import {
  Menu,
  Plus,
  Sliders,
} from 'lucide-react';

interface HeaderProps {
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
  onNewChat: () => void;
  sessionTitle: string;
  onOpenSettings?: () => void;
  activeModelName?: string;
}

export function Header({
  onToggleSidebar,
  isSidebarOpen,
  onNewChat,
  sessionTitle,
  onOpenSettings,
  activeModelName,
}: HeaderProps) {
  return (
    <header
      id="app-header"
      className="flex items-center justify-between px-4 py-2.5 bg-neutral-900 border-b border-neutral-800 shrink-0 select-none"
    >
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          id="btn-sidebar-menu"
          onClick={onToggleSidebar}
          className="p-1.5 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded-md transition-colors"
          title={isSidebarOpen ? 'Close sidebar' : 'Open chat history'}
        >
          <Menu className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-neutral-100 tracking-tight">
              tintware coding ai
            </span>
          </div>

          <span className="text-neutral-600 hidden sm:inline">/</span>

          <div className="hidden sm:flex items-center gap-2 min-w-0">
            <span className="text-xs text-neutral-400 truncate max-w-[240px]">
              {sessionTitle === 'New Roblox Lua Chat' ? 'New Lua Project' : (sessionTitle || 'New Lua Project')}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Model & Settings Button */}
        <button
          type="button"
          id="btn-header-settings"
          onClick={onOpenSettings}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-neutral-800/90 hover:bg-neutral-750 text-neutral-200 text-xs font-medium border border-neutral-700/80 transition-all cursor-pointer shadow-xs active:scale-95"
          title="Open AI Model & Platform Settings (Gemini, ChatGPT, Claude)"
        >
          <Sliders className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-mono text-[11px] text-cyan-300 truncate max-w-[140px] hidden xs:inline">
            {activeModelName || 'Gemini 3.1 Pro'}
          </span>
        </button>

        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-950 border border-neutral-800 text-[11px] text-neutral-400 font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>Unrestricted</span>
        </div>

        <button
          type="button"
          id="btn-header-new-chat"
          onClick={onNewChat}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-300 text-xs font-medium border border-cyan-800/80 transition-all active:scale-[0.98] cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden xs:inline">New Chat</span>
        </button>
      </div>
    </header>
  );
}

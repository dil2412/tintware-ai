import { useState, useEffect, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { TwoSidedInputPanel } from './components/TwoSidedInputPanel';
import { TwoSidedOutputPanel } from './components/TwoSidedOutputPanel';
import { SettingsModal } from './components/SettingsModal';
import { ChatMessage, ChatSession, AppSettings } from './types';
import { DEFAULT_SETTINGS, AVAILABLE_MODELS } from './utils/modelOptions';
import { applySearchReplacePatches } from './utils/diffPatcher';
import { isLuaCode, extractLuaCode, countLines, separatePromptAndScript } from './utils/codeParser';

const STORAGE_KEY = 'tintware_chat_sessions_v4';
const ACTIVE_SESSION_KEY = 'tintware_active_session_id_v4';
const SETTINGS_STORAGE_KEY = 'tintware_app_settings_v2';
const INPUT_DRAFT_KEY = 'tintware_input_draft_v2';

function cleanSessionTitle(title: string): string {
  if (!title || title === 'New Roblox Lua Chat' || title === 'New Session' || title === 'New Lua Project' || title === 'New Lua Chat') {
    return 'New Lua Workspace';
  }
  return title.replace(/tint392/gi, 'tintware');
}

function createNewSession(): ChatSession {
  const id = 'session_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  return {
    id,
    title: 'New Lua Workspace',
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export default function App() {
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      }
    } catch {}
    return DEFAULT_SETTINGS;
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleUpdateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      try {
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const selectedModelObj = AVAILABLE_MODELS.find((m) => m.id === settings.selectedModel);
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try {
      const saved =
        localStorage.getItem(STORAGE_KEY) ||
        localStorage.getItem('tintware_chat_sessions_v3') ||
        localStorage.getItem('tintware_chat_sessions_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((s: ChatSession) => ({
            ...s,
            title: cleanSessionTitle(s.title),
          }));
        }
      }
    } catch (e) {
      console.error('Failed to load sessions from localStorage', e);
    }
    return [createNewSession()];
  });

  const [activeSessionId, setActiveSessionId] = useState<string>(() => {
    const savedId =
      localStorage.getItem(ACTIVE_SESSION_KEY) ||
      localStorage.getItem('tintware_active_session_id_v3') ||
      localStorage.getItem('tintware_active_session_id_v2');
    if (savedId) return savedId;
    return sessions[0]?.id || '';
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  // Persist input draft so the user's code and prompt NEVER disappear when leaving, minimizing, or refreshing
  const [input, setInput] = useState<string>(() => {
    try {
      return localStorage.getItem(INPUT_DRAFT_KEY) || '';
    } catch {
      return '';
    }
  });

  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingOutput, setStreamingOutput] = useState('');
  const [activeTurnIndex, setActiveTurnIndex] = useState(0);
  const [mobileTab, setMobileTab] = useState<'input' | 'output'>('input');

  const abortControllerRef = useRef<AbortController | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const streamingTextRef = useRef<string>('');

  // Persist input draft on every change
  useEffect(() => {
    try {
      localStorage.setItem(INPUT_DRAFT_KEY, input);
    } catch {}
  }, [input]);

  // Handle visibility change so background streaming instantly syncs when tab is reopened or un-minimized
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible' && streamingTextRef.current) {
        setStreamingOutput(streamingTextRef.current);
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, []);

  // Save sessions to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    } catch (e) {
      console.error('Failed to save sessions to localStorage', e);
    }
  }, [sessions]);

  // Save active session id
  useEffect(() => {
    if (activeSessionId) {
      localStorage.setItem(ACTIVE_SESSION_KEY, activeSessionId);
    }
  }, [activeSessionId]);

  const activeSession = sessions.find((s) => s.id === activeSessionId) || sessions[0];

  // Update activeTurnIndex to latest whenever active session or message count changes
  const userMessageCount = activeSession.messages.filter((m) => m.role === 'user').length;
  useEffect(() => {
    if (userMessageCount > 0) {
      setActiveTurnIndex(userMessageCount - 1);
    } else {
      setActiveTurnIndex(0);
    }
  }, [activeSession.id, userMessageCount]);

  const handleSelectSession = (id: string) => {
    if (id === activeSessionId) return;
    if (isStreaming && abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
    }
    // Save current input into active session
    setSessions((prev) =>
      prev.map((s) => (s.id === activeSessionId ? { ...s, inputDraft: input } : s))
    );
    // Find target session
    const target = sessions.find((s) => s.id === id);
    setActiveSessionId(id);
    setInput(target?.inputDraft || '');
    setStreamingOutput('');
    streamingTextRef.current = '';
    const userCount = target?.messages.filter((m) => m.role === 'user').length || 0;
    setActiveTurnIndex(userCount > 0 ? userCount - 1 : 0);
  };

  const handleNewChat = () => {
    if (isStreaming && abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
    }
    // Save current draft into active session
    setSessions((prev) =>
      prev.map((s) => (s.id === activeSessionId ? { ...s, inputDraft: input } : s))
    );
    const newSession = createNewSession();
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    setInput('');
    setStreamingOutput('');
    streamingTextRef.current = '';
    setActiveTurnIndex(0);
    setMobileTab('input');
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 50);
  };

  const handleDeleteSession = (id: string) => {
    setSessions((prev) => {
      const filtered = prev.filter((s) => s.id !== id);
      if (filtered.length === 0) {
        const fresh = createNewSession();
        setActiveSessionId(fresh.id);
        setInput('');
        setStreamingOutput('');
        streamingTextRef.current = '';
        setActiveTurnIndex(0);
        return [fresh];
      }
      if (activeSessionId === id) {
        const nextSession = filtered[0];
        setActiveSessionId(nextSession.id);
        setInput(nextSession.inputDraft || '');
        setStreamingOutput('');
        streamingTextRef.current = '';
        const userCount = nextSession.messages.filter((m) => m.role === 'user').length;
        setActiveTurnIndex(userCount > 0 ? userCount - 1 : 0);
      }
      return filtered;
    });
  };

  const handleRenameSession = (id: string, newTitle: string) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, title: newTitle, updatedAt: Date.now() } : s))
    );
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
    }
  };

  const handleSendToInput = (text: string) => {
    setInput(text);
    setMobileTab('input');
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 50);
  };

  const handleLoadMergeSample = () => {
    const sample = `-- ServerScriptService: Player Ability & Data Controller
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Debris = game:GetService("Debris")

local Remotes = Instance.new("Folder")
Remotes.Name = "AbilityRemotes"
Remotes.Parent = ReplicatedStorage

local CastAbilityEvent = Instance.new("RemoteEvent")
CastAbilityEvent.Name = "CastAbility"
CastAbilityEvent.Parent = Remotes

local COOLDOWNS = {}
local COOLDOWN_TIME = 3.5

CastAbilityEvent.OnServerEvent:Connect(function(player, abilityType)
    local userId = player.UserId
    local now = os.clock()

    if COOLDOWNS[userId] and (now - COOLDOWNS[userId]) < COOLDOWN_TIME then
        return -- Debounce / Cooldown protection
    end
    COOLDOWNS[userId] = now

    local character = player.Character
    local root = character and character:FindFirstChild("HumanoidRootPart")
    if not root then return end

    if abilityType == "Dash" then
        local attachment = Instance.new("Attachment")
        attachment.Parent = root

        local linearVelocity = Instance.new("LinearVelocity")
        linearVelocity.MaxForce = 1e6
        linearVelocity.VectorVelocity = root.CFrame.LookVector * 85
        linearVelocity.Attachment0 = attachment
        linearVelocity.Parent = root

        Debris:AddItem(linearVelocity, 0.25)
        Debris:AddItem(attachment, 0.25)
    end
end)`;
    setInput(sample);
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 50);
  };

  const handleSubmit = async (overrideContent?: unknown) => {
    const rawInput = (typeof overrideContent === 'string' ? overrideContent : input).trim();
    if (!rawInput) return;
    if (isStreaming) return;

    // Send the user's exact input directly
    const userMessage: ChatMessage = {
      id: 'msg_' + Date.now() + '_user',
      role: 'user',
      content: rawInput,
      timestamp: Date.now(),
    };

    const newMessages = [...(activeSession?.messages || []), userMessage];

    // Determine session title if this is the first message
    let newTitle = activeSession.title;
    if (
      activeSession.messages.length === 0 ||
      activeSession.title === 'New Lua Workspace' ||
      activeSession.title.startsWith('New Roblox Lua Chat')
    ) {
      const firstLine = rawInput.split('\n')[0].replace(/[`#-]/g, '').trim();
      if (firstLine) {
        newTitle = firstLine.length > 34 ? firstLine.substring(0, 32) + '...' : firstLine;
      } else {
        newTitle = 'Lua Script ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
    }

    // Update active session with the user message
    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeSession.id
          ? {
              ...s,
              title: newTitle,
              messages: newMessages,
              inputDraft: '',
              updatedAt: Date.now(),
            }
          : s
      )
    );

    setIsStreaming(true);
    setStreamingOutput('');
    streamingTextRef.current = '';
    // Only switch tab if screen is small phone (< 768px)
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setMobileTab('output');
    }
    abortControllerRef.current = new AbortController();

    const assistantMsgId = 'msg_' + Date.now() + '_assistant';
    let accumulatedText = '';

    try {
      // Map complete message history for multi-turn Gemini reasoning
      const payloadMessages = newMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: payloadMessages,
          model: settings.selectedModel,
          platform: settings.platform,
          highSpeedMode: settings.highSpeedMode,
          generationMode: settings.generationMode,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with ${res.status}`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No readable stream available.');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          buffer += decoder.decode();
        } else {
          buffer += decoder.decode(value, { stream: true });
        }

        const lines = buffer.split('\n');
        buffer = done ? '' : lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;
          const dataStr = trimmed.substring(6);

          if (dataStr === '[DONE]') {
            continue;
          }

          try {
            const data = JSON.parse(dataStr);
            if (data.error) {
              accumulatedText += `\n\n**Error:** ${data.error}`;
              streamingTextRef.current = accumulatedText;
              setStreamingOutput(accumulatedText);
            } else if (data.text) {
              accumulatedText += data.text;
              streamingTextRef.current = accumulatedText;
              setStreamingOutput(accumulatedText);
            }
          } catch {
            // Raw text chunk fallback
            accumulatedText += dataStr;
            streamingTextRef.current = accumulatedText;
            setStreamingOutput(accumulatedText);
          }
        }

        if (done) break;
      }

      // Finalize assistant message with Smart Edit in-place patching
      const finalContent = accumulatedText.trim()
        ? accumulatedText
        : 'The AI service experienced a momentary delay and was unable to complete the script. Please click below to send again.';

      let patchedScript: string | undefined;
      let appliedPatchesCount: number | undefined;
      let patchSummary: string[] | undefined;

      // Comprehensive baseScript detection for Smart Edit
      let baseScript = '';
      const { prompt: _userPrompt, script: separatedScript } = separatePromptAndScript(rawInput);
      if (separatedScript && (isLuaCode(separatedScript) || countLines(separatedScript) > 2)) {
        baseScript = separatedScript;
      } else {
        const rawExtracted = extractLuaCode(rawInput);
        if (rawExtracted && (isLuaCode(rawExtracted) || countLines(rawExtracted) > 2)) {
          baseScript = rawExtracted;
        } else if (isLuaCode(rawInput) && countLines(rawInput) > 2) {
          baseScript = rawInput;
        }
      }

      if (!baseScript) {
        // Look backwards through conversation history
        for (let i = newMessages.length - 1; i >= 0; i--) {
          const msg = newMessages[i];
          if (msg.patchedScript) {
            baseScript = msg.patchedScript;
            break;
          }
          const extractedMsgCode = extractLuaCode(msg.content);
          if (extractedMsgCode && (isLuaCode(extractedMsgCode) || countLines(extractedMsgCode) > 2)) {
            baseScript = extractedMsgCode;
            break;
          }
          if (msg.role === 'user' && isLuaCode(msg.content) && countLines(msg.content) > 2) {
            baseScript = msg.content;
            break;
          }
        }
      }

      // Only run Smart Edit in-place patching if generationMode is 'smart_edit' (or response has explicit SEARCH/REPLACE blocks)
      // When generationMode === 'rewrite', NEVER apply Smart Edit!
      const isExplicitPatchFormat = accumulatedText.includes('<<<<<<< SEARCH') || accumulatedText.includes('<<<<<<< INSERT AFTER');
      const shouldApplySmartEdit = settings.generationMode === 'smart_edit' || (settings.generationMode !== 'rewrite' && isExplicitPatchFormat);

      if (shouldApplySmartEdit && baseScript) {
        const patchRes = applySearchReplacePatches(baseScript, accumulatedText);
        if (patchRes.success && patchRes.patchedScript) {
          patchedScript = patchRes.patchedScript;
          appliedPatchesCount = patchRes.appliedCount;
          patchSummary = patchRes.changesSummary;
        }
      }

      // If Smart Edit applied a patch, canonical output becomes the full edited script
      let canonicalContent = finalContent;
      if (shouldApplySmartEdit && patchedScript) {
        canonicalContent = `\`\`\`lua\n${patchedScript}\n\`\`\``;
      }

      const assistantMessage: ChatMessage = {
        id: assistantMsgId,
        role: 'assistant',
        content: canonicalContent,
        taskPrompt: finalContent, // Preserve background reasoning/diff for inspection
        timestamp: Date.now(),
        patchedScript: shouldApplySmartEdit ? patchedScript : undefined,
        appliedPatchesCount: shouldApplySmartEdit ? appliedPatchesCount : undefined,
        patchSummary: shouldApplySmartEdit ? patchSummary : undefined,
      };

      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeSession.id
            ? {
                ...s,
                messages: [...newMessages, assistantMessage],
                updatedAt: Date.now(),
              }
            : s
        )
      );
      setStreamingOutput('');
    } catch (err: any) {
      if (err.name === 'AbortError') {
        const stoppedMessage: ChatMessage = {
          id: assistantMsgId,
          role: 'assistant',
          content: (accumulatedText || '') + '\n\n*(Generation stopped by user)*',
          timestamp: Date.now(),
        };
        setSessions((prev) =>
          prev.map((s) =>
            s.id === activeSession.id
              ? {
                  ...s,
                  messages: [...newMessages, stoppedMessage],
                  updatedAt: Date.now(),
                }
              : s
          )
        );
      } else {
        console.error('Generation error:', err);
        const errorMessage: ChatMessage = {
          id: assistantMsgId,
          role: 'assistant',
          content: `**Error generating code:**\n${err.message || 'Unknown network or API error.'}\n\nPlease verify that your Gemini API key is configured or retry.`,
          timestamp: Date.now(),
        };
        setSessions((prev) =>
          prev.map((s) =>
            s.id === activeSession.id
              ? {
                  ...s,
                  messages: [...newMessages, errorMessage],
                  updatedAt: Date.now(),
                }
              : s
          )
        );
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-neutral-950 text-neutral-100 font-sans antialiased select-none">
      {/* Sidebar with Chat History */}
      <Sidebar
        sessions={sessions}
        activeSessionId={activeSession.id}
        onSelectSession={handleSelectSession}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
        onRenameSession={handleRenameSession}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      {/* Main Two-Sided Workspace */}
      <div className="flex flex-col flex-1 min-w-0 h-screen overflow-hidden bg-neutral-950">
        {/* Top Header */}
        <Header
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          isSidebarOpen={isSidebarOpen}
          onNewChat={handleNewChat}
          sessionTitle={activeSession.title}
          onOpenSettings={() => setIsSettingsOpen(true)}
          activeModelName={selectedModelObj?.name}
        />

        {/* AI Model & Engine Settings Modal */}
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
        />

        {/* Mobile Tab Switcher (Visible only on phone screens < 768px) */}
        <div className="flex md:hidden items-center justify-center p-2 bg-neutral-900 border-b border-neutral-800 shrink-0 gap-2">
          <button
            type="button"
            onClick={() => setMobileTab('input')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
              mobileTab === 'input'
                ? 'bg-cyan-500 text-neutral-950 font-semibold shadow-xs'
                : 'bg-neutral-800 text-neutral-300'
            }`}
          >
            Input Side
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('output')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
              mobileTab === 'output'
                ? 'bg-cyan-500 text-neutral-950 font-semibold shadow-xs'
                : 'bg-neutral-800 text-neutral-300'
            }`}
          >
            Output Side {isStreaming && '(Generating...)'}
          </button>
        </div>

        {/* Two-Sided Main Layout */}
        <main className="flex-1 min-h-0 p-2 sm:p-3 md:p-4 overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 h-full min-h-0">
            {/* Left Side: Input Workspace */}
            <div
              className={`h-full min-h-0 ${
                mobileTab === 'input' ? 'block' : 'hidden md:block'
              }`}
            >
              <TwoSidedInputPanel
                input={input}
                setInput={setInput}
                onSubmit={handleSubmit}
                isStreaming={isStreaming}
                onStop={handleStop}
                textareaRef={textareaRef}
                hasHistory={activeSession.messages.length > 0}
                turnCount={userMessageCount}
                generationMode={settings.generationMode}
                onToggleGenerationMode={(mode) => handleUpdateSettings({ generationMode: mode })}
              />
            </div>

            {/* Right Side: Output Workspace */}
            <div
              className={`h-full min-h-0 ${
                mobileTab === 'output' ? 'block' : 'hidden md:block'
              }`}
            >
              <TwoSidedOutputPanel
                messages={activeSession.messages}
                isStreaming={isStreaming}
                streamingOutput={streamingOutput}
                onSendToInput={handleSendToInput}
                activeTurnIndex={activeTurnIndex}
                setActiveTurnIndex={setActiveTurnIndex}
                onLoadMergeSample={handleLoadMergeSample}
                onFixSyntax={(prompt) => handleSubmit(prompt)}
                generationMode={settings.generationMode}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

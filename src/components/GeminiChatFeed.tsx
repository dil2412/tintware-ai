import { useRef, useEffect } from 'react';
import {
  Terminal,
  User,
  Sparkles,
  GitMerge,
  Wrench,
  Crosshair,
  ShieldAlert,
  ArrowRight,
  Code2,
  Copy,
  Check,
  Edit3,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { ChatMessage } from '../types';
import { CodeBlock } from './CodeBlock';
import { copyToClipboard } from '../utils/codeParser';

interface GeminiChatFeedProps {
  messages: ChatMessage[];
  isStreaming: boolean;
  streamingOutput: string;
  onSelectPrompt: (promptText: string) => void;
  onEditInInput: (codeOrText: string) => void;
}

export function GeminiChatFeed({
  messages,
  isStreaming,
  streamingOutput,
  onSelectPrompt,
  onEditInInput,
}: GeminiChatFeedProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom as messages or streaming output updates
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: isStreaming ? 'smooth' : 'auto',
      });
    }
  }, [messages, streamingOutput, isStreaming]);

  const starterCards = [
    {
      title: 'Merge 2 Scripts into One',
      desc: 'Combine two separate scripts into a single unified, conflict-free system without breaking either one.',
      icon: GitMerge,
      color: 'text-cyan-400',
      borderColor: 'hover:border-cyan-500/50',
      prompt: `Merge these two separate Roblox scripts together into one complete, fully working unified script. Combine their service imports, prevent variable conflicts, and wire their RunService and UserInputService loops together so both camera smoothing and combat dashing work seamlessly:

---------------------------------------------------------
-- SCRIPT 1: Smooth Camera Lerp System (Client)
---------------------------------------------------------
local RunService = game:GetService("RunService")
local Players = game:GetService("Players")
local Workspace = game:GetService("Workspace")

local player = Players.LocalPlayer
local camera = Workspace.CurrentCamera
local CAMERA_LERP_SPEED = 12

local function updateCamera(dt: number)
    local character = player.Character
    if not character then return end
    local rootPart = character:FindFirstChild("HumanoidRootPart")
    if not rootPart then return end

    local targetCFrame = CFrame.new(rootPart.Position + Vector3.new(0, 3, 10), rootPart.Position)
    camera.CFrame = camera.CFrame:Lerp(targetCFrame, math.clamp(dt * CAMERA_LERP_SPEED, 0, 1))
end

RunService.RenderStepped:Connect(updateCamera)


---------------------------------------------------------
-- SCRIPT 2: Combat Dash Ability (Client)
---------------------------------------------------------
local UserInputService = game:GetService("UserInputService")
local Players = game:GetService("Players")

local player = Players.LocalPlayer
local DASH_SPEED = 65
local DASH_DURATION = 0.25
local DASH_COOLDOWN = 2.0

local isDashing = false
local lastDashTime = 0

UserInputService.InputBegan:Connect(function(input, gameProcessed)
    if gameProcessed then return end
    if input.KeyCode == Enum.KeyCode.Q then
        local now = os.clock()
        if (now - lastDashTime) < DASH_COOLDOWN or isDashing then return end
        lastDashTime = now
        isDashing = true

        local character = player.Character
        local humanoid = character and character:FindFirstChildOfClass("Humanoid")
        local rootPart = character and character:FindFirstChild("HumanoidRootPart")
        if not (humanoid and rootPart) then 
            isDashing = false
            return 
        end

        local moveDir = humanoid.MoveDirection
        if moveDir.Magnitude == 0 then
            moveDir = rootPart.CFrame.LookVector
        end

        local bodyVelocity = Instance.new("BodyVelocity")
        bodyVelocity.MaxForce = Vector3.new(1e5, 0, 1e5)
        bodyVelocity.Velocity = moveDir * DASH_SPEED
        bodyVelocity.Parent = rootPart

        task.delay(DASH_DURATION, function()
            bodyVelocity:Destroy()
            isDashing = false
        end)
    end
end)`,
    },
    {
      title: 'Fix & Debug Broken Script',
      desc: 'Fix runtime errors, nil indexing, or logic bugs. Preserves 100% of your code.',
      icon: Wrench,
      color: 'text-amber-400',
      borderColor: 'hover:border-amber-500/50',
      prompt: `Please review, fix, and optimize this Roblox Lua script. Fix any runtime nil-indexing errors and ensure clean execution while keeping all existing code intact:\n\n\`\`\`lua\n-- [Paste your broken script here]\n\`\`\``,
    },
    {
      title: 'Smooth Camera Lerp & FOV',
      desc: 'CFrame interpolation, target tracking, predictive projectile lead, and Raycasting.',
      icon: Crosshair,
      color: 'text-emerald-400',
      borderColor: 'hover:border-emerald-500/50',
      prompt: `Write a complete, production-grade Roblox Luau Client Camera & Aim Lerp system with smooth CFrame interpolation, FOV zooming on right-click, predictive target tracking, and Raycast line-of-sight checks.`,
    },
    {
      title: 'Server Sanity & Remote Validator',
      desc: 'Prevent exploit manipulation and validate player cooldowns with high performance.',
      icon: ShieldAlert,
      color: 'text-purple-400',
      borderColor: 'hover:border-purple-500/50',
      prompt: `Write a robust Roblox ServerScriptService RemoteEvent sanity check system for player actions with strict cooldown tracking, distance checks, and data payload validation.`,
    },
  ];

  return (
    <div
      ref={scrollRef}
      id="gemini-chat-feed"
      className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-6 scrollbar-thin scrollbar-thumb-neutral-800"
    >
      {/* Empty State / Welcome Screen */}
      {messages.length === 0 && !isStreaming && (
        <div className="max-w-3xl mx-auto py-8 sm:py-12 flex flex-col items-center text-center">
          {/* Logo Badge */}
          <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-cyan-500/20 to-neutral-900 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-500/10 mb-5">
            <Terminal className="w-7 h-7" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-100 tracking-tight mb-2">
            tintware <span className="text-transparent bg-clip-text bg-linear-to-r from-cyan-400 to-emerald-400 font-mono">coding ai</span>
          </h1>

          <p className="text-sm text-neutral-400 max-w-lg mb-8 leading-relaxed">
            Ultra-smart Roblox Lua & Luau engineering. Merge two scripts into one, build complex mechanics, or paste code to fix. To edit the output, just continue typing in the input box below.
          </p>

          {/* Quick-starter Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full text-left">
            {starterCards.map((card, idx) => {
              const Icon = card.icon;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onSelectPrompt(card.prompt)}
                  className={`p-4 rounded-xl bg-neutral-900/80 border border-neutral-800/80 ${card.borderColor} hover:bg-neutral-850/90 transition-all text-left group cursor-pointer shadow-xs flex flex-col justify-between`}
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <Icon className={`w-4 h-4 ${card.color}`} />
                      <span className="font-semibold text-xs sm:text-sm text-neutral-200 group-hover:text-cyan-300 transition-colors">
                        {card.title}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">
                      {card.desc}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-neutral-500 group-hover:text-cyan-400 transition-colors mt-3 font-medium">
                    <span>Use this template</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Messages List */}
      <div className="max-w-3xl mx-auto space-y-6">
        {messages.map((message) => {
          if (message.role === 'user') {
            return (
              <div key={message.id} className="flex gap-3 justify-end group">
                <div className="max-w-[90%] sm:max-w-[85%] rounded-2xl bg-neutral-900 border border-neutral-800/80 p-3.5 sm:p-4 text-neutral-200 shadow-sm">
                  {/* User Header */}
                  <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-neutral-800 text-[11px] text-neutral-400">
                    <span className="font-semibold text-neutral-300 flex items-center gap-1.5">
                      <User className="w-3 h-3 text-cyan-400" />
                      You
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onEditInInput(message.content)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-neutral-400 hover:text-cyan-300 cursor-pointer flex items-center gap-1"
                        title="Reload this message into input box"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span className="text-[10px]">Edit</span>
                      </button>
                      <span>{new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>

                  {/* User Content */}
                  <div className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-sans">
                    <ReactMarkdown
                      components={{
                        code({ className, children, ...props }) {
                          const match = /language-(\w+)/.exec(className || '');
                          const codeStr = String(children).replace(/\n$/, '');
                          if (match || codeStr.includes('\n')) {
                            return <CodeBlock code={codeStr} language={match ? match[1] : 'lua'} onEditInInput={onEditInInput} />;
                          }
                          return (
                            <code className="px-1.5 py-0.5 rounded bg-neutral-850 font-mono text-[11px] text-cyan-300 border border-neutral-750" {...props}>
                              {children}
                            </code>
                          );
                        },
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            );
          }

          // Assistant Response Card
          return (
            <div key={message.id} className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-xl bg-cyan-950/80 border border-cyan-800/80 flex items-center justify-center text-cyan-400 shrink-0 mt-1 shadow-xs">
                <Terminal className="w-4 h-4" />
              </div>

              <div className="flex-1 min-w-0 rounded-2xl bg-neutral-900/60 border border-neutral-800/80 p-4 sm:p-5 shadow-sm">
                {/* Assistant Header */}
                <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-neutral-800/80 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-neutral-100 text-xs tracking-tight">
                      tintware coding ai
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950/50 border border-cyan-800/60 text-cyan-300 font-mono">
                      Gemini 3.6
                    </span>
                  </div>
                  <span className="text-[10px] text-neutral-500 font-mono">
                    {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {/* Markdown Prose & Code */}
                <div className="text-xs sm:text-sm text-neutral-200 leading-relaxed font-sans prose prose-invert max-w-none">
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
                              onEditInInput={onEditInInput}
                            />
                          );
                        }
                        return (
                          <code className="px-1.5 py-0.5 rounded bg-neutral-800 font-mono text-[11px] text-cyan-300 border border-neutral-700" {...props}>
                            {children}
                          </code>
                        );
                      },
                      p({ children }) {
                        return <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>;
                      },
                      ul({ children }) {
                        return <ul className="list-disc pl-5 mb-3 space-y-1">{children}</ul>;
                      },
                      ol({ children }) {
                        return <ol className="list-decimal pl-5 mb-3 space-y-1">{children}</ol>;
                      },
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>

                {/* Follow-up Quick Action Chips */}
                <div className="mt-4 pt-3 border-t border-neutral-800/60 flex items-center gap-2 flex-wrap text-[11px]">
                  <span className="text-neutral-500 font-medium mr-1 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-cyan-400" />
                    Quick edits:
                  </span>

                  <button
                    type="button"
                    onClick={() => onEditInInput("Now merge this with my other script:\n\n```lua\n-- [Paste second script here]\n```")}
                    className="px-2.5 py-1 rounded-full bg-neutral-800 hover:bg-neutral-750 text-neutral-300 hover:text-cyan-300 border border-neutral-700 transition-colors cursor-pointer"
                  >
                    Merge with another script
                  </button>

                  <button
                    type="button"
                    onClick={() => onEditInInput("In the script above, please add a cooldown of 3 seconds and a debounce check to prevent spamming.")}
                    className="px-2.5 py-1 rounded-full bg-neutral-800 hover:bg-neutral-750 text-neutral-300 hover:text-cyan-300 border border-neutral-700 transition-colors cursor-pointer"
                  >
                    Add cooldown & debounce
                  </button>

                  <button
                    type="button"
                    onClick={() => onEditInInput("In the script above, add server-side sanity checks and validate the player's character state via RemoteEvent.")}
                    className="px-2.5 py-1 rounded-full bg-neutral-800 hover:bg-neutral-750 text-neutral-300 hover:text-cyan-300 border border-neutral-700 transition-colors cursor-pointer"
                  >
                    Add server validation
                  </button>

                  <button
                    type="button"
                    onClick={() => onEditInInput("Please optimize this script for 60 FPS performance, reduce memory allocations, and clean up connections.")}
                    className="px-2.5 py-1 rounded-full bg-neutral-800 hover:bg-neutral-750 text-neutral-300 hover:text-cyan-300 border border-neutral-700 transition-colors cursor-pointer"
                  >
                    Optimize performance
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {/* Live Streaming Assistant Response */}
        {isStreaming && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-xl bg-cyan-950/80 border border-cyan-800/80 flex items-center justify-center text-cyan-400 shrink-0 mt-1 shadow-xs animate-pulse">
              <Terminal className="w-4 h-4" />
            </div>

            <div className="flex-1 min-w-0 rounded-2xl bg-neutral-900/60 border border-cyan-800/50 p-4 sm:p-5 shadow-sm">
              <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-neutral-800/80 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-neutral-100 text-xs tracking-tight">
                    tintware coding ai
                  </span>
                  <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 font-mono border border-cyan-800 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                    Generating...
                  </span>
                </div>
              </div>

              <div className="text-xs sm:text-sm text-neutral-200 leading-relaxed font-sans prose prose-invert max-w-none">
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
                          />
                        );
                      }
                      return (
                        <code className="px-1.5 py-0.5 rounded bg-neutral-800 font-mono text-[11px] text-cyan-300 border border-neutral-700" {...props}>
                          {children}
                        </code>
                      );
                    },
                  }}
                >
                  {streamingOutput || 'Synthesizing Lua code...'}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

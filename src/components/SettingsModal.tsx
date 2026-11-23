import { useState } from 'react';
import {
  X,
  Sparkles,
  Cpu,
  Layers,
  Check,
  Zap,
  Sliders,
  CheckCircle2,
} from 'lucide-react';
import { AppSettings, AIPlatform } from '../types';
import { PLATFORMS, AVAILABLE_MODELS } from '../utils/modelOptions';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
}

export function SettingsModal({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<AIPlatform>(settings.platform);

  if (!isOpen) return null;

  const currentModels = AVAILABLE_MODELS.filter((m) => m.platform === activeTab);
  const selectedModelObj = AVAILABLE_MODELS.find((m) => m.id === settings.selectedModel);

  const handleSelectModel = (modelId: string) => {
    onUpdateSettings({
      platform: activeTab,
      selectedModel: modelId,
    });
  };

  const getPlatformIcon = (id: AIPlatform) => {
    switch (id) {
      case 'gemini':
        return <Sparkles className="w-4 h-4 text-cyan-400" />;
      case 'chatgpt':
        return <Cpu className="w-4 h-4 text-emerald-400" />;
      case 'claude':
        return <Layers className="w-4 h-4 text-purple-400" />;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-neutral-950/80 border-b border-neutral-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-neutral-800 text-cyan-400 border border-neutral-700/60">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-neutral-100">
                AI Engine & Model Settings
              </h2>
              <p className="text-[11px] text-neutral-400">
                Choose your AI platform and active model. Default is set to the latest Pro engine.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Platform Selection Tabs */}
        <div className="flex border-b border-neutral-800 bg-neutral-950/40 p-2 gap-1.5 shrink-0 overflow-x-auto">
          {PLATFORMS.map((platform) => {
            const isActive = activeTab === platform.id;
            return (
              <button
                key={platform.id}
                type="button"
                onClick={() => setActiveTab(platform.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-neutral-800 text-neutral-100 border border-neutral-700 shadow-xs'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-850 border border-transparent'
                }`}
              >
                {getPlatformIcon(platform.id)}
                <span>{platform.name}</span>
                {settings.platform === platform.id && (
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 ml-0.5"></span>
                )}
              </button>
            );
          })}
        </div>

        {/* Model Selection Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0 scrollbar-thin scrollbar-thumb-neutral-800">
          <div className="flex items-center justify-between text-xs text-neutral-400 px-1">
            <span>Select Model for {PLATFORMS.find((p) => p.id === activeTab)?.name}:</span>
            <span className="text-[11px] font-mono text-cyan-400">
              Active: {selectedModelObj?.name || settings.selectedModel}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {currentModels.map((model) => {
              const isSelected = settings.selectedModel === model.id;
              return (
                <div
                  key={model.id}
                  onClick={() => handleSelectModel(model.id)}
                  className={`relative p-3.5 rounded-xl border transition-all cursor-pointer select-none flex items-start justify-between gap-3 ${
                    isSelected
                      ? 'bg-cyan-950/30 border-cyan-700/80 ring-1 ring-cyan-500/30'
                      : 'bg-neutral-950/60 hover:bg-neutral-850/80 border-neutral-800'
                  }`}
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-neutral-100">
                        {model.name}
                      </span>

                      {model.tag && (
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-mono border ${
                            model.isPro
                              ? 'bg-purple-950/60 text-purple-300 border-purple-700/60'
                              : 'bg-cyan-950/60 text-cyan-300 border-cyan-800/60'
                          }`}
                        >
                          {model.tag}
                        </span>
                      )}

                      {model.recommended && (
                        <span className="px-1.5 py-0.5 rounded-full text-[9px] font-mono bg-emerald-950/80 text-emerald-300 border border-emerald-700/80">
                          Default
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-neutral-400 leading-relaxed">
                      {model.description}
                    </p>
                  </div>

                  <div className="shrink-0 pt-0.5">
                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                        isSelected
                          ? 'border-cyan-400 bg-cyan-500 text-neutral-950'
                          : 'border-neutral-700 bg-neutral-800'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Speed & Optimization Options */}
          <div className="mt-5 pt-4 border-t border-neutral-800 space-y-3">
            <h4 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Speed & Generation Performance</span>
            </h4>

            <div className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800 flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <span className="text-xs font-medium text-neutral-200 block">
                  High-Speed Streaming Mode
                </span>
                <span className="text-[11px] text-neutral-400 block leading-tight">
                  Disables thinking latency buffers to stream 900+ line Luau scripts at maximum token throughput.
                </span>
              </div>
              <button
                type="button"
                onClick={() =>
                  onUpdateSettings({ highSpeedMode: !settings.highSpeedMode })
                }
                className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                  settings.highSpeedMode ? 'bg-cyan-500' : 'bg-neutral-700'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform ${
                    settings.highSpeedMode ? 'translate-x-5' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-neutral-950/80 border-t border-neutral-800 shrink-0">
          <div className="flex items-center gap-1.5 text-[11px] text-neutral-400">
            <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Changes apply automatically to all requests.</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-neutral-950 text-xs font-semibold transition-all cursor-pointer shadow-sm active:scale-95"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

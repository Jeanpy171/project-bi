'use client';

import { useEffect, useState } from 'react';
import {
  AlertCircle,
  Bot,
  Check,
  Copy,
  Loader2,
  Plus,
  RefreshCw,
  Send,
  Sparkles,
  Terminal,
  X,
} from 'lucide-react';
import type {
  AIAskRequest,
  AIAskResponse,
  CardDraft,
  ConnectionConfig,
  LLMChatMessage,
  LLMConfig,
  LLMProviderId,
} from '@bi/contracts';
import type { DataSource } from '../../lib/data-sources';
import type { DynamicCard } from '../dashboard/dashboard-canvas';

interface AICopilotModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly dataSources: readonly DataSource[];
  readonly activeSourceId?: string;
  readonly onInsertCardToDashboard: (card: DynamicCard) => void;
}

interface ChatItem {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  executedSql?: string;
  sqlResultSummary?: string;
  cardDraft?: CardDraft;
  latencyMs?: number;
  modelUsed?: string;
  providerUsed?: LLMProviderId;
}

const STORAGE_KEY_CONFIG = 'proyecto_bi_ai_config_v1';
const DEFAULT_CONFIG: LLMConfig = {
  provider: 'ollama',
  model: 'qwen2.5-coder',
  ollamaBaseUrl: 'http://localhost:11434',
  geminiApiKey: '',
  temperature: 0.1,
};

const SUGGESTED_QUESTIONS = [
  '¿Cuál es la cuenta con mayor saldo acumulado en el balance?',
  'Generame un gráfico de barras de ventas por categoría',
  '¿Está cuadrado el balance general según los asientos?',
  'Creame una tarjeta KPI con el total de activos',
];

export function AICopilotModal({
  isOpen,
  onClose,
  dataSources,
  activeSourceId,
  onInsertCardToDashboard,
}: AICopilotModalProps) {
  const [config, setConfig] = useState<LLMConfig>(() => {
    if (typeof window === 'undefined') return DEFAULT_CONFIG;
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CONFIG);
      return saved ? { ...DEFAULT_CONFIG, ...JSON.parse(saved) } : DEFAULT_CONFIG;
    } catch {
      return DEFAULT_CONFIG;
    }
  });

  const [ollamaModels, setOllamaModels] = useState<string[]>([]);
  const [isOllamaAvailable, setIsOllamaAvailable] = useState<boolean | null>(null);
  const [isCheckingOllama, setIsCheckingOllama] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [insertedCardIds, setInsertedCardIds] = useState<Record<string, boolean>>({});

  const [messages, setMessages] = useState<ChatItem[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        '¡Hola! Soy tu Copiloto Analítico & Contable. Puedo responder preguntas sobre tus tablas y excels, generar consultas SQL de solo lectura y armar tarjetas visuales para tus tableros.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  // Persist config changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(config));
    }
  }, [config]);

  // Probe Ollama models on open or when baseUrl changes
  const checkOllamaStatus = async (baseUrl: string) => {
    setIsCheckingOllama(true);
    try {
      const res = await fetch(`/api/ai/ollama/models?baseUrl=${encodeURIComponent(baseUrl)}`);
      if (res.ok) {
        const data = (await res.json()) as { models: string[]; isAvailable: boolean };
        setOllamaModels(data.models || []);
        setIsOllamaAvailable(true);
        const firstModel = data.models?.[0];
        if (firstModel && !data.models.includes(config.model)) {
          setConfig((prev) => ({ ...prev, model: firstModel }));
        }
      } else {
        setIsOllamaAvailable(false);
      }
    } catch {
      setIsOllamaAvailable(false);
    } finally {
      setIsCheckingOllama(false);
    }
  };

  useEffect(() => {
    if (isOpen && config.provider === 'ollama') {
      checkOllamaStatus(config.ollamaBaseUrl || 'http://localhost:11434');
    }
  }, [isOpen, config.provider, config.ollamaBaseUrl]);

  if (!isOpen) return null;

  // Find active source metadata
  const currentSource = dataSources.find((s) => s.id === activeSourceId) || dataSources[0];

  // Build schema context for LLM
  const buildSchemaContext = () => {
    if (!currentSource || !currentSource.tables) return undefined;
    const context: Record<string, { columns: Array<{ name: string; type: string }>; rowCount?: number }> = {};

    currentSource.tables.forEach((table) => {
      context[table.name] = {
        columns: table.columns.map((c) => ({ name: c.name, type: c.type })),
        rowCount: table.rows.length,
      };
    });

    return context;
  };

  const handleSendMessage = async (userPrompt?: string) => {
    const textToSend = userPrompt || inputMessage.trim();
    if (!textToSend || isLoading) return;

    setErrorMsg(null);
    setInputMessage('');

    const userItem: ChatItem = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const nextChat = [...messages, userItem];
    setMessages(nextChat);
    setIsLoading(true);

    try {
      const chatHistory: LLMChatMessage[] = nextChat
        .filter((m) => m.id !== 'welcome')
        .map((m) => ({
          role: m.role,
          content: m.content,
        }));

      const payload: AIAskRequest = {
        config,
        messages: chatHistory,
        schemaContext: buildSchemaContext(),
        connection: currentSource?.connectionConfig as ConnectionConfig | undefined,
      };

      const res = await fetch('/api/ai/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(errJson.error || `Error HTTP ${res.status}`);
      }

      const data = (await res.json()) as AIAskResponse;

      const assistantItem: ChatItem = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        executedSql: data.executedSql,
        sqlResultSummary: data.sqlResultSummary,
        cardDraft: data.cardDraft,
        latencyMs: data.latencyMs,
        modelUsed: data.modelUsed,
        providerUsed: data.providerUsed,
      };

      setMessages((prev) => [...prev, assistantItem]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopySql = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleInsertDraftCard = (draft: CardDraft, msgId: string) => {
    const newCard: DynamicCard = {
      title: draft.title,
      subtitle: draft.subtitle || draft.explanation,
      chartKind: draft.chartKind,
      cardTheme: 'standard',
      badge: 'IA Generado',
      badgeStyle: 'pill_tint',
      badgePosition: 'top_right',
      titleFontSize: 14,
      subtitleFontSize: 11,
      sourceName: currentSource?.name || 'Origen IA',
      tableName: currentSource?.tables?.[0]?.name || 'Tabla',
      accentColor: '#3b82f6',
    };

    onInsertCardToDashboard(newCard);
    setInsertedCardIds((prev) => ({ ...prev, [msgId]: true }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 md:p-6 no-print">
      <div className="bg-surface border border-surface-border rounded-3xl w-full max-w-4xl h-[90vh] max-h-[850px] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Top Header */}
        <div className="p-4 border-b border-surface-border bg-surface flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary shadow-xs">
              <Sparkles className="h-5 w-5 animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-sm md:text-base font-bold text-foreground truncate">
                  Copiloto Analítico & Contable (IA)
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-primary/15 text-primary border border-primary/20 shrink-0">
                  {config.provider === 'ollama' ? '🦙 Ollama Local' : '✦ Google Gemini'}
                </span>
              </div>
              <p className="text-xs text-muted truncate">
                Contexto activo: {currentSource?.name || 'Sin fuente'} • {currentSource?.tables?.length || 0} tablas
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowSettings((prev) => !prev)}
              className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                showSettings
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-surface-border bg-surface-subtle text-muted hover:text-foreground'
              }`}
            >
              Configurar Proveedor
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl border border-surface-border text-muted hover:text-foreground hover:bg-surface-subtle transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Settings Drawer (Ollama & Gemini Configuration) */}
        {showSettings && (
          <div className="p-4 bg-slate-50 dark:bg-slate-900 border-b border-surface-border space-y-3.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-extrabold uppercase tracking-wider text-muted text-[10px]">
                Configuración de Modelos & Conexión
              </span>
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                className="text-muted hover:text-foreground font-bold"
              >
                Ocultar
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Provider Selection */}
              <div>
                <label className="block text-[11px] font-bold text-muted mb-1">
                  Motor de IA:
                </label>
                <div className="grid grid-cols-2 gap-1 p-0.5 bg-surface rounded-lg border border-surface-border text-center">
                  <button
                    type="button"
                    onClick={() => setConfig((prev) => ({ ...prev, provider: 'ollama' }))}
                    className={`py-1 rounded-md font-bold transition-all ${
                      config.provider === 'ollama'
                        ? 'bg-primary text-white shadow-xs'
                        : 'text-muted hover:text-foreground'
                    }`}
                  >
                    🦙 Ollama (Local)
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfig((prev) => ({ ...prev, provider: 'gemini' }))}
                    className={`py-1 rounded-md font-bold transition-all ${
                      config.provider === 'gemini'
                        ? 'bg-primary text-white shadow-xs'
                        : 'text-muted hover:text-foreground'
                    }`}
                  >
                    ✦ Gemini (Cloud)
                  </button>
                </div>
              </div>

              {/* Ollama Endpoint or Gemini API Key */}
              {config.provider === 'ollama' ? (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-muted">
                      URL Servidor Ollama:
                    </label>
                    <button
                      type="button"
                      onClick={() => checkOllamaStatus(config.ollamaBaseUrl || 'http://localhost:11434')}
                      className="text-[10px] text-primary hover:underline flex items-center gap-1 font-semibold"
                    >
                      <RefreshCw className={`h-3 w-3 ${isCheckingOllama ? 'animate-spin' : ''}`} />
                      <span>Verificar</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={config.ollamaBaseUrl}
                    onChange={(e) => setConfig((prev) => ({ ...prev, ollamaBaseUrl: e.target.value }))}
                    placeholder="http://localhost:11434"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-surface-border bg-surface text-foreground font-mono focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                  {isOllamaAvailable === true && (
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-1 inline-flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Conectado • {ollamaModels.length} modelos detectados
                    </span>
                  )}
                  {isOllamaAvailable === false && (
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold mt-1 inline-flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Ollama no responde. Ejecutá &quot;ollama serve&quot;.
                    </span>
                  )}
                </div>
              ) : (
                <div>
                  <label className="block text-[11px] font-bold text-muted mb-1">
                    API Key de Gemini:
                  </label>
                  <input
                    type="password"
                    value={config.geminiApiKey || ''}
                    onChange={(e) => setConfig((prev) => ({ ...prev, geminiApiKey: e.target.value }))}
                    placeholder="AIzaSy... o usa GEMINI_API_KEY en .env"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-surface-border bg-surface text-foreground font-mono focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>
              )}

              {/* Model Choice */}
              <div>
                <label className="block text-[11px] font-bold text-muted mb-1">
                  Modelo:
                </label>
                {config.provider === 'ollama' && ollamaModels.length > 0 ? (
                  <select
                    value={config.model}
                    onChange={(e) => setConfig((prev) => ({ ...prev, model: e.target.value }))}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-surface-border bg-surface text-foreground font-semibold focus:ring-1 focus:ring-primary focus:outline-none"
                  >
                    {ollamaModels.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={config.model}
                    onChange={(e) => setConfig((prev) => ({ ...prev, model: e.target.value }))}
                    placeholder={config.provider === 'ollama' ? 'qwen2.5-coder' : 'gemini-2.0-flash'}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-surface-border bg-surface text-foreground font-mono focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {/* Chat Message Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-3xl ${
                msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
              }`}
            >
              {/* Avatar */}
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl font-bold text-xs shadow-xs ${
                  msg.role === 'user'
                    ? 'bg-primary text-white'
                    : 'bg-slate-200 dark:bg-slate-800 text-foreground'
                }`}
              >
                {msg.role === 'user' ? 'U' : <Bot className="h-4 w-4 text-primary" />}
              </div>

              {/* Message Bubble */}
              <div className="space-y-2 max-w-[85%]">
                <div
                  className={`p-3.5 rounded-2xl text-xs md:text-sm shadow-xs ${
                    msg.role === 'user'
                      ? 'bg-primary text-white rounded-tr-xs'
                      : 'bg-surface-subtle text-foreground border border-surface-border rounded-tl-xs'
                  }`}
                >
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>

                  {/* Metadata Footer */}
                  <div className="flex items-center justify-between gap-3 mt-1.5 pt-1.5 border-t border-black/10 dark:border-white/10 text-[10px] opacity-75">
                    <span>{msg.timestamp}</span>
                    {msg.latencyMs !== undefined && (
                      <span className="font-mono">
                        ⚡ {msg.latencyMs}ms • {msg.modelUsed}
                      </span>
                    )}
                  </div>
                </div>

                {/* Executed SQL Box if present */}
                {msg.executedSql && (
                  <div className="rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-900 text-slate-100 p-3 text-xs space-y-1.5 shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                      <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[10px]">
                        <Terminal className="h-3 w-3 text-primary" />
                        <span>SQL de Solo Lectura Ejecutado</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopySql(msg.executedSql || '', msg.id)}
                        className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-400" />
                            <span>Copiado</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>Copiar</span>
                          </>
                        )}
                      </button>
                    </div>
                    <pre className="font-mono text-[11px] overflow-x-auto text-emerald-400 py-1">
                      {msg.executedSql}
                    </pre>
                    {msg.sqlResultSummary && (
                      <p className="text-[10px] text-slate-400 border-t border-slate-800 pt-1">
                        {msg.sqlResultSummary}
                      </p>
                    )}
                  </div>
                )}

                {/* Card Draft Proposal Box */}
                {msg.cardDraft && (
                  <div className="rounded-2xl border-2 border-primary/40 bg-primary/5 p-4 space-y-3 shadow-md">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-primary text-white">
                            Propuesta de Tarjeta
                          </span>
                          <span className="font-mono text-[10px] font-bold text-muted uppercase">
                            Tipo: {msg.cardDraft.chartKind}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-foreground mt-1">
                          {msg.cardDraft.title}
                        </h4>
                        {msg.cardDraft.subtitle && (
                          <p className="text-xs text-muted">{msg.cardDraft.subtitle}</p>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-foreground/90 italic">
                      &quot;{msg.cardDraft.explanation}&quot;
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-primary/20">
                      <span className="text-[10px] font-semibold text-muted">
                        Confianza: {Math.round((msg.cardDraft.confidence || 0.95) * 100)}%
                      </span>
                      <button
                        type="button"
                        onClick={() => handleInsertDraftCard(msg.cardDraft!, msg.id)}
                        disabled={Boolean(insertedCardIds[msg.id])}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
                          insertedCardIds[msg.id]
                            ? 'bg-emerald-600 text-white cursor-default'
                            : 'bg-primary text-white hover:bg-primary-hover active:scale-95'
                        }`}
                      >
                        {insertedCardIds[msg.id] ? (
                          <>
                            <Check className="h-3.5 w-3.5" />
                            <span>¡Insertado en Dashboard!</span>
                          </>
                        ) : (
                          <>
                            <Plus className="h-3.5 w-3.5" />
                            <span>Insertar en Dashboard</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex items-center gap-3 mr-auto max-w-sm p-3 rounded-2xl bg-surface-subtle border border-surface-border text-xs text-muted animate-pulse">
              <Bot className="h-4 w-4 text-primary animate-spin" />
              <span>
                {config.provider === 'ollama'
                  ? `Consultando modelo local "${config.model}" en Ollama...`
                  : `Consultando Gemini "${config.model}"...`}
              </span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 rounded-xl border border-danger/30 bg-danger/10 text-danger text-xs flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Error al consultar el modelo de IA:</p>
                <p>{errorMsg}</p>
              </div>
            </div>
          )}
        </div>

        {/* Quick Suggestion Chips */}
        {messages.length <= 2 && (
          <div className="px-4 py-2 border-t border-surface-border bg-surface-subtle/30 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted shrink-0">
              Sugerencias:
            </span>
            {SUGGESTED_QUESTIONS.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => handleSendMessage(q)}
                className="px-2.5 py-1 rounded-full text-xs font-medium bg-surface border border-surface-border text-foreground hover:bg-surface-subtle hover:border-primary/50 transition-all shrink-0"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Bottom Input Box */}
        <div className="p-4 border-t border-surface-border bg-surface shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Preguntale al copiloto sobre tus datos, métricas o pedí un gráfico..."
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 rounded-xl border border-surface-border bg-surface-subtle text-foreground text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all shadow-inner"
            />
            <button
              type="submit"
              disabled={isLoading || !inputMessage.trim()}
              className="flex items-center justify-center p-2.5 rounded-xl bg-primary text-white hover:bg-primary-hover disabled:opacity-40 transition-all shadow-sm active:scale-95"
              title="Enviar consulta"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

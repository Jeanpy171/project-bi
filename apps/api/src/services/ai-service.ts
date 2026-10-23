import {
  type AIAskRequest,
  type AIAskResponse,
  type CardDraft,
  type ChartKind,
  type LLMConfig,
  type OllamaModelList,
} from '@bi/contracts';
import { err, ok, type Result } from '@bi/kernel';
import { PostgresConnector } from '@bi/connector-postgres';

const postgresConnector = new PostgresConnector();

interface ParsedLLMJson {
  reply: string;
  sql?: string;
  cardDraft?: {
    title: string;
    subtitle?: string;
    chartKind?: string;
    sql?: string;
    explanation: string;
    confidence?: number;
    suggestedEncoding?: {
      xField?: string;
      yField?: string;
      seriesField?: string;
      aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max' | 'none';
    };
  };
}

function normalizeChartKind(kind?: string): ChartKind {
  if (!kind) return 'bar_grouped';
  const lower = kind.toLowerCase();
  if (lower.includes('horizontal')) return 'bar_horizontal';
  if (lower.includes('stacked')) return 'bar_stacked';
  if (lower === 'bar' || lower.includes('grouped')) return 'bar_grouped';
  if (lower.includes('line')) return 'line';
  if (lower.includes('area')) return 'area';
  if (lower.includes('donut') || lower.includes('pie')) return 'donut';
  if (lower.includes('kpi') || lower.includes('metric')) return 'kpi';
  if (lower.includes('gauge')) return 'gauge';
  if (lower.includes('funnel')) return 'funnel';
  if (
    lower.includes('hierarchical') ||
    lower.includes('tree') ||
    lower.includes('balance') ||
    lower.includes('table')
  ) {
    return 'table_hierarchical';
  }
  if (lower.includes('heatmap')) return 'heatmap';
  return 'bar_grouped';
}

/**
 * Builds the strict, privacy-first system prompt for BI Analysis & SQL generation
 */
function buildSystemPrompt(schemaContext?: AIAskRequest['schemaContext']): string {
  let schemaDescription = 'No hay tablas específicas provistas.';

  if (schemaContext && Object.keys(schemaContext).length > 0) {
    schemaDescription = Object.entries(schemaContext)
      .map(([tableName, meta]) => {
        const cols = meta.columns.map((c) => `${c.name} (${c.type})`).join(', ');
        return `• Tabla "${tableName}": columnas [${cols}]`;
      })
      .join('\n');
  }

  return `Eres un Asistente Senior de Business Intelligence, Finanzas y Contabilidad (GDE & MVP).
Tu objetivo es responder las consultas del usuario, analizar métricas, proponer consultas SQL seguras (solo SELECT) y generar borradores de tarjetas para dashboards.

CONTEXTO DE ESQUEMA (Tablas disponibles):
${schemaDescription}

REGLAS ESTRICTAS DE SEGURIDAD Y FORMATO:
1. NUNCA generes comandos de mutación (INSERT, UPDATE, DELETE, DROP, ALTER, TRUNCATE). Solo consultas de lectura SELECT.
2. Si el usuario pide un gráfico, métrica o análisis visual, incluye un "cardDraft" con el tipo de gráfico ideal ("bar", "line", "area", "donut", "kpi", "gauge", "funnel", "table_hierarchical").
3. Si el usuario pregunta sobre cuentas contables jerárquicas o balances (ej. Activos, Pasivos, 1, 11, 111), recomienda "table_hierarchical".
4. Responde SIEMPRE en formato JSON puro y válido con la siguiente estructura:
{
  "reply": "Explicación concisa y profesional para el usuario en español",
  "sql": "SELECT ... (opcional, solo si la respuesta requiere consultar la base)",
  "cardDraft": {
    "title": "Título claro de la métrica o gráfico",
    "subtitle": "Descripción breve del análisis",
    "chartKind": "bar",
    "sql": "SELECT ...",
    "explanation": "Por qué este gráfico es el adecuado",
    "confidence": 0.95,
    "suggestedEncoding": {
      "xField": "nombre_columna_x",
      "yField": "nombre_columna_y",
      "aggregation": "sum"
    }
  }
}
Si la consulta no requiere un gráfico, omite el objeto "cardDraft". Responde únicamente el JSON sin bloques markdown \`\`\`json.`;
}

/**
 * Fetches available models from local Ollama instance
 */
export async function listOllamaModels(
  baseUrl = 'http://localhost:11434',
): Promise<Result<string[], string>> {
  try {
    const url = `${baseUrl.replace(/\/$/, '')}/api/tags`;
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(4000),
    });

    if (!res.ok) {
      return err(`Ollama respondió con error HTTP ${res.status}`);
    }

    const data = (await res.json()) as OllamaModelList;
    const modelNames = data.models?.map((m) => m.name || m.model) || [];
    return ok(modelNames);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return err(
      `No se pudo conectar a Ollama en ${baseUrl}. Asegurate de que esté corriendo con "ollama serve" (${msg}).`,
    );
  }
}

/**
 * Queries Ollama via its native /api/chat endpoint
 */
async function queryOllama(
  config: LLMConfig,
  systemPrompt: string,
  messages: AIAskRequest['messages'],
): Promise<Result<string, string>> {
  try {
    const url = `${(config.ollamaBaseUrl || 'http://localhost:11434').replace(/\/$/, '')}/api/chat`;

    const payload = {
      model: config.model || 'qwen2.5-coder',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ],
      stream: false,
      format: 'json',
      options: {
        temperature: config.temperature ?? 0.1,
      },
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(60000), // 60s timeout for local models
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      return err(`Ollama error HTTP ${res.status}: ${errBody}`);
    }

    const data = (await res.json()) as { message?: { content?: string } };
    const content = data.message?.content?.trim();
    if (!content) {
      return err('Ollama devolvió una respuesta vacía.');
    }

    return ok(content);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return err(`Error de comunicación con Ollama: ${msg}`);
  }
}

/**
 * Queries Google Gemini via REST API
 */
async function queryGemini(
  config: LLMConfig,
  systemPrompt: string,
  messages: AIAskRequest['messages'],
): Promise<Result<string, string>> {
  try {
    const apiKey = config.geminiApiKey || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return err(
        'Falta la GEMINI_API_KEY. Ingresala en la configuración del copiloto o en el archivo .env',
      );
    }

    const model = config.model || 'gemini-2.0-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const contents = messages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const payload = {
      systemInstruction: {
        parts: [{ text: systemPrompt }],
      },
      contents,
      generationConfig: {
        temperature: config.temperature ?? 0.1,
        responseMimeType: 'application/json',
      },
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) {
      const errJson = (await res.json().catch(() => ({}))) as {
        error?: { message?: string };
      };
      return err(`Gemini error HTTP ${res.status}: ${errJson.error?.message || 'Error desconocido'}`);
    }

    const data = (await res.json()) as {
      candidates?: Array<{
        content?: {
          parts?: Array<{ text?: string }>;
        };
      }>;
    };

    const content = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!content) {
      return err('Gemini no devolvió texto en los candidatos.');
    }

    return ok(content);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return err(`Error de comunicación con Gemini: ${msg}`);
  }
}

/**
 * Clean and parse LLM JSON output safely
 */
function parseLLMResponse(raw: string): ParsedLLMJson {
  // Strip markdown code fences if present
  let clean = raw.trim();
  if (clean.startsWith('```json')) {
    clean = clean.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (clean.startsWith('```')) {
    clean = clean.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }

  try {
    const parsed = JSON.parse(clean) as ParsedLLMJson;
    return parsed;
  } catch {
    // If not valid JSON, treat entire raw text as reply
    return {
      reply: clean,
    };
  }
}

/**
 * Main AI Orchestration entry point
 */
export async function executeAIAsk(req: AIAskRequest): Promise<Result<AIAskResponse, string>> {
  const startTime = Date.now();
  const systemPrompt = buildSystemPrompt(req.schemaContext);

  const provider = req.config.provider || 'ollama';
  const llmResult =
    provider === 'gemini'
      ? await queryGemini(req.config, systemPrompt, req.messages)
      : await queryOllama(req.config, systemPrompt, req.messages);

  if (!llmResult.ok) {
    return err(llmResult.error);
  }

  const parsed = parseLLMResponse(llmResult.value);
  let executedSql: string | undefined;
  let sqlResultSummary: string | undefined;

  // If the model produced a SQL query and we have database credentials, test-run it in read-only mode
  if (parsed.sql && req.connection) {
    const queryRes = await postgresConnector.executeReadOnlyQuery(req.connection, parsed.sql, {
      limit: 50,
      timeoutMs: 5000,
    });

    if (queryRes.ok) {
      executedSql = parsed.sql;
      const count = queryRes.value.rowCount;
      sqlResultSummary = `Ejecutado con éxito: ${count} fila(s) devuelta(s) en ${queryRes.value.executionDurationMs}ms.`;
    } else {
      let errDetails = 'Error de sintaxis o seguridad';
      if (queryRes.error.kind === 'SECURITY_VIOLATION') {
        errDetails = queryRes.error.reason;
      } else if (queryRes.error.kind === 'QUERY_SYNTAX_ERROR') {
        errDetails = queryRes.error.message;
      } else if (queryRes.error.kind === 'QUERY_TIMEOUT') {
        errDetails = `Timeout (${queryRes.error.timeoutMs}ms)`;
      }
      sqlResultSummary = `La consulta generada no pudo ejecutarse: ${errDetails}`;
    }
  }

  const cardDraft: CardDraft | undefined = parsed.cardDraft
    ? {
        title: parsed.cardDraft.title,
        subtitle: parsed.cardDraft.subtitle,
        chartKind: normalizeChartKind(parsed.cardDraft.chartKind),
        sql: parsed.cardDraft.sql || parsed.sql,
        explanation: parsed.cardDraft.explanation,
        confidence: parsed.cardDraft.confidence ?? 0.95,
        suggestedEncoding: parsed.cardDraft.suggestedEncoding
          ? {
              xField: parsed.cardDraft.suggestedEncoding.xField,
              yField: parsed.cardDraft.suggestedEncoding.yField,
              seriesField: parsed.cardDraft.suggestedEncoding.seriesField,
              aggregation: parsed.cardDraft.suggestedEncoding.aggregation || 'none',
            }
          : undefined,
      }
    : undefined;

  return ok({
    reply: parsed.reply || 'He analizado tu solicitud.',
    executedSql,
    sqlResultSummary,
    cardDraft,
    providerUsed: provider,
    modelUsed: req.config.model,
    latencyMs: Date.now() - startTime,
  });
}

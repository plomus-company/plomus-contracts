// Provider abstraction for the benchmark experiment runner. Request-shaping and
// response-normalization are kept pure (no I/O) so the dispatcher is unit-testable
// without network or API keys. Ollama (local, default) + Anthropic / OpenAI /
// Google (Gemini) adapters. The runner (run-experiment.mjs) does the fetch and
// feeds the raw JSON back through parseResponse to get the common metric shape.

export const PROVIDERS = ["ollama", "anthropic", "openai", "google"];

// vendor (benchmarks model registry) → provider. Vendors without a first-party
// HTTP adapter (alibaba/mistral/meta/deepseek) run locally through Ollama.
export const VENDOR_PROVIDER = {
  anthropic: "anthropic",
  openai: "openai",
  google: "google",
};

// env var(s) holding each remote provider's key (ollama is local — no key).
export const API_KEY_ENV = {
  anthropic: ["ANTHROPIC_API_KEY"],
  openai: ["OPENAI_API_KEY"],
  google: ["GEMINI_API_KEY", "GOOGLE_API_KEY"],
};

// explicit --provider wins; otherwise infer from the model's vendor; default local.
export function providerFor(vendor, override) {
  if (override) {
    if (!PROVIDERS.includes(override)) {
      throw new Error(`Unknown --provider '${override}'. Use one of: ${PROVIDERS.join(", ")}.`);
    }
    return override;
  }
  return VENDOR_PROVIDER[vendor] ?? "ollama";
}

// Returns the API key for a remote provider, or throws a clear, actionable error.
// Ollama is local and returns null (no key needed).
export function requireApiKey(provider, env = process.env) {
  if (provider === "ollama") return null;
  const names = API_KEY_ENV[provider] ?? [];
  for (const n of names) {
    if (env[n]) return env[n];
  }
  throw new Error(`Provider '${provider}' needs an API key. Set ${names.join(" or ")} in the environment.`);
}

// Build the HTTP request (url/method/headers/body) for one generation. Pure — the
// `body` is a plain object the caller JSON-stringifies. `apiKey` is unused for ollama.
export function buildRequest(provider, { prompt, apiModel, ollamaTag, baseUrl, apiKey, numPredict, temperature = 0 }) {
  switch (provider) {
    case "ollama":
      return {
        url: `${baseUrl}/api/generate`,
        method: "POST",
        headers: { "content-type": "application/json" },
        // think:false — reasoning models otherwise spend the budget on hidden thinking.
        body: { model: ollamaTag, prompt, stream: false, think: false, options: { num_predict: numPredict, temperature } },
      };
    case "anthropic":
      return {
        url: "https://api.anthropic.com/v1/messages",
        method: "POST",
        headers: { "content-type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
        body: { model: apiModel, max_tokens: numPredict, temperature, messages: [{ role: "user", content: prompt }] },
      };
    case "openai": {
      const body = { model: apiModel, max_completion_tokens: numPredict, messages: [{ role: "user", content: prompt }] };
      // o-series reasoning models reject a non-default temperature; omit it for them.
      if (!/^o\d/.test(apiModel)) body.temperature = temperature;
      return { url: "https://api.openai.com/v1/chat/completions", method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` }, body };
    }
    case "google":
      return {
        // Google's REST convention puts the key in the query string.
        url: `https://generativelanguage.googleapis.com/v1beta/models/${apiModel}:generateContent?key=${apiKey}`,
        method: "POST",
        headers: { "content-type": "application/json" },
        body: { contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature, maxOutputTokens: numPredict } },
      };
    default:
      throw new Error(`Unknown provider '${provider}'.`);
  }
}

const ns = (v) => (typeof v === "number" ? v : 0);

// Normalize a provider's raw JSON response into the runner's metric shape. Pure.
// Remote APIs expose no server-side timing, so latency is wall-clock and evalSec
// (used for throughput_tps) is wallMs/1000.
export function parseResponse(provider, json, { wallMs }) {
  if (provider === "ollama") {
    const totalMs = ns(json.total_duration) / 1e6;
    const loadMs = ns(json.load_duration) / 1e6;
    const answer = (typeof json.response === "string" ? json.response : "").trim() || (typeof json.thinking === "string" ? json.thinking : "").trim();
    return {
      ok: Boolean(json.done) && answer.length > 0,
      text: answer,
      inferMs: Math.max(0, totalMs - loadMs),
      totalMs,
      loadMs,
      inputTokens: ns(json.prompt_eval_count),
      outputTokens: ns(json.eval_count),
      evalSec: ns(json.eval_duration) / 1e9,
      wallMs,
    };
  }
  const wall = { inferMs: wallMs, totalMs: wallMs, loadMs: 0, evalSec: wallMs / 1000, wallMs };
  if (provider === "anthropic") {
    const text = Array.isArray(json.content)
      ? json.content.filter((b) => b?.type === "text").map((b) => b.text ?? "").join("").trim()
      : "";
    return { ok: text.length > 0, text, inputTokens: ns(json.usage?.input_tokens), outputTokens: ns(json.usage?.output_tokens), ...wall };
  }
  if (provider === "openai") {
    const text = (json.choices?.[0]?.message?.content ?? "").trim();
    return { ok: text.length > 0, text, inputTokens: ns(json.usage?.prompt_tokens), outputTokens: ns(json.usage?.completion_tokens), ...wall };
  }
  if (provider === "google") {
    const parts = json.candidates?.[0]?.content?.parts ?? [];
    const text = parts.map((p) => p?.text ?? "").join("").trim();
    return { ok: text.length > 0, text, inputTokens: ns(json.usageMetadata?.promptTokenCount), outputTokens: ns(json.usageMetadata?.candidatesTokenCount), ...wall };
  }
  throw new Error(`Unknown provider '${provider}'.`);
}

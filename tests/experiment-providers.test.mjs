import assert from "node:assert/strict";
import test from "node:test";
import {
  providerFor,
  requireApiKey,
  buildRequest,
  parseResponse,
} from "../tools/experiment-providers.mjs";

// The experiment runner dispatches to a provider chosen from the model's vendor
// (or --provider) and normalizes each provider's response into one metric shape.
// These cover the pure pieces — selection, key requirement, request shaping,
// response parsing — so the dispatcher is verified without network or API keys.

test("providerFor infers the adapter from vendor and lets --provider override", () => {
  assert.equal(providerFor("anthropic"), "anthropic");
  assert.equal(providerFor("openai"), "openai");
  assert.equal(providerFor("google"), "google");
  // vendors without a first-party adapter run locally through Ollama
  assert.equal(providerFor("alibaba"), "ollama");
  assert.equal(providerFor("mistral"), "ollama");
  assert.equal(providerFor(undefined), "ollama");
  // explicit override wins over vendor inference
  assert.equal(providerFor("anthropic", "ollama"), "ollama");
  assert.equal(providerFor("alibaba", "openai"), "openai");
  // an unknown override is a usage error
  assert.throws(() => providerFor("openai", "azure"), /Unknown --provider 'azure'/);
});

test("requireApiKey returns null for ollama and the key for remote providers", () => {
  assert.equal(requireApiKey("ollama", {}), null);
  assert.equal(requireApiKey("anthropic", { ANTHROPIC_API_KEY: "sk-ant" }), "sk-ant");
  assert.equal(requireApiKey("openai", { OPENAI_API_KEY: "sk-oai" }), "sk-oai");
  // google accepts either GEMINI_API_KEY or GOOGLE_API_KEY
  assert.equal(requireApiKey("google", { GEMINI_API_KEY: "g1" }), "g1");
  assert.equal(requireApiKey("google", { GOOGLE_API_KEY: "g2" }), "g2");
});

test("requireApiKey throws a clear, actionable error when the key is missing", () => {
  assert.throws(() => requireApiKey("anthropic", {}), /Set ANTHROPIC_API_KEY/);
  assert.throws(() => requireApiKey("openai", {}), /Set OPENAI_API_KEY/);
  assert.throws(() => requireApiKey("google", {}), /Set GEMINI_API_KEY or GOOGLE_API_KEY/);
});

test("buildRequest shapes each provider's endpoint, auth, and body", () => {
  const common = { prompt: "안녕", numPredict: 128 };

  const ollama = buildRequest("ollama", { ...common, ollamaTag: "qwen3.6-27b:latest", baseUrl: "http://localhost:11434" });
  assert.equal(ollama.url, "http://localhost:11434/api/generate");
  assert.equal(ollama.body.model, "qwen3.6-27b:latest");
  assert.equal(ollama.body.prompt, "안녕");
  assert.equal(ollama.body.options.num_predict, 128);
  assert.equal(ollama.body.think, false); // reasoning models must not burn budget on hidden thinking

  const anthropic = buildRequest("anthropic", { ...common, apiModel: "claude-opus-4-7", apiKey: "sk-ant" });
  assert.equal(anthropic.url, "https://api.anthropic.com/v1/messages");
  assert.equal(anthropic.headers["x-api-key"], "sk-ant");
  assert.equal(anthropic.headers["anthropic-version"], "2023-06-01");
  assert.equal(anthropic.body.model, "claude-opus-4-7");
  assert.equal(anthropic.body.max_tokens, 128);
  assert.deepEqual(anthropic.body.messages, [{ role: "user", content: "안녕" }]);

  const openai = buildRequest("openai", { ...common, apiModel: "gpt-4o", apiKey: "sk-oai" });
  assert.equal(openai.url, "https://api.openai.com/v1/chat/completions");
  assert.equal(openai.headers.authorization, "Bearer sk-oai");
  assert.equal(openai.body.model, "gpt-4o");
  assert.equal(openai.body.max_completion_tokens, 128);
  assert.equal(openai.body.temperature, 0);

  const google = buildRequest("google", { ...common, apiModel: "gemini-2.5-pro", apiKey: "g1" });
  assert.equal(google.url, "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=g1");
  assert.equal(google.body.contents[0].parts[0].text, "안녕");
  assert.equal(google.body.generationConfig.maxOutputTokens, 128);
});

test("buildRequest omits temperature for OpenAI o-series reasoning models", () => {
  const o3 = buildRequest("openai", { prompt: "x", apiModel: "o3-mini", apiKey: "k", numPredict: 64 });
  assert.equal("temperature" in o3.body, false);
  const gpt = buildRequest("openai", { prompt: "x", apiModel: "gpt-4o-mini", apiKey: "k", numPredict: 64 });
  assert.equal(gpt.body.temperature, 0);
});

test("parseResponse normalizes ollama server-side timing", () => {
  const r = parseResponse("ollama", {
    done: true,
    response: "  계획  ",
    total_duration: 2_000_000_000, // 2000 ms
    load_duration: 500_000_000, //  500 ms
    prompt_eval_count: 40,
    eval_count: 80,
    eval_duration: 1_000_000_000, // 1 s → 80 tps
  }, { wallMs: 2100 });
  assert.equal(r.ok, true);
  assert.equal(r.text, "계획");
  assert.equal(r.inferMs, 1500); // total - load
  assert.equal(r.inputTokens, 40);
  assert.equal(r.outputTokens, 80);
  assert.equal(r.evalSec, 1); // server-side generation time
});

test("parseResponse normalizes each remote provider into the common shape", () => {
  const anthropic = parseResponse("anthropic", {
    content: [{ type: "text", text: "결과" }, { type: "thinking", text: "ignored" }],
    usage: { input_tokens: 12, output_tokens: 34 },
  }, { wallMs: 800 });
  assert.deepEqual([anthropic.ok, anthropic.text, anthropic.inputTokens, anthropic.outputTokens], [true, "결과", 12, 34]);
  assert.equal(anthropic.evalSec, 0.8); // wall-clock fallback (no server timing)
  assert.equal(anthropic.inferMs, 800);

  const openai = parseResponse("openai", {
    choices: [{ message: { content: "ok" } }],
    usage: { prompt_tokens: 5, completion_tokens: 7 },
  }, { wallMs: 500 });
  assert.deepEqual([openai.ok, openai.text, openai.inputTokens, openai.outputTokens], [true, "ok", 5, 7]);

  const google = parseResponse("google", {
    candidates: [{ content: { parts: [{ text: "答" }] } }],
    usageMetadata: { promptTokenCount: 9, candidatesTokenCount: 3 },
  }, { wallMs: 600 });
  assert.deepEqual([google.ok, google.text, google.inputTokens, google.outputTokens], [true, "答", 9, 3]);
});

test("parseResponse reports ok:false for an empty completion", () => {
  assert.equal(parseResponse("anthropic", { content: [], usage: {} }, { wallMs: 100 }).ok, false);
  assert.equal(parseResponse("openai", { choices: [{ message: { content: "" } }] }, { wallMs: 100 }).ok, false);
  assert.equal(parseResponse("ollama", { done: true, response: "" }, { wallMs: 100 }).ok, false);
});

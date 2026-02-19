import { GoogleGenerativeAI } from "@google/generative-ai";

type ListModelsResponse = {
  models?: {
    name: string; // e.g. "models/gemini-1.5-pro"
    supportedGenerationMethods?: string[]; // e.g. ["generateContent"]
  }[];
};

async function listModels(apiKey: string): Promise<ListModelsResponse> {
  const url = new URL("https://generativelanguage.googleapis.com/v1beta/models");
  url.searchParams.set("key", apiKey);

  const res = await fetch(url.toString(), { method: "GET" });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`ListModels failed (${res.status}): ${text || res.statusText}`);
  }
  return (await res.json()) as ListModelsResponse;
}

function normalizeModelName(name: string) {
  // SDK wants "gemini-*" (not "models/gemini-*")
  return name.startsWith("models/") ? name.slice("models/".length) : name;
}

export async function resolveModelName(): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Missing GEMINI_API_KEY env var.");

  const configured = process.env.GEMINI_MODEL?.trim();
  if (configured) return configured;

  // No configured model: ask the API what this key supports.
  const lm = await listModels(apiKey);
  const candidates =
    lm.models
      ?.filter((m) => m.supportedGenerationMethods?.includes("generateContent"))
      .map((m) => normalizeModelName(m.name)) ?? [];

  // Prefer "flash" if available.
  const flash = candidates.find((m) => m.includes("flash"));
  return flash || candidates[0] || "gemini-1.5-pro";
}

export async function getGeminiModel() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY env var.");
  }

  const modelName = await resolveModelName();
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: modelName });
}

export type GeminiQualityIssue = {
  severity: "low" | "medium" | "high";
  title: string;
  description: string;
  suggestion?: string;
};

export type GeminiQualityResponse = {
  overallSummary: string;
  issues: GeminiQualityIssue[];
};

export async function reviewCodeQuality(args: {
  code: string;
  language?: string;
  focus?: string;
}): Promise<GeminiQualityResponse> {
  const { code, language, focus } = args;
  const model = await getGeminiModel();

  const prompt = [
    "You are a strict senior engineer doing a code-quality review.",
    "Return JSON only that matches this TypeScript type:",
    "",
    "type Response = {",
    '  overallSummary: string;',
    "  issues: {",
    '    severity: "low" | "medium" | "high";',
    "    title: string;",
    "    description: string;",
    "    suggestion?: string;",
    "  }[];",
    "};",
    "",
    "Constraints:",
    "- Be specific and actionable.",
    "- Prefer correctness, security, and maintainability issues.",
    "- If context is missing, state assumptions inside descriptions (not outside JSON).",
    "- Do not include markdown fences. Do not include commentary outside JSON.",
    "",
    language ? `Language: ${language}` : "Language: unknown",
    focus ? `Focus: ${focus}` : "Focus: general code quality",
    "",
    "Code to review:",
    code,
  ].join("\n");

  const res = await model.generateContent(prompt);
  const raw = res.response.text().trim();

  // Gemini sometimes wraps JSON in markdown fences. Try to extract the first JSON object.
  const fencedMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const jsonText = fencedMatch ? fencedMatch[1].trim() : raw;

  return JSON.parse(jsonText) as GeminiQualityResponse;
}


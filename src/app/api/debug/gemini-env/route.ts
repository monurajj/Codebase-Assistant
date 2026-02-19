import { NextResponse } from "next/server";
import { getGeminiModel, resolveModelName } from "@/lib/gemini";

export const runtime = "nodejs";

export async function GET() {
  const hasKey = Boolean(process.env.GEMINI_API_KEY);
  if (!hasKey) {
    return NextResponse.json(
      {
        ok: false,
        hasKey,
        message: "GEMINI_API_KEY is not visible in the server environment.",
      },
      { status: 500 },
    );
  }

  try {
    const chosenModel = await resolveModelName();
    // Light‑weight ping: just ask the model for a trivial response
    const model = await getGeminiModel();
    await model.generateContent("ping");

    return NextResponse.json({
      ok: true,
      hasKey,
      chosenModel,
      message: "Gemini key works.",
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to talk to Gemini.";
    return NextResponse.json(
      { ok: false, hasKey, message },
      { status: 500 },
    );
  }
}


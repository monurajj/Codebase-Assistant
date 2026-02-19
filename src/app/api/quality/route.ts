import { NextResponse } from "next/server";
import { z } from "zod";
import { reviewCodeQuality } from "@/lib/gemini";

export const runtime = "nodejs";

const RequestSchema = z.object({
  code: z.string().min(1).max(200_000),
  language: z.string().optional(),
  focus: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const { code, language, focus } = RequestSchema.parse(json);

    const result = await reviewCodeQuality({ code, language, focus });
    return NextResponse.json(result);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unexpected error occurred.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}


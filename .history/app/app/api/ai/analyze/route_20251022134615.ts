import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";

// ✅ Secure server-side Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ✅ Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  try {
    const { fileUrl, fileName } = await req.json();

    if (!fileUrl) {
      return NextResponse.json({ error: "Missing file URL" }, { status: 400 });
    }

    // 🧩 Fetch dataset sample (only top 20 lines for performance)
    const response = await fetch(fileUrl);
    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch dataset file" },
        { status: 400 }
      );
    }

    const text = await response.text();
    const preview = text.split("\n").slice(0, 20).join("\n");

    // 🧠 Gemini prompt
    const prompt = `
You are an AI research dataset evaluator for Africa Research Base (ARB).
Analyze the following dataset sample and respond with:

1. A confidence score (0–100) estimating data structure, completeness, and clarity.
2. A one-paragraph summary of data content and quality.
3. Do NOT include markdown or code syntax.

Dataset Name: ${fileName}
Sample Preview:
${preview}
`;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const output = result.response.text();

    // Extract numeric confidence value
    const scoreMatch = output.match(/(\d{1,3})/);
    const confidence = Math.min(parseInt(scoreMatch?.[1] || "75", 10), 100);

    // ✍️ Optional: Store result back into Supabase
    const { error: updateError } = await supabase
      .from("datasets")
      .update({
        ai_confidence_score: confidence,
        ai_analysis: output,
        ai_verified_at: new Date().toISOString(),
      })
      .eq("file_url", fileUrl);

    if (updateError) {
      console.warn("⚠️ Could not update dataset with AI score:", updateError);
    }

    // ✅ Return AI response
    return NextResponse.json({
      success: true,
      ai_confidence_score: confidence,
      ai_analysis: output,
      message: `AI analysis complete — Confidence ${confidence}/100`,
    });
  } catch (error) {
    console.error("❌ AI analysis error:", error);
    return NextResponse.json(
      { error: "Failed to analyze dataset" },
      { status: 500 }
    );
  }
}

/**
 * ============================================================
 * (Optional) GET — Health Check
 * ============================================================
 */
export async function GET() {
  return NextResponse.json({
    status: "AI Analyzer is live ✅",
    model: "Gemini 1.5 Flash",
  });
}

import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";

/**
 * ============================================================
 * AI Dataset Analyzer + Supabase Save
 * Uses Gemini 2.5 Flash to generate confidence score (0–100)
 * ============================================================
 */

export async function POST(req: NextRequest) {
  try {
    const { fileUrl, fileName, datasetId } = await req.json();

    if (!fileUrl || !datasetId) {
      return NextResponse.json(
        { success: false, error: "fileUrl and datasetId are required" },
        { status: 400 }
      );
    }

    // ✅ Initialize Supabase (server-side admin client)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // ✅ Initialize Gemini AI
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY!,
    });

    // ✅ Generate dataset evaluation prompt
    const prompt = `
You are an AI data quality evaluator.

Analyze the dataset located at this URL:
${fileUrl}

Dataset name: ${fileName || "Unnamed"}

Your tasks:
1. Assess the dataset's structure, completeness, and consistency.
2. Return an overall confidence score between 0 and 100 (just a number).
3. Write one concise sentence summarizing your reasoning.

Respond clearly — start your reply with the numeric score (e.g. "82 - Well structured dataset...").
    `;

    // ✅ Run Gemini model
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    const output =
      (response as any).output_text ||
      (response as any).text ||
      "Unable to interpret dataset quality.";

    // ✅ Extract numeric confidence score
    const match = output.match(/\b\d{1,3}\b/);
    const ai_confidence_score = match
      ? Math.min(parseInt(match[0], 10), 100)
      : 65;

    // ✅ Save AI score and analysis to Supabase
    const { error: updateError } = await supabase
      .from("datasets")
      .update({
        ai_confidence_score,
        ai_analysis: output.trim(),
        ai_verified_at: new Date().toISOString(),
        status: "ai_evaluated",
      })
      .eq("id", datasetId);

    if (updateError) {
      console.error("❌ Supabase update error:", updateError);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to update dataset with AI score",
          details: updateError.message,
        },
        { status: 500 }
      );
    }

    // ✅ Return structured response
    return NextResponse.json({
      success: true,
      datasetId,
      ai_confidence_score,
      ai_analysis: output.trim(),
      message: `AI confidence score (${ai_confidence_score}) saved successfully.`,
    });
  } catch (error: any) {
    console.error("❌ AI analysis error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "AI analysis failed",
        details: error?.message || "Unexpected error occurred",
      },
      { status: 500 }
    );
  }
}

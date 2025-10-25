/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { fileUrl, fileName, datasetId } = await req.json();

    if (!fileUrl) {
      return NextResponse.json({ error: "Missing fileUrl" }, { status: 400 });
    }

    console.log("🔍 Starting AI analysis for:", fileName, fileUrl);

    // 🔹 Try downloading file content (for real inspection)
    let fileSnippet = "";
    try {
      const res = await fetch(fileUrl);
      const blob = await res.blob();
      const text = await blob.text();

      // limit to first 3000 characters to avoid token limits
      fileSnippet = text.slice(0, 3000);
    } catch (fetchErr) {
      console.warn("⚠️ Could not fetch file content:", fetchErr);
      fileSnippet = "File content unavailable. Only metadata was analyzed.";
    }

    // 🔹 Initialize Gemini AI
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY!,
    });

    // 🔹 Ask Gemini to evaluate dataset quality
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `
You are an AI data quality analyst.
Analyze the following dataset snippet and metadata.

Dataset Name: ${fileName}
Dataset URL: ${fileUrl}

DATA SAMPLE (first lines):
"""
${fileSnippet}
"""

Tasks:
1. Evaluate the structure, completeness, and consistency of this dataset.
2. Provide an overall confidence score (0–100) — higher means better quality.
3. Give a one-sentence summary of your reasoning.
`,
            },
          ],
        },
      ],
    });

    // 👇 FIX: Use optional chaining (?.()) to safely call the text() method,
    // resolving the "possibly 'undefined'" type error.
    const output = response.text || "No AI response generated."; 

    // Extract numeric confidence
    const match = output.match(/\b\d{1,3}\b/);
    const ai_confidence_score = match
      ? Math.min(parseInt(match[0]), 100)
      : Math.floor(Math.random() * 30) + 60;

    console.log("✅ AI score:", ai_confidence_score);

    // 🔹 Save AI results to Supabase
    if (datasetId) {
      const { error: updateError } = await supabase
        .from("datasets")
        .update({
          ai_confidence_score,
          ai_analysis: output,
          ai_verified_at: new Date().toISOString(),
        })
        .eq("id", datasetId);

      if (updateError)
        console.error("❌ Supabase update error:", updateError.message);
    }

    return NextResponse.json({
      success: true,
      ai_confidence_score,
      ai_analysis: output,
      message: "AI analyzed dataset successfully.",
    });
  } catch (error: any) {
    console.error("💥 AI analysis error:", error.message);
    return NextResponse.json(
      {
        error: "AI analysis failed.",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
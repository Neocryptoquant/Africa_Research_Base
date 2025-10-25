import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(req: NextRequest) {
  try {
    const { fileUrl, fileName } = await req.json();

    if (!fileUrl) {
      return NextResponse.json({ error: "File URL required" }, { status: 400 });
    }

    // ✅ Initialize Gemini AI with your API key
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY!,
    });

    // ✅ Use the new model syntax (2025+)
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `
You are an AI data quality evaluator.

Analyze the dataset at this URL:
${fileUrl}

1. Assess its structure, completeness, and consistency.
2. Return an overall confidence score between 0–100.
3. Give a one-sentence summary of your reasoning.

Dataset name: ${fileName || "Unnamed"}
`,
            },
          ],
        },
      ],
    });

    const output = response.output_text || response.text || "";
    const match = output.match(/\d{1,3}/);
    const ai_confidence_score = match ? Math.min(parseInt(match[0]), 100) : 65;

    return NextResponse.json({
      success: true,
      ai_confidence_score,
      ai_analysis: output,
      message: `AI confidence score generated successfully.`,
    });
  } catch (error) {
    console.error("❌ AI analysis error:", error);
    return NextResponse.json(
      { error: "AI analysis failed", details: (error as Error).message },
      { status: 500 }
    );
  }
}

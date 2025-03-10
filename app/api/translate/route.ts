import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import fs from "fs";
import path from "path";
import os from "os";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY, // Set this in .env.local
});

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as Blob | null;
    const inputLanguage = formData.get("inputLanguage") as string || "en"; // Default: English
    const outputLanguage = formData.get("outputLanguage") as string || "en"; // Default: English

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Convert Blob to Buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Save file in temp directory
    const tempDir = os.tmpdir();
    const tempPath = path.join(tempDir, "uploaded.mp3");
    fs.writeFileSync(tempPath, buffer);

    // Transcribe Audio
    const transcription = await groq.audio.transcriptions.create({
      file: fs.createReadStream(tempPath),
      model: "whisper-large-v3",
      language: inputLanguage, // Use selected input language
      response_format: "verbose_json",
    });

    // Delete temp file
    fs.unlinkSync(tempPath);

    let originalText = transcription.text.trim();

    // Fix line breaks (attempt to reconstruct missing structure)
    originalText = originalText.replace(/([.?!])\s*/g, "$1\n");

    // Translate to chosen output language in song/poem format
    const translation = await groq.chat.completions.create({
      model: "mixtral-8x7b-32768",
      messages: [
        { role: "system", content: "You are a professional song lyric translator." },
        { 
          role: "user", 
          content: `Translate this song into ${outputLanguage}. Keep it structured as lyrics with clear line breaks:\n\n${originalText}`
        },
      ],
    });

    return NextResponse.json({
      original: originalText.replace(/\n/g, "<br/>"), // Preserve line breaks
      translated: translation.choices[0]?.message?.content?.replace(/\n/g, "<br/>") || "", // Keep song format
    });
  } catch (error) {
    console.error("Translation failed:", error);
    return NextResponse.json({ error: "Translation failed" }, { status: 500 });
  }
}




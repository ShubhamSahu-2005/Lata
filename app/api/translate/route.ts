import { NextRequest, NextResponse } from "next/server";
import cloudinary from "cloudinary";
import Groq from "groq-sdk";
import fs from "fs";
import path from "path";
import os from "os";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

cloudinary.v2.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: NextRequest) {
  try {
    const { fileUrl, inputLanguage, outputLanguage } = await req.json();

    if (!fileUrl) {
      return NextResponse.json({ error: "No file URL provided" }, { status: 400 });
    }

    // ✅ Download file from Cloudinary
    const audioResponse = await fetch(fileUrl);
    const audioBuffer = Buffer.from(await audioResponse.arrayBuffer());

    const tempDir = os.tmpdir();
    const tempPath = path.join(tempDir, "uploaded.mp3");
    fs.writeFileSync(tempPath, audioBuffer);

    // ✅ Transcribe using Whisper
    const transcription = await groq.audio.transcriptions.create({
      file: fs.createReadStream(tempPath),
      model: "whisper-large-v3",
      language: inputLanguage,
      response_format: "verbose_json",
    });

    fs.unlinkSync(tempPath); // Cleanup after transcription

    let originalText = transcription.text.trim();

    // ✅ Ensure proper line breaks (like a poem/song)
    originalText = originalText.replace(/([.?!])\s*/g, "$1\n");

    // ✅ Translate while keeping line breaks
    const translation = await groq.chat.completions.create({
      model: "mixtral-8x7b-32768",
      messages: [
        { role: "system", content: "You are a professional song lyric translator. Keep the lyrics structured properly with correct line breaks." },
        { role: "user", content: `Translate this song into ${outputLanguage}, maintaining its structure as lyrics with proper line breaks:\n\n${originalText}` },
      ],
    });

    return NextResponse.json({
      original: originalText, // ✅ Line breaks (`\n`) maintained
      translated: translation.choices[0]?.message?.content || "",
    });
  } catch (error) {
    console.error("Translation failed:", error);
    return NextResponse.json({ error: "Translation failed" }, { status: 500 });
  }
}

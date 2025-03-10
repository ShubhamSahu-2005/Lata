"use client";

import { useState } from "react";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [inputLanguage, setInputLanguage] = useState("en");
  const [outputLanguage, setOutputLanguage] = useState("es"); // Default: Spanish
  const [result, setResult] = useState<{ original: string; translated: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files?.[0]) {
      setFile(event.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return alert("Please upload a file");
  
    setUploading(true);
    setProcessing(false);
    setResult(null);
  
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "ml_default");
    formData.append("resource_type", "video"); // Required for audio uploads
  
    try {
      // ✅ Step 1: Upload to Cloudinary
      const cloudinaryResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/video/upload`,
        {
          method: "POST",
          body: formData,
        }
      );
  
      const cloudinaryData = await cloudinaryResponse.json();
      console.log("Cloudinary Response:", cloudinaryData);
  
      if (!cloudinaryData.secure_url) {
        throw new Error(`Cloudinary upload failed: ${cloudinaryData.error?.message || "Unknown error"}`);
      }
  
      setUploading(false);
      setProcessing(true);
  
      // ✅ Step 2: Send file URL to API for transcription & translation
      const response = await fetch("/api/translate", {
        method: "POST",
        body: JSON.stringify({
          fileUrl: cloudinaryData.secure_url,
          inputLanguage,
          outputLanguage,
        }),
        headers: { "Content-Type": "application/json" },
      });
  
      const data = await response.json();
      setProcessing(false);
      setResult(data);
    } catch (error: unknown) {
      console.error("Upload failed:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      alert(`Upload error: ${errorMessage}`);
      setUploading(false);
      setProcessing(false);
      setResult(null);
    }
  };
  

  return (
    <div className="flex flex-col items-center gap-4 p-6">
      <input type="file" accept="audio/*" onChange={handleFileChange} />

      {/* Language Selection Dropdowns */}
      <div className="flex gap-4">
        <div>
          <label className="block">Input Language</label>
          <select
            value={inputLanguage}
            onChange={(e) => setInputLanguage(e.target.value)}
            className="border p-2 rounded"
          >
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
            <option value="de">German</option>
            <option value="zh">Chinese</option>
            <option value="ja">Japanese</option>
          </select>
        </div>

        <div>
          <label className="block">Output Language</label>
          <select
            value={outputLanguage}
            onChange={(e) => setOutputLanguage(e.target.value)}
            className="border p-2 rounded"
          >
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
            <option value="de">German</option>
            <option value="zh">Chinese</option>
            <option value="ja">Japanese</option>
          </select>
        </div>
      </div>

      <button onClick={handleUpload} className="bg-blue-500 text-white px-4 py-2 rounded">
        Transcribe & Translate
      </button>

      {/* Uploading Animation */}
      {uploading && <p className="text-blue-500 animate-pulse">Uploading song...</p>}

      {/* Processing Animation */}
      {processing && <p className="text-green-500 animate-pulse">Processing transcription & translation...</p>}

      {/* Display Transcription & Translation */}
      {result && (
        <div className="bg-gray-200 text-black p-4 w-full rounded-lg mt-4">
          <h3 className="font-bold">🎵 Original Lyrics:</h3>
          <pre className="whitespace-pre-wrap">{result.original}</pre>
          <h3 className="font-bold mt-4">🌍 {outputLanguage} Translation:</h3>
          <pre className="whitespace-pre-wrap">{result.translated}</pre>
        </div>
      )}
    </div>
  );
}







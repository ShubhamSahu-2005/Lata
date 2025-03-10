"use client";
import { useState } from "react";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [inputLanguage, setInputLanguage] = useState("en"); // Default: English
  const [outputLanguage, setOutputLanguage] = useState("es"); // Default: Spanish
  const [result, setResult] = useState<{ original: string; translated: string } | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files?.[0]) {
      setFile(event.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return alert("Please upload a file");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("inputLanguage", inputLanguage);
    formData.append("outputLanguage", outputLanguage);

    try {
      const response = await fetch("/api/translate", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error("Upload failed:", error);
      setResult(null);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 p-6">
      <input type="file" accept="audio/*" onChange={handleFileChange} />

      {/* Input Language Selection */}
      <label className="font-semibold">Input Language:</label>
      <select onChange={(e) => setInputLanguage(e.target.value)} value={inputLanguage} className="p-2 border rounded">
        <option value="en">English</option>
        <option value="es">Spanish</option>
        <option value="fr">French</option>
        <option value="de">German</option>
        <option value="zh">Chinese (Mandarin)</option>
        <option value="ar">Arabic</option>
      </select>

      {/* Output Language Selection */}
      <label className="font-semibold">Translate To:</label>
      <select onChange={(e) => setOutputLanguage(e.target.value)} value={outputLanguage} className="p-2 border rounded">
        <option value="en">English</option>
        <option value="es">Spanish</option>
        <option value="fr">French</option>
        <option value="de">German</option>
        <option value="zh">Chinese (Mandarin)</option>
        <option value="ar">Arabic</option>
      </select>

      <button onClick={handleUpload} className="bg-blue-500 text-white px-4 py-2 rounded">
        Transcribe & Translate
      </button>

      {result && (
        <div className="bg-gray-200 text-black p-4 w-full rounded-lg mt-4">
          <h3 className="font-bold">🎵 Original Lyrics:</h3>
          <p className="whitespace-pre-line" dangerouslySetInnerHTML={{ __html: result.original }}></p>
          
          <h3 className="font-bold mt-4">🌍 Translated Lyrics:</h3>
          <p className="whitespace-pre-line" dangerouslySetInnerHTML={{ __html: result.translated }}></p>
        </div>
      )}
    </div>
  );
}







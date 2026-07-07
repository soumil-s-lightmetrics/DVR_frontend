"use client";

import { useRef, useState } from "react";

type Section = { title: string; body: string; bullets: string[] };

// Strip markdown bold markers; we apply our own weights.
const cleanInline = (s: string) => s.replace(/\*\*(.*?)\*\*/g, "$1").trim();

// Parse Gemini's fixed response format into titled sections.
// Lines like "Label: value" start a section; lines starting with -, * or •
// become bullets under the current section.
function parseAnalysis(text: string): Section[] {
  const sections: Section[] = [];
  let current: Section | null = null;

  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line) continue;

    const bullet = line.match(/^[-*•]\s+(.*)$/);
    if (bullet && current) {
      const b = cleanInline(bullet[1]);
      if (b && b.toUpperCase() !== "N/A") current.bullets.push(b);
      continue;
    }

    const kv = line.match(/^([A-Za-z][A-Za-z /]{0,30}?):\s*(.*)$/);
    if (kv) {
      current = { title: kv[1].trim(), body: cleanInline(kv[2]), bullets: [] };
      sections.push(current);
      continue;
    }

    if (current) {
      const extra = cleanInline(line);
      current.body = current.body ? `${current.body} ${extra}` : extra;
    }
  }

  return sections;
}

export default function Home() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [previewSrc, setPreviewSrc] = useState<string>("");
  const [base64ImageData, setBase64ImageData] = useState<string>("");
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resultText, setResultText] = useState<string>("");
  const [error, setError] = useState<string>("");

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setPreviewSrc(result);
        setBase64ImageData(result.split(",")[1]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleReset = () => {
    setPreviewSrc("");
    setBase64ImageData("");
    setShowResults(false);
    setLoading(false);
    setResultText("");
    setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const showError = (message: string) => {
    setShowResults(true);
    setLoading(false);
    setResultText("");
    setError(message);
  };

  const displayResult = (text: string) => {
    setResultText(text);
    setError("");
  };

  const handleAnalyze = async () => {
    if (!base64ImageData) {
      showError("Please upload an image first.");
      return;
    }

    setShowResults(true);
    setResultText("");
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageData: base64ImageData }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Request failed");
      }
      displayResult(result.text || "No response.");
    } catch (err) {
      console.error("API call failed:", err);
      showError("Failed to analyze the image. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Navbar */}
      <nav className="bg-white shadow-md py-3 px-6 flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/logo.jpg" alt="LightMetrics Logo" className="h-10 w-auto" />
        <span className="text-lg font-bold text-[#212121]">
          Dashcam Mount Analyzer
        </span>
        <span className="rounded-md bg-[#FDF3C7] px-2 py-0.5 text-xs font-bold tracking-wider text-[#8B2682]">
          BETA
        </span>
        <button
          onClick={handleReset}
          title="Reset the analyzer"
          className="ml-auto flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-[#2898A2]"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
            aria-hidden="true"
          >
            <polyline points="23 4 23 10 17 10" />
            <polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
          Refresh
        </button>
      </nav>

      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl w-full m-4">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-[#212121]">
              Dashcam Mount Analyzer
            </h1>
            <p className="text-gray-500 mt-2">
              Upload a dashcam image to check if it&apos;s mounted correctly.
            </p>
          </div>

          {/* Image Upload and Preview */}
          <div className="mb-6">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-[#2898A2] transition-colors"
            >
              {previewSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewSrc}
                  alt="Image Preview"
                  className="max-h-64 mx-auto rounded-md"
                />
              ) : (
                <div>
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                    aria-hidden="true"
                  >
                    <path
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <p className="mt-2 text-sm text-gray-600">
                    <span className="font-semibold text-[#2898A2]">
                      Click to upload an image
                    </span>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    PNG, JPG, GIF up to 10MB
                  </p>
                </div>
              )}
            </div>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleFileChange}
            />
          </div>

          <div className="text-center">
            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="btn-primary font-bold py-3 px-8 rounded-lg w-full hover:opacity-90 transition-all focus:outline-none focus:ring-4 focus:ring-[#A13B97] disabled:opacity-70"
            >
              Analyze Mounting
            </button>
          </div>

          {/* Results Section */}
          {showResults && (
            <div className="mt-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Analysis Result
              </h2>
              {loading && <div className="loader mx-auto my-4"></div>}
              {resultText &&
                (() => {
                  const sections = parseAnalysis(resultText).filter(
                    (s) => s.body || s.bullets.length > 0,
                  );
                  return (
                    <div className="bg-[#F5F5F5] p-6 rounded-lg text-gray-700 leading-relaxed">
                      {sections.length > 0 ? (
                        <div className="space-y-4">
                          {sections.map((s, i) => (
                            <div key={i}>
                              <div className="font-semibold text-[#212121]">
                                {s.title}
                              </div>
                              {s.body && (
                                <p className="font-normal">{s.body}</p>
                              )}
                              {s.bullets.length > 0 && (
                                <ol className="list-decimal pl-5 mt-1 space-y-1 font-normal">
                                  {s.bullets.map((b, j) => (
                                    <li key={j}>{b}</li>
                                  ))}
                                </ol>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="whitespace-pre-line font-normal">
                          {resultText}
                        </p>
                      )}
                    </div>
                  );
                })()}
              {error && (
                <div
                  className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mt-4"
                  role="alert"
                >
                  <strong className="font-bold">Error:</strong>
                  <span className="block sm:inline"> {error}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </>
  );
}

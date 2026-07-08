import { NextResponse } from "next/server";

// Keep the key server-side only. Set GEMINI_API_KEY and (optionally) GEMINI_MODEL
// in your environment (locally in .env.local, on Amplify under App settings ->
// Environment variables).
const MODEL = process.env.GEMINI_MODEL || "gemini-3-flash-preview";

const PROMPT = `
    Task: You are a Video Telematics Auditor. Classify the dashcam mounting based on "Video Evidence Utility" first, and "AI Readiness" second.

 Task:
You are a Video Telematics Mounting Auditor.
Your goal is to classify a dashcam image based on:
1) Video Evidence Utility (human review)
2) ADAS / AI Readiness (FCW, LDW)

You must classify the image into ONE of the following categories:
BEST MOUNT (Green), GOOD MOUNT (Amber), or BAD MOUNT (Red).

IMPORTANT DECISION ORDER (Follow strictly):
1. First, check for BAD MOUNT conditions (fail-fast).
2. Only if NOT BAD, check for BEST MOUNT.
3. If it is neither BAD nor BEST, classify as GOOD.

--------------------------------------------------
STEP 1 — BAD MOUNT (Red) : "Data Loss / Unsafe"
--------------------------------------------------
Immediately classify as BAD if ANY of the following are true:

• Horizon is in the TOP 10% of the frame or BOTTOM 15%, or not visible at all
• Neither road markings NOR the road surface near the vehicle are visible
• Camera points almost entirely (>70%) at the sky or almost entirely (>70%) at the hood, with little to no usable road view
• Large solid obstructions (pillars, curtains, visors) block >20% of the image width, hiding side lanes or cross traffic
• Image is too dark, too blurry, or too washed out to identify vehicles or lanes

Borderline Rescue Clause:
If some road ahead is clearly visible and traffic context (vehicles, signals, lane flow) can still be understood, do NOT classify as BAD.

If BAD, stop further evaluation.

--------------------------------------------------
STEP 2 — BEST MOUNT (Green) : "ADAS Perfect"
--------------------------------------------------
Classify as BEST only if ALL conditions below are met:

• Horizon is level and vertically centered (40–60% of frame height)
• Vanishing point is horizontally centered
• Full road ahead is visible, including adjacent lanes
• Hood is visible only for reference and occupies <20% of the frame
• View is suitable for both human review and AI algorithms (FCW / LDW)

If ANY condition fails, do NOT select BEST.

--------------------------------------------------
STEP 3 — GOOD MOUNT (Amber) : "Video Evidence Usable"
--------------------------------------------------
If the image is NOT BAD and NOT BEST, classify as GOOD.

Guiding philosophy:
Be generous. If a human can clearly understand the road scene,
traffic flow, lane context, and nearby vehicles, it is GOOD.

Typical GOOD cases include:
• Dashcam-style downward pitch
• Horizon slightly high or low but not extreme
• Hood visible up to 40% of the frame
• Minor tilt that does not hide adjacent lanes

AI performance may be degraded, but human video review is reliable.

--------------------------------------------------
RESPONSE FORMAT (Strict — Do Not Deviate):
--------------------------------------------------
Mounting Type: <Road-Facing / Driver-Facing>
Classification: <BEST MOUNT / GOOD MOUNT / BAD MOUNT>
Reason: <Explain why. If Amber, explicitly state: "Video is usable for evidence, but angle is too steep for accurate AI calibration.">
Corrections:
- <If BAD MOUNT, provide actionable steps as bullet points (e.g., "- Tilt up", "- Move left")>
- <If NOT BAD MOUNT, write "N/A">


`;

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY is not configured on the server." },
      { status: 500 },
    );
  }

  let imageData: string | undefined;
  try {
    const body = await request.json();
    imageData = body.imageData;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!imageData) {
    return NextResponse.json({ error: "No image provided." }, { status: 400 });
  }

  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`;

  const payload = {
    contents: [
      {
        parts: [
          { text: PROMPT },
          { inlineData: { mimeType: "image/jpeg", data: imageData } },
        ],
      },
    ],
  };

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    if (!response.ok) {
      return NextResponse.json(
        { error: result?.error?.message || "Gemini request failed." },
        { status: response.status },
      );
    }

    const text =
      result?.candidates?.[0]?.content?.parts?.[0]?.text || "No response.";
    return NextResponse.json({ text });
  } catch (err) {
    console.error("Gemini call failed:", err);
    return NextResponse.json(
      { error: "Failed to reach the analysis service." },
      { status: 502 },
    );
  }
}

import type { VitalReading } from './vitals';
import { GoogleGenAI } from "@google/genai";

// ✅ Put your real key here
const ai = new GoogleGenAI({
  apiKey: "AIzaSyBKjmdr8wfiMhHFhqywG6nkKP-pEIS3usU",
});

// ✅ Fallback (used only if SDK call fails)
function getFallbackResponse(message: string, vitals: VitalReading | null): string {
  if (vitals) {
    return `Vitals: BPM ${vitals.bpm}, SpO2 ${vitals.spo2}%. I am an AI, not a doctor.`;
  }
  return `I'm here to help. I am an AI, not a doctor.`;
}

// ✅ MAIN FUNCTION
export async function askAI(
  userMessage: string,
  vitals: VitalReading | null,
  history: { role: string; content: string }[]
): Promise<string> {

  try {
    const vitalsContext = vitals
      ? `User vitals: BPM=${vitals.bpm}, SpO2=${vitals.spo2}%, Status=${vitals.status}.`
      : `No vitals available.`;

    // 🔥 Simple, reliable prompt
    const prompt = `
You are CardioWatch Pro AI.

${vitalsContext}

User question: ${userMessage}

Answer clearly and correctly.
Keep it short.
Always include: "I am an AI ."
`;

    const response = await ai.models.generateContent({
      // ⚠️ Use a model available to your key
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    // SDK gives you text directly
    const text = response.text;

    if (!text || text.trim() === "") {
      return getFallbackResponse(userMessage, vitals);
    }

    return text;

  } catch (err) {
    console.error("AI ERROR:", err);
    return getFallbackResponse(userMessage, vitals);
  }
}
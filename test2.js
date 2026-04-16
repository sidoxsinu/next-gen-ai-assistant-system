import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function test() {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite-preview',
      contents: 'Hello'
    });
    console.log("Success Flash Lite:", !!response.text);
  } catch (err) {
    console.error("DEBUG ERROR Flash Lite:", err);
  }
}
test();

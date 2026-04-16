import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function test() {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash-latest',
      contents: 'Hello'
    });
    console.log("Success 1.5 Flash:", !!response.text);
  } catch (err) {
    console.error("DEBUG ERROR 1.5 Flash:", err.message);
  }
}
test();

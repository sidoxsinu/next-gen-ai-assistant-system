import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();

async function test() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-1.5-flash',
    contents: 'test'
  });
  console.log("Success 1.5 flash:", !!response.text);
}
test().catch(e=>console.error(e.message));

import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();

async function test() {
  const models = ['gemini-flash-latest', 'gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-2.0-flash'];
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  for (const m of models) {
    try {
       const response = await ai.models.generateContent({ model: m, contents: 'hello' });
       console.log("Success with:", m);
       process.exit(0);
    } catch (err) {
       console.log("Failed:", m, err.message);
    }
  }
}
test();

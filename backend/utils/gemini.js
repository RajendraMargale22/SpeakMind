import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const getGeminiResponse = async (message) => {
  try {
    const model = genAI.getGenerativeModel({
        model: "gemini-1.0-pro",
    });

    const result = await model.generateContent(message);
    const response = await result.response;

    return response.text(); // ✅ IMPORTANT
  } catch (error) {
    console.log("Gemini error:", error);
    return "Error generating response";
  }
};
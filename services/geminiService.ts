import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.API_KEY;

async function callGemini(prompt: string, fallbackResponse: string): Promise<string> {
    if (!API_KEY) {
        console.warn("API_KEY environment variable not set. Returning placeholder response.");
        return new Promise(resolve => setTimeout(() => resolve(fallbackResponse), 500));
    }

    try {
        const ai = new GoogleGenAI({ apiKey: API_KEY });
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });
        return response.text.trim().replace(/["']/g, ""); // Clean up quotes
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        return "API Call Failed";
    }
}


export async function getConversationSummary(threadText: string): Promise<string> {
    const prompt = `You are an expert in analyzing conversation histories. Please provide a concise, one-paragraph summary of the following chat thread. Focus on the main topic and the key information exchanged.

        Conversation Thread:
        ---
        ${threadText}
        ---
        
        Summary:`;
    
    return callGemini(prompt, "This is a placeholder summary as the API key is not configured.");
}

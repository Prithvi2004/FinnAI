import { ChatMessage } from "../types";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Replace with your actual Gemini API key
const GEMINI_API_KEY = "AIzaSyBA5ZlJB03W_h2cTnZdcBGKHXl3mvkvNSU";
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

export async function sendMessage(
  messages: ChatMessage[],
  retryCount = 0
): Promise<string> {
  try {
    // Convert messages to a format suitable for Gemini API
    const formattedMessages = messages.map((msg) => ({
      role: msg.role,
      parts: [{ text: msg.content }],
    }));

    // Generate content using Gemini API
    const result = await model.generateContent({
      contents: formattedMessages,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1000,
      },
    });

    // Extract and return the response text
    const responseText = result.response.text();
    if (!responseText) {
      throw new Error("Invalid response format from Gemini API");
    }
    return responseText;
  } catch (error) {
    if (retryCount < MAX_RETRIES) {
      console.warn(`Attempt ${retryCount + 1} failed, retrying...`, error);
      await sleep(RETRY_DELAY * (retryCount + 1));
      return sendMessage(messages, retryCount + 1);
    }
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to connect to Gemini AI service";
    console.error("Error sending message:", errorMessage);
    throw new Error(
      "Unable to get a response from the Gemini AI service. Please try again later."
    );
  }
}

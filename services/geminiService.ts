import { GoogleGenAI, Type, Schema } from "@google/genai";
import { RefinementResult } from "../types";

// Helper to convert File to Base64
export const fileToGenerativePart = async (file: File): Promise<{ inlineData: { data: string; mimeType: string } }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve({
        inlineData: {
          data: base64String,
          mimeType: file.type,
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const refinementSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    segments: {
      type: Type.ARRAY,
      description: "The rewritten sentence broken down into sequential segments to support color-coding.",
      items: {
        type: Type.OBJECT,
        properties: {
          text: {
            type: Type.STRING,
            description: "The text content of this segment.",
          },
          type: {
            type: Type.STRING,
            enum: ["original", "style", "source"],
            description: "original: Unchanged text. style: Changed for flow/grammar (Green). source: Changed based on PDF content (Orange).",
          },
          originalSource: {
            type: Type.STRING,
            description: "If type is 'source', provide the exact quote from the PDF used as reference. Leave empty otherwise.",
          },
          explanation: {
            type: Type.STRING,
            description: "Brief reason for the change (e.g. 'Corrected grammar', 'Added specific finding from PDF').",
          },
        },
        required: ["text", "type"],
      },
    },
  },
  required: ["segments"],
};

export const refineTextWithPaper = async (
  pdfFiles: File[],
  inputText: string,
  instruction?: string
): Promise<RefinementResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const pdfParts = await Promise.all(pdfFiles.map(fileToGenerativePart));

  const prompt = `
    You are an expert academic editor.
    
    Task:
    1. Read the attached PDF(s).
    2. Rewrite the User's Input Sentence to be academically rigorous.
    3. You MUST output the result as a sequential list of text segments that reconstruct the full refined sentence.
    
    Tagging Rules:
    - If a part of the text is largely unchanged from the input (ignoring minor punctuation), tag it as "original".
    - If you modify words solely for better flow, grammar, conciseness, or academic tone, tag it as "style". (These will be highlighted in GREEN).
    - If you modify, add, or correct facts/claims based specifically on content found in the PDF, tag it as "source". (These will be highlighted in ORANGE).
    
    Constraint:
    - The concatenation of all 'text' fields in the JSON array must form the complete, readable rewritten sentence.
    - For "source" tags, you MUST provide the 'originalSource' (the quote from the PDF).
    
    User Instruction: ${instruction || "Optimize for academic clarity and verify against the paper."}
    
    User Input Sentence: "${inputText}"
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: {
      parts: [
        ...pdfParts,
        { text: prompt }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: refinementSchema,
      temperature: 0.1,
    }
  });

  const text = response.text;
  if (!text) throw new Error("No response from Gemini");

  try {
    return JSON.parse(text) as RefinementResult;
  } catch (e) {
    throw new Error("Failed to parse Gemini response");
  }
};

import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Initialize Gemini Client safely
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// 1. Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", hasApiKey: !!process.env.GEMINI_API_KEY });
});

// 2. Generate 2-Word Business Names with Gemini AI
app.post("/api/generate-names", async (req, res) => {
  try {
    const { category = "General", style = "Modern & Futuristic", keywords = "", count = 12 } = req.body;
    
    const ai = getGeminiClient();

    if (!ai) {
      return res.status(503).json({
        error: "GEMINI_API_KEY is not configured.",
        fallbackNeeded: true
      });
    }

    const prompt = `Generate exactly ${count} highly creative, unique, brandable 2-WORD business names.
Category: ${category}
Desired Brand Vibe/Style: ${style}
${keywords ? `Must relate to or incorporate key concept/keyword: "${keywords}"` : ""}

CRITICAL RULES:
1. Every name MUST consist of EXACTLY TWO WORDS (e.g., "Apex Horizon", "Nova Craft", "Pulse Logic", "Aero Nest").
2. No single-word names, no 3+ word names. Strictly two words.
3. Make them memorable, catchy, easy to pronounce, and suitable for high-end domain branding.
4. If Bengali/Local style is selected, fuse modern English and Bengali concepts cleanly (e.g., "Sonar Tech", "Nodi Breeze", "Deshi Crafts", "Bong Bytes").
5. Provide a catchy tagline and a brief explanation for why each name works well.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are an expert brand naming strategist and creative agency leader specializing in 2-word business names.",
        temperature: 1.0,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            names: {
              type: Type.ARRAY,
              description: "List of generated 2-word business names and brand details",
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: "Exactly two-word business name, e.g. Apex Horizon" },
                  word1: { type: Type.STRING, description: "First word" },
                  word2: { type: Type.STRING, description: "Second word" },
                  tagline: { type: Type.STRING, description: "Catchy slogan or tagline" },
                  rationale: { type: Type.STRING, description: "Why this name is compelling" },
                  vibe: { type: Type.STRING, description: "Vibe/tone description e.g. Premium & Sleek" },
                  suggestedColors: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "Array of 2-3 HEX colors for brand palette e.g. ['#3B82F6', '#1E293B']"
                  },
                  domains: {
                    type: Type.OBJECT,
                    properties: {
                      com: { type: Type.BOOLEAN },
                      io: { type: Type.BOOLEAN },
                      co: { type: Type.BOOLEAN },
                      ai: { type: Type.BOOLEAN },
                      app: { type: Type.BOOLEAN }
                    },
                    required: ["com", "io", "co", "ai", "app"]
                  }
                },
                required: ["name", "word1", "word2", "tagline", "rationale", "vibe", "suggestedColors", "domains"]
              }
            }
          },
          required: ["names"]
        }
      }
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error("Empty response from AI model");
    }

    const data = JSON.parse(responseText);
    return res.json({ success: true, data: data.names || [] });

  } catch (error: any) {
    console.error("Error generating names via Gemini:", error);
    return res.status(500).json({
      error: error.message || "Failed to generate AI business names.",
      fallbackNeeded: true
    });
  }
});

// 3. AI Name Analysis & Evaluation Endpoint
app.post("/api/evaluate-name", async (req, res) => {
  try {
    const { name, category = "General" } = req.body;
    if (!name) return res.status(400).json({ error: "Name is required" });

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({ error: "Gemini API key not configured" });
    }

    const prompt = `Analyze the business name "${name}" for a business in the "${category}" industry.
Evaluate it across:
1. Memorability (0-100)
2. Pronounceability (0-100)
3. Brand Potential (0-100)
4. SEO Potential (0-100)
5. Modernity (0-100)

Also provide overall score, summary pros & cons, target demographic, 3 alternate tagline variations, and logo design inspiration idea.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        temperature: 0.7,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overallScore: { type: Type.NUMBER },
            memorability: { type: Type.NUMBER },
            pronounceability: { type: Type.NUMBER },
            brandPotential: { type: Type.NUMBER },
            seoPotential: { type: Type.NUMBER },
            modernity: { type: Type.NUMBER },
            summary: { type: Type.STRING },
            pros: { type: Type.ARRAY, items: { type: Type.STRING } },
            cons: { type: Type.ARRAY, items: { type: Type.STRING } },
            targetDemographic: { type: Type.STRING },
            taglines: { type: Type.ARRAY, items: { type: Type.STRING } },
            logoIdea: { type: Type.STRING }
          },
          required: ["overallScore", "memorability", "pronounceability", "brandPotential", "seoPotential", "modernity", "summary", "pros", "cons", "targetDemographic", "taglines", "logoIdea"]
        }
      }
    });

    const data = JSON.parse(response.text || "{}");
    return res.json({ success: true, data });
  } catch (error: any) {
    console.error("Error evaluating name:", error);
    return res.status(500).json({ error: error.message || "Evaluation failed" });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`2-Word Business Name Generator server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

async function callGemini({
  model,
  prompt,
  systemInstruction,
  temperature,
  responseMimeType,
  responseSchema,
}: {
  model: string;
  prompt: string;
  systemInstruction?: string;
  temperature?: number;
  responseMimeType?: string;
  responseSchema?: Record<string, unknown>;
}) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  const body: Record<string, unknown> = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  };

  if (systemInstruction) {
    body.systemInstruction = {
      parts: [{ text: systemInstruction }],
    };
  }

  const generationConfig: Record<string, unknown> = {};
  if (temperature !== undefined) generationConfig.temperature = temperature;
  if (responseMimeType) generationConfig.responseMimeType = responseMimeType;
  if (responseSchema) generationConfig.responseSchema = responseSchema;

  if (Object.keys(generationConfig).length > 0) {
    body.generationConfig = generationConfig;
  }

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "aistudio-build",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API request failed: ${response.status} ${response.statusText} ${errorText}`);
  }

  const data = await response.json();
  const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!responseText) {
    throw new Error("Empty response from AI model");
  }

  return responseText as string;
}

// 1. Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", hasApiKey: !!process.env.GEMINI_API_KEY });
});

// 2. Generate 2-Word Business Names with Gemini AI
app.post("/api/generate-names", async (req, res) => {
  try {
    const { category = "General", style = "Modern & Futuristic", keywords = "", count = 12 } = req.body;
    
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

    const responseText = await callGemini({
      model: "gemini-3.6-flash",
      prompt,
      systemInstruction: "You are an expert brand naming strategist and creative agency leader specializing in 2-word business names.",
      temperature: 1.0,
      responseMimeType: "application/json",
      responseSchema: {
        type: "OBJECT",
        properties: {
          names: {
            type: "ARRAY",
            description: "List of generated 2-word business names and brand details",
            items: {
              type: "OBJECT",
              properties: {
                name: { type: "STRING", description: "Exactly two-word business name, e.g. Apex Horizon" },
                word1: { type: "STRING", description: "First word" },
                word2: { type: "STRING", description: "Second word" },
                tagline: { type: "STRING", description: "Catchy slogan or tagline" },
                rationale: { type: "STRING", description: "Why this name is compelling" },
                vibe: { type: "STRING", description: "Vibe/tone description e.g. Premium & Sleek" },
                suggestedColors: {
                  type: "ARRAY",
                  items: { type: "STRING" },
                  description: "Array of 2-3 HEX colors for brand palette e.g. ['#3B82F6', '#1E293B']"
                },
                domains: {
                  type: "OBJECT",
                  properties: {
                    com: { type: "BOOLEAN" },
                    io: { type: "BOOLEAN" },
                    co: { type: "BOOLEAN" },
                    ai: { type: "BOOLEAN" },
                    app: { type: "BOOLEAN" }
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
    });

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

    const prompt = `Analyze the business name "${name}" for a business in the "${category}" industry.
Evaluate it across:
1. Memorability (0-100)
2. Pronounceability (0-100)
3. Brand Potential (0-100)
4. SEO Potential (0-100)
5. Modernity (0-100)

Also provide overall score, summary pros & cons, target demographic, 3 alternate tagline variations, and logo design inspiration idea.`;

    const responseText = await callGemini({
      model: "gemini-3.6-flash",
      prompt,
      temperature: 0.7,
      responseMimeType: "application/json",
      responseSchema: {
        type: "OBJECT",
        properties: {
          overallScore: { type: "NUMBER" },
          memorability: { type: "NUMBER" },
          pronounceability: { type: "NUMBER" },
          brandPotential: { type: "NUMBER" },
          seoPotential: { type: "NUMBER" },
          modernity: { type: "NUMBER" },
          summary: { type: "STRING" },
          pros: { type: "ARRAY", items: { type: "STRING" } },
          cons: { type: "ARRAY", items: { type: "STRING" } },
          targetDemographic: { type: "STRING" },
          taglines: { type: "ARRAY", items: { type: "STRING" } },
          logoIdea: { type: "STRING" }
        },
        required: ["overallScore", "memorability", "pronounceability", "brandPotential", "seoPotential", "modernity", "summary", "pros", "cons", "targetDemographic", "taglines", "logoIdea"]
      }
    });

    const data = JSON.parse(responseText || "{}");
    return res.json({ success: true, data });
  } catch (error: any) {
    console.error("Error evaluating name:", error);
    return res.status(500).json({ error: error.message || "Evaluation failed" });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
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

import "dotenv/config";
import express from "express";
import type { Request, Response } from "express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { GoogleGenAI } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const IS_PRODUCTION = process.env.NODE_ENV === "production";

function getAiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not configured. Please add your Gemini API key in Settings > Secrets."
    );
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

async function withExponentialBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelayMs = 800
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      lastError = err;
      const message = err instanceof Error ? err.message : String(err);
      const status =
        typeof err === "object" && err !== null && "status" in err
          ? Number((err as { status?: unknown }).status)
          : undefined;
      const isRetryable =
        status === 429 ||
        status === 500 ||
        status === 503 ||
        /429|RESOURCE_EXHAUSTED|UNAVAILABLE|rate limit|timeout/i.test(message);

      if (!isRetryable || attempt === maxRetries) {
        throw err;
      }
      const jitter = Math.random() * 250;
      const delay = baseDelayMs * Math.pow(2, attempt) + jitter;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw lastError;
}

function extractApiError(err: unknown): { status: number; message: string } {
  const rawMessage = err instanceof Error ? err.message : String(err);
  if (/API_KEY_INVALID|PERMISSION_DENIED|403|401/i.test(rawMessage)) {
    return {
      status: 403,
      message:
        "Gemini API key is invalid or missing permissions. Please verify your key in Settings > Secrets.",
    };
  }
  if (/RESOURCE_EXHAUSTED|429/i.test(rawMessage)) {
    return {
      status: 429,
      message:
        "Gemini API rate limit reached. Please wait a moment and retry.",
    };
  }
  if (/NOT_FOUND|404/i.test(rawMessage)) {
    return {
      status: 404,
      message: `Requested Gemini model was not found: ${rawMessage}`,
    };
  }
  return {
    status: 500,
    message: rawMessage || "Unexpected error communicating with Gemini API.",
  };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: "4mb" }));

  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({ ok: true });
  });

  app.post("/api/gemini/generate", async (req: Request, res: Response) => {
    try {
      const { prompt, systemInstruction, responseSchema } = req.body as {
        prompt?: string;
        systemInstruction?: string;
        responseSchema?: Record<string, unknown>;
      };

      if (!prompt || typeof prompt !== "string") {
        res.status(400).json({ error: "Missing or invalid prompt string." });
        return;
      }

      const ai = getAiClient();
      const response = await withExponentialBackoff(() =>
        ai.models.generateContent({
          model: "gemini-4-hydrogen",
          contents: prompt,
          config: {
            ...(systemInstruction ? { systemInstruction } : {}),
            ...(responseSchema
              ? {
                  responseMimeType: "application/json",
                  responseSchema,
                }
              : {}),
          },
        })
      );

      res.json({ text: response.text ?? "" });
    } catch (err: unknown) {
      const { status, message } = extractApiError(err);
      res.status(status).json({ error: message });
    }
  });

  app.post("/api/gemini/embed", async (req: Request, res: Response) => {
    try {
      const { texts } = req.body as { texts?: string[] };
      if (!Array.isArray(texts) || texts.length === 0) {
        res.status(400).json({ error: "texts must be a non-empty array." });
        return;
      }

      const ai = getAiClient();
      const BATCH_SIZE = 50;
      const allVectors: number[][] = [];

      for (let i = 0; i < texts.length; i += BATCH_SIZE) {
        const batch = texts.slice(i, i + BATCH_SIZE).map((t) =>
          t.trim().length > 0 ? t.trim() : "N/A"
        );
        const result = await withExponentialBackoff(() =>
          ai.models.embedContent({
            model: "gemini-embedding-2",
            contents: batch,
          })
        );
        const embeddings = result.embeddings ?? [];
        for (const item of embeddings) {
          allVectors.push(item.values ?? []);
        }
      }

      res.json({ embeddings: allVectors });
    } catch (err: unknown) {
      const { status, message } = extractApiError(err);
      res.status(status).json({ error: message });
    }
  });

  if (!IS_PRODUCTION) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, "dist");
    app.use(express.static(distDir));
    app.get("/{*splat}", (_req: Request, res: Response) => {
      const indexFile = path.join(distDir, "index.html");
      if (fs.existsSync(indexFile)) {
        res.sendFile(indexFile);
      } else {
        res.status(404).send("Application build not found.");
      }
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`GetHired server running at http://localhost:${PORT}`);
  });
}

startServer();

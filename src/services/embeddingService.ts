export type EmbeddingCache = Map<string, number[]>;

function normalizeCacheKey(text: string): string {
  return text.trim().replace(/\s+/g, " ");
}

async function fetchEmbeddingsWithRetry(
  texts: string[],
  maxRetries = 2
): Promise<number[][]> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch("/api/gemini/embed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texts }),
      });

      if (!response.ok) {
        let errorMessage = `Embedding request failed (${response.status})`;
        try {
          const errData = (await response.json()) as { error?: string };
          if (errData.error) errorMessage = errData.error;
        } catch {
          // ignore JSON parse error on error body
        }

        const isRetryable = response.status === 429 || response.status >= 500;
        if (!isRetryable || attempt === maxRetries) {
          throw new Error(errorMessage);
        }

        const delay = 750 * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      const data = (await response.json()) as { embeddings?: number[][] };
      if (!Array.isArray(data.embeddings)) {
        throw new Error("Invalid embedding response format from server.");
      }
      return data.embeddings;
    } catch (err: unknown) {
      lastError = err;
      if (attempt === maxRetries) {
        throw err;
      }
      const delay = 750 * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Failed to generate embeddings.");
}

export async function getBatchedEmbeddings(
  texts: string[],
  cache: EmbeddingCache
): Promise<number[][]> {
  const normalizedTexts = texts.map(normalizeCacheKey);
  const missingTexts: string[] = [];
  const missingIndexMap = new Map<string, number>();

  for (const key of normalizedTexts) {
    if (!key) continue;
    if (!cache.has(key) && !missingIndexMap.has(key)) {
      missingIndexMap.set(key, missingTexts.length);
      missingTexts.push(key);
    }
  }

  if (missingTexts.length > 0) {
    const vectors = await fetchEmbeddingsWithRetry(missingTexts);
    missingTexts.forEach((key, idx) => {
      if (vectors[idx] && vectors[idx].length > 0) {
        cache.set(key, vectors[idx]);
      }
    });
  }

  return normalizedTexts.map((key) => cache.get(key) ?? []);
}

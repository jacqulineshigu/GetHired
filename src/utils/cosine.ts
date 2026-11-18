import type { SkillMatchStatus } from "../types";

export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA.length || !vecB.length || vecA.length !== vecB.length) {
    return 0;
  }

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    const a = vecA[i];
    const b = vecB[i];
    dot += a * b;
    normA += a * a;
    normB += b * b;
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) {
    return 0;
  }

  const raw = dot / denominator;
  return Math.max(-1, Math.min(1, raw));
}

export function classifySimilarity(similarity: number): SkillMatchStatus {
  if (similarity >= 0.75) {
    return "match";
  }
  if (similarity >= 0.55) {
    return "partial";
  }
  return "missing";
}

export interface CandidateEvidenceVector {
  label: string;
  vector: number[];
}

export function findMostSimilarCandidateItem(
  skillVector: number[],
  candidateItems: CandidateEvidenceVector[]
): { label: string; similarity: number; status: SkillMatchStatus } {
  if (!candidateItems.length || !skillVector.length) {
    return {
      label: "No matching evidence found in resume",
      similarity: 0,
      status: "missing",
    };
  }

  let bestLabel = candidateItems[0].label;
  let bestScore = -1;

  for (const item of candidateItems) {
    const sim = cosineSimilarity(skillVector, item.vector);
    if (sim > bestScore) {
      bestScore = sim;
      bestLabel = item.label;
    }
  }

  const clamped = Math.max(0, bestScore);
  return {
    label: bestLabel,
    similarity: Number(clamped.toFixed(3)),
    status: classifySimilarity(clamped),
  };
}

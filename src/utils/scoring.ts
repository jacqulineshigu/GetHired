import type { ScoreBreakdown, SkillGap } from "../types";

export const SCORE_WEIGHTS = {
  skillsMatch: 0.4,
  experienceRelevance: 0.25,
  projectsRelevance: 0.15,
  educationFit: 0.1,
  documentSemanticSimilarity: 0.1,
} as const;

export function clampScore(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round(Math.max(0, Math.min(100, value)));
}

export function computeSkillsMatchScore(skillGaps: SkillGap[]): number {
  if (!skillGaps.length) return 0;
  let points = 0;
  for (const gap of skillGaps) {
    if (gap.status === "match") {
      points += 1;
    } else if (gap.status === "partial") {
      points += 0.55;
    }
  }
  return clampScore((points / skillGaps.length) * 100);
}

export function computeWeightedCompatibilityScore(breakdown: ScoreBreakdown): number {
  const weighted =
    clampScore(breakdown.skillsMatch) * SCORE_WEIGHTS.skillsMatch +
    clampScore(breakdown.experienceRelevance) * SCORE_WEIGHTS.experienceRelevance +
    clampScore(breakdown.projectsRelevance) * SCORE_WEIGHTS.projectsRelevance +
    clampScore(breakdown.educationFit) * SCORE_WEIGHTS.educationFit +
    clampScore(breakdown.documentSemanticSimilarity) *
      SCORE_WEIGHTS.documentSemanticSimilarity;

  return clampScore(weighted);
}

export function getReadinessLabel(score: number): {
  label: string;
  tone: "green" | "amber" | "red";
} {
  if (score >= 78) {
    return { label: "Strong Fit", tone: "green" };
  }
  if (score >= 58) {
    return { label: "Moderate Fit", tone: "amber" };
  }
  return { label: "Significant Gaps", tone: "red" };
}

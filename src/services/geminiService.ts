import type {
  MatchResult,
  ParsedJob,
  ParsedResume,
  RadarDimension,
  ScoreBreakdown,
  SemanticSkillMatch,
  SkillGap,
  Suggestion,
} from "../types";
import {
  cosineSimilarity,
  findMostSimilarCandidateItem,
  type CandidateEvidenceVector,
} from "../utils/cosine";
import {
  clampScore,
  computeSkillsMatchScore,
  computeWeightedCompatibilityScore,
} from "../utils/scoring";
import { getBatchedEmbeddings, type EmbeddingCache } from "./embeddingService";

const SCHEMA_TYPE = {
  STRING: "STRING",
  NUMBER: "NUMBER",
  INTEGER: "INTEGER",
  BOOLEAN: "BOOLEAN",
  ARRAY: "ARRAY",
  OBJECT: "OBJECT",
} as const;

async function callGeminiJson<T>(
  prompt: string,
  systemInstruction: string,
  responseSchema: Record<string, unknown>,
  fallbackValue: T,
  maxRetries = 2
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch("/api/gemini/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          systemInstruction,
          responseSchema,
        }),
      });

      if (!response.ok) {
        let errorMessage = `Gemini API error (${response.status})`;
        try {
          const errData = (await response.json()) as { error?: string };
          if (errData.error) errorMessage = errData.error;
        } catch {
          // ignore
        }

        const isRetryable = response.status === 429 || response.status >= 500;
        if (!isRetryable || attempt === maxRetries) {
          throw new Error(errorMessage);
        }

        const delay = 850 * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      const data = (await response.json()) as { text?: string };
      const rawText = (data.text ?? "").trim();

      return safeParseJson<T>(rawText, fallbackValue);
    } catch (err: unknown) {
      lastError = err;
      if (attempt === maxRetries) {
        throw err;
      }
      const delay = 850 * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Failed to get response from Gemini.");
}

function safeParseJson<T>(rawText: string, fallback: T): T {
  if (!rawText) return fallback;

  try {
    return JSON.parse(rawText) as T;
  } catch {
    // Strip markdown code fences if present
    const cleaned = rawText
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```$/i, "")
      .trim();
    try {
      return JSON.parse(cleaned) as T;
    } catch {
      const start = cleaned.indexOf("{");
      const end = cleaned.lastIndexOf("}");
      if (start !== -1 && end > start) {
        try {
          return JSON.parse(cleaned.slice(start, end + 1)) as T;
        } catch {
          return fallback;
        }
      }
      return fallback;
    }
  }
}

const RESUME_SCHEMA = {
  type: SCHEMA_TYPE.OBJECT,
  properties: {
    name: { type: SCHEMA_TYPE.STRING },
    email: { type: SCHEMA_TYPE.STRING },
    summary: { type: SCHEMA_TYPE.STRING },
    education: {
      type: SCHEMA_TYPE.ARRAY,
      items: { type: SCHEMA_TYPE.STRING },
    },
    technical_skills: {
      type: SCHEMA_TYPE.ARRAY,
      items: { type: SCHEMA_TYPE.STRING },
    },
    soft_skills: {
      type: SCHEMA_TYPE.ARRAY,
      items: { type: SCHEMA_TYPE.STRING },
    },
    projects: {
      type: SCHEMA_TYPE.ARRAY,
      items: {
        type: SCHEMA_TYPE.OBJECT,
        properties: {
          title: { type: SCHEMA_TYPE.STRING },
          description: { type: SCHEMA_TYPE.STRING },
          technologies: {
            type: SCHEMA_TYPE.ARRAY,
            items: { type: SCHEMA_TYPE.STRING },
          },
        },
        required: ["title", "description", "technologies"],
      },
    },
    experience: {
      type: SCHEMA_TYPE.ARRAY,
      items: {
        type: SCHEMA_TYPE.OBJECT,
        properties: {
          role: { type: SCHEMA_TYPE.STRING },
          company: { type: SCHEMA_TYPE.STRING },
          duration: { type: SCHEMA_TYPE.STRING },
          highlights: {
            type: SCHEMA_TYPE.ARRAY,
            items: { type: SCHEMA_TYPE.STRING },
          },
        },
        required: ["role", "company", "duration", "highlights"],
      },
    },
    certifications: {
      type: SCHEMA_TYPE.ARRAY,
      items: { type: SCHEMA_TYPE.STRING },
    },
  },
  required: [
    "name",
    "email",
    "summary",
    "education",
    "technical_skills",
    "soft_skills",
    "projects",
    "experience",
    "certifications",
  ],
};

const JOB_SCHEMA = {
  type: SCHEMA_TYPE.OBJECT,
  properties: {
    job_title: { type: SCHEMA_TYPE.STRING },
    company: { type: SCHEMA_TYPE.STRING },
    required_technical_skills: {
      type: SCHEMA_TYPE.ARRAY,
      items: { type: SCHEMA_TYPE.STRING },
    },
    preferred_skills: {
      type: SCHEMA_TYPE.ARRAY,
      items: { type: SCHEMA_TYPE.STRING },
    },
    soft_skills: {
      type: SCHEMA_TYPE.ARRAY,
      items: { type: SCHEMA_TYPE.STRING },
    },
    education_requirements: { type: SCHEMA_TYPE.STRING },
    experience_required: { type: SCHEMA_TYPE.STRING },
    responsibilities: {
      type: SCHEMA_TYPE.ARRAY,
      items: { type: SCHEMA_TYPE.STRING },
    },
    seniority_level: { type: SCHEMA_TYPE.STRING },
  },
  required: [
    "job_title",
    "company",
    "required_technical_skills",
    "preferred_skills",
    "soft_skills",
    "education_requirements",
    "experience_required",
    "responsibilities",
    "seniority_level",
  ],
};

const MATCH_ANALYSIS_SCHEMA = {
  type: SCHEMA_TYPE.OBJECT,
  properties: {
    overallVerdict: { type: SCHEMA_TYPE.STRING },
    experienceRelevanceScore: { type: SCHEMA_TYPE.NUMBER },
    projectsRelevanceScore: { type: SCHEMA_TYPE.NUMBER },
    educationFitScore: { type: SCHEMA_TYPE.NUMBER },
    softSkillsCandidateScore: { type: SCHEMA_TYPE.NUMBER },
    softSkillsRequirementTarget: { type: SCHEMA_TYPE.NUMBER },
    skillGaps: {
      type: SCHEMA_TYPE.ARRAY,
      items: {
        type: SCHEMA_TYPE.OBJECT,
        properties: {
          skill: { type: SCHEMA_TYPE.STRING },
          status: { type: SCHEMA_TYPE.STRING },
          similarityScore: { type: SCHEMA_TYPE.NUMBER },
          explanation: { type: SCHEMA_TYPE.STRING },
          resumeEvidence: { type: SCHEMA_TYPE.STRING },
        },
        required: [
          "skill",
          "status",
          "similarityScore",
          "explanation",
          "resumeEvidence",
        ],
      },
    },
    learningPlan: {
      type: SCHEMA_TYPE.ARRAY,
      items: {
        type: SCHEMA_TYPE.OBJECT,
        properties: {
          skill: { type: SCHEMA_TYPE.STRING },
          importance: { type: SCHEMA_TYPE.STRING },
          learningPath: { type: SCHEMA_TYPE.STRING },
          estimatedTime: { type: SCHEMA_TYPE.STRING },
        },
        required: ["skill", "importance", "learningPath", "estimatedTime"],
      },
    },
    suggestions: {
      type: SCHEMA_TYPE.OBJECT,
      properties: {
        sectionSuggestions: {
          type: SCHEMA_TYPE.ARRAY,
          items: {
            type: SCHEMA_TYPE.OBJECT,
            properties: {
              section: { type: SCHEMA_TYPE.STRING },
              advice: { type: SCHEMA_TYPE.STRING },
              priority: { type: SCHEMA_TYPE.STRING },
            },
            required: ["section", "advice", "priority"],
          },
        },
        bulletRewrites: {
          type: SCHEMA_TYPE.ARRAY,
          items: {
            type: SCHEMA_TYPE.OBJECT,
            properties: {
              section: { type: SCHEMA_TYPE.STRING },
              before: { type: SCHEMA_TYPE.STRING },
              after: { type: SCHEMA_TYPE.STRING },
              rationale: { type: SCHEMA_TYPE.STRING },
              metricsNeeded: {
                type: SCHEMA_TYPE.ARRAY,
                items: { type: SCHEMA_TYPE.STRING },
              },
            },
            required: [
              "section",
              "before",
              "after",
              "rationale",
              "metricsNeeded",
            ],
          },
        },
        missingKeywords: {
          type: SCHEMA_TYPE.ARRAY,
          items: {
            type: SCHEMA_TYPE.OBJECT,
            properties: {
              keyword: { type: SCHEMA_TYPE.STRING },
              suggestedSection: { type: SCHEMA_TYPE.STRING },
              examplePhrasing: { type: SCHEMA_TYPE.STRING },
            },
            required: ["keyword", "suggestedSection", "examplePhrasing"],
          },
        },
        tailoredSummary: { type: SCHEMA_TYPE.STRING },
      },
      required: [
        "sectionSuggestions",
        "bulletRewrites",
        "missingKeywords",
        "tailoredSummary",
      ],
    },
  },
  required: [
    "overallVerdict",
    "experienceRelevanceScore",
    "projectsRelevanceScore",
    "educationFitScore",
    "softSkillsCandidateScore",
    "softSkillsRequirementTarget",
    "skillGaps",
    "learningPlan",
    "suggestions",
  ],
};

export async function parseResumeWithGemini(
  rawText: string
): Promise<ParsedResume> {
  const fallback: ParsedResume = {
    name: "Candidate",
    email: "",
    summary: "",
    education: [],
    technical_skills: [],
    soft_skills: [],
    projects: [],
    experience: [],
    certifications: [],
  };

  const systemInstruction =
    "You are an accurate, conservative resume parser. Extract only facts explicitly present in the resume text. Never invent skills, companies, degrees, or metrics. Return strict JSON matching the schema.";

  const prompt = `Parse the following resume text into structured JSON.
- Extract concise individual skill names into technical_skills and soft_skills.
- Keep experience highlights verbatim or tightly faithful to the original bullets.
- If a field is absent, return an empty string or empty array.

RESUME TEXT:
${rawText}`;

  const parsed = await callGeminiJson<ParsedResume>(
    prompt,
    systemInstruction,
    RESUME_SCHEMA,
    fallback
  );

  return {
    name: parsed.name || "Candidate",
    email: parsed.email || "",
    summary: parsed.summary || "",
    education: Array.isArray(parsed.education) ? parsed.education : [],
    technical_skills: Array.isArray(parsed.technical_skills)
      ? parsed.technical_skills
      : [],
    soft_skills: Array.isArray(parsed.soft_skills) ? parsed.soft_skills : [],
    projects: Array.isArray(parsed.projects) ? parsed.projects : [],
    experience: Array.isArray(parsed.experience) ? parsed.experience : [],
    certifications: Array.isArray(parsed.certifications)
      ? parsed.certifications
      : [],
  };
}

export async function parseJobDescriptionWithGemini(
  rawJobText: string,
  titleHint?: string,
  companyHint?: string
): Promise<ParsedJob> {
  const fallback: ParsedJob = {
    job_title: titleHint || "Target Role",
    company: companyHint || "Company",
    required_technical_skills: [],
    preferred_skills: [],
    soft_skills: [],
    education_requirements: "Not specified",
    experience_required: "Not specified",
    responsibilities: [],
    seniority_level: "Not specified",
  };

  const systemInstruction =
    "You are a precise technical recruiter and job description analyzer. Extract structured requirements strictly from the provided job description text. Never invent requirements.";

  const prompt = `Analyze the following job description and extract structured fields.
${titleHint ? `Provided Job Title: ${titleHint}` : ""}
${companyHint ? `Provided Company: ${companyHint}` : ""}

JOB DESCRIPTION:
${rawJobText}`;

  const parsed = await callGeminiJson<ParsedJob>(
    prompt,
    systemInstruction,
    JOB_SCHEMA,
    fallback
  );

  return {
    job_title: titleHint?.trim() || parsed.job_title || "Target Role",
    company: companyHint?.trim() || parsed.company || "Company",
    required_technical_skills: Array.isArray(parsed.required_technical_skills)
      ? parsed.required_technical_skills
      : [],
    preferred_skills: Array.isArray(parsed.preferred_skills)
      ? parsed.preferred_skills
      : [],
    soft_skills: Array.isArray(parsed.soft_skills) ? parsed.soft_skills : [],
    education_requirements: parsed.education_requirements || "Not specified",
    experience_required: parsed.experience_required || "Not specified",
    responsibilities: Array.isArray(parsed.responsibilities)
      ? parsed.responsibilities
      : [],
    seniority_level: parsed.seniority_level || "Not specified",
  };
}

export function buildResumeEvidenceItems(resume: ParsedResume): string[] {
  const items: string[] = [];

  for (const skill of resume.technical_skills) {
    items.push(`Technical Skill: ${skill}`);
  }
  for (const skill of resume.soft_skills) {
    items.push(`Soft Skill: ${skill}`);
  }
  for (const exp of resume.experience) {
    items.push(`Role: ${exp.role} at ${exp.company} (${exp.duration})`);
    for (const h of exp.highlights) {
      items.push(`Experience (${exp.role} at ${exp.company}): ${h}`);
    }
  }
  for (const proj of resume.projects) {
    items.push(
      `Project (${proj.title}): ${proj.description} [Tech: ${proj.technologies.join(", ")}]`
    );
  }
  for (const edu of resume.education) {
    items.push(`Education: ${edu}`);
  }
  for (const cert of resume.certifications) {
    items.push(`Certification: ${cert}`);
  }

  return items.filter((item) => item.trim().length > 0);
}

function buildResumeDocumentString(resume: ParsedResume, rawText: string): string {
  if (rawText.trim().length > 100) {
    return rawText.slice(0, 6000);
  }
  return [
    resume.summary,
    `Skills: ${[...resume.technical_skills, ...resume.soft_skills].join(", ")}`,
    ...resume.experience.map(
      (e) => `${e.role} at ${e.company}: ${e.highlights.join("; ")}`
    ),
    ...resume.projects.map(
      (p) => `${p.title}: ${p.description} (${p.technologies.join(", ")})`
    ),
    `Education: ${resume.education.join("; ")}`,
  ]
    .filter(Boolean)
    .join("\n");
}

export interface MatchPipelineCallbacks {
  onProgress?: (message: string) => void;
}

export async function runSemanticJobMatch(
  jobId: string,
  resume: ParsedResume,
  rawResumeText: string,
  parsedJob: ParsedJob,
  rawJobText: string,
  embeddingCache: EmbeddingCache,
  callbacks?: MatchPipelineCallbacks
): Promise<MatchResult> {
  callbacks?.onProgress?.("Generating semantic embeddings for resume & job...");

  const resumeEvidenceLabels = buildResumeEvidenceItems(resume);
  const resumeDocText = buildResumeDocumentString(resume, rawResumeText);
  const jobDocText = rawJobText.slice(0, 6000);

  const requiredSkills = Array.from(
    new Set([
      ...parsedJob.required_technical_skills,
      ...parsedJob.soft_skills.slice(0, 4),
    ])
  ).filter((s) => s.trim().length > 0);

  const skillsToEvaluate =
    requiredSkills.length > 0
      ? requiredSkills
      : parsedJob.preferred_skills.slice(0, 8);

  // Batch all embeddings cleanly (cached items won't re-hit the API!)
  const allTextsToEmbed = [
    resumeDocText,
    jobDocText,
    ...resumeEvidenceLabels,
    ...skillsToEvaluate,
  ];

  const allVectors = await getBatchedEmbeddings(allTextsToEmbed, embeddingCache);

  const resumeDocVec = allVectors[0] ?? [];
  const jobDocVec = allVectors[1] ?? [];

  const evidenceOffset = 2;
  const candidateEvidenceVectors: CandidateEvidenceVector[] =
    resumeEvidenceLabels.map((label, i) => ({
      label,
      vector: allVectors[evidenceOffset + i] ?? [],
    }));

  const skillsOffset = evidenceOffset + resumeEvidenceLabels.length;

  callbacks?.onProgress?.("Computing cosine similarity across skills...");

  const wholeDocSimilarity = Math.max(
    0,
    cosineSimilarity(resumeDocVec, jobDocVec)
  );
  const docSemanticScore = clampScore(wholeDocSimilarity * 100);

  const semanticSkillMatches: SemanticSkillMatch[] = skillsToEvaluate.map(
    (skill, i) => {
      const skillVec = allVectors[skillsOffset + i] ?? [];
      const best = findMostSimilarCandidateItem(
        skillVec,
        candidateEvidenceVectors
      );
      return {
        requiredSkill: skill,
        bestCandidateEvidence: best.label,
        similarity: best.similarity,
        initialStatus: best.status,
      };
    }
  );

  callbacks?.onProgress?.("Evaluating contextual relevance with Gemini...");

  const systemInstruction = `You are GetHired, a rigorous, honest career readiness evaluator.
TONE & EVIDENCE RULES:
- Be honest, constructive, and specific. Never inflate scores.
- Base every claim strictly on evidence present in the Parsed Resume.
- Clearly state when a skill or requirement is NOT demonstrated rather than assuming or extrapolating.
- For bullet rewrites ("Before -> After"): use strong action verbs and quantified impact, NEVER invent fake metrics or facts the candidate did not provide. Instead, insert clear bracketed placeholders like [Add metric: % latency reduction] or [Add scale: # of users] and list them in metricsNeeded.
- Interpret semantic matches critically: if cosine similarity is high (>=0.75) due to shared vocabulary, verify whether the resume genuinely demonstrates hands-on proficiency vs. passing mention; conversely, recognize genuine equivalent experience (e.g. "built REST services" -> "API development").`;

  const prompt = `Evaluate this candidate's resume against the target job description using both the structured data and the computed embedding cosine similarity matrix.

PARSED RESUME:
${JSON.stringify(resume, null, 2)}

PARSED JOB DESCRIPTION:
${JSON.stringify(parsedJob, null, 2)}

COMPUTED SEMANTIC SIMILARITY MATRIX (Cosine Similarity >= 0.75 = match, 0.55-0.75 = partial, < 0.55 = missing):
Whole Document Cosine Similarity: ${wholeDocSimilarity.toFixed(3)} (${docSemanticScore}/100)
${JSON.stringify(semanticSkillMatches, null, 2)}

TASK:
1. Return skillGaps covering every required skill listed in the similarity matrix (keep the similarityScore accurate to the matrix, refine status to "match" | "partial" | "missing" only if contextual evidence justifies it, and write a concise, evidence-grounded explanation + exact resumeEvidence quote or "Not demonstrated in resume").
2. Score these independent dimensions honestly from 0 to 100:
   - experienceRelevanceScore: How relevant are the candidate's past roles, seniority, and tenure to this job's responsibilities and experience_required?
   - projectsRelevanceScore: How strongly do the candidate's projects demonstrate applied capability for this target role?
   - educationFitScore: How well does the candidate's education/certifications match education_requirements?
   - softSkillsCandidateScore (0-100) and softSkillsRequirementTarget (typically 80-95).
3. Build a Priority Learning Plan (learningPlan) for every "missing" or weak "partial" skill with importance ("High" | "Medium" | "Low"), concrete learningPath, and realistic estimatedTime (e.g. "2-3 weeks").
4. Generate tailored resume improvement suggestions:
   - sectionSuggestions: section-by-section actionable improvements.
   - bulletRewrites: 3 to 5 "Before -> After" rewrites of real bullets from the candidate's experience or projects. NEVER invent metrics; put [Add metric: ...] where real numbers are needed and populate metricsNeeded.
   - missingKeywords: important job keywords missing from the resume, where to place them naturally, and example phrasing.
   - tailoredSummary: a sharp, honest 3-sentence professional summary tailored to this specific role using ONLY real facts from the resume.`;

  interface RawMatchAnalysis {
    overallVerdict: string;
    experienceRelevanceScore: number;
    projectsRelevanceScore: number;
    educationFitScore: number;
    softSkillsCandidateScore: number;
    softSkillsRequirementTarget: number;
    skillGaps: SkillGap[];
    learningPlan: {
      skill: string;
      importance: "High" | "Medium" | "Low";
      learningPath: string;
      estimatedTime: string;
    }[];
    suggestions: Suggestion;
  }

  const fallbackAnalysis: RawMatchAnalysis = {
    overallVerdict:
      "Analysis completed using semantic similarity baselines.",
    experienceRelevanceScore: 50,
    projectsRelevanceScore: 50,
    educationFitScore: 60,
    softSkillsCandidateScore: 65,
    softSkillsRequirementTarget: 85,
    skillGaps: semanticSkillMatches.map((m) => ({
      skill: m.requiredSkill,
      status: m.initialStatus,
      similarityScore: m.similarity,
      explanation:
        m.initialStatus === "match"
          ? "Semantically aligned with existing resume experience."
          : m.initialStatus === "partial"
          ? "Related background detected, but direct depth is limited."
          : "No clear evidence found in the uploaded resume.",
      resumeEvidence: m.bestCandidateEvidence,
    })),
    learningPlan: semanticSkillMatches
      .filter((m) => m.initialStatus !== "match")
      .map((m) => ({
        skill: m.requiredSkill,
        importance: m.initialStatus === "missing" ? "High" : "Medium",
        learningPath: `Build a focused hands-on project demonstrating ${m.requiredSkill} and document measurable outcomes.`,
        estimatedTime: "2–4 weeks",
      })),
    suggestions: {
      sectionSuggestions: [],
      bulletRewrites: [],
      missingKeywords: [],
      tailoredSummary: resume.summary || "",
    },
  };

  const aiAnalysis = await callGeminiJson<RawMatchAnalysis>(
    prompt,
    systemInstruction,
    MATCH_ANALYSIS_SCHEMA,
    fallbackAnalysis
  );

  const normalizedGaps: SkillGap[] = (
    Array.isArray(aiAnalysis.skillGaps) && aiAnalysis.skillGaps.length > 0
      ? aiAnalysis.skillGaps
      : fallbackAnalysis.skillGaps
  ).map((g) => {
    const rawStatus = String(g.status || "").toLowerCase();
    const status: SkillGap["status"] =
      rawStatus === "match"
        ? "match"
        : rawStatus === "partial"
        ? "partial"
        : "missing";
    return {
      skill: g.skill,
      status,
      similarityScore: Number(g.similarityScore ?? 0),
      explanation: g.explanation || "",
      resumeEvidence: g.resumeEvidence || "Not demonstrated in resume",
    };
  });

  const skillsMatchScore = computeSkillsMatchScore(normalizedGaps);
  const breakdown: ScoreBreakdown = {
    skillsMatch: skillsMatchScore,
    experienceRelevance: clampScore(aiAnalysis.experienceRelevanceScore),
    projectsRelevance: clampScore(aiAnalysis.projectsRelevanceScore),
    educationFit: clampScore(aiAnalysis.educationFitScore),
    documentSemanticSimilarity: docSemanticScore,
  };

  const overallScore = computeWeightedCompatibilityScore(breakdown);

  const radarData: RadarDimension[] = [
    {
      category: "Technical Skills",
      candidate: breakdown.skillsMatch,
      requirement: 90,
    },
    {
      category: "Experience",
      candidate: breakdown.experienceRelevance,
      requirement: 85,
    },
    {
      category: "Projects",
      candidate: breakdown.projectsRelevance,
      requirement: 80,
    },
    {
      category: "Education",
      candidate: breakdown.educationFit,
      requirement: 75,
    },
    {
      category: "Soft Skills",
      candidate: clampScore(aiAnalysis.softSkillsCandidateScore || 70),
      requirement: clampScore(aiAnalysis.softSkillsRequirementTarget || 85),
    },
  ];

  return {
    id: jobId,
    jobTitle: parsedJob.job_title,
    company: parsedJob.company,
    overallScore,
    breakdown,
    skillGaps: normalizedGaps,
    learningPlan: Array.isArray(aiAnalysis.learningPlan)
      ? aiAnalysis.learningPlan
      : [],
    radarData,
    suggestions: {
      sectionSuggestions: Array.isArray(
        aiAnalysis.suggestions?.sectionSuggestions
      )
        ? aiAnalysis.suggestions.sectionSuggestions
        : [],
      bulletRewrites: Array.isArray(aiAnalysis.suggestions?.bulletRewrites)
        ? aiAnalysis.suggestions.bulletRewrites
        : [],
      missingKeywords: Array.isArray(aiAnalysis.suggestions?.missingKeywords)
        ? aiAnalysis.suggestions.missingKeywords
        : [],
      tailoredSummary: aiAnalysis.suggestions?.tailoredSummary || "",
    },
    overallVerdict:
      aiAnalysis.overallVerdict ||
      "Evaluation completed based on semantic similarity and structured resume evidence.",
    analyzedAt: new Date().toISOString(),
  };
}

export async function generateComparisonSummary(
  resume: ParsedResume,
  results: MatchResult[]
): Promise<string> {
  if (results.length === 0) return "";
  const sorted = [...results].sort((a, b) => b.overallScore - a.overallScore);
  const top = sorted[0];

  const schema = {
    type: SCHEMA_TYPE.OBJECT,
    properties: {
      explanation: { type: SCHEMA_TYPE.STRING },
    },
    required: ["explanation"],
  };

  const prompt = `Given this candidate's background and ranked job match results, write a concise, honest 3-4 sentence explanation of why "${top.jobTitle}" at "${top.company}" (Score: ${top.overallScore}/100) is the best fit compared to the other evaluated roles, citing specific matched strengths and remaining gaps.

Candidate Skills: ${resume.technical_skills.join(", ")}
Ranked Results:
${sorted
  .map(
    (r, idx) =>
      `${idx + 1}. ${r.jobTitle} (${r.company}) — Overall: ${r.overallScore}/100, Skills: ${r.breakdown.skillsMatch}%, Experience: ${r.breakdown.experienceRelevance}%, Projects: ${r.breakdown.projectsRelevance}%. Matched skills: ${r.skillGaps
        .filter((s) => s.status === "match")
        .map((s) => s.skill)
        .join(", ")}. Missing: ${r.skillGaps
        .filter((s) => s.status === "missing")
        .map((s) => s.skill)
        .join(", ")}.`
  )
  .join("\n")}`;

  const data = await callGeminiJson<{ explanation: string }>(
    prompt,
    "You are a candid career advisor. Be concise, specific, and grounded strictly in the provided match data.",
    schema,
    {
      explanation: `${top.jobTitle} at ${top.company} ranks highest at ${top.overallScore}/100 due to stronger alignment across core technical requirements and relevant experience.`,
    }
  );

  return data.explanation;
}

export async function generateCustomTailoredSummary(
  resume: ParsedResume,
  matchResult: MatchResult,
  emphasis: "balanced" | "technical" | "leadership"
): Promise<string> {
  const schema = {
    type: SCHEMA_TYPE.OBJECT,
    properties: {
      summary: { type: SCHEMA_TYPE.STRING },
    },
    required: ["summary"],
  };

  const prompt = `Write a tailored 3-sentence professional resume summary for ${resume.name} targeting "${matchResult.jobTitle}" at "${matchResult.company}".
Tone/Focus: ${emphasis}
Matched Skills to highlight: ${matchResult.skillGaps
    .filter((g) => g.status === "match")
    .map((g) => g.skill)
    .join(", ")}
Candidate Resume Facts (use ONLY these facts, never invent degrees, years, or metrics):
${JSON.stringify({
  summary: resume.summary,
  experience: resume.experience,
  projects: resume.projects,
  education: resume.education,
  technical_skills: resume.technical_skills,
})}`;

  const data = await callGeminiJson<{ summary: string }>(
    prompt,
    "You are an expert executive resume writer. Strictly use only facts present in the candidate's resume.",
    schema,
    { summary: matchResult.suggestions.tailoredSummary }
  );

  return data.summary;
}

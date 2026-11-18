export interface ProjectItem {
  title: string;
  description: string;
  technologies: string[];
}

export interface ExperienceItem {
  role: string;
  company: string;
  duration: string;
  highlights: string[];
}

export interface ParsedResume {
  name: string;
  email: string;
  summary: string;
  education: string[];
  technical_skills: string[];
  soft_skills: string[];
  projects: ProjectItem[];
  experience: ExperienceItem[];
  certifications: string[];
}

export interface ParsedJob {
  job_title: string;
  company: string;
  required_technical_skills: string[];
  preferred_skills: string[];
  soft_skills: string[];
  education_requirements: string;
  experience_required: string;
  responsibilities: string[];
  seniority_level: string;
}

export type SkillMatchStatus = "match" | "partial" | "missing";

export interface SemanticSkillMatch {
  requiredSkill: string;
  bestCandidateEvidence: string;
  similarity: number;
  initialStatus: SkillMatchStatus;
}

export interface SkillGap {
  skill: string;
  status: SkillMatchStatus;
  similarityScore: number;
  explanation: string;
  resumeEvidence: string;
}

export type LearningImportance = "High" | "Medium" | "Low";

export interface PriorityLearningItem {
  skill: string;
  importance: LearningImportance;
  learningPath: string;
  estimatedTime: string;
}

export interface BulletRewrite {
  section: string;
  before: string;
  after: string;
  rationale: string;
  metricsNeeded: string[];
}

export interface KeywordPlacement {
  keyword: string;
  suggestedSection: string;
  examplePhrasing: string;
}

export interface SectionSuggestion {
  section: string;
  advice: string;
  priority: LearningImportance;
}

export interface Suggestion {
  sectionSuggestions: SectionSuggestion[];
  bulletRewrites: BulletRewrite[];
  missingKeywords: KeywordPlacement[];
  tailoredSummary: string;
}

export interface RadarDimension {
  category: "Technical Skills" | "Experience" | "Projects" | "Education" | "Soft Skills";
  candidate: number;
  requirement: number;
}

export interface ScoreBreakdown {
  skillsMatch: number; // 0-100 (weight 40%)
  experienceRelevance: number; // 0-100 (weight 25%)
  projectsRelevance: number; // 0-100 (weight 15%)
  educationFit: number; // 0-100 (weight 10%)
  documentSemanticSimilarity: number; // 0-100 (weight 10%)
}

export interface MatchResult {
  id: string;
  jobTitle: string;
  company: string;
  overallScore: number;
  breakdown: ScoreBreakdown;
  skillGaps: SkillGap[];
  learningPlan: PriorityLearningItem[];
  radarData: RadarDimension[];
  suggestions: Suggestion;
  overallVerdict: string;
  analyzedAt: string;
}

export type AppSection =
  | "dashboard"
  | "upload"
  | "analyze"
  | "suggestions";

export interface ToastMessage {
  id: string;
  type: "success" | "error" | "info";
  title: string;
  description?: string;
}

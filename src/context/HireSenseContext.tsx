import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  SAMPLE_JOBS,
  SAMPLE_PARSED_RESUME,
  SAMPLE_RESUME_RAW_TEXT,
} from "../data/sampleData";
import type { EmbeddingCache } from "../services/embeddingService";
import {
  parseJobDescriptionWithGemini,
  parseResumeWithGemini,
  runSemanticJobMatch,
} from "../services/geminiService";
import { extractTextFromPdf } from "../services/pdfService";
import type {
  AppSection,
  MatchResult,
  ParsedJob,
  ParsedResume,
  ToastMessage,
} from "../types";

interface HireSenseContextValue {
  theme: "light" | "dark";
  toggleTheme: () => void;
  activeSection: AppSection;
  setActiveSection: (section: AppSection) => void;
  toasts: ToastMessage[];
  pushToast: (toast: Omit<ToastMessage, "id">) => void;
  dismissToast: (id: string) => void;

  // Resume state
  resumeFileMeta: { name: string; size: number; pageCount?: number } | null;
  rawResumeText: string;
  parsedResume: ParsedResume | null;
  resumeParsingStatus: "idle" | "extracting" | "parsing" | "done" | "error";
  resumeProgressMessage: string;
  resumeError: string | null;
  handleUploadResumeFile: (file: File) => Promise<void>;
  handleParseRawResumeText: (text: string) => Promise<void>;
  updateResumeSkills: (
    kind: "technical_skills" | "soft_skills",
    skills: string[]
  ) => void;
  clearResume: () => void;

  // Single Job Analysis state
  primaryJobFileMeta: { name: string; size: number; pageCount?: number } | null;
  primaryJobTitle: string;
  setPrimaryJobTitle: (v: string) => void;
  primaryJobCompany: string;
  setPrimaryJobCompany: (v: string) => void;
  primaryJobRawText: string;
  setPrimaryJobRawText: (v: string) => void;
  primaryParsedJob: ParsedJob | null;
  primaryJobStatus: "idle" | "extracting" | "parsing" | "matching" | "done" | "error";
  primaryJobProgress: string;
  primaryJobError: string | null;
  activeMatchResult: MatchResult | null;
  setActiveMatchResult: (result: MatchResult | null) => void;
  handleUploadJobPdf: (file: File) => Promise<void>;
  clearPrimaryJobFile: () => void;
  parsePrimaryJobOnly: () => Promise<ParsedJob | null>;
  analyzePrimaryJobMatch: () => Promise<void>;

  // Sample data loader
  loadSampleData: (andAnalyze?: boolean) => Promise<void>;
  isLoadingSample: boolean;
}

const HireSenseContext = createContext<HireSenseContextValue | null>(null);

export function HireSenseProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [activeSection, setActiveSection] = useState<AppSection>("dashboard");
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // In-memory embedding cache for the current session (private, never persisted)
  const embeddingCacheRef = useRef<EmbeddingCache>(new Map());

  // Resume state
  const [resumeFileMeta, setResumeFileMeta] = useState<{
    name: string;
    size: number;
    pageCount?: number;
  } | null>(null);
  const [rawResumeText, setRawResumeText] = useState<string>("");
  const [parsedResume, setParsedResume] = useState<ParsedResume | null>(null);
  const [resumeParsingStatus, setResumeParsingStatus] = useState<
    "idle" | "extracting" | "parsing" | "done" | "error"
  >("idle");
  const [resumeProgressMessage, setResumeProgressMessage] =
    useState<string>("");
  const [resumeError, setResumeError] = useState<string | null>(null);

  // Single Job state
  const [primaryJobFileMeta, setPrimaryJobFileMeta] = useState<{
    name: string;
    size: number;
    pageCount?: number;
  } | null>(null);
  const [primaryJobTitle, setPrimaryJobTitle] = useState<string>("");
  const [primaryJobCompany, setPrimaryJobCompany] = useState<string>("");
  const [primaryJobRawText, setPrimaryJobRawTextState] = useState<string>("");
  const [primaryParsedJob, setPrimaryParsedJob] = useState<ParsedJob | null>(
    null
  );
  const setPrimaryJobRawText = useCallback((value: string) => {
    setPrimaryJobRawTextState(value);
    setPrimaryParsedJob(null);
  }, []);
  const [primaryJobStatus, setPrimaryJobStatus] = useState<
    "idle" | "extracting" | "parsing" | "matching" | "done" | "error"
  >("idle");
  const [primaryJobProgress, setPrimaryJobProgress] = useState<string>("");
  const [primaryJobError, setPrimaryJobError] = useState<string | null>(null);
  const [activeMatchResult, setActiveMatchResult] =
    useState<MatchResult | null>(null);

  const [isLoadingSample, setIsLoadingSample] = useState<boolean>(false);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const pushToast = useCallback(
    (toast: Omit<ToastMessage, "id">) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setToasts((prev) => [...prev, { ...toast, id }]);
      window.setTimeout(() => {
        dismissToast(id);
      }, 4500);
    },
    [dismissToast]
  );

  const handleUploadResumeFile = useCallback(
    async (file: File) => {
      setResumeError(null);
      setResumeParsingStatus("extracting");
      setResumeProgressMessage("Extracting text from PDF in your browser...");

      try {
        const extracted = await extractTextFromPdf(file);
        setResumeFileMeta({
          name: extracted.fileName,
          size: extracted.fileSize,
          pageCount: extracted.pageCount,
        });
        setRawResumeText(extracted.text);

        setResumeParsingStatus("parsing");
        setResumeProgressMessage("Parsing resume structure with Gemini AI...");

        const structured = await parseResumeWithGemini(extracted.text);
        setParsedResume(structured);
        setResumeParsingStatus("done");
        setResumeProgressMessage("");
        pushToast({
          type: "success",
          title: "Resume parsed",
          description: `Extracted ${structured.technical_skills.length} technical skills and ${structured.experience.length} roles.`,
        });
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : "Failed to process resume PDF.";
        setResumeParsingStatus("error");
        setResumeProgressMessage("");
        setResumeError(msg);
        pushToast({
          type: "error",
          title: "Resume parsing failed",
          description: msg,
        });
      }
    },
    [pushToast]
  );

  const handleParseRawResumeText = useCallback(
    async (text: string) => {
      if (!text.trim()) {
        setResumeError("Please paste resume text before parsing.");
        return;
      }
      setResumeError(null);
      setRawResumeText(text);
      setResumeFileMeta({ name: "Pasted Resume Text", size: text.length });
      setResumeParsingStatus("parsing");
      setResumeProgressMessage("Parsing resume structure with Gemini AI...");

      try {
        const structured = await parseResumeWithGemini(text);
        setParsedResume(structured);
        setResumeParsingStatus("done");
        setResumeProgressMessage("");
        pushToast({
          type: "success",
          title: "Resume parsed",
          description: "Your structured profile is ready to review.",
        });
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : "Failed to parse resume text.";
        setResumeParsingStatus("error");
        setResumeProgressMessage("");
        setResumeError(msg);
        pushToast({
          type: "error",
          title: "Parsing error",
          description: msg,
        });
      }
    },
    [pushToast]
  );

  const updateResumeSkills = useCallback(
    (kind: "technical_skills" | "soft_skills", skills: string[]) => {
      setParsedResume((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          [kind]: skills,
        };
      });
    },
    []
  );

  const clearResume = useCallback(() => {
    setResumeFileMeta(null);
    setRawResumeText("");
    setParsedResume(null);
    setResumeParsingStatus("idle");
    setResumeProgressMessage("");
    setResumeError(null);
    setActiveMatchResult(null);
    embeddingCacheRef.current.clear();
  }, []);

  const clearPrimaryJobFile = useCallback(() => {
    setPrimaryJobFileMeta(null);
    setPrimaryJobRawTextState("");
    setPrimaryParsedJob(null);
    setPrimaryJobError(null);
    setPrimaryJobStatus("idle");
    setPrimaryJobProgress("");
  }, []);

  const handleUploadJobPdf = useCallback(
    async (file: File) => {
      setPrimaryJobError(null);
      setPrimaryJobStatus("extracting");
      setPrimaryJobProgress("Extracting text from job description PDF...");

      try {
        const extracted = await extractTextFromPdf(file);
        setPrimaryJobFileMeta({
          name: extracted.fileName,
          size: extracted.fileSize,
          pageCount: extracted.pageCount,
        });
        setPrimaryJobRawTextState(extracted.text);

        setPrimaryJobStatus("parsing");
        setPrimaryJobProgress(
          "Extracting structured job requirements with Gemini AI..."
        );

        const parsed = await parseJobDescriptionWithGemini(
          extracted.text,
          primaryJobTitle,
          primaryJobCompany
        );
        setPrimaryParsedJob(parsed);
        if (!primaryJobTitle.trim()) setPrimaryJobTitle(parsed.job_title);
        if (!primaryJobCompany.trim()) setPrimaryJobCompany(parsed.company);
        setPrimaryJobStatus("idle");
        setPrimaryJobProgress("");
        pushToast({
          type: "success",
          title: "Job PDF extracted",
          description: `Identified ${parsed.required_technical_skills.length} required skills for ${parsed.job_title}.`,
        });
      } catch (err: unknown) {
        const msg =
          err instanceof Error
            ? err.message
            : "Failed to process job description PDF.";
        setPrimaryJobStatus("error");
        setPrimaryJobProgress("");
        setPrimaryJobError(msg);
        pushToast({
          type: "error",
          title: "Job PDF extraction failed",
          description: msg,
        });
      }
    },
    [primaryJobTitle, primaryJobCompany, pushToast]
  );

  const parsePrimaryJobOnly = useCallback(async () => {
    if (!primaryJobRawText.trim()) {
      setPrimaryJobError("Please paste or upload a job description first.");
      return null;
    }

    setPrimaryJobError(null);
    setPrimaryJobStatus("parsing");
    setPrimaryJobProgress("Analyzing job description requirements...");

    try {
      const parsed = await parseJobDescriptionWithGemini(
        primaryJobRawText,
        primaryJobTitle,
        primaryJobCompany
      );
      setPrimaryParsedJob(parsed);
      if (!primaryJobTitle.trim()) setPrimaryJobTitle(parsed.job_title);
      if (!primaryJobCompany.trim()) setPrimaryJobCompany(parsed.company);
      setPrimaryJobStatus("idle");
      setPrimaryJobProgress("");
      pushToast({
        type: "success",
        title: "Job description extracted",
        description: `Identified ${parsed.required_technical_skills.length} required skills for ${parsed.job_title}.`,
      });
      return parsed;
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Failed to analyze job description.";
      setPrimaryJobStatus("error");
      setPrimaryJobProgress("");
      setPrimaryJobError(msg);
      pushToast({
        type: "error",
        title: "Job analysis failed",
        description: msg,
      });
      return null;
    }
  }, [primaryJobRawText, primaryJobTitle, primaryJobCompany, pushToast]);

  const analyzePrimaryJobMatch = useCallback(async () => {
    if (!parsedResume) {
      pushToast({
        type: "error",
        title: "Resume required",
        description: "Upload or load a resume before running semantic matching.",
      });
      setActiveSection("upload");
      return;
    }
    if (!primaryJobRawText.trim()) {
      setPrimaryJobError("Please paste a job description to analyze.");
      return;
    }

    setPrimaryJobError(null);
    setPrimaryJobStatus("matching");
    setPrimaryJobProgress("Parsing job description...");

    try {
      const jobToMatch =
        primaryParsedJob &&
        primaryParsedJob.job_title === (primaryJobTitle || primaryParsedJob.job_title)
          ? primaryParsedJob
          : await parseJobDescriptionWithGemini(
              primaryJobRawText,
              primaryJobTitle,
              primaryJobCompany
            );

      setPrimaryParsedJob(jobToMatch);
      if (!primaryJobTitle.trim()) setPrimaryJobTitle(jobToMatch.job_title);
      if (!primaryJobCompany.trim()) setPrimaryJobCompany(jobToMatch.company);

      const matchResult = await runSemanticJobMatch(
        "primary-job",
        parsedResume,
        rawResumeText,
        jobToMatch,
        primaryJobRawText,
        embeddingCacheRef.current,
        {
          onProgress: (msg) => setPrimaryJobProgress(msg),
        }
      );

      setActiveMatchResult(matchResult);
      setPrimaryJobStatus("done");
      setPrimaryJobProgress("");
      setActiveSection("dashboard");
      pushToast({
        type: "success",
        title: `Match complete: ${matchResult.overallScore}%`,
        description: `${matchResult.jobTitle} at ${matchResult.company}`,
      });
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Semantic matching failed. Please try again.";
      setPrimaryJobStatus("error");
      setPrimaryJobProgress("");
      setPrimaryJobError(msg);
      pushToast({
        type: "error",
        title: "Matching failed",
        description: msg,
      });
    }
  }, [
    parsedResume,
    rawResumeText,
    primaryJobRawText,
    primaryParsedJob,
    primaryJobTitle,
    primaryJobCompany,
    pushToast,
  ]);

  const loadSampleData = useCallback(
    async (andAnalyze = false) => {
      setIsLoadingSample(true);
      try {
        setResumeFileMeta({
          name: "Maya_Lin_Resume_Sample.pdf",
          size: SAMPLE_RESUME_RAW_TEXT.length,
          pageCount: 1,
        });
        setRawResumeText(SAMPLE_RESUME_RAW_TEXT);
        setParsedResume(SAMPLE_PARSED_RESUME);
        setResumeParsingStatus("done");
        setResumeError(null);

        const firstJob = SAMPLE_JOBS[0];
        setPrimaryJobTitle(firstJob.title);
        setPrimaryJobCompany(firstJob.company);
        setPrimaryJobRawTextState(firstJob.rawText);
        setPrimaryParsedJob(null);
        setPrimaryJobError(null);

        if (andAnalyze) {
          setPrimaryJobStatus("matching");
          setPrimaryJobProgress("Analyzing sample job description...");
          const parsedJob = await parseJobDescriptionWithGemini(
            firstJob.rawText,
            firstJob.title,
            firstJob.company
          );
          setPrimaryParsedJob(parsedJob);

          const matchResult = await runSemanticJobMatch(
            "sample-primary-job",
            SAMPLE_PARSED_RESUME,
            SAMPLE_RESUME_RAW_TEXT,
            parsedJob,
            firstJob.rawText,
            embeddingCacheRef.current,
            {
              onProgress: (msg) => setPrimaryJobProgress(msg),
            }
          );

          setActiveMatchResult(matchResult);
          setPrimaryJobStatus("done");
          setPrimaryJobProgress("");
          setActiveSection("dashboard");
          pushToast({
            type: "success",
            title: `Sample analyzed: ${matchResult.overallScore}% match`,
            description: `${matchResult.jobTitle} at ${matchResult.company}`,
          });
        } else {
          setActiveSection("analyze");
          pushToast({
            type: "info",
            title: "Sample resume & job loaded",
            description:
              "Review Maya Lin's profile or run AI Semantic Match right away.",
          });
        }
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : "Failed to run sample analysis.";
        setPrimaryJobStatus("error");
        setPrimaryJobProgress("");
        setPrimaryJobError(msg);
        pushToast({
          type: "error",
          title: "Sample analysis failed",
          description: msg,
        });
      } finally {
        setIsLoadingSample(false);
      }
    },
    [pushToast]
  );

  const value = useMemo<HireSenseContextValue>(
    () => ({
      theme,
      toggleTheme,
      activeSection,
      setActiveSection,
      toasts,
      pushToast,
      dismissToast,
      resumeFileMeta,
      rawResumeText,
      parsedResume,
      resumeParsingStatus,
      resumeProgressMessage,
      resumeError,
      handleUploadResumeFile,
      handleParseRawResumeText,
      updateResumeSkills,
      clearResume,
      primaryJobFileMeta,
      primaryJobTitle,
      setPrimaryJobTitle,
      primaryJobCompany,
      setPrimaryJobCompany,
      primaryJobRawText,
      setPrimaryJobRawText,
      primaryParsedJob,
      primaryJobStatus,
      primaryJobProgress,
      primaryJobError,
      activeMatchResult,
      setActiveMatchResult,
      handleUploadJobPdf,
      clearPrimaryJobFile,
      parsePrimaryJobOnly,
      analyzePrimaryJobMatch,
      loadSampleData,
      isLoadingSample,
    }),
    [
      theme,
      toggleTheme,
      activeSection,
      toasts,
      pushToast,
      dismissToast,
      resumeFileMeta,
      rawResumeText,
      parsedResume,
      resumeParsingStatus,
      resumeProgressMessage,
      resumeError,
      handleUploadResumeFile,
      handleParseRawResumeText,
      updateResumeSkills,
      clearResume,
      primaryJobFileMeta,
      primaryJobTitle,
      primaryJobCompany,
      primaryJobRawText,
      primaryParsedJob,
      primaryJobStatus,
      primaryJobProgress,
      primaryJobError,
      activeMatchResult,
      handleUploadJobPdf,
      clearPrimaryJobFile,
      parsePrimaryJobOnly,
      analyzePrimaryJobMatch,
      loadSampleData,
      isLoadingSample,
    ]
  );

  return (
    <HireSenseContext.Provider value={value}>
      {children}
    </HireSenseContext.Provider>
  );
}

export function useHireSense(): HireSenseContextValue {
  const ctx = useContext(HireSenseContext);
  if (!ctx) {
    throw new Error("useHireSense must be used inside HireSenseProvider");
  }
  return ctx;
}

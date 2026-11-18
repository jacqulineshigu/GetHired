import { Check } from "lucide-react";
import { useHireSense } from "../context/HireSenseContext";
import type { AppSection } from "../types";

export function OnboardingStepper() {
  const {
    parsedResume,
    primaryJobRawText,
    activeMatchResult,
    activeSection,
    setActiveSection,
  } = useHireSense();

  const step1Done = Boolean(parsedResume);
  const step2Done = Boolean(primaryJobRawText.trim()) && Boolean(activeMatchResult);
  const step3Done = Boolean(activeMatchResult);

  const steps: {
    number: number;
    label: string;
    detail: string;
    done: boolean;
    active: boolean;
    target: AppSection;
  }[] = [
    {
      number: 1,
      label: "Upload Resume",
      detail: parsedResume
        ? `${parsedResume.name} · ${parsedResume.technical_skills.length} skills`
        : "PDF up to 5 MB",
      done: step1Done,
      active: activeSection === "upload" || !step1Done,
      target: "upload",
    },
    {
      number: 2,
      label: "Add Job Description",
      detail: activeMatchResult
        ? activeMatchResult.jobTitle
        : "Paste role requirements",
      done: step2Done,
      active: activeSection === "analyze" || (step1Done && !step3Done),
      target: "analyze",
    },
    {
      number: 3,
      label: "View Results",
      detail: activeMatchResult
        ? `${activeMatchResult.overallScore}% match`
        : "Score, gaps & rewrites",
      done: step3Done,
      active: activeSection === "dashboard" && step3Done,
      target: "dashboard",
    },
  ];

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {steps.map((step) => (
          <button
            key={step.number}
            type="button"
            onClick={() => setActiveSection(step.target)}
            className={`flex items-center gap-3.5 text-left p-3 rounded-xl border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
              step.active
                ? "border-indigo-300 dark:border-indigo-700 bg-indigo-50/60 dark:bg-indigo-950/30"
                : "border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50"
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-mono-tabular font-semibold shrink-0 ${
                step.done
                  ? "bg-emerald-600 text-white"
                  : step.active
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
              }`}
            >
              {step.done ? <Check className="w-4 h-4" /> : step.number}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                {step.label}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                {step.detail}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

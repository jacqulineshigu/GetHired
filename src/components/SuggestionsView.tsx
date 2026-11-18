import { useState } from "react";
import { motion } from "motion/react";
import {
  AlertCircle,
  ArrowRight,
  Check,
  Copy,
  Loader2,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { useHireSense } from "../context/HireSenseContext";
import { generateCustomTailoredSummary } from "../services/geminiService";

export function SuggestionsView() {
  const {
    parsedResume,
    activeMatchResult,
    setActiveSection,
    pushToast,
    loadSampleData,
  } = useHireSense();

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [summaryEmphasis, setSummaryEmphasis] = useState<
    "balanced" | "technical" | "leadership"
  >("balanced");
  const [customSummary, setCustomSummary] = useState<string | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  const handleCopy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      pushToast({
        type: "success",
        title: "Copied to clipboard",
      });
      window.setTimeout(() => {
        setCopiedId((prev) => (prev === id ? null : prev));
      }, 2000);
    } catch {
      pushToast({
        type: "error",
        title: "Copy failed",
        description: "Please select and copy the text manually.",
      });
    }
  };

  const handleRegenerateSummary = async () => {
    if (!parsedResume || !activeMatchResult) return;
    setIsGeneratingSummary(true);
    try {
      const text = await generateCustomTailoredSummary(
        parsedResume,
        activeMatchResult,
        summaryEmphasis
      );
      setCustomSummary(text);
      pushToast({
        type: "success",
        title: "Tailored summary updated",
      });
    } catch (err: unknown) {
      pushToast({
        type: "error",
        title: "Generation failed",
        description:
          err instanceof Error ? err.message : "Could not generate summary.",
      });
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  if (!activeMatchResult) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 sm:p-12 text-center"
      >
        <div className="mx-auto w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4">
          <Sparkles className="w-6 h-6" />
        </div>
        <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-slate-100">
          No active job analysis yet
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
          Run a semantic match against a job description to unlock tailored
          bullet rewrites, keyword placement advice, and a custom summary.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => setActiveSection("analyze")}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium"
          >
            Analyze a Job
          </button>
          <button
            type="button"
            onClick={() => loadSampleData(true)}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            Try Sample Data
          </button>
        </div>
      </motion.div>
    );
  }

  const { suggestions } = activeMatchResult;
  const displayedSummary = customSummary ?? suggestions.tailoredSummary;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      {/* Tailored Professional Summary Generator */}
      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
              Tailored for {activeMatchResult.jobTitle} at{" "}
              {activeMatchResult.company}
            </p>
            <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
              Tailored Professional Summary
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
              {(["balanced", "technical", "leadership"] as const).map(
                (mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setSummaryEmphasis(mode)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium capitalize transition-colors whitespace-nowrap ${
                      summaryEmphasis === mode
                        ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                    }`}
                  >
                    {mode}
                  </button>
                )
              )}
            </div>

            <button
              type="button"
              onClick={handleRegenerateSummary}
              disabled={isGeneratingSummary || !parsedResume}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-60 whitespace-nowrap"
            >
              {isGeneratingSummary ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5" />
              )}
              <span>Regenerate</span>
            </button>

            <button
              type="button"
              onClick={() => handleCopy("tailored-summary", displayedSummary)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium whitespace-nowrap"
            >
              {copiedId === "tailored-summary" ? (
                <Check className="w-3.5 h-3.5" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              <span>
                {copiedId === "tailored-summary" ? "Copied" : "Copy"}
              </span>
            </button>
          </div>
        </div>

        <p className="mt-4 text-sm sm:text-base text-slate-700 dark:text-slate-200 leading-relaxed">
          {displayedSummary ||
            "Click Regenerate to draft a tailored summary grounded in your parsed resume."}
        </p>
      </section>

      {/* Before -> After Bullet Rewrites */}
      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
        <div className="mb-5">
          <h3 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
            Before → After Bullet Point Rewrites
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Stronger action verbs and structure using only verified resume
            facts. Bracketed prompts show where to fill in your own metrics.
          </p>
        </div>

        {suggestions.bulletRewrites.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            No bullet point rewrites generated for this match.
          </p>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {suggestions.bulletRewrites.map((rw, idx) => {
              const copyKey = `rewrite-${idx}`;
              return (
                <div key={idx} className="py-5 first:pt-0 last:pb-0 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                      {rw.section}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(copyKey, rw.after)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      {copiedId === copyKey ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span>
                        {copiedId === copyKey ? "Copied" : "Copy rewrite"}
                      </span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-11 gap-3 items-stretch">
                    <div className="lg:col-span-5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 p-3.5">
                      <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 mb-1">
                        Before
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                        {rw.before}
                      </p>
                    </div>

                    <div className="hidden lg:flex lg:col-span-1 items-center justify-center text-slate-400">
                      <ArrowRight className="w-4 h-4" />
                    </div>

                    <div className="lg:col-span-5 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/25 border border-indigo-200 dark:border-indigo-900/60 p-3.5">
                      <p className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 mb-1">
                        After
                      </p>
                      <p className="text-sm text-slate-900 dark:text-slate-100 leading-relaxed">
                        {rw.after}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span>{rw.rationale}</span>
                    {rw.metricsNeeded && rw.metricsNeeded.length > 0 && (
                      <span className="inline-flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-medium shrink-0">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>Add real numbers: {rw.metricsNeeded.join(", ")}</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Section-by-Section Advice & Missing Keyword Placement */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
          <h3 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100 mb-4">
            Section-by-Section Improvements
          </h3>

          {suggestions.sectionSuggestions.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              No section-level changes needed.
            </p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {suggestions.sectionSuggestions.map((sec, idx) => {
                const copyKey = `sec-${idx}`;
                return (
                  <div key={idx} className="py-3.5 first:pt-0 last:pb-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                          {sec.section}
                        </span>
                        <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">
                          ·
                        </span>
                        <span
                          className={`font-semibold ${
                            sec.priority === "High"
                              ? "text-rose-600 dark:text-rose-400"
                              : sec.priority === "Medium"
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-slate-500 dark:text-slate-400"
                          }`}
                        >
                          {sec.priority}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(copyKey, sec.advice)}
                        aria-label={`Copy ${sec.section} suggestion`}
                        className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 p-1 rounded"
                      >
                        {copiedId === copyKey ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                    <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      {sec.advice}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
          <h3 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100 mb-4">
            Missing Keywords & Natural Placement
          </h3>

          {suggestions.missingKeywords.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Your resume already covers the role&apos;s primary keywords.
            </p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {suggestions.missingKeywords.map((kw, idx) => {
                const copyKey = `kw-${idx}`;
                return (
                  <div key={idx} className="py-3.5 first:pt-0 last:pb-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                          {kw.keyword}
                        </span>
                        <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">
                          ·
                        </span>
                        <span className="text-indigo-600 dark:text-indigo-400 font-medium">
                          Place in {kw.suggestedSection}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(copyKey, kw.examplePhrasing)}
                        aria-label={`Copy phrasing for ${kw.keyword}`}
                        className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 p-1 rounded"
                      >
                        {copiedId === copyKey ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                    <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      &ldquo;{kw.examplePhrasing}&rdquo;
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </motion.div>
  );
}

import { motion } from "motion/react";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  FileUp,
  FlaskConical,
  Sparkles,
  XCircle,
} from "lucide-react";
import {
  Legend,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { useHireSense } from "../context/HireSenseContext";
import { CircularScoreGauge } from "./CircularScoreGauge";
import { OnboardingStepper } from "./OnboardingStepper";

export function DashboardView() {
  const {
    theme,
    parsedResume,
    activeMatchResult,
    setActiveSection,
    loadSampleData,
    isLoadingSample,
  } = useHireSense();

  const targetRoleTitle = activeMatchResult?.jobTitle || "—";

  if (!activeMatchResult) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="space-y-6"
      >
        <OnboardingStepper />

        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 sm:p-12 text-center">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4">
            <Sparkles className="w-7 h-7" />
          </div>
          <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-100 max-w-xl mx-auto">
            Semantic Resume & Job Match Intelligence
          </h2>
          <p className="mt-2.5 text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Upload your PDF resume and paste a target job description to get an
            evidence-backed compatibility score, embedding-based skill gap
            diagnostics, and actionable resume rewrites.
          </p>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() =>
                setActiveSection(parsedResume ? "analyze" : "upload")
              }
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors whitespace-nowrap"
            >
              <FileUp className="w-4 h-4" />
              <span>
                {parsedResume ? "Add Job Description" : "Upload Resume (PDF)"}
              </span>
            </button>

            <button
              type="button"
              disabled={isLoadingSample}
              onClick={() => loadSampleData(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm font-medium text-slate-700 dark:text-slate-200 transition-colors whitespace-nowrap disabled:opacity-60"
            >
              <FlaskConical className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>
                {isLoadingSample
                  ? "Running Sample Analysis..."
                  : "Try with Sample Data"}
              </span>
            </button>
          </div>
        </section>
      </motion.div>
    );
  }

  const matchedSkills = activeMatchResult.skillGaps.filter(
    (s) => s.status === "match"
  );
  const partialSkills = activeMatchResult.skillGaps.filter(
    (s) => s.status === "partial"
  );
  const missingSkills = activeMatchResult.skillGaps.filter(
    (s) => s.status === "missing"
  );

  const breakdownRows = [
    {
      label: "Skills Alignment",
      weight: "40%",
      score: activeMatchResult.breakdown.skillsMatch,
    },
    {
      label: "Experience Relevance",
      weight: "25%",
      score: activeMatchResult.breakdown.experienceRelevance,
    },
    {
      label: "Projects Alignment",
      weight: "15%",
      score: activeMatchResult.breakdown.projectsRelevance,
    },
    {
      label: "Education & Credentials",
      weight: "10%",
      score: activeMatchResult.breakdown.educationFit,
    },
    {
      label: "Whole-Doc Semantic Similarity",
      weight: "10%",
      score: activeMatchResult.breakdown.documentSemanticSimilarity,
    },
  ];

  const isDark = theme === "dark";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      {/* Hero Readiness Score + Weighted Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <section className="lg:col-span-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 flex flex-col justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {activeMatchResult.company} · Semantic Compatibility
            </p>
            <h2 className="font-display text-xl font-bold text-slate-900 dark:text-slate-100 mt-0.5">
              {activeMatchResult.jobTitle}
            </h2>
          </div>

          <div className="my-6 flex justify-center">
            <CircularScoreGauge score={activeMatchResult.overallScore} />
          </div>

          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed pt-4 border-t border-slate-100 dark:border-slate-800">
            {activeMatchResult.overallVerdict}
          </p>
        </section>

        <section className="lg:col-span-7 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-5">
              <div>
                <h3 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
                  Weighted Compatibility Breakdown
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Combined embedding similarity and Gemini contextual verification
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveSection("suggestions")}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline whitespace-nowrap shrink-0"
              >
                <span>View Rewrites</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-4">
              {breakdownRows.map((row) => (
                <div key={row.label}>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {row.label}{" "}
                      <span className="text-xs text-slate-400 dark:text-slate-500 font-mono-tabular">
                        ({row.weight})
                      </span>
                    </span>
                    <span className="font-mono-tabular font-semibold text-slate-900 dark:text-slate-100">
                      {row.score}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-indigo-600 dark:bg-indigo-500 transition-all duration-500"
                      style={{ width: `${row.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Stat Strip */}
          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Skills Matched
              </p>
              <p className="font-mono-tabular text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                {matchedSkills.length}
                <span className="text-xs font-normal text-slate-400 dark:text-slate-500">
                  /{activeMatchResult.skillGaps.length}
                </span>
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Skills Missing
              </p>
              <p className="font-mono-tabular text-xl font-bold text-rose-600 dark:text-rose-400 mt-0.5">
                {missingSkills.length}
              </p>
            </div>
            <div className="min-w-0">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Target Role
              </p>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate mt-1">
                {targetRoleTitle}
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* Radar Chart + Priority Learning Plan */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <section className="lg:col-span-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
          <h3 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
            Candidate vs. Role Profile
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Coverage across five core hiring dimensions
          </p>
          <div className="h-72 mt-3">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart
                cx="50%"
                cy="50%"
                outerRadius="72%"
                data={activeMatchResult.radarData}
              >
                <PolarGrid
                  stroke={isDark ? "#334155" : "#e2e8f0"}
                />
                <PolarAngleAxis
                  dataKey="category"
                  tick={{
                    fill: isDark ? "#cbd5e1" : "#475569",
                    fontSize: 11,
                  }}
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 100]}
                  tick={{
                    fill: isDark ? "#64748b" : "#94a3b8",
                    fontSize: 10,
                  }}
                />
                <Radar
                  name="Candidate"
                  dataKey="candidate"
                  stroke="#4f46e5"
                  fill="#4f46e5"
                  fillOpacity={0.32}
                />
                <Radar
                  name="Job Target"
                  dataKey="requirement"
                  stroke="#94a3b8"
                  fill="#94a3b8"
                  fillOpacity={0.14}
                />
                <Legend
                  wrapperStyle={{ fontSize: "12px" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? "#0f172a" : "#ffffff",
                    borderColor: isDark ? "#334155" : "#e2e8f0",
                    borderRadius: "12px",
                    fontSize: "12px",
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="lg:col-span-7 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
          <div className="flex items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
                Priority Learning Plan
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Targeted sequence to close missing and partial requirements
              </p>
            </div>
            <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
          </div>

          {activeMatchResult.learningPlan.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400 py-8 text-center">
              No critical skill gaps identified for this role.
            </p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {activeMatchResult.learningPlan.map((item, idx) => {
                const importanceTone =
                  item.importance === "High"
                    ? "text-rose-700 dark:text-rose-400"
                    : item.importance === "Medium"
                    ? "text-amber-700 dark:text-amber-400"
                    : "text-slate-600 dark:text-slate-400";

                return (
                  <div key={`${item.skill}-${idx}`} className="py-3.5 first:pt-0 last:pb-0">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {item.skill}
                      </span>
                      <div className="flex items-center gap-2 text-xs">
                        <span className={`font-semibold ${importanceTone}`}>
                          {item.importance} Priority
                        </span>
                        <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">
                          ·
                        </span>
                        <span className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400 font-mono-tabular">
                          <Clock className="w-3 h-3" />
                          {item.estimatedTime}
                        </span>
                      </div>
                    </div>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      {item.learningPath}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Three-column Skill Gap Analysis */}
      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
        <div className="mb-5">
          <h3 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
            Skill Gap Analysis
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Semantic threshold: Match (≥ 0.75 cosine) · Partial (0.55–0.75) ·
            Missing (&lt; 0.55)
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Matched Skills */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-emerald-200 dark:border-emerald-900/60">
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                Matched Skills
              </span>
              <span className="font-mono-tabular text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                {matchedSkills.length}
              </span>
            </div>

            {matchedSkills.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400 py-2">
                No strong skill matches found yet.
              </p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {matchedSkills.map((item) => (
                  <div key={item.skill} className="py-3 first:pt-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {item.skill}
                      </span>
                      <span className="font-mono-tabular text-xs text-emerald-700 dark:text-emerald-400">
                        {Math.round(item.similarityScore * 100)}%
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {item.explanation}
                    </p>
                    <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                      Evidence: {item.resumeEvidence}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Partially Demonstrated */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-amber-200 dark:border-amber-900/60">
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-amber-700 dark:text-amber-400">
                <AlertTriangle className="w-4 h-4" />
                Partially Demonstrated
              </span>
              <span className="font-mono-tabular text-xs font-semibold text-amber-700 dark:text-amber-400">
                {partialSkills.length}
              </span>
            </div>

            {partialSkills.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400 py-2">
                No partially demonstrated skills.
              </p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {partialSkills.map((item) => (
                  <div key={item.skill} className="py-3 first:pt-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {item.skill}
                      </span>
                      <span className="font-mono-tabular text-xs text-amber-700 dark:text-amber-400">
                        {Math.round(item.similarityScore * 100)}%
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {item.explanation}
                    </p>
                    <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                      Evidence: {item.resumeEvidence}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Missing Skills */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-rose-200 dark:border-rose-900/60">
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-rose-700 dark:text-rose-400">
                <XCircle className="w-4 h-4" />
                Missing Skills
              </span>
              <span className="font-mono-tabular text-xs font-semibold text-rose-700 dark:text-rose-400">
                {missingSkills.length}
              </span>
            </div>

            {missingSkills.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400 py-2">
                No missing required skills detected.
              </p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {missingSkills.map((item) => (
                  <div key={item.skill} className="py-3 first:pt-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {item.skill}
                      </span>
                      <span className="font-mono-tabular text-xs text-rose-700 dark:text-rose-400">
                        {Math.round(item.similarityScore * 100)}%
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {item.explanation}
                    </p>
                    <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                      Nearest match: {item.resumeEvidence}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </motion.div>
  );
}

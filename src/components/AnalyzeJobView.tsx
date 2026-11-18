import React, { useRef, useState } from "react";
import { motion } from "motion/react";
import {
  AlertCircle,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  FileText,
  Loader2,
  RotateCcw,
  Sparkles,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { useHireSense } from "../context/HireSenseContext";
import { validatePdfFile } from "../services/pdfService";

export function AnalyzeJobView() {
  const {
    parsedResume,
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
    handleUploadJobPdf,
    clearPrimaryJobFile,
    parsePrimaryJobOnly,
    analyzePrimaryJobMatch,
    setActiveSection,
    loadSampleData,
    pushToast,
  } = useHireSense();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [inputMode, setInputMode] = useState<"paste" | "pdf">("paste");
  const [isDragging, setIsDragging] = useState(false);
  const [lastSelectedFile, setLastSelectedFile] = useState<File | null>(null);
  const [showExtractedPreview, setShowExtractedPreview] = useState(false);

  const isBusy =
    primaryJobStatus === "extracting" ||
    primaryJobStatus === "parsing" ||
    primaryJobStatus === "matching";

  const processJobFile = async (file: File) => {
    const err = validatePdfFile(file);
    if (err) {
      pushToast({
        type: "error",
        title: "Invalid PDF file",
        description: err,
      });
      return;
    }
    setLastSelectedFile(file);
    await handleUploadJobPdf(file);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processJobFile(file);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processJobFile(file);
    }
    e.target.value = "";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      {!parsedResume && (
        <div className="rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/30 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-sm text-amber-900 dark:text-amber-200">
            <span className="font-semibold">Resume needed for matching:</span>{" "}
            You can inspect job requirements now, or upload a resume first to
            compute your compatibility score.
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setActiveSection("upload")}
              className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium whitespace-nowrap"
            >
              Upload Resume
            </button>
            <button
              type="button"
              onClick={() => loadSampleData(false)}
              className="px-3 py-1.5 rounded-lg border border-amber-300 dark:border-amber-700 text-xs font-medium text-amber-900 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/40 whitespace-nowrap"
            >
              Use Sample
            </button>
          </div>
        </div>
      )}

      {/* Job Input Card */}
      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
          <div>
            <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-slate-100">
              Target Job Description
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Paste a job posting or upload a job description PDF. GetHired
              extracts structured requirements and evaluates semantic alignment.
            </p>
          </div>

          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setInputMode("paste")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                inputMode === "paste"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              Paste Text
            </button>
            <button
              type="button"
              onClick={() => setInputMode("pdf")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                inputMode === "pdf"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              Upload PDF
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label
              htmlFor="job-title-input"
              className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Job Title (optional)
            </label>
            <div className="relative">
              <BriefcaseBusiness className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="job-title-input"
                type="text"
                value={primaryJobTitle}
                onChange={(e) => setPrimaryJobTitle(e.target.value)}
                placeholder="e.g., Senior Full-Stack Engineer"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 pl-9 pr-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="job-company-input"
              className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Company (optional)
            </label>
            <div className="relative">
              <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="job-company-input"
                type="text"
                value={primaryJobCompany}
                onChange={(e) => setPrimaryJobCompany(e.target.value)}
                placeholder="e.g., Veloce Cloud"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 pl-9 pr-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {inputMode === "pdf" ? (
          <div className="space-y-4">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => !isBusy && fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if ((e.key === "Enter" || e.key === " ") && !isBusy) {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              className={`rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition-colors ${
                isDragging
                  ? "border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/30"
                  : "border-slate-300 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 bg-slate-50/60 dark:bg-slate-950/40"
              } ${isBusy ? "pointer-events-none opacity-75" : ""}`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="mx-auto w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3">
                {isBusy ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <UploadCloud className="w-5 h-5" />
                )}
              </div>

              {isBusy ? (
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {primaryJobProgress || "Processing job description PDF..."}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Extracting text locally and structuring role requirements
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Drop a job description PDF here, or{" "}
                    <span className="text-indigo-600 dark:text-indigo-400">
                      browse files
                    </span>
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    PDF format only · Maximum 5 MB · Automatically extracts role
                    skills and responsibilities
                  </p>
                </div>
              )}
            </div>

            {primaryJobFileMeta && !isBusy && (
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span className="font-medium text-slate-900 dark:text-slate-200 truncate">
                    {primaryJobFileMeta.name}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="tabular-nums shrink-0">
                    {(primaryJobFileMeta.size / 1024).toFixed(1)} KB
                  </span>
                  {primaryJobFileMeta.pageCount && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums shrink-0">
                        {primaryJobFileMeta.pageCount}{" "}
                        {primaryJobFileMeta.pageCount === 1 ? "page" : "pages"}
                      </span>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {primaryJobRawText && (
                    <button
                      type="button"
                      onClick={() => setShowExtractedPreview((v) => !v)}
                      className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                    >
                      {showExtractedPreview
                        ? "Hide extracted text"
                        : "Edit extracted text"}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      clearPrimaryJobFile();
                      setLastSelectedFile(null);
                      setShowExtractedPreview(false);
                    }}
                    className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 hover:underline font-medium"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear</span>
                  </button>
                </div>
              </div>
            )}

            {showExtractedPreview && primaryJobRawText && (
              <div>
                <label
                  htmlFor="extracted-job-text-editor"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  Extracted Job Description Text (Editable)
                </label>
                <textarea
                  id="extracted-job-text-editor"
                  value={primaryJobRawText}
                  onChange={(e) => setPrimaryJobRawText(e.target.value)}
                  rows={8}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed"
                />
              </div>
            )}
          </div>
        ) : (
          <div>
            <label
              htmlFor="job-description-textarea"
              className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Job Description
            </label>
            <textarea
              id="job-description-textarea"
              value={primaryJobRawText}
              onChange={(e) => setPrimaryJobRawText(e.target.value)}
              rows={10}
              placeholder="Paste the full job description, required qualifications, responsibilities, and preferred skills..."
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed"
            />
          </div>
        )}

        <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {isBusy ? (
              <span className="inline-flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-medium">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>{primaryJobProgress || "Processing..."}</span>
              </span>
            ) : (
              <span className="tabular-nums">
                {primaryJobRawText.trim().length.toLocaleString()} characters
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              disabled={isBusy || !primaryJobRawText.trim()}
              onClick={parsePrimaryJobOnly}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm font-medium text-slate-700 dark:text-slate-200 transition-colors disabled:opacity-60 whitespace-nowrap"
            >
              Extract Requirements
            </button>

            <button
              type="button"
              disabled={isBusy || !primaryJobRawText.trim()}
              onClick={analyzePrimaryJobMatch}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors disabled:opacity-60 whitespace-nowrap"
            >
              {isBusy ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              <span>
                {isBusy ? "Running Match..." : "Run Semantic Match"}
              </span>
            </button>
          </div>
        </div>

        {primaryJobError && (
          <div className="mt-4 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/30 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5 text-sm text-rose-800 dark:text-rose-200">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-rose-600 dark:text-rose-400" />
              <span>{primaryJobError}</span>
            </div>
            <button
              type="button"
              onClick={() =>
                inputMode === "pdf" && lastSelectedFile && !primaryJobRawText
                  ? processJobFile(lastSelectedFile)
                  : analyzePrimaryJobMatch()
              }
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium self-start sm:self-auto shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        )}
      </section>

      {/* Skeleton during job parsing/matching */}
      {isBusy && (
        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4 animate-pulse">
          <div className="h-5 w-56 bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="h-20 bg-slate-100 dark:bg-slate-800/70 rounded-xl" />
            <div className="h-20 bg-slate-100 dark:bg-slate-800/70 rounded-xl" />
            <div className="h-20 bg-slate-100 dark:bg-slate-800/70 rounded-xl" />
          </div>
        </section>
      )}

      {/* Structured Job Summary Card */}
      {primaryParsedJob && !isBusy && (
        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-5 border-b border-slate-200 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Extracted Role Requirements</span>
              </div>
              <h3 className="font-display text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                {primaryParsedJob.job_title}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {primaryParsedJob.company} · {primaryParsedJob.seniority_level}{" "}
                · {primaryParsedJob.experience_required}
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2.5">
                Required Technical Skills (
                {primaryParsedJob.required_technical_skills.length})
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {primaryParsedJob.required_technical_skills.map((skill) => (
                  <span
                    key={skill}
                    className="px-2.5 py-1 rounded-md border border-indigo-200 dark:border-indigo-800 bg-indigo-50/70 dark:bg-indigo-950/40 text-xs font-medium text-indigo-800 dark:text-indigo-200"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2.5">
                Preferred & Soft Skills
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {[
                  ...primaryParsedJob.preferred_skills,
                  ...primaryParsedJob.soft_skills,
                ].map((skill) => (
                  <span
                    key={skill}
                    className="px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
                Education Requirements
              </h4>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                {primaryParsedJob.education_requirements}
              </p>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
                Core Responsibilities
              </h4>
              <ul className="space-y-1.5 text-sm text-slate-700 dark:text-slate-300 list-disc pl-5">
                {primaryParsedJob.responsibilities.slice(0, 5).map((r, i) => (
                  <li key={i} className="leading-relaxed">
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}
    </motion.div>
  );
}

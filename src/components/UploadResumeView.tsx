import React, { useRef, useState } from "react";
import { motion } from "motion/react";
import {
  AlertCircle,
  ArrowRight,
  Award,
  Briefcase,
  FileText,
  FolderGit2,
  GraduationCap,
  Loader2,
  Plus,
  RotateCcw,
  Trash2,
  UploadCloud,
  Wrench,
  X,
} from "lucide-react";
import { useHireSense } from "../context/HireSenseContext";
import { validatePdfFile } from "../services/pdfService";

type ProfileTab =
  | "skills"
  | "experience"
  | "projects"
  | "education"
  | "certifications";

export function UploadResumeView() {
  const {
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
    setActiveSection,
    loadSampleData,
    pushToast,
  } = useHireSense();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [inputMode, setInputMode] = useState<"pdf" | "paste">("pdf");
  const [pastedText, setPastedText] = useState(rawResumeText);
  const [activeTab, setActiveTab] = useState<ProfileTab>("skills");
  const [newTechSkill, setNewTechSkill] = useState("");
  const [newSoftSkill, setNewSoftSkill] = useState("");
  const [lastSelectedFile, setLastSelectedFile] = useState<File | null>(null);
  const [showRawPreview, setShowRawPreview] = useState(false);

  const isBusy =
    resumeParsingStatus === "extracting" || resumeParsingStatus === "parsing";

  const processFile = async (file: File) => {
    const err = validatePdfFile(file);
    if (err) {
      pushToast({
        type: "error",
        title: "Invalid file",
        description: err,
      });
      return;
    }
    setLastSelectedFile(file);
    await handleUploadResumeFile(file);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processFile(file);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processFile(file);
    }
    e.target.value = "";
  };

  const handleAddTechSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!parsedResume) return;
    const trimmed = newTechSkill.trim();
    if (!trimmed) return;
    if (
      parsedResume.technical_skills.some(
        (s) => s.toLowerCase() === trimmed.toLowerCase()
      )
    ) {
      setNewTechSkill("");
      return;
    }
    updateResumeSkills("technical_skills", [
      ...parsedResume.technical_skills,
      trimmed,
    ]);
    setNewTechSkill("");
  };

  const handleRemoveTechSkill = (skillToRemove: string) => {
    if (!parsedResume) return;
    updateResumeSkills(
      "technical_skills",
      parsedResume.technical_skills.filter((s) => s !== skillToRemove)
    );
  };

  const handleAddSoftSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!parsedResume) return;
    const trimmed = newSoftSkill.trim();
    if (!trimmed) return;
    if (
      parsedResume.soft_skills.some(
        (s) => s.toLowerCase() === trimmed.toLowerCase()
      )
    ) {
      setNewSoftSkill("");
      return;
    }
    updateResumeSkills("soft_skills", [...parsedResume.soft_skills, trimmed]);
    setNewSoftSkill("");
  };

  const handleRemoveSoftSkill = (skillToRemove: string) => {
    if (!parsedResume) return;
    updateResumeSkills(
      "soft_skills",
      parsedResume.soft_skills.filter((s) => s !== skillToRemove)
    );
  };

  const profileTabs: {
    id: ProfileTab;
    label: string;
    count: number;
    icon: typeof Wrench;
  }[] = parsedResume
    ? [
        {
          id: "skills",
          label: "Skills",
          count:
            parsedResume.technical_skills.length +
            parsedResume.soft_skills.length,
          icon: Wrench,
        },
        {
          id: "experience",
          label: "Experience",
          count: parsedResume.experience.length,
          icon: Briefcase,
        },
        {
          id: "projects",
          label: "Projects",
          count: parsedResume.projects.length,
          icon: FolderGit2,
        },
        {
          id: "education",
          label: "Education",
          count: parsedResume.education.length,
          icon: GraduationCap,
        },
        {
          id: "certifications",
          label: "Certifications",
          count: parsedResume.certifications.length,
          icon: Award,
        },
      ]
    : [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      {/* Upload Card */}
      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
          <div>
            <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-slate-100">
              Candidate Resume
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Upload a PDF resume (max 5 MB) or paste text to extract your
              structured profile.
            </p>
          </div>

          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 self-start sm:self-auto">
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
          </div>
        </div>

        {inputMode === "pdf" ? (
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
            className={`rounded-2xl border-2 border-dashed p-8 sm:p-10 text-center cursor-pointer transition-colors ${
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
            <div className="mx-auto w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3">
              {isBusy ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <UploadCloud className="w-6 h-6" />
              )}
            </div>

            {isBusy ? (
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {resumeProgressMessage || "Processing resume..."}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Extracting sections, skills, projects, and experience
                </p>
              </div>
            ) : (
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Drop your PDF resume here, or{" "}
                  <span className="text-indigo-600 dark:text-indigo-400">
                    browse files
                  </span>
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                  PDF format only · Maximum 5 MB · Extracted locally in-browser
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <textarea
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              rows={8}
              placeholder="Paste your complete resume text here..."
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                {pastedText.length.toLocaleString()} characters
              </span>
              <button
                type="button"
                disabled={isBusy || !pastedText.trim()}
                onClick={() => handleParseRawResumeText(pastedText)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors disabled:opacity-60 whitespace-nowrap"
              >
                {isBusy && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{isBusy ? "Parsing..." : "Parse Resume Text"}</span>
              </button>
            </div>
          </div>
        )}

        {/* File status bar */}
        {resumeFileMeta && !isBusy && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-2 min-w-0">
              <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span className="font-medium text-slate-900 dark:text-slate-200 truncate">
                {resumeFileMeta.name}
              </span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums shrink-0">
                {(resumeFileMeta.size / 1024).toFixed(1)} KB
              </span>
              {resumeFileMeta.pageCount && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="tabular-nums shrink-0">
                    {resumeFileMeta.pageCount}{" "}
                    {resumeFileMeta.pageCount === 1 ? "page" : "pages"}
                  </span>
                </>
              )}
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {rawResumeText && (
                <button
                  type="button"
                  onClick={() => setShowRawPreview((v) => !v)}
                  className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                >
                  {showRawPreview ? "Hide extracted text" : "View extracted text"}
                </button>
              )}
              <button
                type="button"
                onClick={clearResume}
                className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 hover:underline font-medium"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            </div>
          </div>
        )}

        {showRawPreview && rawResumeText && (
          <pre className="mt-4 max-h-56 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4 text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-mono-tabular">
            {rawResumeText}
          </pre>
        )}

        {/* Inline Error with Retry */}
        {resumeError && (
          <div className="mt-4 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/30 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5 text-sm text-rose-800 dark:text-rose-200">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-rose-600 dark:text-rose-400" />
              <span>{resumeError}</span>
            </div>
            {(lastSelectedFile || rawResumeText) && (
              <button
                type="button"
                onClick={() =>
                  lastSelectedFile
                    ? handleUploadResumeFile(lastSelectedFile)
                    : handleParseRawResumeText(rawResumeText)
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium self-start sm:self-auto shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </button>
            )}
          </div>
        )}
      </section>

      {/* Skeleton Loader during AI parsing */}
      {isBusy && (
        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4 animate-pulse">
          <div className="h-5 w-48 bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="h-4 w-72 bg-slate-100 dark:bg-slate-800/70 rounded" />
          <div className="flex flex-wrap gap-2 pt-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-7 w-24 bg-slate-100 dark:bg-slate-800 rounded-md"
              />
            ))}
          </div>
          <div className="space-y-3 pt-4">
            <div className="h-16 bg-slate-100 dark:bg-slate-800/60 rounded-xl" />
            <div className="h-16 bg-slate-100 dark:bg-slate-800/60 rounded-xl" />
          </div>
        </section>
      )}

      {/* Parsed Profile View */}
      {parsedResume && !isBusy && (
        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
            <div>
              <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
                Parsed Profile
              </p>
              <h3 className="font-display text-xl font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                {parsedResume.name}
              </h3>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
                {parsedResume.email && <span>{parsedResume.email}</span>}
                {parsedResume.email && <span aria-hidden="true">·</span>}
                <span className="tabular-nums">
                  {parsedResume.technical_skills.length} technical skills
                </span>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">
                  {parsedResume.experience.length} roles
                </span>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">
                  {parsedResume.projects.length} projects
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveSection("analyze")}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors self-start md:self-auto whitespace-nowrap shrink-0"
            >
              <span>Continue to Job Analysis</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {parsedResume.summary && (
            <p className="mt-4 text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-4xl">
              {parsedResume.summary}
            </p>
          )}

          {/* Profile Tabs */}
          <div className="mt-6 flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-x-auto">
            {profileTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                    isActive
                      ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  <span className="font-mono-tabular text-xs text-slate-400 dark:text-slate-500">
                    ({tab.count})
                  </span>
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="mt-6">
            {activeTab === "skills" && (
              <div className="space-y-6">
                {/* Technical Skills (editable chips) */}
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        Technical Skills
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Remove inaccurate tags or add missing skills before
                        semantic matching.
                      </p>
                    </div>
                    <form
                      onSubmit={handleAddTechSkill}
                      className="flex items-center gap-2"
                    >
                      <input
                        type="text"
                        value={newTechSkill}
                        onChange={(e) => setNewTechSkill(e.target.value)}
                        placeholder="Add technical skill..."
                        className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-44"
                      />
                      <button
                        type="submit"
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-medium hover:opacity-90 whitespace-nowrap"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add</span>
                      </button>
                    </form>
                  </div>

                  {parsedResume.technical_skills.length === 0 ? (
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      No technical skills extracted yet. Add skills above.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {parsedResume.technical_skills.map((skill) => (
                        <span
                          key={skill}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-xs font-medium text-slate-800 dark:text-slate-200"
                        >
                          <span>{skill}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveTechSkill(skill)}
                            aria-label={`Remove ${skill}`}
                            className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Soft Skills */}
                <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      Soft Skills & Leadership
                    </h4>
                    <form
                      onSubmit={handleAddSoftSkill}
                      className="flex items-center gap-2"
                    >
                      <input
                        type="text"
                        value={newSoftSkill}
                        onChange={(e) => setNewSoftSkill(e.target.value)}
                        placeholder="Add soft skill..."
                        className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-44"
                      />
                      <button
                        type="submit"
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-medium hover:opacity-90 whitespace-nowrap"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add</span>
                      </button>
                    </form>
                  </div>

                  {parsedResume.soft_skills.length === 0 ? (
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      No soft skills explicitly listed.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {parsedResume.soft_skills.map((skill) => (
                        <span
                          key={skill}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-xs font-medium text-slate-700 dark:text-slate-300"
                        >
                          <span>{skill}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveSoftSkill(skill)}
                            aria-label={`Remove ${skill}`}
                            className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "experience" && (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {parsedResume.experience.length === 0 ? (
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    No work experience entries extracted.
                  </p>
                ) : (
                  parsedResume.experience.map((exp, idx) => (
                    <div
                      key={`${exp.company}-${idx}`}
                      className="py-4 first:pt-0 last:pb-0"
                    >
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {exp.role}
                        </h4>
                        <span className="text-xs font-mono-tabular text-slate-500 dark:text-slate-400">
                          {exp.duration}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400 mt-0.5">
                        {exp.company}
                      </p>
                      <ul className="mt-2.5 space-y-1.5 text-sm text-slate-600 dark:text-slate-300 list-disc pl-5">
                        {exp.highlights.map((bullet, bIdx) => (
                          <li key={bIdx} className="leading-relaxed">
                            {bullet}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === "projects" && (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {parsedResume.projects.length === 0 ? (
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    No projects extracted from this resume.
                  </p>
                ) : (
                  parsedResume.projects.map((proj, idx) => (
                    <div
                      key={`${proj.title}-${idx}`}
                      className="py-4 first:pt-0 last:pb-0"
                    >
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {proj.title}
                      </h4>
                      <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                        {proj.description}
                      </p>
                      {proj.technologies.length > 0 && (
                        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                          Stack: {proj.technologies.join(" · ")}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === "education" && (
              <div className="space-y-3">
                {parsedResume.education.length === 0 ? (
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    No education credentials extracted.
                  </p>
                ) : (
                  parsedResume.education.map((edu, idx) => (
                    <div
                      key={idx}
                      className="py-2.5 border-b last:border-b-0 border-slate-100 dark:border-slate-800 text-sm text-slate-800 dark:text-slate-200"
                    >
                      {edu}
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === "certifications" && (
              <div className="space-y-3">
                {parsedResume.certifications.length === 0 ? (
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    No certifications listed in the resume.
                  </p>
                ) : (
                  parsedResume.certifications.map((cert, idx) => (
                    <div
                      key={idx}
                      className="py-2.5 border-b last:border-b-0 border-slate-100 dark:border-slate-800 text-sm text-slate-800 dark:text-slate-200"
                    >
                      {cert}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Friendly Empty State when no resume loaded yet */}
      {!parsedResume && !isBusy && (
        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center">
          <h3 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
            No resume parsed yet
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
            Upload your PDF above or load our sample software engineer resume to
            explore GetHired immediately.
          </p>
          <button
            type="button"
            onClick={() => loadSampleData(false)}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Load Sample Resume & Job
          </button>
        </section>
      )}
    </motion.div>
  );
}

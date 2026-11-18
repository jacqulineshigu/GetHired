import { useState } from "react";
import {
  ChevronDown,
  Download,
  FileJson,
  FileText,
  FlaskConical,
  Loader2,
  Moon,
  Sun,
} from "lucide-react";
import { useHireSense } from "../context/HireSenseContext";
import { exportAnalysisAsJson } from "../utils/exportReport";
import type { AppSection } from "../types";

const SECTION_TITLES: Record<AppSection, string> = {
  dashboard: "Readiness Dashboard",
  upload: "Upload & Parse Resume",
  analyze: "Job Description Analysis",
  suggestions: "Resume Improvement Studio",
};

interface TopBarProps {
  onExportPdf: () => Promise<void>;
  isExportingPdf: boolean;
}

export function TopBar({ onExportPdf, isExportingPdf }: TopBarProps) {
  const {
    theme,
    toggleTheme,
    activeSection,
    parsedResume,
    activeMatchResult,
    loadSampleData,
    isLoadingSample,
    pushToast,
  } = useHireSense();

  const [exportMenuOpen, setExportMenuOpen] = useState(false);

  const hasExportableData = Boolean(activeMatchResult);

  const handleJsonExport = () => {
    setExportMenuOpen(false);
    if (!hasExportableData) {
      pushToast({
        type: "info",
        title: "Nothing to export yet",
        description: "Run a job analysis first to generate a report.",
      });
      return;
    }
    exportAnalysisAsJson(parsedResume, activeMatchResult);
    pushToast({
      type: "success",
      title: "JSON report downloaded",
    });
  };

  const handlePdfExportClick = async () => {
    setExportMenuOpen(false);
    if (!hasExportableData) {
      pushToast({
        type: "info",
        title: "Nothing to export yet",
        description: "Run a job analysis first to export a PDF report.",
      });
      return;
    }
    await onExportPdf();
  };

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Brand / Contextual Section Title */}
        <div className="flex items-center gap-3 min-w-0">
          <span className="lg:hidden font-display font-bold text-base text-indigo-600 dark:text-indigo-400 whitespace-nowrap shrink-0">
            GetHired
          </span>
          <span
            aria-hidden="true"
            className="lg:hidden text-slate-300 dark:text-slate-700"
          >
            /
          </span>
          <h1 className="font-display font-semibold text-base sm:text-lg text-slate-900 dark:text-slate-100 truncate">
            {SECTION_TITLES[activeSection]}
          </h1>
        </div>

        {/* Zone 2 & 3: Utility Actions + Primary Action */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            type="button"
            onClick={() => loadSampleData(true)}
            disabled={isLoadingSample}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/80 transition-colors whitespace-nowrap shrink-0 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            {isLoadingSample ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600 dark:text-indigo-400" />
            ) : (
              <FlaskConical className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            )}
            <span>{isLoadingSample ? "Analyzing..." : "Load Sample Data"}</span>
          </button>

          {/* Export Report Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setExportMenuOpen((v) => !v)}
              disabled={isExportingPdf}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-medium transition-colors whitespace-nowrap shrink-0 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              {isExportingPdf ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">Export Report</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>

            {exportMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setExportMenuOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-48 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg py-1 z-20">
                  <button
                    type="button"
                    onClick={handlePdfExportClick}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/70 transition-colors"
                  >
                    <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>Download PDF</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleJsonExport}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/70 transition-colors"
                  >
                    <FileJson className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                    <span>Download JSON</span>
                  </button>
                </div>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            aria-label={
              theme === "light" ? "Switch to dark mode" : "Switch to light mode"
            }
            className="inline-flex items-center justify-center w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            {theme === "light" ? (
              <Moon className="w-4 h-4" />
            ) : (
              <Sun className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}

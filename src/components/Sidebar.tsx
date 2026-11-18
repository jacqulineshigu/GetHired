import {
  BriefcaseBusiness,
  FileUp,
  LayoutDashboard,
  Lock,
  Sparkles,
} from "lucide-react";
import { useHireSense } from "../context/HireSenseContext";
import type { AppSection } from "../types";

const NAV_ITEMS: {
  id: AppSection;
  label: string;
  mobileLabel: string;
  icon: typeof LayoutDashboard;
}[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    mobileLabel: "Overview",
    icon: LayoutDashboard,
  },
  {
    id: "upload",
    label: "Upload Resume",
    mobileLabel: "Resume",
    icon: FileUp,
  },
  {
    id: "analyze",
    label: "Analyze Job",
    mobileLabel: "Job",
    icon: BriefcaseBusiness,
  },
  {
    id: "suggestions",
    label: "Suggestions",
    mobileLabel: "Improve",
    icon: Sparkles,
  },
];

export function Sidebar() {
  const {
    activeSection,
    setActiveSection,
    parsedResume,
    activeMatchResult,
  } = useHireSense();

  return (
    <>
      {/* Desktop Left Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:shrink-0 lg:flex-col lg:justify-between border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 min-h-screen sticky top-0 h-screen">
        <div className="p-5">
          <button
            type="button"
            onClick={() => setActiveSection("dashboard")}
            className="flex items-center gap-2.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-lg p-1"
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-display font-bold text-sm">
              GH
            </div>
            <span className="font-display font-bold text-lg tracking-tight text-slate-900 dark:text-slate-100 whitespace-nowrap">
              GetHired
            </span>
          </button>

          <nav className="mt-8 space-y-1" aria-label="Main navigation">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;

              let statusText: string | null = null;
              if (item.id === "upload" && parsedResume) {
                statusText = "Ready";
              } else if (item.id === "dashboard" && activeMatchResult) {
                statusText = `${activeMatchResult.overallScore}%`;
              }

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                    isActive
                      ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-slate-100"
                  }`}
                >
                  <span className="flex items-center gap-2.5 min-w-0">
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive
                          ? "text-indigo-600 dark:text-indigo-400"
                          : "text-slate-400 dark:text-slate-500"
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </span>
                  {statusText && (
                    <span className="text-xs font-mono-tabular text-slate-500 dark:text-slate-400 shrink-0">
                      {statusText}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-5 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-start gap-2.5 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            <Lock className="w-3.5 h-3.5 mt-0.5 shrink-0 text-slate-400 dark:text-slate-500" />
            <div>
              <p className="font-medium text-slate-700 dark:text-slate-300">
                Session-Only Privacy
              </p>
              <p className="mt-0.5">
                PDF text extraction runs locally in your browser. Resumes are
                never saved or stored on disk.
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation (compact, <= 15% mobile height) */}
      <nav
        aria-label="Mobile navigation"
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-2 py-1.5 flex items-center justify-around"
      >
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveSection(item.id)}
              className={`flex flex-col items-center justify-center gap-0.5 px-2.5 py-1.5 rounded-lg min-w-[56px] min-h-[44px] text-[11px] font-medium transition-colors whitespace-nowrap ${
                isActive
                  ? "text-indigo-600 dark:text-indigo-400"
                  : "text-slate-500 dark:text-slate-400"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.mobileLabel}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}

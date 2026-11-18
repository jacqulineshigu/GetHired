/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useRef, useState } from "react";
import { AnalyzeJobView } from "./components/AnalyzeJobView";
import { DashboardView } from "./components/DashboardView";
import { PrintableReport } from "./components/PrintableReport";
import { Sidebar } from "./components/Sidebar";
import { SuggestionsView } from "./components/SuggestionsView";
import { ToastContainer } from "./components/ToastContainer";
import { TopBar } from "./components/TopBar";
import { UploadResumeView } from "./components/UploadResumeView";
import { HireSenseProvider, useHireSense } from "./context/HireSenseContext";
import { exportElementAsPdf } from "./utils/exportReport";

function GetHiredWorkspace() {
  const {
    activeSection,
    parsedResume,
    activeMatchResult,
    pushToast,
  } = useHireSense();

  const reportRef = useRef<HTMLDivElement | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const handleExportPdf = async () => {
    if (!reportRef.current) return;
    setIsExportingPdf(true);
    try {
      await exportElementAsPdf(
        reportRef.current,
        activeMatchResult?.jobTitle || "gethired-report"
      );
      pushToast({
        type: "success",
        title: "PDF report downloaded",
      });
    } catch (err: unknown) {
      pushToast({
        type: "error",
        title: "PDF export failed",
        description:
          err instanceof Error ? err.message : "Could not generate PDF.",
      });
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <TopBar
          onExportPdf={handleExportPdf}
          isExportingPdf={isExportingPdf}
        />

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 lg:pb-10">
          {activeSection === "dashboard" && <DashboardView />}
          {activeSection === "upload" && <UploadResumeView />}
          {activeSection === "analyze" && <AnalyzeJobView />}
          {activeSection === "suggestions" && <SuggestionsView />}
        </main>
      </div>

      <PrintableReport
        reportRef={reportRef}
        resume={parsedResume}
        activeMatch={activeMatchResult}
      />

      <ToastContainer />
    </div>
  );
}

export default function App() {
  return (
    <HireSenseProvider>
      <GetHiredWorkspace />
    </HireSenseProvider>
  );
}

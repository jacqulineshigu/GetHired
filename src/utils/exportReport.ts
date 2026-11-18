import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import type { MatchResult, ParsedResume } from "../types";

export function exportAnalysisAsJson(
  resume: ParsedResume | null,
  activeMatch: MatchResult | null
): void {
  const payload = {
    exportedAt: new Date().toISOString(),
    platform: "GetHired",
    candidate: resume
      ? {
          name: resume.name,
          email: resume.email,
          technical_skills: resume.technical_skills,
          soft_skills: resume.soft_skills,
          education: resume.education,
        }
      : null,
    activeAnalysis: activeMatch,
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const slug = (activeMatch?.jobTitle || "gethired-report")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  link.href = url;
  link.download = `${slug}-analysis.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function exportElementAsPdf(
  element: HTMLElement,
  fileNameBase: string
): Promise<void> {
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
    logging: false,
  });

  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: "a4",
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 24;
  const usableWidth = pageWidth - margin * 2;
  const imgHeight = (canvas.height * usableWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = margin;

  pdf.addImage(imgData, "PNG", margin, position, usableWidth, imgHeight);
  heightLeft -= pageHeight - margin * 2;

  while (heightLeft > 0) {
    position = heightLeft - imgHeight + margin;
    pdf.addPage();
    pdf.addImage(imgData, "PNG", margin, position, usableWidth, imgHeight);
    heightLeft -= pageHeight - margin * 2;
  }

  const slug = fileNameBase
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  pdf.save(`${slug || "gethired-report"}.pdf`);
}

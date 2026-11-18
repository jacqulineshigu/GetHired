import React from "react";
import type { MatchResult, ParsedResume } from "../types";

interface PrintableReportProps {
  reportRef: React.RefObject<HTMLDivElement | null>;
  resume: ParsedResume | null;
  activeMatch: MatchResult | null;
}

export function PrintableReport({
  reportRef,
  resume,
  activeMatch,
}: PrintableReportProps) {
  if (!activeMatch) {
    return null;
  }

  const target = activeMatch;

  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        left: "-99999px",
        top: 0,
        width: "780px",
        backgroundColor: "#ffffff",
        color: "#0f172a",
        padding: "32px",
        fontFamily: "DM Sans, Arial, sans-serif",
      }}
      ref={reportRef}
    >
      <div
        style={{
          borderBottom: "2px solid #e2e8f0",
          paddingBottom: "16px",
          marginBottom: "20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
        }}
      >
        <div>
          <div style={{ fontSize: "12px", color: "#4f46e5", fontWeight: 700 }}>
            GETHIRED ANALYSIS REPORT
          </div>
          <h1 style={{ fontSize: "22px", fontWeight: 700, margin: "4px 0 0" }}>
            {target.jobTitle} — {target.company}
          </h1>
          <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>
            Candidate: {resume?.name || "Candidate"}
            {resume?.email ? ` (${resume.email})` : ""} · Generated{" "}
            {new Date().toLocaleDateString()}
          </div>
        </div>

        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "28px", fontWeight: 800, color: "#4f46e5" }}>
            {target.overallScore}/100
          </div>
          <div style={{ fontSize: "11px", color: "#64748b" }}>
            Compatibility Score
          </div>
        </div>
      </div>

      <p style={{ fontSize: "13px", lineHeight: 1.5, color: "#334155" }}>
        {target.overallVerdict}
      </p>

      <h2
        style={{
          fontSize: "15px",
          fontWeight: 700,
          marginTop: "20px",
          marginBottom: "8px",
        }}
      >
        Weighted Score Breakdown
      </h2>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "8px",
          fontSize: "12px",
        }}
      >
        <div>Skills Match (40%): {target.breakdown.skillsMatch}%</div>
        <div>
          Experience Relevance (25%): {target.breakdown.experienceRelevance}%
        </div>
        <div>Projects Relevance (15%): {target.breakdown.projectsRelevance}%</div>
        <div>Education Fit (10%): {target.breakdown.educationFit}%</div>
        <div>
          Semantic Doc Similarity (10%):{" "}
          {target.breakdown.documentSemanticSimilarity}%
        </div>
      </div>

      <h2
        style={{
          fontSize: "15px",
          fontWeight: 700,
          marginTop: "20px",
          marginBottom: "8px",
        }}
      >
        Skill Gaps & Evidence
      </h2>
      <div style={{ fontSize: "12px", lineHeight: 1.45 }}>
        {target.skillGaps.map((g) => (
          <div
            key={g.skill}
            style={{
              padding: "6px 0",
              borderBottom: "1px solid #f1f5f9",
            }}
          >
            <strong>{g.skill}</strong> [{g.status.toUpperCase()} ·{" "}
            {Math.round(g.similarityScore * 100)}%] — {g.explanation}{" "}
            <span style={{ color: "#64748b" }}>({g.resumeEvidence})</span>
          </div>
        ))}
      </div>

      {target.suggestions.tailoredSummary && (
        <>
          <h2
            style={{
              fontSize: "15px",
              fontWeight: 700,
              marginTop: "20px",
              marginBottom: "8px",
            }}
          >
            Tailored Professional Summary
          </h2>
          <p style={{ fontSize: "12px", lineHeight: 1.5, color: "#334155" }}>
            {target.suggestions.tailoredSummary}
          </p>
        </>
      )}

    </div>
  );
}

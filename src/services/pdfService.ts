import * as pdfjsLib from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

export const MAX_PDF_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export interface PdfExtractionResult {
  text: string;
  pageCount: number;
  fileName: string;
  fileSize: number;
}

export function validatePdfFile(file: File): string | null {
  const isPdfMime = file.type === "application/pdf";
  const isPdfExtension = file.name.toLowerCase().endsWith(".pdf");

  if (!isPdfMime && !isPdfExtension) {
    return "Please upload a valid PDF document (.pdf).";
  }

  if (file.size === 0) {
    return "The selected PDF file appears to be empty.";
  }

  if (file.size > MAX_PDF_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
    return `File size (${sizeMb} MB) exceeds the 5 MB maximum limit.`;
  }

  return null;
}

export async function extractTextFromPdf(
  file: File
): Promise<PdfExtractionResult> {
  const validationError = validatePdfFile(file);
  if (validationError) {
    throw new Error(validationError);
  }

  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
  });

  const pdfDocument = await loadingTask.promise;
  const pageCount = pdfDocument.numPages;
  const pageTexts: string[] = [];

  for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
    const page = await pdfDocument.getPage(pageNum);
    const textContent = await page.getTextContent();
    const lines: string[] = [];
    let lastY: number | null = null;
    let currentLine = "";

    for (const item of textContent.items) {
      if (!("str" in item)) continue;
      const textItem = item as { str: string; transform?: number[] };
      const y = textItem.transform?.[5] ?? null;

      if (lastY !== null && y !== null && Math.abs(y - lastY) > 4) {
        if (currentLine.trim()) {
          lines.push(currentLine.trim());
        }
        currentLine = textItem.str;
      } else {
        currentLine += (currentLine && textItem.str ? " " : "") + textItem.str;
      }
      lastY = y;
    }

    if (currentLine.trim()) {
      lines.push(currentLine.trim());
    }

    pageTexts.push(lines.join("\n"));
  }

  const combinedText = pageTexts.join("\n\n").trim();

  if (!combinedText || combinedText.length < 30) {
    throw new Error(
      "Could not extract readable text from this PDF. If it is a scanned image PDF, please export a text-based PDF or paste the text directly."
    );
  }

  return {
    text: combinedText,
    pageCount,
    fileName: file.name,
    fileSize: file.size,
  };
}

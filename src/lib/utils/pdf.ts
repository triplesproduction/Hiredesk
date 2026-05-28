import * as pdfjs from "pdfjs-dist";

// Worker configured once at module load — avoids repeated CDN negotiation
const PDFJS_VERSION = pdfjs.version || "4.4.168";
pdfjs.GlobalWorkerOptions.workerSrc =
  `https://unpkg.com/pdfjs-dist@${PDFJS_VERSION}/build/pdf.worker.min.mjs`;

/**
 * Extracts plain text from a PDF file using pdfjs-dist.
 * - Reads pages in PARALLEL (vs sequential await) for maximum speed
 * - Calls page.cleanup() after each read to free memory from PDF.js cache
 * - Caps reading at 4 pages — sufficient for any resume format
 * - Falls back gracefully on failure (image-only PDFs, corrupt files, etc.)
 */
export async function extractTextFromPDF(file: File): Promise<string> {
  let pdf: pdfjs.PDFDocumentProxy | undefined;
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjs.getDocument({
      data: arrayBuffer,
      useWorkerFetch: true,
      isEvalSupported: false,
    });
    pdf = await loadingTask.promise;

    const pagesToRead = Math.min(4, pdf.numPages);
    const pageNumbers = Array.from({ length: pagesToRead }, (_, i) => i + 1);

    // Fetch and extract all pages in parallel
    const pageTexts = await Promise.all(
      pageNumbers.map(async (num) => {
        const page = await pdf!.getPage(num);
        const textContent = await page.getTextContent();
        const text = textContent.items.map((item: any) => item.str).join(" ");
        // Release page resources from the internal PDF.js render cache
        page.cleanup();
        return text;
      })
    );

    const fullText = pageTexts.join("\n").trim();
    return fullText.length > 50 ? fullText : file.name.replace(/[_\-\.]/g, " ");
  } catch (error) {
    console.error("PDF.js parsing failed, falling back to filename:", error);
    return file.name.replace(/[_\-\.]/g, " ");
  } finally {
    // Destroy the PDF document to release all worker memory
    if (pdf) {
      try { await pdf.destroy(); } catch { /* ignore cleanup errors */ }
    }
  }
}

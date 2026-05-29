import * as pdfjs from "pdfjs-dist";

// Worker configured once at module load — avoids repeated CDN negotiation
const PDFJS_VERSION = pdfjs.version || "4.4.168";
pdfjs.GlobalWorkerOptions.workerSrc =
  `https://unpkg.com/pdfjs-dist@${PDFJS_VERSION}/build/pdf.worker.min.mjs`;

export interface PDFTextLine {
  text: string;
  fontSize: number;
  y: number;
  x: number;
}

export interface PDFParsedResult {
  text: string;
  firstPageLines: PDFTextLine[];
  ocrUsed: boolean;
}

/**
 * Dynamically loads Tesseract.js from CDN and performs OCR on a file.
 */
export async function performOCROnFile(file: File): Promise<string> {
  if (typeof window === "undefined") return "";
  
  console.log("[HireDesk OCR] Scanned PDF or low-text PDF detected. Triggering dynamic Tesseract.js OCR...");
  
  return new Promise((resolve, reject) => {
    // 1. Inject Tesseract CDN script if not already present
    if (!(window as any).Tesseract) {
      const script = document.createElement("script");
      script.src = "https://unpkg.com/tesseract.js@v5.1.0/dist/tesseract.min.js";
      script.onload = () => runTesseract(file, resolve, reject);
      script.onerror = (err) => {
        console.error("[HireDesk OCR] Failed to load Tesseract.js CDN script:", err);
        reject(new Error("Failed to load Tesseract.js CDN"));
      };
      document.head.appendChild(script);
    } else {
      runTesseract(file, resolve, reject);
    }
  });
}

function runTesseract(file: File, resolve: (text: string) => void, reject: (err: any) => void) {
  const Tesseract = (window as any).Tesseract;
  if (!Tesseract) {
    reject(new Error("Tesseract library not found after script load"));
    return;
  }

  Tesseract.recognize(
    file,
    "eng",
    {
      logger: (m: any) => {
        if (m.status === "recognizing text") {
          console.log(`[HireDesk OCR] Progress: ${Math.round(m.progress * 100)}%`);
        }
      }
    }
  )
    .then(({ data: { text } }: any) => {
      console.log(`[HireDesk OCR] Success. Extracted ${text.length} characters of scanned text.`);
      resolve(text);
    })
    .catch((err: any) => {
      console.error("[HireDesk OCR] Tesseract processing failed:", err);
      reject(err);
    });
}

/**
 * Extracts plain text and font/layout metadata from a PDF file using pdfjs-dist.
 * Performs parallel page reads and runs OCR fallback if text is sparse.
 */
export async function extractTextAndMetaFromPDF(file: File): Promise<PDFParsedResult> {
  let pdf: pdfjs.PDFDocumentProxy | undefined;
  let ocrUsed = false;
  let fullText = "";
  const firstPageLines: PDFTextLine[] = [];

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

    // Fetch and extract page contents
    const pageTexts = await Promise.all(
      pageNumbers.map(async (num) => {
        const page = await pdf!.getPage(num);
        const textContent = await page.getTextContent();
        
        let lastY = -1;
        const lines: string[] = [];
        let currentLine: string[] = [];
        
        // Group items for first-page metadata
        const pageItems: any[] = textContent.items;

        for (const item of pageItems) {
          if (item.str === undefined) continue;
          const y = item.transform?.[5];
          
          if (lastY !== -1 && Math.abs(y - lastY) > 3) {
            lines.push(currentLine.join(" ").trim());
            currentLine = [item.str];
          } else {
            currentLine.push(item.str);
          }
          lastY = y;
        }
        
        if (currentLine.length > 0) {
          lines.push(currentLine.join(" ").trim());
        }

        // On page 1, extract rich layout and font information
        if (num === 1) {
          let currentY = -1;
          let currentLineItems: any[] = [];

          for (const item of pageItems) {
            if (item.str === undefined || !item.str.trim()) continue;
            const y = item.transform?.[5];
            const x = item.transform?.[4];
            const fontSize = Math.abs(item.transform?.[3]) || Math.abs(item.transform?.[0]) || 10;

            if (currentY !== -1 && Math.abs(y - currentY) > 4) {
              // Commit the previous line
              if (currentLineItems.length > 0) {
                const text = currentLineItems.map(i => i.str).join(" ").trim();
                const maxFontSize = Math.max(...currentLineItems.map(i => i.fontSize));
                const avgY = currentLineItems.reduce((acc, i) => acc + i.y, 0) / currentLineItems.length;
                const minX = Math.min(...currentLineItems.map(i => i.x));
                
                if (text) {
                  firstPageLines.push({ text, fontSize: maxFontSize, y: avgY, x: minX });
                }
              }
              currentLineItems = [{ str: item.str, y, x, fontSize }];
            } else {
              currentLineItems.push({ str: item.str, y, x, fontSize });
            }
            currentY = y;
          }

          if (currentLineItems.length > 0) {
            const text = currentLineItems.map(i => i.str).join(" ").trim();
            const maxFontSize = Math.max(...currentLineItems.map(i => i.fontSize));
            const avgY = currentLineItems.reduce((acc, i) => acc + i.y, 0) / currentLineItems.length;
            const minX = Math.min(...currentLineItems.map(i => i.x));
            
            if (text) {
              firstPageLines.push({ text, fontSize: maxFontSize, y: avgY, x: minX });
            }
          }
        }

        page.cleanup();
        return lines.filter(Boolean).join("\n");
      })
    );

    fullText = pageTexts.join("\n").trim();
    
    // Release PDF documents
    try { await pdf.destroy(); pdf = undefined; } catch {}

    // Check if we need OCR fallback
    if (fullText.length < 50) {
      ocrUsed = true;
      fullText = await performOCROnFile(file);
    }

  } catch (error) {
    console.error("[HireDesk PDF] Native PDF.js parsing failed. Triggering OCR fallback...", error);
    try {
      ocrUsed = true;
      fullText = await performOCROnFile(file);
    } catch (ocrError) {
      console.error("[HireDesk PDF] OCR fallback failed. Falling back to filename cleanup:", ocrError);
      fullText = file.name.replace(/[_\-\.]/g, " ");
    }
  } finally {
    if (pdf) {
      try { await pdf.destroy(); } catch {}
    }
  }

  // Ensure we clean up any trailing generic values in the full text
  if (!fullText.trim()) {
    fullText = file.name.replace(/[_\-\.]/g, " ");
  }

  return {
    text: fullText,
    firstPageLines,
    ocrUsed
  };
}

/**
 * Standard string-based plain text extractor for legacy compatibility.
 */
export async function extractTextFromPDF(file: File): Promise<string> {
  const result = await extractTextAndMetaFromPDF(file);
  return result.text;
}

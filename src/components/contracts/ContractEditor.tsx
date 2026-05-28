"use client";
import { useState, useRef, useCallback } from "react";
import { useStore } from "@/lib/store";
import type { Contract } from "@/types";
import { compressImage } from "@/lib/utils/image";

interface Props { contract: Contract; onBack: () => void; }

export default function ContractEditor({ contract, onBack }: Props) {
  const { updateContract } = useStore();
  const [body, setBody] = useState(contract.body);
  const [logoUrl, setLogoUrl] = useState<string>(() => localStorage.getItem("tsp_logo") ?? "");
  const [signUrl, setSignUrl] = useState<string>(() => localStorage.getItem("tsp_sign") ?? "");
  const logoRef = useRef<HTMLInputElement>(null);
  const signRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  async function uploadImage(file: File, key: string, setter: (s: string) => void) {
    try {
      const compressed = await compressImage(file, 400, 150);
      setter(compressed);
      localStorage.setItem(key, compressed);
    } catch (err) {
      console.error("Image compression failed, falling back to raw data URL", err);
      const reader = new FileReader();
      reader.onload = e => {
        const url = e.target?.result as string;
        setter(url);
        localStorage.setItem(key, url);
      };
      reader.readAsDataURL(file);
    }
  }

  // ─── Debounced sync: persist only after 400ms of no typing ──────────────────
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const syncBody = useCallback(() => {
    if (!editorRef.current) return;
    const html = editorRef.current.innerHTML;
    setBody(html);
    // Debounce the store + localStorage write
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    syncTimerRef.current = setTimeout(() => {
      updateContract(contract.id, html);
    }, 400);
  }, [contract.id, updateContract]);

  const fmt = useCallback((cmd: string) => {
    document.execCommand(cmd, false, undefined);
    syncBody();
  }, [syncBody]);

  const insertField = useCallback((text: string) => {
    if (editorRef.current) {
      editorRef.current.focus();
      document.execCommand("insertText", false, text);
      syncBody();
    }
  }, [syncBody]);

  function handlePrint() {
    const logo = logoUrl 
      ? `<img src="${logoUrl}" style="height:56px;object-fit:contain;" alt="Logo"/>` 
      : `<div style="font-family:Arial,sans-serif;font-size:22pt;font-weight:800;letter-spacing:-0.5px;color:#111;line-height:1">Triple S Production</div><div style="font-family:Arial,sans-serif;font-size:8pt;color:#666;text-transform:uppercase;letter-spacing:2px;margin-top:4px">Production · Marketing · Digital</div>`;
    const sign = signUrl ? `<img src="${signUrl}" style="height:96px;object-fit:contain;" alt="Signature"/>` : "";
    const content = editorRef.current?.innerHTML ?? body;

    // Inject logo + signature into printed output
    const finalContent = content
      .replace("<!--LOGO-->", logo)
      .replace("<!--SIGN-->", sign);

    const win = window.open("", "_blank", "width=900,height=700");
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head>
      <meta charset="UTF-8"/>
      <title>${contract.name} — Triple S Production</title>
      <style>
        * { box-sizing: border-box; }
        body { font-family: Arial, Helvetica, sans-serif; max-width: 210mm; margin: 0 auto; padding: 20mm 25mm; color: #111; font-size: 11pt; line-height: 1.85; }
        h1,h2,h3 { font-family: Arial, Helvetica, sans-serif; }
        h2 { font-size: 14pt; border-bottom: 2px solid #111; padding-bottom: 6px; margin: 18px 0 12px; }
        h3 { font-size: 11pt; margin: 14px 0 6px; }
        p { margin-bottom: 10px; text-align: justify; }
        .letterhead { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #111; padding-bottom: 16px; margin-bottom: 24px; }
        .sig-block { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; margin-top: 48px; }
        .sig-line { border-top: 1px solid #333; padding-top: 6px; font-size: 10pt; }
        @media print {
          @page { size: A4; margin: 0mm; }
          body { margin: 0; padding: 20mm 25mm; }
          .no-print { display: none !important; }
        }
      </style>
    </head><body>${finalContent}
    <script>window.onload=()=>{setTimeout(()=>{window.print();},300);}<\/script>
    </body></html>`);
    win.document.close();
  }

  const FIELDS = [
    "[CANDIDATE NAME]", "[ROLE]", "[START DATE]", "[END DATE]",
    "[AMOUNT ₹]", "[REF NO]", "[X months]", "[NOTICE PERIOD]",
  ];

  return (
    <div className="flex gap-6 h-full">
      {/* Left: controls */}
      <div className="w-64 flex-shrink-0 flex flex-col gap-4">
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-[var(--text-3)] hover:text-white transition-colors font-medium">
          ← Back to Contracts
        </button>

        <div className="text-base font-bold tracking-tight leading-tight">{contract.name}</div>

        <div className="h-px bg-[var(--border)]" />

        {/* Logo upload */}
        <div>
          <div className="text-xs font-semibold text-[var(--text-3)] uppercase tracking-widest mb-2">Company Logo</div>
          {logoUrl
            ? <div className="relative rounded-xl overflow-hidden" style={{ border: "1px solid var(--border-2)" }}>
                <img src={logoUrl} alt="Logo" className="w-full h-16 object-contain p-2 bg-white" />
                <button onClick={() => { setLogoUrl(""); localStorage.removeItem("tsp_logo"); }}
                  className="absolute top-1 right-1 w-5 h-5 rounded bg-black/70 text-white text-xs flex items-center justify-center">✕</button>
              </div>
            : <button onClick={() => logoRef.current?.click()}
                className="w-full py-3 rounded-xl text-sm text-[var(--text-3)] hover:text-[var(--text-2)] transition-colors text-center border-2 border-dashed"
                style={{ borderColor: "var(--border-2)" }}>
                + Upload Logo (PNG/JPG)
              </button>
          }
          <input ref={logoRef} type="file" accept="image/*" className="hidden"
            onChange={e => e.target.files?.[0] && uploadImage(e.target.files[0], "tsp_logo", setLogoUrl)} />
        </div>

        {/* Signature upload */}
        <div>
          <div className="text-xs font-semibold text-[var(--text-3)] uppercase tracking-widest mb-2">Authorized Signature</div>
          {signUrl
            ? <div className="relative rounded-xl overflow-hidden" style={{ border: "1px solid var(--border-2)" }}>
                <img src={signUrl} alt="Sign" className="w-full h-14 object-contain p-2 bg-white" />
                <button onClick={() => { setSignUrl(""); localStorage.removeItem("tsp_sign"); }}
                  className="absolute top-1 right-1 w-5 h-5 rounded bg-black/70 text-white text-xs flex items-center justify-center">✕</button>
              </div>
            : <button onClick={() => signRef.current?.click()}
                className="w-full py-3 rounded-xl text-sm text-[var(--text-3)] hover:text-[var(--text-2)] transition-colors text-center border-2 border-dashed"
                style={{ borderColor: "var(--border-2)" }}>
                + Upload Signature (PNG)
              </button>
          }
          <input ref={signRef} type="file" accept="image/*" className="hidden"
            onChange={e => e.target.files?.[0] && uploadImage(e.target.files[0], "tsp_sign", setSignUrl)} />
        </div>

        <div className="h-px bg-[var(--border)]" />

        {/* Format toolbar */}
        <div>
          <div className="text-xs font-semibold text-[var(--text-3)] uppercase tracking-widest mb-2">Format</div>
          <div className="flex gap-2 flex-wrap">
            {[["B","bold"],["I","italic"],["U","underline"]].map(([l,c]) => (
              <button key={c} onClick={() => fmt(c)}
                className="w-9 h-9 rounded-lg text-sm font-bold text-[var(--text-2)] hover:text-white transition-colors"
                style={{ background: "var(--glass-2)", border: "1px solid var(--border)" }}>{l}</button>
            ))}
          </div>
        </div>

        {/* Insert fields */}
        <div>
          <div className="text-xs font-semibold text-[var(--text-3)] uppercase tracking-widest mb-2">Insert Fields</div>
          <div className="flex flex-col gap-1">
            {FIELDS.map(f => (
              <button key={f} onClick={() => insertField(f)}
                className="text-left text-xs px-3 py-2 rounded-lg text-[var(--text-3)] hover:text-[var(--text-2)] hover:bg-[var(--glass-2)] transition-colors font-mono border border-transparent hover:border-[var(--border)]">
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="h-px bg-[var(--border)]" />

        <button onClick={handlePrint}
          className="w-full py-3 rounded-xl text-sm font-semibold bg-white text-black hover:bg-white/90 transition-all">
          🖨 Print / Export PDF
        </button>
        <button onClick={syncBody}
          className="w-full py-2.5 rounded-xl text-sm font-medium text-[var(--text-2)] hover:text-white transition-colors"
          style={{ background: "var(--glass-2)", border: "1px solid var(--border)" }}>
          💾 Save Changes
        </button>
      </div>

      {/* Right: paper editor */}
      <div className="flex-1 overflow-y-auto">
        <div className="text-xs text-[var(--text-3)] font-medium mb-3 uppercase tracking-widest">Paper Preview — Click to Edit</div>

        {/* A4 paper */}
        <div className="rounded-2xl overflow-hidden shadow-2xl" style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
          {/* Paper header bar */}
          <div className="px-4 py-2 flex items-center gap-2" style={{ background: "#1a1a1a", borderBottom: "1px solid var(--border)" }}>
            <div className="w-3 h-3 rounded-full bg-red-500/60" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
            <div className="w-3 h-3 rounded-full bg-green-500/60" />
            <span className="ml-2 text-xs text-[var(--text-3)]">A4 · {contract.name}</span>
          </div>

          {/* White paper */}
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            className="outline-none"
            style={{
              background: "#fff",
              color: "#111",
              fontFamily: "Arial, Helvetica, sans-serif",
              fontSize: "11pt",
              lineHeight: "1.85",
              padding: "16mm 20mm",
              minHeight: "297mm",
            }}
            dangerouslySetInnerHTML={{ __html: body }}
            onInput={syncBody}
          />
        </div>

        {/* Logo/sign preview info */}
        {(logoUrl || signUrl) && (
          <div className="mt-3 text-xs text-[var(--text-3)] font-medium px-1">
            {logoUrl && "✅ Logo will appear on printed document · "}
            {signUrl && "✅ Signature will appear on printed document"}
          </div>
        )}
      </div>
    </div>
  );
}

import UploadZone from "@/components/upload/UploadZone";

export default function UploadPage() {
  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-[22px] font-extrabold tracking-tight">Upload Resumes</h1>
        <div className="font-mono text-[10px] text-[var(--text-3)] mt-1 uppercase tracking-widest">
          Drag & drop PDFs · Auto-parse · Bulk processing
        </div>
      </div>
      <UploadZone />
    </div>
  );
}

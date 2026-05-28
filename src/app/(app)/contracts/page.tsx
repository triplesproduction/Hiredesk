import { Suspense } from "react";
import ContractsList from "@/components/contracts/ContractsList";

export default function ContractsPage() {
  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-[22px] font-extrabold tracking-tight">Contracts &amp; Agreements</h1>
        <div className="font-mono text-[10px] text-[var(--text-3)] mt-1 uppercase tracking-widest">
          Agency-grade legal documents · Triple S Production branding
        </div>
      </div>
      <Suspense fallback={null}>
        <ContractsList />
      </Suspense>
    </div>
  );
}

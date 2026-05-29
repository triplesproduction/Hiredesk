"use client";
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from "react";
import type { Candidate, Role, Contract, Filters } from "@/types";
import { DEFAULT_ROLES, generateSeedCandidates, getContractTemplates } from "@/lib/data";
import { exportCandidatesToCSV } from "@/lib/utils/csv";

interface Store {
  candidates: Candidate[];
  roles: Role[];
  contracts: Contract[];
  filters: Filters;
  selectedIds: Set<string>;
  setCandidates: (c: Candidate[]) => void;
  setRoles: (r: Role[]) => void;
  addCandidate: (c: Candidate) => void;
  addCandidates: (c: Candidate[]) => void;
  updateCandidate: (id: string, patch: Partial<Candidate>) => void;
  deleteCandidate: (id: string) => void;
  deleteCandidates: (ids: string[]) => void;
  deleteBelowScore: (threshold: number) => number;
  addRole: (r: Role) => void;
  updateContract: (id: string, body: string) => void;
  setFilters: (f: Partial<Filters>) => void;
  clearFilters: () => void;
  toggleSelect: (id: string) => void;
  toggleSelectAll: (ids: string[]) => void;
  clearSelection: () => void;
  exportCSV: () => void;
}

const DEFAULT_FILTERS: Filters = {
  search: "", roleId: "all", status: "all",
  city: "", gender: "all", ageRange: "all", exp: "all",
  sort: "newest",
};

const StoreCtx = createContext<Store | null>(null);

// ─── O(1) role count via Map ────────────────────────────────────────────────
function computeRoleCounts(candidates: Candidate[], roles: Role[]): Role[] {
  const countMap = new Map<string, number>();
  for (const c of candidates) {
    countMap.set(c.roleId, (countMap.get(c.roleId) ?? 0) + 1);
  }
  return roles.map(r => ({ ...r, count: countMap.get(r.id) ?? 0 }));
}

// ─── Debounce helper ─────────────────────────────────────────────────────────
function debounce<T extends (...args: any[]) => void>(fn: T, ms: number): T {
  let timer: ReturnType<typeof setTimeout>;
  return ((...args: any[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  }) as T;
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [candidates, setCandidatesRaw] = useState<Candidate[]>([]);
  const [roles, setRolesRaw] = useState<Role[]>(DEFAULT_ROLES);
  const [contracts, setContracts] = useState<Contract[]>(getContractTemplates);
  const [filters, setFiltersRaw] = useState<Filters>(DEFAULT_FILTERS);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const initializedRef = useRef(false);

  // ─── Load strictly from Supabase once on mount ───────────
  useEffect(() => {
    async function loadInitialData() {
      try {
        const { getDBCandidates, getDBRoles, getDBContracts, insertDBRoles, insertDBContracts } = await import("@/lib/supabase");
        
        // Concurrently fetch all cloud state
        const [dbCandidates, dbRoles, dbContracts] = await Promise.all([
          getDBCandidates(),
          getDBRoles(),
          getDBContracts(),
        ]);
        
        setCandidatesRaw(dbCandidates);
        
        // If roles table is empty, seed it with defaults and save to DB
        if (dbRoles.length === 0) {
          const defaultRoles = computeRoleCounts(dbCandidates, DEFAULT_ROLES);
          setRolesRaw(defaultRoles);
          insertDBRoles(defaultRoles).catch(console.error);
        } else {
          setRolesRaw(computeRoleCounts(dbCandidates, dbRoles));
        }

        // If contracts table is empty, seed it with defaults and save to DB
        if (dbContracts.length === 0) {
          const defaultContracts = getContractTemplates();
          setContracts(defaultContracts);
          insertDBContracts(defaultContracts).catch(console.error);
        } else {
          setContracts(dbContracts);
        }
        
      } catch (e) {
        console.error("Failed to hydrate from Supabase:", e);
      } finally {
        initializedRef.current = true;
      }
    }

    loadInitialData();
  }, []);

  // ─── Mutation helpers ───────────────────────────────────────────────────────
  const setCandidates = useCallback((c: Candidate[]) => {
    setCandidatesRaw(c);
    setRolesRaw(prev => computeRoleCounts(c, prev));
  }, []);

  const setRoles = useCallback((r: Role[]) => {
    setRolesRaw(r);
    import("@/lib/supabase").then(db => db.insertDBRoles(r)).catch(console.error);
  }, []);

  const addCandidate = useCallback((c: Candidate) => {
    setCandidatesRaw(prev => {
      const next = [...prev, c];
      setRolesRaw(rPrev => computeRoleCounts(next, rPrev));
      return next;
    });
    import("@/lib/supabase").then(db => db.insertDBCandidate(c)).catch(err => console.error(err));
  }, []);

  const addCandidates = useCallback((newOnes: Candidate[]) => {
    setCandidatesRaw(prev => {
      const next = [...prev, ...newOnes];
      setRolesRaw(rPrev => computeRoleCounts(next, rPrev));
      return next;
    });
    import("@/lib/supabase").then(db => db.insertDBCandidates(newOnes)).catch(err => {
      console.error(err);
      alert("Failed to save candidate to database: " + (err?.message || JSON.stringify(err)));
    });
  }, []);

  const updateCandidate = useCallback((id: string, patch: Partial<Candidate>) => {
    setCandidatesRaw(prev => {
      const next = prev.map(c => c.id === id ? { ...c, ...patch } : c);
      if (patch.roleId !== undefined) {
        setRolesRaw(rPrev => computeRoleCounts(next, rPrev));
      }
      return next;
    });
    import("@/lib/supabase").then(db => db.updateDBCandidate(id, patch)).catch(err => console.error(err));
  }, []);

  const deleteCandidate = useCallback((id: string) => {
    setCandidatesRaw(prev => {
      const next = prev.filter(c => c.id !== id);
      setRolesRaw(rPrev => computeRoleCounts(next, rPrev));
      return next;
    });
    import("@/lib/supabase").then(db => db.deleteDBCandidate(id)).catch(err => console.error(err));
  }, []);

  const deleteCandidates = useCallback((ids: string[]) => {
    const idSet = new Set(ids);
    setCandidatesRaw(prev => {
      const next = prev.filter(c => !idSet.has(c.id));
      setRolesRaw(rPrev => computeRoleCounts(next, rPrev));
      return next;
    });
    setSelectedIds(new Set());
    import("@/lib/supabase").then(db => db.deleteDBCandidates(ids)).catch(err => console.error(err));
  }, []);

  const deleteBelowScore = useCallback((threshold: number) => {
    let deletedCount = 0;
    const toDeleteIds: string[] = [];
    setCandidatesRaw(prev => {
      const next = prev.filter(c => {
        if (c.score.total < threshold) { 
          deletedCount++; 
          toDeleteIds.push(c.id);
          return false; 
        }
        return true;
      });
      setRolesRaw(rPrev => computeRoleCounts(next, rPrev));
      return next;
    });
    if (toDeleteIds.length > 0) {
      import("@/lib/supabase").then(db => db.deleteDBCandidates(toDeleteIds)).catch(err => console.error(err));
    }
    return deletedCount;
  }, []);

  const addRole = useCallback((r: Role) => {
    setRolesRaw(prev => [...prev, r]);
    import("@/lib/supabase").then(db => db.insertDBRoles([r])).catch(console.error);
  }, []);

  const updateContract = useCallback((id: string, body: string) => {
    setContracts(prev => prev.map(c => c.id === id ? { ...c, body } : c));
    import("@/lib/supabase").then(db => db.updateDBContract(id, { body })).catch(console.error);
  }, []);

  const setFilters = useCallback(
    (f: Partial<Filters>) => setFiltersRaw(prev => ({ ...prev, ...f })),
    []
  );
  const clearFilters = useCallback(() => setFiltersRaw(DEFAULT_FILTERS), []);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback((ids: string[]) => {
    setSelectedIds(prev => {
      const allSelected = ids.every(id => prev.has(id));
      const next = new Set(prev);
      if (allSelected) {
        ids.forEach(id => next.delete(id));
      } else {
        ids.forEach(id => next.add(id));
      }
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  const exportCSV = useCallback(() => {
    exportCandidatesToCSV(candidates);
  }, [candidates]);

  // ─── Stable context value (only recreated when slices change) ───────────────
  const value = useMemo<Store>(() => ({
    candidates, roles, contracts, filters, selectedIds,
    setCandidates, setRoles, addCandidate, addCandidates,
    updateCandidate, deleteCandidate, deleteCandidates, deleteBelowScore,
    addRole, updateContract, setFilters, clearFilters,
    toggleSelect, toggleSelectAll, clearSelection, exportCSV,
  }), [
    candidates, roles, contracts, filters, selectedIds,
    setCandidates, setRoles, addCandidate, addCandidates,
    updateCandidate, deleteCandidate, deleteCandidates, deleteBelowScore,
    addRole, updateContract, setFilters, clearFilters,
    toggleSelect, toggleSelectAll, clearSelection, exportCSV,
  ]);

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreCtx);
  if (!ctx) throw new Error("useStore must be inside StoreProvider");
  return ctx;
}

// ─── Pre-parsed age range cache ──────────────────────────────────────────────
const ageRangeCache = new Map<string, [number, number]>();
function parseAgeRange(range: string): [number, number] {
  if (ageRangeCache.has(range)) return ageRangeCache.get(range)!;
  const result: [number, number] = range === "40+" ? [40, 99] : range.split("-").map(Number) as [number, number];
  ageRangeCache.set(range, result);
  return result;
}

export function useFilteredCandidates() {
  const { candidates, filters } = useStore();

  return useMemo(() => {
    const { roleId, status, city, gender, exp, ageRange, search, sort } = filters;

    // Pre-compute search query once
    const q = search ? search.toLowerCase() : null;
    const [lo, hi] = ageRange !== "all" ? parseAgeRange(ageRange) : [0, 999];

    const filtered = candidates.filter(c => {
      if (roleId !== "all" && c.roleId !== roleId) return false;
      if (status !== "all" && c.status !== status) return false;
      if (city && c.city !== city) return false;
      if (gender !== "all" && c.gender !== gender) return false;
      if (exp !== "all" && c.exp !== exp) return false;
      if (ageRange !== "all" && (c.age < lo || c.age > hi)) return false;
      if (q && !c.name.toLowerCase().includes(q)
            && !c.email.toLowerCase().includes(q)
            && !c.roleName.toLowerCase().includes(q)) return false;
      return true;
    });

    // Apply sort
    return [...filtered].sort((a, b) => {
      switch (sort) {
        case "newest":
          // Fall back to array position (index) for old records without createdAt
          return (b.createdAt ?? "") > (a.createdAt ?? "") ? 1 : -1;
        case "oldest":
          return (a.createdAt ?? "") > (b.createdAt ?? "") ? 1 : -1;
        case "score-desc":
          return b.score.total - a.score.total;
        case "score-asc":
          return a.score.total - b.score.total;
        case "name-az":
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });
  }, [candidates, filters]);
}

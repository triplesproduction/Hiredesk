import { createClient } from "@supabase/supabase-js";
import type { Candidate } from "@/types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Supabase credentials missing. Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in your .env.local file."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper functions for candidate database sync
export async function getDBCandidates(): Promise<Candidate[]> {
  const { data, error } = await supabase
    .from("candidates")
    .select("*")
    .order("createdAt", { ascending: false });

  if (error) {
    console.error("Error fetching candidates from Supabase:", error);
    throw error;
  }
  return (data || []) as Candidate[];
}

export async function insertDBCandidate(c: Candidate): Promise<void> {
  const { error } = await supabase.from("candidates").insert(c);
  if (error) {
    console.error("Error inserting candidate to Supabase:", error);
    throw error;
  }
}

export async function insertDBCandidates(candidates: Candidate[]): Promise<void> {
  const { error } = await supabase.from("candidates").insert(candidates);
  if (error) {
    console.error("Error inserting bulk candidates to Supabase:", error);
    throw error;
  }
}

export async function updateDBCandidate(id: string, patch: Partial<Candidate>): Promise<void> {
  const { error } = await supabase.from("candidates").update(patch).eq("id", id);
  if (error) {
    console.error("Error updating candidate in Supabase:", error);
    throw error;
  }
}

export async function deleteDBCandidate(id: string): Promise<void> {
  const { error } = await supabase.from("candidates").delete().eq("id", id);
  if (error) {
    console.error("Error deleting candidate from Supabase:", error);
    throw error;
  }
}

export async function deleteDBCandidates(ids: string[]): Promise<void> {
  const { error } = await supabase.from("candidates").delete().in("id", ids);
  if (error) {
    console.error("Error deleting bulk candidates from Supabase:", error);
    throw error;
  }
}

export async function uploadResumeFile(file: File, candidateId: string): Promise<string> {
  const fileExt = file.name.split(".").pop();
  const filePath = `${candidateId}/${Date.now()}.${fileExt}`;
  
  const { error } = await supabase.storage
    .from("resumes")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false
    });

  if (error) {
    console.error("Supabase storage upload error details:", error);
    throw error;
  }

  const { data } = supabase.storage.from("resumes").getPublicUrl(filePath);
  return data.publicUrl;
}


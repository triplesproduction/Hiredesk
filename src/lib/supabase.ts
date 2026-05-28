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

// ─── Brand Asset Storage (Logo & Signature) ─────────────────────────────────
// Stores the company logo and authorized signature in Supabase Storage so they
// persist across all devices, browsers, and sessions. Uses upsert=true so
// uploading a new file always replaces the old one at the same fixed path.

const BRAND_BUCKET = "brand-assets";

/**
 * Upload a brand asset (logo or signature) to Supabase Storage.
 * @param dataUrl  Base64 data URL of the image
 * @param key      "tsp_logo" | "tsp_sign"
 * @returns        Public URL of the uploaded asset
 */
export async function uploadBrandAsset(dataUrl: string, key: "tsp_logo" | "tsp_sign"): Promise<string> {
  // Convert base64 data URL to Blob
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  const mimeType = blob.type || "image/png";
  const ext = mimeType.split("/")[1]?.split("+")[0] || "png";
  
  // Fixed path — always the same file name so upsert replaces in-place
  const filePath = `${key}.${ext}`;

  const { error } = await supabase.storage
    .from(BRAND_BUCKET)
    .upload(filePath, blob, {
      contentType: mimeType,
      cacheControl: "0",   // No cache — always fetch latest
      upsert: true,        // Replace existing file
    });

  if (error) {
    console.error(`Failed to upload brand asset ${key}:`, error);
    throw error;
  }

  const { data } = supabase.storage.from(BRAND_BUCKET).getPublicUrl(filePath);
  // Append cache-buster so browsers always fetch the latest version
  return `${data.publicUrl}?t=${Date.now()}`;
}

/**
 * Fetch the latest brand asset URL from Supabase Storage.
 * Falls back to localStorage cache if Supabase fails or asset doesn't exist.
 * @param key  "tsp_logo" | "tsp_sign"
 * @returns    Public URL string or empty string if not uploaded yet
 */
export async function getBrandAssetUrl(key: "tsp_logo" | "tsp_sign"): Promise<string> {
  // Try both .png and .jpg extensions
  for (const ext of ["png", "jpg", "jpeg", "webp"]) {
    const filePath = `${key}.${ext}`;
    const { data } = supabase.storage.from(BRAND_BUCKET).getPublicUrl(filePath);
    
    // Check if the file actually exists by doing a HEAD request
    try {
      const { data: listData } = await supabase.storage
        .from(BRAND_BUCKET)
        .list("", { search: `${key}.${ext}` });
      
      if (listData && listData.length > 0) {
        const url = `${data.publicUrl}?t=${Date.now()}`;
        // Cache in localStorage for offline/fast-load
        localStorage.setItem(key, url);
        return url;
      }
    } catch {
      // Ignore listing errors
    }
  }
  
  // Fallback: return localStorage cache if Supabase lookup fails
  return localStorage.getItem(key) ?? "";
}

/**
 * Delete a brand asset from Supabase Storage and localStorage.
 */
export async function deleteBrandAsset(key: "tsp_logo" | "tsp_sign"): Promise<void> {
  localStorage.removeItem(key);
  for (const ext of ["png", "jpg", "jpeg", "webp"]) {
    await supabase.storage.from(BRAND_BUCKET).remove([`${key}.${ext}`]);
  }
}

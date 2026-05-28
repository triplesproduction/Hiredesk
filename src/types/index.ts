export type Status = "new" | "review" | "approved" | "rejected";

export interface ScoreBreakdown {
  skills: number;
  exp: number;
  edu: number;
  completeness: number;
  total: number;
}

export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  roleId: string;
  roleName: string;
  score: ScoreBreakdown;
  status: Status;
  city: string;
  gender: string;
  age: number;
  exp: string;
  education: string;
  skills: string[];
  resumeFile: string;
  resumeUrl?: string;   // Public URL to the uploaded PDF on Supabase Storage
  resumeText?: string;  // Raw extracted text for resume preview
  appliedAt: string;
  createdAt: string;
  note: string;
}

export interface Role {
  id: string;
  name: string;
  type: "Full-time" | "Intern" | "Freelance";
  keywords: string[];
  count: number;
  isActive: boolean;
}

export interface Contract {
  id: string;
  name: string;
  icon: string;
  desc: string;
  type: string;
  body: string;
}

export type SortKey = "newest" | "oldest" | "score-desc" | "score-asc" | "name-az";

export interface Filters {
  search: string;
  roleId: string;
  status: string;
  city: string;
  gender: string;
  ageRange: string;
  exp: string;
  sort: SortKey;
}

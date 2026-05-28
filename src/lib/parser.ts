"use client";
import type { Candidate, Role } from "@/types";
import { makeCandidate, extractInfoFromText, detectBestRole, scoreCandidateFromText } from "@/lib/data";
import { extractTextFromPDF } from "@/lib/utils/pdf";

const SKILL_KEYWORDS: Record<string, string[]> = {
  "dev-ft": ["React","Node","JavaScript","TypeScript","Python","Flutter","Next.js","MongoDB","SQL","AWS","Docker","Git","REST","GraphQL","CSS","HTML"],
  "dev-in": ["JavaScript","HTML","CSS","React","Python","Git","Basics","jQuery","Bootstrap"],
  "designer": ["Figma","Photoshop","Illustrator","Canva","Branding","Typography","UI","UX","Adobe","InDesign","CorelDRAW","Sketch"],
  "editor": ["Premiere","After Effects","DaVinci","Final Cut","Color Grading","Motion Graphics","Editing","CapCut","Audition"],
  "dmarketer": ["SEO","SEM","Google Ads","Meta Ads","Analytics","Email Marketing","HubSpot","Campaigns","Digital Marketing","GTM"],
  "smm": ["Instagram","TikTok","Social Media","Content Creation","Reels","Scheduling","Engagement","Facebook","YouTube","LinkedIn"],
  "sales": ["Sales","CRM","B2B","B2C","Negotiation","Lead Generation","Revenue","Target","Closing","Salesforce","Pipeline"],
  "perfmkt": ["Google Ads","Meta Ads","ROAS","CPC","CPM","PPC","Remarketing","A/B Testing","Conversion","Performance Marketing"],
  "content": ["Copywriting","SEO","Content Strategy","Storytelling","Editorial","Blogging","Brand Voice","Content Calendar"],
  "model-m": ["Modelling","Portfolio","Commercial","Editorial","Runway","Brand","Fitness"],
  "model-f": ["Modelling","Portfolio","Commercial","Editorial","Runway","Fashion","Brand"],
  "camera": ["Cinematography","DSLR","Lighting","Video Production","Drone","Stabilizer","Camera","Shoot","Lens","Gimbal"],
};

function extractSkills(text: string, roleId: string): string[] {
  const lower = text.toLowerCase();
  const pool = SKILL_KEYWORDS[roleId] ?? [];
  const found = pool.filter(k => lower.includes(k.toLowerCase()));
  // Also look for generic skill keywords
  const generic = ["Photoshop","Illustrator","Excel","PowerPoint","WordPress","Shopify","Zoom","Slack"]
    .filter(k => lower.includes(k.toLowerCase()) && !found.includes(k));
  return Array.from(new Set([...found, ...generic])).slice(0, 8);
}

function extractName(text: string, filename: string): string {
  // Strategy 1: Explicit "Name:" label (most reliable)
  const labelMatch = text.match(/(?:^|\n)\s*(?:Full\s+)?Name\s*[:\-]\s*([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+){1,3})/im);
  if (labelMatch?.[1]) {
    const n = labelMatch[1].replace(/\s+/g, " ").trim();
    if (n.length > 3 && n.length < 50) return n;
  }

  // Strategy 2: All-caps name block (common in professionally formatted resumes)
  // e.g. "JOHN MICHAEL DOE" on its own line or at start
  const capsMatch = text.match(/(?:^|\n)\s*([A-Z]{2,}(?:\s+[A-Z]{2,}){1,3})\s*(?:\n|$)/m);
  if (capsMatch?.[1]) {
    const n = capsMatch[1].replace(/\s+/g, " ").trim();
    // Must look like a name, not a section header like "WORK EXPERIENCE"
    if (n.length > 3 && n.length < 40 && n.split(" ").length <= 4) {
      return n.split(" ").map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(" ");
    }
  }

  // Strategy 3: First line of text — pdfjs often puts the name at the very top
  // Grab the first non-empty line and validate it looks like a name
  const firstLines = text.split(/\n/).map(l => l.trim()).filter(Boolean);
  for (const line of firstLines.slice(0, 5)) {
    // Must be 2–4 words, each starting with capital, no digits/symbols
    const words = line.split(/\s+/);
    if (words.length >= 2 && words.length <= 4
      && words.every(w => /^[A-Z][a-zA-Z'-]{1,}$/.test(w))
      && line.length < 50) {
      return line;
    }
  }

  // Strategy 4: Titlecase "Firstname Lastname" anywhere in first 300 chars
  const titleMatch = text.slice(0, 300).match(/([A-Z][a-z]{1,15}\s+[A-Z][a-z]{1,15}(?:\s+[A-Z][a-z]{1,15})?)/);
  if (titleMatch?.[1]) {
    const n = titleMatch[1].replace(/\s+/g, " ").trim();
    // Reject common section headers that also happen to be Titlecase
    const STOP = /^(Work Experience|Personal Information|Career Objective|Contact Details|Education Qualifications|Skills Summary)$/i;
    if (!STOP.test(n) && n.length > 3 && n.length < 40) return n;
  }

  // Strategy 5: Filename fallback — "John_Doe_Resume.pdf" → "John Doe"
  const fn = filename.replace(/\.(pdf|PDF)$/, "").replace(/[_\-\.]/g, " ").replace(/resume|cv|curriculum vitae/gi, "").trim();
  const parts = fn.split(/\s+/).filter(p => p.length > 1 && /^[A-Za-z]/.test(p));
  if (parts.length >= 2) {
    return parts.slice(0, 2).map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(" ");
  }

  return "";
}

function extractEmail(text: string): string {
  return text.match(/[\w.+\-]+@[\w\-]+\.[a-z]{2,6}/i)?.[0] ?? "";
}

function extractPhone(text: string): string {
  return text.match(/(\+91[\s\-]?)?[6-9]\d{9}/)?.[0] ??
    text.match(/(\+?[\d\s\-]{10,14})/)?.[0]?.trim() ?? "";
}

function extractCity(text: string): string {
  const cities = ["Mumbai","Delhi","Pune","Bangalore","Bengaluru","Hyderabad","Chennai","Kolkata","Ahmedabad","Jaipur","Surat","Nashik","Nagpur","Vadodara","Indore","Remote","Noida","Gurugram","Gurgaon","Chandigarh"];
  const lower = text.toLowerCase();
  return cities.find(c => lower.includes(c.toLowerCase())) ?? "Not specified";
}

function extractEducation(text: string): string {
  const degrees = ["Ph.D","M.Tech","MCA","MBA","M.Sc","M.Com","B.Tech","BCA","BBA","B.Sc","B.Com","B.Des","BA","BE","Diploma","12th","10th"];
  for (const d of degrees) {
    if (text.includes(d) || text.toLowerCase().includes(d.toLowerCase())) return d;
  }
  return "Not specified";
}

function extractExperience(text: string): string {
  const m = text.match(/(\d+)\+?\s*(?:year|yr)s?\s*(?:of\s*)?(?:experience|exp)/i);
  if (m) {
    const yrs = parseInt(m[1]);
    if (yrs === 0) return "Fresher";
    if (yrs === 1) return "1 yr";
    if (yrs >= 5) return "5+ yrs";
    return `${yrs} yrs`;
  }
  const fresher = /fresher|fresh graduate|0 year|no experience/i.test(text);
  if (fresher) return "Fresher";
  return "Not specified";
}

function extractGender(text: string): string {
  const lower = text.toLowerCase();
  if (/\b(female|woman|she\/her|f\b)\b/.test(lower)) return "Female";
  if (/\b(male|man|he\/him|m\b)\b/.test(lower)) return "Male";
  return "Not specified";
}

function extractAge(text: string): number {
  const m = text.match(/[Aa]ge[:\s]+(\d{2})/) ?? text.match(/DOB[:\s\-]+\d{1,2}[\/-]\d{1,2}[\/-](\d{4})/);
  if (m) {
    const val = parseInt(m[1]);
    if (val > 1950 && val < 2010) return new Date().getFullYear() - val; // birth year
    if (val >= 18 && val <= 65) return val;
  }
  return Math.floor(Math.random() * 10) + 22; // reasonable default
}

export async function parseResumeFile(file: File, roles: Role[]): Promise<Candidate> {
  const text = await extractTextFromPDF(file);
  const roleId = detectBestRole(text, roles);
  const role = roles.find(r => r.id === roleId) ?? roles[0];
  const score = scoreCandidateFromText(text, roleId);

  const name = extractName(text, file.name);
  const email = extractEmail(text);
  const phone = extractPhone(text);
  const city = extractCity(text);
  const education = extractEducation(text);
  const exp = extractExperience(text);
  const gender = extractGender(text);
  const age = extractAge(text);
  const skills = extractSkills(text, roleId);

  return makeCandidate(roleId, {
    name: name || `Candidate (${file.name.replace(".pdf","")})`,
    email: email || "",
    phone: phone || "",
    city,
    education,
    exp,
    gender,
    age,
    roleName: role.name,
    score,
    resumeFile: file.name,
    resumeText: text,
    skills: skills.length > 0 ? skills : ["See resume"],
    status: "new",
    appliedAt: new Date().toLocaleDateString("en-IN"),
    createdAt: new Date().toISOString(),
  });
}

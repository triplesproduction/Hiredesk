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

const TITLE_STOP_WORDS = /\b(executive|manager|developer|designer|editor|marketer|cameraman|consultant|engineer|intern|resume|cv|profile|page|curriculum|vitae|specialist|analyst|lead|director|architect|builder|associate|student|graduate|fresher|professional)\b/i;

function extractName(text: string, filename: string): string {
  // Strategy 1: Explicit "Name:" label (most reliable, global search)
  const labelMatches = Array.from(text.matchAll(/\b(?:Full\s+)?Name\s*[:\-]\s*([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+){1,3})/img));
  for (const match of labelMatches) {
    const n = match[1].replace(/\s+/g, " ").trim();
    if (n.length > 3 && n.length < 50 && !TITLE_STOP_WORDS.test(n)) return n;
  }

  // Strategy 2: All-caps name block (common in professionally formatted resumes, global search)
  const capsMatches = Array.from(text.slice(0, 600).matchAll(/\b([A-Z]{2,}(?:\s+[A-Z]{2,}){1,3})\b/g));
  for (const match of capsMatches) {
    const n = match[1].replace(/\s+/g, " ").trim();
    if (n.length > 3 && n.length < 40 && n.split(" ").length <= 4 && !TITLE_STOP_WORDS.test(n)) {
      return n.split(" ").map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(" ");
    }
  }

  // Strategy 3: First line segment of text
  const firstLines = text.split(/\n/).map(l => l.trim()).filter(Boolean);
  const skipKeywords = /resume|cv|curriculum|vitae|summary|profile|page/i;
  for (const line of firstLines.slice(0, 6)) {
    if (skipKeywords.test(line)) continue;
    
    // Split by common header separators like |, - or ,
    const parts = line.split(/\s*[\|\-,]\s*/);
    const firstSegment = parts[0].trim();
    
    const words = firstSegment.split(/\s+/);
    if (words.length >= 2 && words.length <= 4
      && words.every(w => /^[A-Z][a-zA-Z'\-]*\.?$/.test(w))
      && firstSegment.length > 3 && firstSegment.length < 40
      && !TITLE_STOP_WORDS.test(firstSegment)) {
      return firstSegment;
    }
  }

  // Strategy 4: Titlecase "Firstname Lastname" anywhere in first 400 chars (global search)
  const titleMatches = Array.from(text.slice(0, 400).matchAll(/\b([A-Z][a-z]{1,15}\s+[A-Z][a-z]{1,15}(?:\s+[A-Z][a-z]{1,15})?)\b/g));
  for (const match of titleMatches) {
    const n = match[1].replace(/\s+/g, " ").trim();
    const STOP = /^(Work Experience|Personal Information|Career Objective|Contact Details|Education Qualifications|Skills Summary)$/i;
    if (!STOP.test(n) && n.length > 3 && n.length < 40 && !TITLE_STOP_WORDS.test(n)) return n;
  }

  // Strategy 5: Filename fallback — strip UUID and find valid name parts
  // e.g. "fee7ddb2-dc57-48fd-ab08-4ab686a54297-Mitali_Marketing Profile.pdf" -> "Mitali"
  let cleanFn = filename.replace(/\.(pdf|PDF)$/, "");
  // Strip UUID prefix (36 chars hex with dashes)
  cleanFn = cleanFn.replace(/^[a-f0-9\-]{30,}\-?/i, "");
  
  const fnParts = cleanFn.split(/[_\-\.\s]+/).filter(Boolean);
  const cleanParts = fnParts.filter(p => p.length > 1 && /^[A-Za-z]/.test(p) && !TITLE_STOP_WORDS.test(p));
  
  if (cleanParts.length > 0) {
    return cleanParts.slice(0, 3).map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(" ");
  }

  // Strategy 6: Email prefix fallback — "mitalikumkar110@gmail.com" -> "Mitali Kumkar"
  const email = extractEmail(text);
  if (email) {
    const prefix = email.split("@")[0].replace(/[0-9\-_.]+/g, " ").trim();
    if (prefix.length > 2) {
      return prefix.split(/\s+/).map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(" ");
    }
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

function extractGender(text: string, name: string): string {
  const lowerText = text.toLowerCase();
  
  // 1. Explicit mention in text
  const explicitMatch = lowerText.match(/\b(?:gender|sex)\s*[:\-]\s*(female|male|f|m)\b/i);
  if (explicitMatch) {
    const g = explicitMatch[1].toLowerCase();
    if (g === "female" || g === "f") return "Female";
    if (g === "male" || g === "m") return "Male";
  }

  // 2. Pronoun checks
  const sheCount = (lowerText.match(/\b(she|her|hers)\b/g) || []).length;
  const heCount = (lowerText.match(/\b(he|him|his)\b/g) || []).length;
  if (sheCount > heCount + 2) return "Female";
  if (heCount > sheCount + 2) return "Male";

  // 3. Indian name heuristics
  if (name) {
    const firstName = name.split(/\s+/)[0].toLowerCase();
    const femaleNames = ["priya","sneha","neha","ananya","pooja","riya","meera","shruti","zara","tanya","ayesha","simran","deepika","mitali","aditi","kavya","anushka","snehal","swati","sakshi","shreya","rashi","kirti","tripti","divya","kajal","isha","ekta","sheetal","rashmi","poornima","preeti","sonia","monika","payal"];
    const maleNames = ["aarav","rohit","arjun","vikram","raj","dev","ishaan","siddharth","aditya","manish","omar","nikhil","dhruv","ratan","vivek","amit","abhishek","rahul","sachin","saurabh","gaurav","pankaj","sanjay","anil","sunil","vijay","raju","ram","shyam","harsh","aman","kunal","yash"];
    
    if (femaleNames.includes(firstName)) return "Female";
    if (maleNames.includes(firstName)) return "Male";
    
    // Ending in i, ee, ya, a are highly likely female in India
    if (/(i|ee|ya|a)$/.test(firstName)) {
      const maleSuffixExceptions = ["aditya","yash","amit","sharma","gupta","kumar","singh","verma","mehta","shah","joshi","nair","iyer","reddy","bose","khanna","malhotra","kapoor","desai","pillai","rao","agarwal"];
      if (!maleSuffixExceptions.includes(firstName)) {
        return "Female";
      }
    }
  }

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
  const gender = extractGender(text, name);
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

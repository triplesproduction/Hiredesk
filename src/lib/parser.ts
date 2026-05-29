"use client";
import type { Candidate, Role } from "@/types";
import { makeCandidate, detectBestRole, scoreCandidateFromText, SKILLS_POOL } from "@/lib/data";
import { extractTextAndMetaFromPDF, PDFTextLine } from "@/lib/utils/pdf";

// Common job titles and ATS keyword stop-words to prune from candidate names
const JUNK_KEYWORDS = new Set([
  "resume", "cv", "curriculum", "vitae", "profile", "portfolio", "page", "developer", "engineer",
  "designer", "manager", "executive", "intern", "cameraman", "consultant", "specialist", "analyst",
  "lead", "director", "architect", "builder", "associate", "student", "graduate", "fresher",
  "professional", "hiredesk", "copy", "final", "latest", "updated", "work", "experience", "education",
  "skills", "summary", "contact", "phone", "email", "address", "about", "me", "hobbies", "languages",
  "references", "project", "projects", "key", "technical", "personal", "microsoft", "word", "pdf"
]);

const NAME_PREFIXES = /^(mr|ms|mrs|dr|prof|sir|er|md)\.?\s+/i;

/**
 * Normalizes a candidate name string:
 * - Removes salutations (Mr, Dr, etc.)
 * - Cleans multiple spaces
 * - Handles camelCase splitting
 * - Standardizes ALL CAPS or all lowercase into clean Title Case
 */
function normalizeName(rawName: string): string {
  let name = rawName.trim();
  
  // 1. Remove prefixes
  name = name.replace(NAME_PREFIXES, "");

  // 2. Handle camelCase names (e.g. mitaliKumkar -> mitali Kumkar)
  name = name.replace(/([a-z])([A-Z])/g, "$1 $2");

  // 3. Normalize separation characters
  name = name.replace(/[_\-\.\s%20]+/g, " ");

  // 4. Title Case normalization
  const words = name.split(/\s+/).filter(Boolean);
  const titleCased = words.map(w => {
    // If the word was ALL CAPS or all lowercase, title-case it.
    // Otherwise preserve mixed casing (e.g. McDonald, O'Connor)
    if (w === w.toUpperCase() || w === w.toLowerCase()) {
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    }
    return w;
  });

  return titleCased.join(" ").trim();
}

/**
 * Validates whether a candidate string looks like a plausible human name.
 * Returns a boolean and a validation penalty (0.0 to 1.0)
 */
function validateNameHeuristics(name: string): { isValid: boolean; scoreBoost: number } {
  const words = name.split(/\s+/);
  
  // Rule 1: Human names typically contain between 2 and 4 words
  if (words.length < 2 || words.length > 4) {
    return { isValid: false, scoreBoost: 0 };
  }

  // Rule 2: Names should be between 3 and 40 characters
  if (name.length < 3 || name.length > 40) {
    return { isValid: false, scoreBoost: 0 };
  }

  // Rule 3: Names shouldn't contain numbers or typical email/web symbols
  if (/[0-9@#\$\%&\*\(\)\+=\{\}\[\]\|\\:;"'<>,\?/]/.test(name)) {
    return { isValid: false, scoreBoost: 0 };
  }

  // Rule 4: Reject if any word matches a common junk keyword
  for (const w of words) {
    const cleanWord = w.toLowerCase().replace(/[^a-z]/g, "");
    if (JUNK_KEYWORDS.has(cleanWord)) {
      return { isValid: false, scoreBoost: 0 };
    }
  }

  let scoreBoost = 0.5; // Base valid name multiplier

  // Bonus for Title Case capitalization
  const isTitleCased = words.every(w => /^[A-Z][a-zA-Z'\-]*\.?$/.test(w));
  if (isTitleCased) {
    scoreBoost += 0.25;
  }

  return { isValid: true, scoreBoost };
}

/**
 * Scans top portion of resume text for Title-cased name blocks (Custom NLP/NER heuristics).
 */
function extractNLPPersonName(text: string): string {
  // Grab the first 500 characters of the document (where the header/name usually sits)
  const headerText = text.slice(0, 500);
  const lines = headerText.split("\n").map(l => l.trim()).filter(Boolean);

  const TITLE_STOP_WORDS = /\b(executive|manager|developer|designer|editor|marketer|cameraman|consultant|engineer|intern|resume|cv|profile|page|curriculum|vitae|specialist|analyst|lead|director|architect|builder|associate|student|graduate|fresher|professional)\b/i;

  for (const line of lines.slice(0, 6)) {
    if (TITLE_STOP_WORDS.test(line)) continue;
    
    // Check if the line is 2-3 words, all capitalized, containing only letters/spaces
    const words = line.split(/\s+/);
    if (words.length >= 2 && words.length <= 3 
        && words.every(w => /^[A-Z][a-zA-Z'\-]*\.?$/.test(w))
        && !/[0-9]/.test(line)) {
      return line;
    }
  }

  // Fallback: title-case search anywhere in first 350 chars
  const matches = Array.from(headerText.slice(0, 350).matchAll(/\b([A-Z][a-z]{1,15}\s+[A-Z][a-z]{1,15}(?:\s+[A-Z][a-z]{1,15})?)\b/g));
  for (const match of matches) {
    const n = match[1].trim();
    const { isValid } = validateNameHeuristics(n);
    if (isValid && !TITLE_STOP_WORDS.test(n)) {
      return n;
    }
  }

  return "";
}

/**
 * Extracts candidate name from PDF Page 1 heading metadata using font size and Y coordinates.
 */
function extractHeadingName(firstPageLines: PDFTextLine[]): string {
  if (firstPageLines.length === 0) return "";

  // Filter out invalid/junk lines first
  const validHeadings = firstPageLines.filter(line => {
    const normalized = normalizeName(line.text);
    const { isValid } = validateNameHeuristics(normalized);
    return isValid;
  });

  if (validHeadings.length === 0) return "";

  // Sort by font size descending, and then by Y coordinate descending (top of page first)
  const sorted = [...validHeadings].sort((a, b) => {
    if (Math.abs(a.fontSize - b.fontSize) > 1.5) {
      return b.fontSize - a.fontSize;
    }
    return b.y - a.y; // Higher Y coordinate is topmost
  });

  return normalizeName(sorted[0].text);
}

/**
 * Extracts and cleans a display name from an email sender string (e.g. "Mitali Kumkar <mitalikumkar110@gmail.com>")
 */
function extractEmailSenderName(sender?: string): string {
  if (!sender) return "";

  // Match "Name" <email> or Name <email>
  const match = sender.match(/^(?:"?([^"<]+)"?\s*)?<[^>]+>/) || sender.match(/^([^<]+)/);
  if (match && match[1]) {
    const cleaned = normalizeName(match[1]);
    const { isValid } = validateNameHeuristics(cleaned);
    if (isValid) return cleaned;
  }
  return "";
}

/**
 * Cleans resume filename to extract candidate name (stripping UUIDs, job titles, extensions)
 */
function extractFilenameName(filename: string): string {
  let cleanFn = filename.replace(/\.(pdf|PDF|docx|DOCX)$/, "");
  
  // Strip UUID prefix (30+ characters hex with dashes)
  cleanFn = cleanFn.replace(/^[a-f0-9\-]{25,}\-?/i, "");
  
  // Clean separators
  const cleaned = normalizeName(cleanFn);
  const words = cleaned.split(/\s+/);
  
  // Filter out any job title tokens or junk words
  const nameParts = words.filter(w => {
    const lowerWord = w.toLowerCase().replace(/[^a-z]/g, "");
    return !JUNK_KEYWORDS.has(lowerWord);
  });

  if (nameParts.length >= 2 && nameParts.length <= 4) {
    const finalCandidate = nameParts.join(" ");
    const { isValid } = validateNameHeuristics(finalCandidate);
    if (isValid) return finalCandidate;
  }

  return "";
}

/**
 * Parses email subject line to extract name
 */
function extractEmailSubjectName(subject?: string): string {
  if (!subject) return "";

  const lowerSubject = subject.toLowerCase();
  
  // Typical patterns: "Resume of Mitali Kumkar", "Application from Rohan Patil for..."
  const patterns = [
    /\bresume\s+of\s+([a-z\s]+?)(?:\bfor\b|\b\-|\b$)/i,
    /\bcv\s+of\s+([a-z\s]+?)(?:\bfor\b|\b\-|\b$)/i,
    /\bapplication\s+from\s+([a-z\s]+?)(?:\bfor\b|\b\-|\b$)/i,
    /\bapplication\s+by\s+([a-z\s]+?)(?:\bfor\b|\b\-|\b$)/i
  ];

  for (const pattern of patterns) {
    const match = subject.match(pattern);
    if (match && match[1]) {
      const cleaned = normalizeName(match[1]);
      const { isValid } = validateNameHeuristics(cleaned);
      if (isValid) return cleaned;
    }
  }

  return "";
}

/**
 * Extracts signature name from the bottom 15% of the resume text
 */
function extractSignatureName(text: string): string {
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
  const signatureStarters = /^(best\s+regards|warm\s+regards|sincerely|thanks\s+&\s+regards|thanks|yours\s+faithfully|regards|thank\s+you),?\s*$/i;

  const totalLines = lines.length;
  // Look only at the bottom 25% of the lines
  const startIndex = Math.max(0, Math.floor(totalLines * 0.7));

  for (let i = startIndex; i < totalLines - 1; i++) {
    if (signatureStarters.test(lines[i])) {
      // The name should follow in the next 1-2 lines
      for (let j = 1; j <= 2; j++) {
        if (i + j < totalLines) {
          const candidate = normalizeName(lines[i + j]);
          const { isValid } = validateNameHeuristics(candidate);
          if (isValid) return candidate;
        }
      }
    }
  }

  return "";
}

/**
 * Parses social/LinkedIn profiles inside the text to extract name from url slug
 */
function extractLinkedInURLName(text: string): string {
  // LinkedIn profile URL matcher
  const linkedinMatch = text.match(/linkedin\.com\/in\/([a-zA-Z0-9\-_%]+)/i);
  if (linkedinMatch && linkedinMatch[1]) {
    const slug = linkedinMatch[1].replace(/%20/g, " ");
    const cleaned = normalizeName(slug.replace(/[\-_]+/g, " "));
    const { isValid } = validateNameHeuristics(cleaned);
    if (isValid) return cleaned;
  }
  return "";
}

/**
 * Helper to extract email addresses
 */
function extractEmail(text: string): string {
  return text.match(/[\w.+\-]+@[\w\-]+\.[a-z]{2,6}/i)?.[0] ?? "";
}

/**
 * Helper to extract Indian/general phone numbers
 */
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
  const lower = text.toLowerCase();
  const fresher = /\b(fresher|fresh graduate|entry level|no experience|0\s*years?\s*experience)\b/i.test(lower);
  if (fresher) return "Fresher";

  const labelRegexes = [
    /\b(?:total\s+)?experience\s*[:\-]?\s*(\d+(?:\.\d+)?)\+?\s*(?:year|yr)s?/i,
    /\bwork\s+experience\s*[:\-]?\s*(\d+(?:\.\d+)?)\+?\s*(?:year|yr)s?/i,
    /\b(?:total\s+)?exp\s*[:\-]?\s*(\d+(?:\.\d+)?)\+?\s*(?:year|yr)s?/i
  ];

  for (const regex of labelRegexes) {
    const match = lower.match(regex);
    if (match) {
      const yrs = Math.round(parseFloat(match[1]));
      if (yrs === 0) return "Fresher";
      if (yrs === 1) return "1 yr";
      if (yrs >= 5) return "5+ yrs";
      if (yrs === 2) return "2 yrs";
      if (yrs === 3 || yrs === 4) return "3 yrs";
      return `${yrs} yrs`;
    }
  }

  const valueFirstRegexes = [
    /(\d+(?:\.\d+)?)\+?\s*(?:year|yr)s?\s*(?:of\s*)?(?:experience|exp|work\s+exp)/i,
    /(\d+(?:\.\d+)?)\+?\s*(?:year|yr)s?\s+(?:professional|relevant|industry)\s+experience/i
  ];

  for (const regex of valueFirstRegexes) {
    const match = lower.match(regex);
    if (match) {
      const yrs = Math.round(parseFloat(match[1]));
      if (yrs === 0) return "Fresher";
      if (yrs === 1) return "1 yr";
      if (yrs >= 5) return "5+ yrs";
      if (yrs === 2) return "2 yrs";
      if (yrs === 3 || yrs === 4) return "3 yrs";
      return `${yrs} yrs`;
    }
  }

  const standaloneMatch = lower.match(/\b(\d+(?:\.\d+)?)\+?\s*(?:year|yr)s?\b/i);
  if (standaloneMatch) {
    const yrs = Math.round(parseFloat(standaloneMatch[1]));
    if (yrs >= 1 && yrs <= 35) {
      if (yrs === 1) return "1 yr";
      if (yrs >= 5) return "5+ yrs";
      if (yrs === 2) return "2 yrs";
      if (yrs === 3 || yrs === 4) return "3 yrs";
      return `${yrs} yrs`;
    }
  }

  return "Not specified";
}

function extractGender(text: string, name: string): string {
  const lowerText = text.toLowerCase();
  
  const explicitMatch = lowerText.match(/\b(?:gender|sex)\s*[:\-]\s*(female|male|f|m)\b/i);
  if (explicitMatch) {
    const g = explicitMatch[1].toLowerCase();
    if (g === "female" || g === "f") return "Female";
    if (g === "male" || g === "m") return "Male";
  }

  const sheCount = (lowerText.match(/\b(she|her|hers)\b/g) || []).length;
  const heCount = (lowerText.match(/\b(he|him|his)\b/g) || []).length;
  if (sheCount > heCount + 2) return "Female";
  if (heCount > sheCount + 2) return "Male";

  if (name) {
    const firstName = name.split(/\s+/)[0].toLowerCase();
    const femaleNames = ["priya","sneha","neha","ananya","pooja","riya","meera","shruti","zara","tanya","ayesha","simran","deepika","mitali","aditi","kavya","anushka","snehal","swati","sakshi","shreya","rashi","kirti","tripti","divya","kajal","isha","ekta","sheetal","rashmi","poornima","preeti","sonia","monika","payal"];
    const maleNames = ["aarav","rohit","arjun","vikram","raj","dev","ishaan","siddharth","aditya","manish","omar","nikhil","dhruv","ratan","vivek","amit","abhishek","rahul","sachin","saurabh","gaurav","pankaj","sanjay","anil","sunil","vijay","raju","ram","shyam","harsh","aman","kunal","yash"];
    
    if (femaleNames.includes(firstName)) return "Female";
    if (maleNames.includes(firstName)) return "Male";
    
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
    if (val > 1950 && val < 2010) return new Date().getFullYear() - val;
    if (val >= 18 && val <= 65) return val;
  }
  return Math.floor(Math.random() * 10) + 22;
}

function extractSkills(text: string, roleId: string): string[] {
  const lower = text.toLowerCase();
  const rolePool = SKILLS_POOL[roleId] ?? [];
  const foundRoleSkills = rolePool.filter(skill => {
    const escaped = skill.toLowerCase().replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    return new RegExp(`\\b${escaped}\\b`, 'i').test(lower) || lower.includes(skill.toLowerCase());
  });

  const globalPool = [
    "React", "Node.js", "JavaScript", "TypeScript", "Python", "Flutter", "Next.js", "MongoDB", "SQL", "AWS", "Docker", "Git", "REST APIs", "GraphQL", "CSS", "HTML",
    "Figma", "Adobe XD", "Illustrator", "Photoshop", "Canva", "Branding", "Typography", "UI/UX", "Premiere Pro", "After Effects", "DaVinci Resolve", "Motion Graphics", "Color Grading",
    "SEO", "SEM", "Google Ads", "Meta Ads", "Analytics", "Email Marketing", "HubSpot", "Instagram", "TikTok", "Content Creation", "Reels", "Sales", "CRM", "B2B Sales", "Lead Generation",
    "Negotiation", "Salesforce", "Cold Calling", "ROAS", "PPC", "A/B Testing", "Conversion Optimization", "Copywriting", "Content Strategy", "Storytelling", "Brand Voice", "Editorial",
    "Commercial", "Runway", "Fashion", "Cinematography", "DSLR", "Lighting", "Video Production", "Drone", "Stabilizer", "Camera", "WordPress", "Shopify", "Excel", "PowerPoint", "Word", "Office"
  ];
  
  const foundGlobalSkills = globalPool.filter(skill => {
    if (foundRoleSkills.includes(skill)) return false;
    const escaped = skill.toLowerCase().replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    return new RegExp(`\\b${escaped}\\b`, 'i').test(lower) || lower.includes(skill.toLowerCase());
  });

  const sectionSkills: string[] = [];
  const skillSectionMatch = text.match(/\b(?:skills|expertise|key\s+skills|technical\s+skills)\b[:\-]?\s*([^\n\r]{5,200})/i);
  if (skillSectionMatch) {
    const rawList = skillSectionMatch[1];
    const items = rawList.split(/[,;|\/•\t]+/).map(i => i.trim()).filter(i => i.length > 1 && i.length < 25);
    for (const item of items) {
      const formattedItem = item.charAt(0).toUpperCase() + item.slice(1);
      if (!foundRoleSkills.includes(formattedItem) && !foundGlobalSkills.includes(formattedItem)) {
        sectionSkills.push(formattedItem);
      }
    }
  }

  const combined = [...foundRoleSkills, ...foundGlobalSkills, ...sectionSkills];
  const unique = Array.from(new Set(combined));

  if (unique.length > 0) {
    return unique.slice(0, 10);
  }
  return rolePool.slice(0, 5);
}

/**
 * Entry point for parsing resumes. Implements the robust name extraction,
 * scoring, dynamic OCR, and confidence pipeline.
 */
export async function parseResumeFile(
  file: File,
  roles: Role[],
  emailSender?: string,
  emailSubject?: string
): Promise<Candidate> {
  
  console.log(`[HireDesk Parser] Beginning multi-source parsing for: ${file.name}`);

  // 1. Text & layout extraction from PDF
  const parseResult = await extractTextAndMetaFromPDF(file);
  const text = parseResult.text;
  const firstPageLines = parseResult.firstPageLines;
  const ocrUsed = parseResult.ocrUsed;

  // 2. Detect matching role & ATS scoring
  const roleId = detectBestRole(text, roles);
  const role = roles.find(r => r.id === roleId) ?? roles[0];
  const score = scoreCandidateFromText(text, roleId);

  // 3. Multi-source name extraction pipeline
  const nlpName = extractNLPPersonName(text);
  const headingName = extractHeadingName(firstPageLines);
  const senderName = extractEmailSenderName(emailSender);
  const filenameName = extractFilenameName(file.name);
  const subjectName = extractEmailSubjectName(emailSubject);
  const signatureName = extractSignatureName(text);
  const linkedinName = extractLinkedInURLName(text);

  // Compile all sources for the resolver
  const candidatesList = [
    { source: "Explicit NLP/NER", name: nlpName, baseConfidence: 0.95 },
    { source: "PDF Large Heading", name: headingName, baseConfidence: 0.90 },
    { source: "Email Sender Display", name: senderName, baseConfidence: 0.85 },
    { source: "LinkedIn Profile URL", name: linkedinName, baseConfidence: 0.75 },
    { source: "Bottom Signature Block", name: signatureName, baseConfidence: 0.70 },
    { source: "Cleaned Resume Filename", name: filenameName, baseConfidence: 0.65 },
    { source: "Email Subject Parsing", name: subjectName, baseConfidence: 0.60 }
  ];

  // Score each candidate name with name heuristics
  const evaluatedCandidates = candidatesList
    .filter(c => c.name.trim().length > 0)
    .map(c => {
      const normalized = normalizeName(c.name);
      const { isValid, scoreBoost } = validateNameHeuristics(normalized);
      
      // Calculate final confidence score
      let finalConfidence = 0;
      if (isValid) {
        finalConfidence = c.baseConfidence * scoreBoost;
      }
      
      return {
        source: c.source,
        name: normalized,
        confidence: Math.round(Math.min(100, finalConfidence * 100))
      };
    });

  // Sort candidates by final confidence score
  const sortedCandidates = [...evaluatedCandidates].sort((a, b) => b.confidence - a.confidence);

  // Choose the best name or fallback
  let finalName = "";
  let finalSource = "Fallback Filename Extraction";
  let finalConfidence = 30;

  if (sortedCandidates.length > 0 && sortedCandidates[0].confidence >= 40) {
    finalName = sortedCandidates[0].name;
    finalSource = sortedCandidates[0].source;
    finalConfidence = sortedCandidates[0].confidence;
  } else {
    // Ultimate fallback if no candidate reaches confidence threshold
    const cleanFn = file.name.replace(/\.(pdf|PDF|docx|DOCX)$/, "").replace(/[_\-\.]/g, " ").trim();
    finalName = normalizeName(cleanFn) || `Candidate (${file.name})`;
    finalSource = "Cleaned Filename Fallback";
    finalConfidence = 40;
  }

  console.log(`[HireDesk Parser] Name extraction completed: "${finalName}" via ${finalSource} (${finalConfidence}% Confidence)`);
  if (ocrUsed) {
    console.log("[HireDesk Parser] Dynamic OCR was used for text extraction.");
  }

  // Extract other metadata
  const email = extractEmail(text);
  const phone = extractPhone(text);
  const city = extractCity(text);
  const education = extractEducation(text);
  const exp = extractExperience(text);
  const gender = extractGender(text, finalName);
  const age = extractAge(text);
  const skills = extractSkills(text, roleId);

  // Construct final Candidate object
  return makeCandidate(roleId, {
    name: finalName,
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
    extractionSource: finalSource,
    extractionConfidence: finalConfidence,
    extractionMetadata: {
      sourceRankings: sortedCandidates,
      ocrUsed
    }
  });
}

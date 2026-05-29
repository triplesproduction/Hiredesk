// Production overhaul verification test suite
console.log("=== Hiredesk Name Extractor Pipeline Production Overhaul Tests ===");

const COMMON_FIRSTNAMES = new Set([
  "sunita", "amit", "rohan", "mitali", "priya", "sneha", "neha", "ananya", "pooja", "riya", "meera",
  "shruti", "zara", "tanya", "ayesha", "simran", "deepika", "aditi", "kavya", "anushka", "rahul",
  "rohit", "arjun", "vikram", "raj", "dev", "ishaan", "siddharth", "aditya", "manish", "nikhil",
  "dhruv", "vivek", "abhishek", "saurabh", "gaurav", "kunal", "yash", "ajay", "vijay", "sunil",
  "anil", "sanjay", "aarav", "ram", "shyam", "harsh", "aman"
]);

const COMMON_LASTNAMES = new Set([
  "madake", "kumar", "sharma", "patel", "singh", "gupta", "verma", "mehta", "shah", "joshi",
  "nair", "iyer", "reddy", "bose", "khanna", "malhotra", "kapoor", "desai", "pillai", "rao",
  "agarwal", "kumkar"
]);

const JUNK_KEYWORDS = new Set([
  "resume", "cv", "curriculum", "vitae", "profile", "portfolio", "page", "developer", "engineer",
  "designer", "manager", "executive", "intern", "cameraman", "consultant", "specialist", "analyst",
  "lead", "director", "architect", "builder", "associate", "student", "graduate", "fresher",
  "professional", "hiredesk", "copy", "final", "latest", "updated", "work", "experience", "education",
  "skills", "summary", "contact", "phone", "email", "address", "about", "me", "hobbies", "languages",
  "references", "project", "projects", "key", "technical", "personal", "microsoft", "word", "pdf"
]);

const NAME_PREFIXES = /^(mr|ms|mrs|dr|prof|sir|er)\.?\s+/i;

function splitMergedName(word) {
  if (!word || word.length < 3) return word;
  let split = word.replace(/([a-z])([A-Z])/g, "$1 $2");
  split = split.replace(/([A-Z]+)([A-Z][a-z]+)/g, "$1 $2");
  if (split !== word) return split;

  const lower = word.toLowerCase();
  for (let i = 3; i < lower.length - 2; i++) {
    const part1 = lower.slice(0, i);
    const part2 = lower.slice(i);
    if (COMMON_FIRSTNAMES.has(part1) && (COMMON_LASTNAMES.has(part2) || COMMON_FIRSTNAMES.has(part2))) {
      const p1Cap = part1.charAt(0).toUpperCase() + part1.slice(1);
      const p2Cap = part2.charAt(0).toUpperCase() + part2.slice(1);
      return `${p1Cap} ${p2Cap}`;
    }
  }
  return word;
}

function normalizeCandidateName(rawName) {
  let name = rawName.trim().replace(NAME_PREFIXES, "");
  name = name.replace(/[_\/\\%20]+/g, " ").replace(/\s+/g, " ").trim();
  const words = name.split(/\s+/).filter(Boolean);
  const processedWords = words.map(w => splitMergedName(w));
  const finalWords = processedWords.join(" ").trim().split(/\s+/).filter(Boolean);
  
  const titleCased = finalWords.map(w => {
    if (w.includes("-")) {
      return w.split("-").map(sub => sub.charAt(0).toUpperCase() + sub.slice(1).toLowerCase()).join("-");
    }
    if (w.includes(".") && w.length <= 4) return w.toUpperCase();
    if (w.length === 1) return w.toUpperCase();
    // Preserve short all-caps words (2-4 characters) representing acronym initials
    if (w === w.toUpperCase() && w.length >= 2 && w.length <= 4) {
      return w;
    }
    if (w === w.toUpperCase() || w === w.toLowerCase()) {
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    }
    return w;
  });
  return titleCased.join(" ").trim();
}

function scoreAndValidateName(name) {
  const words = name.split(/\s+/).filter(Boolean);
  if (words.length < 1 || words.length > 6) return { isValid: false, reason: `Word count: ${words.length}` };
  if (name.length < 3 || name.length > 50) return { isValid: false, reason: `Char count: ${name.length}` };
  if (/[0-9]/.test(name)) return { isValid: false, reason: "Contains digit" };
  if (/[@#\$\%&\*\(\)\+=\{\}\[\]\|\\:;"'<>,\?/]/.test(name)) return { isValid: false, reason: "Contains symbol" };
  for (const w of words) {
    const cleanWord = w.toLowerCase().replace(/[^a-z]/g, "");
    if (JUNK_KEYWORDS.has(cleanWord)) return { isValid: false, reason: `Junk word: ${cleanWord}` };
  }
  return { isValid: true };
}

// 2. Production Overhaul Test Cases
const overhaulTestCases = [
  {
    name: "Merged lowercase name (Dictionary split case)",
    input: "SunitaMadake",
    expected: "Sunita Madake"
  },
  {
    name: "CamelCase Split (Standard transition)",
    input: "AmitKumarSharma",
    expected: "Amit Kumar Sharma"
  },
  {
    name: "ALL CAPS Split with mixed case tail",
    input: "ROHANSharma",
    expected: "Rohan Sharma"
  },
  {
    name: "1-Word initialed standard name",
    input: "A R Rahman",
    expected: "A R Rahman"
  },
  {
    name: "Salutation removal + 4 word name",
    input: "Dr APJ Abdul Kalam",
    expected: "APJ Abdul Kalam"
  },
  {
    name: "Hyphenated international name",
    input: "Jean-Pierre",
    expected: "Jean-Pierre"
  },
  {
    name: "Initials prefix and standard split",
    input: "Md Arif",
    expected: "Md Arif"
  }
];

function runSuite() {
  let passed = 0;
  overhaulTestCases.forEach((tc, idx) => {
    console.log(`\nTest ${idx+1}: ${tc.name}`);
    console.log(`- Input: "${tc.input}"`);
    
    // Run normalizer (Extract -> Normalize)
    const normalized = normalizeCandidateName(tc.input);
    
    // Validate (Score -> Validate)
    const validation = scoreAndValidateName(normalized);
    
    console.log(`- Normalized Output: "${normalized}"`);
    console.log(`- Validation status:`, validation.isValid ? "🟢 VALID" : `🔴 INVALID: ${validation.reason}`);
    
    if (normalized.toLowerCase() === tc.expected.toLowerCase() && validation.isValid) {
      console.log("🟢 PASS");
      passed++;
    } else {
      console.log(`🔴 FAIL (Expected: "${tc.expected}")`);
    }
  });

  console.log(`\n=== Overhaul Verification Results: ${passed}/${overhaulTestCases.length} Passed ===`);
  return passed === overhaulTestCases.length;
}

runSuite();

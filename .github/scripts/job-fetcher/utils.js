const fs = require("fs");
const path = require("path");

// Load company database
const companies = JSON.parse(
  fs.readFileSync(path.join(__dirname, "companies.json"), "utf8")
);

// Flatten all companies for easy access
const ALL_COMPANIES = Object.values(companies).flat();
const COMPANY_BY_NAME = {};
ALL_COMPANIES.forEach((company) => {
  COMPANY_BY_NAME[company.name.toLowerCase()] = company;
  // Add safety check for api_names
  if (company.api_names && Array.isArray(company.api_names)) {
    company.api_names.forEach((name) => {
      COMPANY_BY_NAME[name.toLowerCase()] = company;
    });
  }
});

/**
 * Utility functions for job processing
 */

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Generate a standardized job ID for consistent deduplication across systems
 * This ensures the same job gets the same ID in both the scraper and Discord posting
 */
function generateJobId(job) {
  const title = (job.job_title || "").toLowerCase().trim().replace(/\s+/g, "-");
  const company = (job.employer_name || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-");
  const city = (job.job_city || "").toLowerCase().trim().replace(/\s+/g, "-");

  // Remove special characters and normalize
  const normalize = (str) =>
    str
      .replace(/[^\w-]/g, "-") // Replace special chars with dashes
      .replace(/-+/g, "-") // Collapse multiple dashes
      .replace(/^-|-$/g, ""); // Remove leading/trailing dashes

  return `${normalize(company)}-${normalize(title)}-${normalize(city)}`;
}

/**
 * Convert old job ID format to new standardized format
 * This helps with migration from the old inconsistent ID system
 */
function migrateOldJobId(oldId) {
  // Old format was: company-title-city with inconsistent normalization
  // We can't perfectly reverse it, but we can normalize what we have
  const normalized = oldId
    .replace(/[^\w-]/g, "-") // Replace special chars with dashes
    .replace(/-+/g, "-") // Collapse multiple dashes
    .replace(/^-|-$/g, ""); // Remove leading/trailing dashes

  return normalized;
}

function normalizeCompanyName(companyName) {
  const company = COMPANY_BY_NAME[companyName.toLowerCase()];
  return company ? company.name : companyName;
}

function getCompanyEmoji(companyName) {
  const company = COMPANY_BY_NAME[companyName.toLowerCase()];
  return company ? company.emoji : "🏢";
}

function getCompanyCareerUrl(companyName) {
  const company = COMPANY_BY_NAME[companyName.toLowerCase()];
  return company ? company.career_url : "#";
}

function isJobOlderThanWeek(dateString) {
  if (!dateString) return false;

  // Check if the date is in relative format (e.g., '1d', '2w')
  const relativeMatch = dateString.match(/^(\d+)([hdwmo])$/i);
  if (relativeMatch) {
    const value = parseInt(relativeMatch[1]);
    const unit = relativeMatch[2].toLowerCase();

    if (unit === 'd' && value >= 7) return true; // 7 or more days
    if (unit === 'w') return true; // Any number of weeks is older than a week
    if (unit === 'mo') return true; // Any number of months is older than a week
    return false; // Hours ('h') or less than 7 days ('d') are not older than a week
  }

  // Fallback to absolute date comparison
  const date = new Date(dateString);
  const now = new Date();
  const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

  return diffInDays >= 7;
}

/**
 * Filter out internships and non-software engineering jobs
 * @param {Array} jobs - Array of job objects
 * @returns {Array} - Filtered array of software engineering jobs (excluding internships)
 */
function filterSoftwareEngineeringJobs(jobs) {
  console.log(`🔍 Starting job title filtering for ${jobs.length} jobs...`);
  
  // Keywords that indicate INTERNSHIP positions (to EXCLUDE)
  const internshipKeywords = [
    'intern', 'internship', 'co-op', 'coop', 'co op',
    'summer program', 'training program', 'rotational program',
    'student position', 'student program', 'campus hire'
  ];
  
  // Keywords that indicate NON-SOFTWARE ENGINEERING roles (to EXCLUDE)
  const nonSoftwareKeywords = [
    // Data Science & Analytics
    'data scientist', 'data science', 'data analyst', 'data analytics',
    'business analyst', 'business intelligence', 'bi analyst',
    'machine learning engineer', 'ml engineer', 'ai engineer',
    'research scientist', 'applied scientist', 'quantitative analyst',
    
    // Hardware & Electrical Engineering
    'hardware engineer', 'hardware', 'electrical engineer', 'electronics engineer',
    'circuit design', 'pcb design', 'fpga', 'asic', 'vlsi',
    'embedded hardware', 'rf engineer', 'antenna engineer',
    'power engineer', 'signal processing', 'analog design', 'digital design',
    
    // Testing & QA (Non-Development)
    'test engineer', 'testing engineer', 'qa tester',
    'validation engineer', 'verification engineer', 'test technician',
    'quality control', 'qc engineer', 'test analyst',
    
    // Technicians & Lab Roles
    'technician', 'lab technician', 'laboratory technician',
    'it technician', 'support technician', 'field technician',
    'service technician', 'maintenance technician', 'repair technician',
    
    // Manufacturing & Operations
    'manufacturing engineer', 'production engineer', 'process engineer',
    'industrial engineer', 'operations engineer', 'plant engineer',
    'facilities engineer', 'equipment engineer', 'assembly engineer',
    
    // Mechanical & Materials
    'mechanical engineer', 'materials engineer', 'metallurgical',
    'structural engineer', 'civil engineer', 'aerospace engineer',
    
    // Product & Design (Non-Technical)
    'product manager', 'product owner', 'program manager', 'project manager',
    'product designer', 'ux designer', 'ui designer', 'graphic designer',
    
    // Systems & Network (Infrastructure focused)
    'network engineer', 'systems administrator', 'sysadmin',
    'network administrator', 'it administrator', 'infrastructure engineer',
    
    // Sales & Support
    'sales engineer', 'solutions engineer', 'technical sales',
    'customer success engineer', 'support engineer', 'help desk',
    
    // Other Technical But Non-Software
    'biomedical engineer', 'chemical engineer', 'environmental engineer',
    'safety engineer', 'reliability engineer', 'compliance engineer'
  ];
  
  // Keywords that CONFIRM software engineering roles (to INCLUDE)
  const softwareKeywords = [
    'software engineer', 'software developer', 'software development',
    'backend engineer', 'backend developer', 'back-end',
    'frontend engineer', 'frontend developer', 'front-end',
    'full stack', 'fullstack', 'full-stack',
    'web developer', 'web engineer', 'mobile developer', 'mobile engineer',
    'application developer', 'application engineer', 'app developer',
    'cloud engineer', 'devops engineer', 'sre', 'site reliability',
    'platform engineer', 'infrastructure software', 'systems software',
    'embedded software', 'firmware engineer', 'firmware developer',
    'game developer', 'game engineer', 'graphics programmer',
    'security engineer', 'cybersecurity engineer', 'software security',
    'compiler engineer', 'distributed systems', 'microservices',
    'api developer', 'integration engineer', 'middleware developer'
  ];
  
  function isInternship(title) {
    if (!title) return false;
    const lowerTitle = title.toLowerCase().trim();
    
    for (const keyword of internshipKeywords) {
      if (lowerTitle.includes(keyword.toLowerCase())) {
        return true;
      }
    }
    return false;
  }
  
  function isSoftwareEngineering(title) {
    if (!title) return false;
    const lowerTitle = title.toLowerCase().trim();
    
    // Check if it explicitly contains software engineering keywords
    const hasSoftwareKeyword = softwareKeywords.some(keyword => 
      lowerTitle.includes(keyword.toLowerCase())
    );
    
    if (hasSoftwareKeyword) {
      // Double-check it's not also a non-software role
      const hasNonSoftwareKeyword = nonSoftwareKeywords.some(keyword => 
        lowerTitle.includes(keyword.toLowerCase())
      );
      
      if (hasNonSoftwareKeyword) {
        // Special case: "Software Test Engineer" -> exclude
        const testRelated = ['test engineer', 'testing engineer', 'validation engineer', 'verification engineer'];
        if (testRelated.some(test => lowerTitle.includes(test))) {
          return false;
        }
      }
      
      return true;
    }
    
    // Check if it contains non-software keywords
    const hasNonSoftwareKeyword = nonSoftwareKeywords.some(keyword => 
      lowerTitle.includes(keyword.toLowerCase())
    );
    
    if (hasNonSoftwareKeyword) {
      return false;
    }
    
    // Check for generic "engineer" or "developer" titles
    const genericTechKeywords = ['engineer', 'developer', 'programmer', 'architect'];
    const hasGenericKeyword = genericTechKeywords.some(keyword => 
      lowerTitle.includes(keyword)
    );
    
    // Assume software engineering if generic tech keywords present
    return hasGenericKeyword;
  }
  
  const filteredJobs = [];
  const removedJobs = [];
  
  jobs.forEach((job, index) => {
    let shouldInclude = true;
    let reason = '';
    
    const title = job.job_title || '';
    
    console.log(`\n🔍 Job ${index + 1}/${jobs.length}: "${title}" at ${job.employer_name || 'Unknown'}`);
    
    if (isInternship(title)) {
      shouldInclude = false;
      reason = 'Internship position';
      console.log(`   ❌ EXCLUDED - ${reason}`);
      removedJobs.push({ ...job, removal_reason: reason });
    }
    else if (!isSoftwareEngineering(title)) {
      shouldInclude = false;
      reason = 'Non-software engineering role';
      console.log(`   ❌ EXCLUDED - ${reason}`);
      removedJobs.push({ ...job, removal_reason: reason });
    }
    else {
      console.log(`   ✅ INCLUDED - Software engineering role`);
      filteredJobs.push(job);
    }
  });
  
  console.log(`\n${'='.repeat(50)}`);
  console.log(`🎯 JOB TITLE FILTERING SUMMARY`);
  console.log(`${'='.repeat(50)}`);
  console.log(`📊 Original jobs: ${jobs.length}`);
  console.log(`✅ Software engineering jobs: ${filteredJobs.length} (${((filteredJobs.length/jobs.length)*100).toFixed(1)}%)`);
  console.log(`❌ Removed jobs: ${removedJobs.length} (${((removedJobs.length/jobs.length)*100).toFixed(1)}%)`);
  
  const internshipCount = removedJobs.filter(j => j.removal_reason === 'Internship position').length;
  const nonSoftwareCount = removedJobs.filter(j => j.removal_reason === 'Non-software engineering role').length;
  
  console.log(`\n📈 REMOVAL REASONS BREAKDOWN:`);
  console.log(`   • Internship positions: ${internshipCount} jobs (${((internshipCount/removedJobs.length)*100).toFixed(1)}%)`);
  console.log(`   • Non-software engineering roles: ${nonSoftwareCount} jobs (${((nonSoftwareCount/removedJobs.length)*100).toFixed(1)}%)`);
  console.log(`\n${'='.repeat(50)}`);
  
  return filteredJobs;
}

function filterJobsByLevel(jobs) {
  console.log(`🔍 Starting job level filtering for ${jobs.length} jobs...`);
  
  // Enhanced keywords that indicate senior/advanced level positions (to EXCLUDE)
  const seniorKeywords = [
    'senior', 'sr.', 'sr ', 'lead', 'principal', 'staff', 'architect', 
    'director', 'manager', 'head of', 'chief', 'vp', 'vice president',
    'expert', 'specialist', 'consultant', 'advanced', 'executive',
    'tech lead', 'technical lead', 'team lead', 'team leader',
    'supervisor', 'coordinator', 'program manager', 'project manager',
    'engineering manager', 'senior director', 'executive director', 
    'group leader', 'division head', 'department head', 'fellow', 
    'guru', 'master', 'senior specialist', 'principal consultant', 
    'distinguished', 'senior architect', 'lead architect', 'chief architect', 
    'senior scientist', 'strategy', 'strategic', 'portfolio manager', 
    'senior advisor', 'principal advisor', 'veteran', 'seasoned', 
    'senior consultant', 'lead consultant', 'senior lead'
  ];
  
  // Enhanced keywords that indicate entry/junior level positions (to INCLUDE)
  const juniorKeywords = [
    'junior', 'jr.', 'jr ', 'entry', 'entry-level', 'entry level',
    'graduate', 'new grad', 'new graduate', 'recent graduate', 
    'college graduate', 'university graduate', 'fresh graduate',
    'intern', 'internship', 'trainee', 'apprentice', 'rotational',
    'graduate program', 'training program', 'development program',
    'associate', 'fresh', 'beginner', 'starting', 'early career',
    'level 1', 'level i', 'grade 1', 'tier 1', '0-2 years'
  ];
  
  // Enhanced experience patterns to check in descriptions
  const experiencePatterns = [
    /(\d+)\s*[-+to]\s*(\d+)?\s*years?\s*(?:of\s*)?(?:experience|exp|work)/gi,
    /(?:minimum|min|at least|require[ds]?|need|must have)\s*(\d+)\s*years?\s*(?:of\s*)?(?:experience|exp)/gi,
    /(\d+)\s*\+\s*years?\s*(?:of\s*)?(?:experience|exp)/gi,
    /(\d+)\s*or\s*more\s*years?\s*(?:of\s*)?(?:experience|exp)/gi,
    /(?:with|having)\s*(\d+)\s*years?\s*(?:of\s*)?(?:experience|exp)/gi,
    /(\d+)\s*years?\s*(?:of\s*)?(?:professional|relevant|related)\s*(?:experience|exp)/gi,
    /(?:minimum|at least)\s*(\d+)\s*years?\s*in/gi,
    /(\d+)\s*years?\s*(?:background|history)/gi,
    /(?:experience|background|history|track record).*?(\d+)\s*years?/gi,
    /(?:skilled|experienced|seasoned|veteran).*?(\d+)\s*years?/gi,
    /(?:portfolio|work|projects).*?(\d+)\s*years?/gi,
    /(?:must|should|need|require).*?(\d+)\s*years?/gi,
  ];
  
  // Advanced education requirements (to EXCLUDE)
  const advancedEducation = [
    'phd', 'ph.d.', 'doctorate', 'doctoral', 'postgraduate required'
  ];

  function isSearchQueryDescription(description) {
    if (!description) return false;
    
    const searchQueryPattern = /\b\w+\s+job\s+for\s+the\s+role\s+\w+/i;
    const isSearchQuery = searchQueryPattern.test(description);
    
    if (isSearchQuery) {
      console.log(`   🔍 Detected search query format description - will ignore for experience filtering`);
    }
    
    return isSearchQuery;
  }

  function extractYearsFromDescription(description) {
    if (!description) return [];
    
    if (isSearchQueryDescription(description)) {
      console.log(`   ⚠️  Skipping experience extraction from search query format description`);
      return [];
    }
    
    const years = [];
    const lowerDesc = description.toLowerCase();
    
    const cleanDesc = lowerDesc.replace(/\s+/g, ' ').trim();
    
    console.log(`   🔍 Analyzing description for experience patterns...`);
    
    experiencePatterns.forEach((pattern, index) => {
      const matches = [...cleanDesc.matchAll(pattern)];
      matches.forEach(match => {
        if (match[1] && !isNaN(parseInt(match[1]))) {
          const year1 = parseInt(match[1]);
          years.push(year1);
          console.log(`   📊 Pattern ${index + 1} found: ${year1} years (from: "${match[0].trim()}")`);
        }
        
        if (match[2] && !isNaN(parseInt(match[2]))) {
          const year2 = parseInt(match[2]);
          years.push(year2);
          console.log(`   📊 Pattern ${index + 1} found: ${year2} years (from: "${match[0].trim()}")`);
        }
      });
    });
    
    const uniqueYears = [...new Set(years)].sort((a, b) => a - b);
    
    if (uniqueYears.length > 0) {
      console.log(`   📈 Total years extracted: [${uniqueYears.join(', ')}]`);
    } else {
      console.log(`   ℹ️  No experience requirements found in description`);
    }
    
    return uniqueYears;
  }

  function checkTitleLevel(title) {
    if (!title) return { level: 'unknown', matchedKeyword: '' };
    
    const lowerTitle = title.toLowerCase();
    
    for (const keyword of seniorKeywords) {
      if (lowerTitle.includes(keyword.toLowerCase())) {
        return { level: 'senior', matchedKeyword: keyword };
      }
    }
    
    for (const keyword of juniorKeywords) {
      if (lowerTitle.includes(keyword.toLowerCase())) {
        return { level: 'junior', matchedKeyword: keyword };
      }
    }
    
    return { level: 'unclear', matchedKeyword: '' };
  }

  function checkEducationRequirements(description) {
    if (!description) return { level: 'acceptable', matchedRequirement: '' };
    
    if (isSearchQueryDescription(description)) {
      console.log(`   📚 Skipping education requirement check for search query format description`);
      return { level: 'acceptable', matchedRequirement: 'search_query_format' };
    }
    
    const lowerDesc = description.toLowerCase();
    
    for (const edu of advancedEducation) {
      if (lowerDesc.includes(edu.toLowerCase())) {
        if (lowerDesc.includes('preferred') || lowerDesc.includes('nice to have') || 
            lowerDesc.includes('plus') || lowerDesc.includes('bonus') || 
            lowerDesc.includes('optional') || lowerDesc.includes('desired')) {
          continue;
        }
        return { level: 'too_advanced', matchedRequirement: edu };
      }
    }
    
    return { level: 'acceptable', matchedRequirement: '' };
  }

  const filteredJobs = [];
  const removedJobs = [];
  
  jobs.forEach((job, index) => {
    let shouldInclude = true;
    let reason = '';
    let category = '';
    
    const titleAnalysis = checkTitleLevel(job.job_title);
    const yearsRequired = extractYearsFromDescription(job.job_description);
    const educationAnalysis = checkEducationRequirements(job.job_description);
    const isSearchQueryFormat = isSearchQueryDescription(job.job_description);
    
    console.log(`\n🔍 Job ${index + 1}/${jobs.length}: "${job.job_title}" at ${job.employer_name}`);
    
    if (titleAnalysis.level === 'senior') {
      shouldInclude = false;
      reason = `Senior-level title detected`;
      category = `EXCLUDED - Title contains "${titleAnalysis.matchedKeyword}"`;
      console.log(`   ❌ STEP 1 - ${category}`);
    }
    else if (titleAnalysis.level === 'junior') {
      shouldInclude = true;
      reason = `Junior-level title confirmed`;
      category = `INCLUDED - Entry-level title contains "${titleAnalysis.matchedKeyword}"`;
      console.log(`   ✅ STEP 2 - ${category}`);
    }
    else {
      if (yearsRequired.length > 0) {
        const maxYears = Math.max(...yearsRequired);
        console.log(`   📊 STEP 3 - Experience required: ${yearsRequired.join(', ')} years (max: ${maxYears})`);
        
        if (maxYears >= 5) {
          shouldInclude = false;
          reason = `Requires ${maxYears}+ years experience`;
          category = `EXCLUDED - Too much experience required (${maxYears}+ years)`;
          console.log(`   ❌ STEP 3 - ${category}`);
        } else {
          shouldInclude = true;
          category = `INCLUDED - Acceptable experience requirement (${maxYears} years)`;
          console.log(`   ✅ STEP 3 - ${category}`);
        }
      }
      else {
        shouldInclude = true;
        if (isSearchQueryFormat) {
          category = `INCLUDED - Search query format, no filtering applied`;
          reason = `Search query generated description`;
        } else if (titleAnalysis.level === 'unclear') {
          category = `INCLUDED - Unclear level, no experience requirements (assuming entry-friendly)`;
          reason = `No clear barriers identified`;
        }
        console.log(`   ✅ STEP 4 - ${category}`);
      }
    }
    
    if (shouldInclude && educationAnalysis.level === 'too_advanced') {
      shouldInclude = false;
      reason = `Requires advanced degree (${educationAnalysis.matchedRequirement})`;
      category = `EXCLUDED - Advanced degree required: ${educationAnalysis.matchedRequirement}`;
      console.log(`   ❌ STEP 5 - Education: ${category}`);
    }
    
    if (shouldInclude) {
      console.log(`   ✅ FINAL DECISION: INCLUDED`);
      filteredJobs.push(job);
    } else {
      console.log(`   ❌ FINAL DECISION: EXCLUDED - ${reason}`);
      removedJobs.push({ ...job, removal_reason: reason, category: category });
    }
  });
  
  console.log(`\n${'='.repeat(50)}`);
  console.log(`🎯 JOB LEVEL FILTERING SUMMARY`);
  console.log(`${'='.repeat(50)}`);
  console.log(`📊 Original jobs: ${jobs.length}`);
  console.log(`✅ Suitable jobs (entry/mid-level): ${filteredJobs.length} (${((filteredJobs.length/jobs.length)*100).toFixed(1)}%)`);
  console.log(`❌ Removed jobs (senior/advanced): ${removedJobs.length} (${((removedJobs.length/jobs.length)*100).toFixed(1)}%)`);
  
  const removalReasons = {};
  removedJobs.forEach(job => {
    const reason = job.removal_reason;
    removalReasons[reason] = (removalReasons[reason] || 0) + 1;
  });
  
  console.log(`\n📈 REMOVAL REASONS BREAKDOWN:`);
  Object.entries(removalReasons).forEach(([reason, count]) => {
    const percentage = ((count / removedJobs.length) * 100).toFixed(1);
    console.log(`   • ${reason}: ${count} jobs (${percentage}%)`);
  });
  
  console.log(`\n${'='.repeat(50)}`);
  
  return filteredJobs;
}

function isUSOnlyJob(job) {
    const state = (job.job_state || '').toLowerCase().trim();
    const city = (job.job_city || '').toLowerCase().trim();
    
    const cleanCity = city.replace(/[,\s]+/g, ' ').trim();
    const cleanState = state.replace(/[,\s]+/g, ' ').trim();
    
    const nonUSCountries = [
        'estonia', 'canada', 'uk', 'united kingdom', 'great britain', 'britain',
        'germany', 'deutschland', 'france', 'netherlands', 'holland',
        'sweden', 'norway', 'denmark', 'finland', 'australia', 'india', 'singapore',
        'japan', 'south korea', 'korea', 'brazil', 'mexico', 'spain', 'italy', 'poland',
        'ireland', 'israel', 'switzerland', 'austria', 'belgium', 'czech republic',
        'russia', 'china', 'ukraine', 'serbia', 'romania', 'bulgaria', 'hungary',
        'portugal', 'greece', 'turkey', 'croatia', 'slovakia', 'slovenia', 'lithuania',
        'latvia', 'luxembourg', 'malta', 'cyprus', 'iceland', 'new zealand', 'thailand',
        'vietnam', 'philippines', 'indonesia', 'malaysia', 'taiwan', 'hong kong'
    ];
    
    if (nonUSCountries.some(nonUSCountry => cleanState.includes(nonUSCountry))) {
        return false;
    }
    
    const nonUSCities = [
        'toronto', 'vancouver', 'montreal', 'ottawa', 'calgary', 'edmonton',
        'london', 'manchester', 'birmingham', 'glasgow', 'liverpool', 'bristol',
        'berlin', 'munich', 'hamburg', 'cologne', 'frankfurt',
        'amsterdam', 'rotterdam', 'the hague',
        'stockholm', 'gothenburg', 'malmo',
        'copenhagen', 'aarhus', 'odense',
        'helsinki', 'espoo', 'tampere',
        'oslo', 'bergen', 'trondheim',
        'sydney', 'melbourne', 'brisbane', 'perth', 'adelaide',
        'bangalore', 'bengaluru', 'mumbai', 'bombay', 'delhi', 'new delhi',
        'hyderabad', 'pune', 'chennai', 'madras', 'kolkata', 'calcutta',
        'ahmedabad', 'jaipur', 'surat', 'lucknow', 'kanpur', 'nagpur',
        'singapore', 'tokyo', 'osaka', 'kyoto', 'yokohama', 'nagoya',
        'seoul', 'busan', 'incheon', 'daegu', 'daejeon',
        'tel aviv', 'jerusalem', 'haifa', 'beer sheva',
        'zurich', 'geneva', 'basel', 'bern',
        'dublin', 'cork', 'galway', 'limerick',
        'tallinn', 'tartu', 'riga', 'vilnius', 'kaunas',
        'prague', 'brno', 'ostrava', 'budapest', 'debrecen',
        'paris', 'marseille', 'lyon', 'toulouse', 'nice',
        'madrid', 'barcelona', 'valencia', 'seville', 'bilbao',
        'rome', 'milan', 'naples', 'turin', 'palermo',
        'warsaw', 'krakow', 'gdansk', 'wroclaw', 'poznan',
        'moscow', 'st petersburg', 'novosibirsk', 'yekaterinburg',
        'beijing', 'shanghai', 'guangzhou', 'shenzhen', 'chengdu',
        'kyiv', 'kiev', 'kharkiv', 'odesa', 'dnipro',
        'belgrade', 'novi sad', 'nis'
    ];
    
    if (nonUSCities.some(nonUSCity => cleanCity.includes(nonUSCity))) {
        return false;
    }
    
    if (cleanCity.includes('remote') && nonUSCountries.some(country => cleanCity.includes(country))) {
        return false;
    }
    
    if (cleanState.includes('remote') && nonUSCountries.some(country => cleanState.includes(country))) {
        return false;
    }
    
    const usCountryIndicators = [
        'us', 'usa', 'united states', 'united states of america', 'america'
    ];
    
    if (usCountryIndicators.some(indicator => cleanState.includes(indicator))) {
        return true;
    }
    
    const usStates = [
        'al', 'ak', 'az', 'ar', 'ca', 'co', 'ct', 'de', 'fl', 'ga', 'hi', 'id', 'il', 'in', 'ia',
        'ks', 'ky', 'la', 'me', 'md', 'ma', 'mi', 'mn', 'ms', 'mo', 'mt', 'ne', 'nv', 'nh', 'nj',
        'nm', 'ny', 'nc', 'nd', 'oh', 'ok', 'or', 'pa', 'ri', 'sc', 'sd', 'tn', 'tx', 'ut', 'vt',
        'va', 'wa', 'wv', 'wi', 'wy', 'dc',
        'alabama', 'alaska', 'arizona', 'arkansas', 'california', 'colorado', 'connecticut',
        'delaware', 'florida', 'georgia', 'hawaii', 'idaho', 'illinois', 'indiana', 'iowa',
        'kansas', 'kentucky', 'louisiana', 'maine', 'maryland', 'massachusetts', 'michigan',
        'minnesota', 'mississippi', 'missouri', 'montana', 'nebraska', 'nevada', 'new hampshire',
        'new jersey', 'new mexico', 'new york', 'north carolina', 'north dakota', 'ohio',
        'oklahoma', 'oregon', 'pennsylvania', 'rhode island', 'south carolina', 'south dakota',
        'tennessee', 'texas', 'utah', 'vermont', 'virginia', 'washington', 'west virginia',
        'wisconsin', 'wyoming', 'district of columbia'
    ];
    
    if (usStates.some(usState => cleanState === usState || cleanState.includes(usState))) {
        return true;
    }
    
    const majorUSCities = [
        'new york', 'los angeles', 'chicago', 'houston', 'phoenix', 'philadelphia',
        'san antonio', 'san diego', 'dallas', 'san jose', 'austin', 'jacksonville',
        'fort worth', 'columbus', 'charlotte', 'san francisco', 'indianapolis',
        'seattle', 'denver', 'washington', 'boston', 'el paso', 'detroit', 'nashville',
        'portland', 'memphis', 'oklahoma city', 'las vegas', 'louisville', 'baltimore',
        'milwaukee', 'albuquerque', 'tucson', 'fresno', 'sacramento', 'kansas city',
        'mesa', 'atlanta', 'colorado springs', 'raleigh', 'omaha', 'miami', 'oakland',
        'tulsa', 'cleveland', 'wichita', 'arlington', 'new orleans', 'bakersfield',
        'tampa', 'honolulu', 'aurora', 'anaheim', 'santa ana', 'corpus christi',
        'riverside', 'lexington', 'stockton', 'toledo', 'saint paul', 'newark',
        'greensboro', 'plano', 'henderson', 'lincoln', 'buffalo', 'jersey city',
        'chula vista', 'fort wayne', 'orlando', 'st petersburg', 'chandler',
        'laredo', 'norfolk', 'durham', 'madison', 'lubbock', 'irvine', 'winston salem',
        'glendale', 'garland', 'hialeah', 'reno', 'chesapeake', 'gilbert', 'baton rouge',
        'irving', 'scottsdale', 'north las vegas', 'fremont', 'boise', 'richmond',
        'san bernardino', 'birmingham', 'spokane', 'rochester', 'des moines', 'modesto',
        'fayetteville', 'tacoma', 'oxnard', 'fontana', 'montgomery',
        'moreno valley', 'shreveport', 'yonkers', 'akron', 'huntington beach',
        'little rock', 'augusta', 'amarillo', 'mobile', 'grand rapids',
        'salt lake city', 'tallahassee', 'huntsville', 'grand prairie', 'knoxville',
        'worcester', 'newport news', 'brownsville', 'santa clarita', 'providence',
        'fort lauderdale', 'chattanooga', 'oceanside', 'jackson', 'garden grove',
        'rancho cucamonga', 'port st lucie', 'tempe', 'ontario', 'vancouver',
        'cape coral', 'sioux falls', 'springfield', 'peoria', 'pembroke pines',
        'elk grove', 'salem', 'lancaster', 'corona', 'eugene', 'palmdale', 'salinas',
        'pasadena', 'fort collins', 'hayward', 'pomona', 'cary',
        'rockford', 'alexandria', 'escondido', 'mckinney', 'joliet',
        'sunnyvale', 'torrance', 'bridgeport', 'lakewood', 'hollywood', 'paterson',
        'naperville', 'syracuse', 'mesquite', 'dayton', 'savannah', 'clarksville',
        'orange', 'fullerton', 'killeen', 'frisco', 'hampton',
        'mcallen', 'warren', 'bellevue', 'west valley city', 'columbia', 'olathe',
        'sterling heights', 'new haven', 'miramar', 'waco', 'thousand oaks',
        'cedar rapids', 'charleston', 'visalia', 'topeka', 'elizabeth', 'gainesville',
        'thornton', 'roseville', 'carrollton', 'coral springs', 'stamford', 'simi valley',
        'concord', 'hartford', 'kent', 'lafayette', 'midland', 'surprise', 'denton',
        'victorville', 'evansville', 'santa clara', 'abilene', 'athens', 'vallejo',
        'allentown', 'norman', 'beaumont', 'independence', 'murfreesboro', 'ann arbor',
        'fargo', 'wilmington', 'golden valley', 'pearland', 'richardson', 'broken arrow',
        'college station', 'league city', 'sugar land', 'lakeland',
        'duluth', 'woodbridge'
    ];
    
    if (majorUSCities.some(usCity => cleanCity.includes(usCity))) {
        return true;
    }
    
    if (cleanCity.includes('remote') && !cleanCity.includes('-') && !cleanState.includes('-')) {
        return true;
    }
    
    if (cleanState.includes('remote') && !cleanState.includes('-')) {
        return true;
    }
    
    if (cleanState.includes('united states')) {
        return true;
    }
    
    if (!cleanCity && !cleanState) {
        return false;
    }
    
    return false;
}

function formatLocation(city, state) {
  let normalizedCity = city ? city.trim() : '';
  let normalizedState = state ? state.trim() : '';

  if (normalizedCity.toLowerCase() === 'remote' || normalizedState.toLowerCase() === 'remote') {
    return 'Remote 🏠';
  }

  const invalidStates = [
    'us', 'usa', 'u.s.', 'u.s.a', 'united states',
    'multiple locations', 'various locations', 'nationwide',
    'location not specified', 'tbd', 'tba', 'n/a'
  ];
  
  if (invalidStates.includes(normalizedState.toLowerCase())) {
    normalizedState = '';
  }

  const cityCleanupKeywords = [
    'internship', 'intern', 'entry level', 'entrylevel', 'entry',
    'senior', 'junior', 'multiple cities', 'various'
  ];
  
  cityCleanupKeywords.forEach(keyword => {
    const regex = new RegExp(`^${keyword}\\s*`, 'gi');
    normalizedCity = normalizedCity.replace(regex, '').trim();
  });

  normalizedCity = normalizedCity
    .replace(/,?\s*United States$/i, '')
    .replace(/,?\s*USA$/i, '')
    .replace(/,?\s*U\.S\.A?$/i, '')
    .trim();

  if (normalizedState.toLowerCase().includes('united states')) {
    if (normalizedState.toLowerCase() === 'united states') {
      normalizedState = '';
    } else {
      normalizedState = normalizedState
        .replace(/,?\s*United States$/i, '')
        .replace(/,?\s*USA$/i, '')
        .trim();
    }
  }

  if (normalizedCity.includes(' - ')) {
    const parts = normalizedCity.split(' - ').map(p => p.trim());
    if (parts.length === 2) {
      normalizedState = normalizedState || parts[0];
      normalizedCity = parts[1];
    }
  }

  if (normalizedCity && normalizedCity.length < 2) {
    normalizedCity = '';
  }
  if (normalizedState && normalizedState.length < 2) {
    normalizedState = '';
  }

  if (normalizedCity && /^[\d\s,\-._]+$/.test(normalizedCity)) {
    normalizedCity = '';
  }

  if (normalizedCity && normalizedState) {
    return `${normalizedCity}, ${normalizedState}`;
  }
  
  if (!normalizedCity && normalizedState) {
    return normalizedState;
  }
  
  if (normalizedCity && !normalizedState) {
    return normalizedCity;
  }

  return null;
}

async function fetchInternshipData() {
  console.log("🎓 Fetching 2025/2026 internship opportunities...");

  const internships = [];

  const internshipSources = [
    {
      name: "AngelList Internships",
      emogi: "👼",
      url: "https://wellfound.com/jobs#internships",
      type: "Job Board",
      description: "Trending startup internships and entry-level roles",
    },
    {
      name: "LinkedIn Student Jobs",
      emogi: "🔗",
      url: "https://www.linkedin.com/jobs/search/?currentJobId=4292794755&geoId=103644278&keywords=software%20engineering%20intern&origin=JOB_SEARCH_PAGE_SEARCH_BUTTON&refresh=true",
      type: "Platform",
      description: "New Jobs and professional networking for students",
    },
    {
      name: "Indeed Internships",
      emogi: "🔵",
      url: "https://www.indeed.com/jobs?q=software%20engineering%20intern&l=United%20States&from=searchOnDesktopSerp%2Cwhereautocomplete",
      type: "Job Board",
      description: "Comprehensive internship search engine",
    },
    {
      name: "Glassdoor Internships",
      emogi: "🏢",
      url: "https://www.glassdoor.com/Job/united-states-software-engineer-intern-jobs-SRCH_IL.0,13_IN1_KO14,38.htm",
      type: "Job Board",
      description: "Internships with company reviews and salary data",
    },
    {
      name: "University Career Centers",
      emogi: "🏫",
      url: "https://www.naceweb.org/tag/internships",
      type: "Resource",
      description: "National Association of Colleges and Employers",
    },
  ];

  const companyInternshipPrograms = [
    {
      company: "Google",
      emogi: "🟢",
      program: "STEP Internship",
      url: "https://careers.google.com/students/",
      deadline: "Various",
    },
    {
      company: "Microsoft",
      emogi: "🟦",
      program: "Software Engineering Internship",
      url: "https://careers.microsoft.com/students",
      deadline: "Various",
    },
    {
      company: "Meta",
      emogi: "🔵",
      program: "Software Engineer Internship",
      url: "https://www.metacareers.com/careerprograms/students",
      deadline: "Various",
    },
    {
      company: "Amazon",
      emogi: "📦",
      program: "SDE Internship",
      url: "https://www.amazon.jobs/en/teams/internships-for-students",
      deadline: "Various",
    },
    {
      company: "Apple",
      emogi: "🍎",
      program: "Software Engineering Internship",
      url: "https://jobs.apple.com/en-us/search?search=software+engineering&sort=relevance&location=united-states-USA&team=internships-STDNT-INTRN",
      deadline: "Various",
    },
    {
      company: "Netflix",
      emogi: "🎬",
      program: "Software Engineering Internship",
      url: "https://explore.jobs.netflix.net/careers?query=software%20internship&pid=790302560337&domain=netflix.com&sort_by=relevance&triggerGoButton=false",
      deadline: "Various",
    },
    {
      company: "Tesla",
      emogi: "⚡",
      program: "Software Engineering Internship",
      url: "https://www.tesla.com/careers/search/?query=software%20intern&site=US",
      deadline: "Various",
    },
    {
      company: "Nvidia",
      emogi: "🎮",
      program: "Software Engineering Internship",
      url: "https://nvidia.wd5.myworkdayjobs.com/NVIDIAExternalCareerSite?q=software+intern&locationHierarchy1=2fcb99c455831013ea52fb338f2932d8",
      deadline: "Various",
    },
    {
      company: "Stripe",
      emogi: "💳",
      program: "Software Engineering Internship",
      url: "https://stripe.com/jobs/search?query=software+intern&remote_locations=North+America--US+Remote",
      deadline: "Various",
    },
    {
      company: "Coinbase",
      emogi: "₿",
      program: "Software Engineering Internship",
      url: "https://www.coinbase.com/careers/positions?search=software%2520internship",
      deadline: "Various",
    },
  ];

  return {
    sources: internshipSources,
    companyPrograms: companyInternshipPrograms,
    lastUpdated: new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
  };
}

module.exports = {
  companies,
  ALL_COMPANIES,
  COMPANY_BY_NAME,
  delay,
  generateJobId,
  migrateOldJobId,
  normalizeCompanyName,
  getCompanyEmoji,
  getCompanyCareerUrl,
  isJobOlderThanWeek,
  isUSOnlyJob,
  formatLocation,
  filterJobsByLevel,
  filterSoftwareEngineeringJobs, // NEW EXPORT
  fetchInternshipData,
};
const { initBrowser, closeBrowser } = require("./baseScraper.js");
const { getCompanyConfig, getPaginationType } = require("../services/companyService.js");
const { navigateToFirstPage } = require("../services/navigationService.js");
const { extractJobData } = require("../services/extractionService.js");
const {applyUSAFilter} = require("../utils/applyUSAFilter.js")
const { 
  handlePagination, 
  handleInfiniteScrollPagination, 
  handleShowMorePagination 
} = require("../services/paginationService.js");
const { validateJobObject, sanitizeJobObject } = require("../types/JobTypes.js");
const { PAGINATION_CONSTANTS, PAGINATION_TYPES } = require("../utils/constants.js");

/**
 * Main function to scrape data for a single company
 * @param {string} companyKey - Company identifier key
 * @param {string} searchQuery - Search query parameter
 * @param {number} maxPages - Maximum pages to scrape (default: 4)
 * @param {number} startPage - Starting page (IGNORED to prevent multiple browser instances)
 * @returns {Promise<Array>} Array of job objects
 */
async function scrapeCompanyData(companyKey, searchQuery, maxPages, startPage) {
  // Set default values properly
  maxPages = maxPages || PAGINATION_CONSTANTS.DEFAULT_MAX_PAGES;
  startPage = startPage || 1;

  let browser, page;
  const jobs = [];

  try {
    // Log that we're ignoring startPage to prevent multiple browser instances
    if (startPage > 1) {
      console.log(`WARNING: Ignoring startPage=${startPage} for ${companyKey} to prevent multiple browser instances. Will scrape all pages 1-${maxPages} in single session.`);
    }

    // Initialize browser ONCE per company - this is the ONLY browser instance
    console.log(`Initializing single browser instance for ${companyKey}...`);
    ({ browser, page } = await initBrowser());

    // Get company configuration
    const company = getCompanyConfig(companyKey, searchQuery, 1);
    if (!company) {
      console.error(`Failed to get configuration for company: ${companyKey}`);
      return jobs;
    }

    const selector = company.selector;
    const paginationType = getPaginationType(company);

    console.log(`Starting complete scrape for ${company.name} with pagination type: ${paginationType || 'none'} (Pages 1-${maxPages})`);

    // Handle different pagination strategies - each will scrape ALL pages in one go
    if (paginationType === PAGINATION_TYPES.INFINITE_SCROLL) {
      await scrapeWithInfiniteScroll(page, company, selector, maxPages, jobs);
    } else if (paginationType === PAGINATION_TYPES.SHOW_MORE_BUTTON) {
      await scrapeWithShowMoreButton(page, company, selector, maxPages, jobs);
    } else {
      await scrapeWithTraditionalPagination(page, company, selector, searchQuery, maxPages, jobs);
    }

    console.log(`Completed scraping ${company.name}. Found ${jobs.length} jobs using single browser instance.`);

  } catch (error) {
    console.error(`Fatal error scraping ${companyKey}: ${error.message}`);
    console.error(`Stack trace: ${error.stack}`);
  } finally {
    // Ensure browser is closed only once at the end
    if (browser) {
      try {
        await closeBrowser(browser);
        console.log(`Browser closed for ${companyKey}`);
      } catch (closeError) {
        console.error(`Error closing browser for ${companyKey}: ${closeError.message}`);
      }
    }
  }

  return jobs;
}

/**
 * Scrape company with infinite scroll pagination
 * @param {Object} page - Puppeteer page instance
 * @param {Object} company - Company configuration
 * @param {Object} selector - Selector configuration
 * @param {number} maxPages - Maximum scroll iterations
 * @param {Array} jobs - Jobs array to populate
 */
/**
 * Scrape company with infinite scroll pagination
 * @param {Object} page - Puppeteer page instance
 * @param {Object} company - Company configuration
 * @param {Object} selector - Selector configuration
 * @param {number} maxPages - Maximum scroll iterations
 * @param {Array} jobs - Jobs array to populate
 */
/**
 * Scrape company with infinite scroll pagination
 * This version handles ALL scrolling HERE, then extracts all jobs at once
 * @param {Object} page - Puppeteer page instance
 * @param {Object} company - Company configuration
 * @param {Object} selector - Selector configuration
 * @param {number} maxPages - Maximum scroll iterations
 * @param {Array} jobs - Jobs array to populate
 */
async function scrapeWithInfiniteScroll(page, company, selector, maxPages, jobs) {
  await navigateToFirstPage(page, company);

  // ============================================
  // STEP 1: Load seen jobs for duplicate detection
  // ============================================
  const seenJobIds = new Set();
  try {
    const fs = require('fs');
    const path = require('path');
    const seenJobsPath = path.join(process.cwd(), '.github', 'data', 'seen_jobs.json');
    
    if (fs.existsSync(seenJobsPath)) {
      const allSeenJobs = JSON.parse(fs.readFileSync(seenJobsPath, 'utf8'));
      const companyPrefix = company.name.toLowerCase().replace(/\s+/g, '-');
      
      allSeenJobs.forEach(id => {
        if (id.toLowerCase().startsWith(companyPrefix + '-')) {
          seenJobIds.add(id);
        }
      });
      
      console.log(`Loaded ${seenJobIds.size} previously seen jobs for ${company.name} (infinite scroll)`);
    }
  } catch (err) {
    console.log(`Could not load seen jobs for ${company.name}: ${err.message}`);
  }

  // ============================================
  // STEP 2: SCROLL FIRST - Load all jobs onto the page
  // ============================================
  console.log(`\n🔄 [${company.name}] Starting infinite scroll (up to ${maxPages} scrolls)...`);
  
  let previousJobCount = 0;
  let currentJobCount = 0;
  let noChangeCount = 0;
  const MAX_NO_CHANGE = 3; // Stop if no new jobs for 3 consecutive scrolls

  try {
    // Get initial job count
    await page.waitForSelector(selector.jobSelector, { timeout: 10000 });
    currentJobCount = await page.$$eval(selector.jobSelector, els => els.length);
    console.log(`   Initial jobs visible: ${currentJobCount}`);
  } catch (err) {
    console.error(`   ❌ Failed to find initial jobs with selector "${selector.jobSelector}"`);
    return; // Exit early if no jobs found
  }

  // Scroll loop
  for (let scrollNum = 1; scrollNum <= maxPages; scrollNum++) {
    try {
      // Scroll to bottom of page
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });

      // Wait for content to load
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Get updated job count
      previousJobCount = currentJobCount;
      currentJobCount = await page.$$eval(selector.jobSelector, els => els.length);

      const newJobsLoaded = currentJobCount - previousJobCount;
      console.log(`   Scroll ${scrollNum}/${maxPages}: ${previousJobCount} → ${currentJobCount} jobs (+${newJobsLoaded})`);

      // Check if new jobs were loaded
      if (currentJobCount === previousJobCount) {
        noChangeCount++;
        console.log(`   ⚠️  No new jobs loaded (${noChangeCount}/${MAX_NO_CHANGE})`);
        
        if (noChangeCount >= MAX_NO_CHANGE) {
          console.log(`   ✓ Stopping: No new jobs after ${MAX_NO_CHANGE} consecutive scrolls`);
          break;
        }
      } else {
        noChangeCount = 0; // Reset counter when new jobs are found
      }

      // Scroll back up slightly to trigger lazy loading (some sites need this)
      if (scrollNum < maxPages) {
        await page.evaluate(() => {
          window.scrollTo(0, document.body.scrollHeight - 500);
        });
        await new Promise(resolve => setTimeout(resolve, 500));
      }

    } catch (scrollError) {
      console.error(`   ❌ Error during scroll ${scrollNum}: ${scrollError.message}`);
      // Continue to next scroll attempt
    }
  }

  console.log(`\n✓ [${company.name}] Scrolling complete. Total jobs loaded: ${currentJobCount}\n`);

  // Scroll back to top for extraction
  try {
    await page.evaluate(() => window.scrollTo(0, 0));
    await new Promise(resolve => setTimeout(resolve, 1000));
  } catch (err) {
    console.warn(`   Could not scroll to top: ${err.message}`);
  }

  // ============================================
  // STEP 3: EXTRACT all jobs (no more scrolling)
  // ============================================
  console.log(`📦 [${company.name}] Extracting all ${currentJobCount} jobs...`);
  
  try {
    // Call extractJobData with pageNum = 1 (just for logging purposes)
    // NOTE: Make sure extractJobData does NOT scroll for infinite scroll companies
    // OR pass a flag to tell it we already scrolled
    const jobData = await extractJobData(page, selector, company, 1);
    const validJobs = processJobData(jobData);

    console.log(`   Raw jobs extracted: ${jobData.length}`);
    console.log(`   Valid jobs after processing: ${validJobs.length}`);

    // ============================================
    // STEP 4: Process and add jobs with duplicate tracking
    // ============================================
    let newJobCount = 0;
    let duplicateCount = 0;

    for (const job of validJobs) {
      // Generate consistent job ID
      const companyPart = (job.company || company.name || '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-');
      
      const titlePart = (job.title || '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-');
      
      const locationPart = (job.location || job.city || '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-');
      
      const jobId = `${companyPart}-${titlePart}-${locationPart}`
        .replace(/--+/g, '-')
        .replace(/^-|-$/g, '');

      // Track new vs duplicate jobs
      if (!seenJobIds.has(jobId)) {
        seenJobIds.add(jobId);
        newJobCount++;
      } else {
        duplicateCount++;
      }

      // Add ALL jobs to results (including duplicates for this run)
      jobs.push(job);
    }

    // ============================================
    // STEP 5: Log final statistics
    // ============================================
    console.log(`\n✅ [${company.name}] Infinite scroll complete:`);
    console.log(`   Total jobs extracted: ${validJobs.length}`);
    console.log(`   New jobs (not seen before): ${newJobCount}`);
    console.log(`   Duplicate jobs (seen before): ${duplicateCount}`);
    console.log(`   Jobs added to results: ${jobs.length}\n`);

  } catch (extractError) {
    console.error(`❌ [${company.name}] Extraction failed: ${extractError.message}`);
    console.error(`   Stack: ${extractError.stack}`);
  }
}

/**
 * Safe pagination handler that doesn't create new browser instances
 * @param {Object} page - Puppeteer page instance
 * @param {Object} selector - Selector configuration
 * @param {Object} company - Company configuration
 * @param {string} searchQuery - Search query parameter
 * @param {number} currentPage - Current page number
 * @param {number} maxPages - Maximum pages
 * @returns {boolean} Whether pagination can continue
 */
async function handlePaginationSafely(page, selector, company, searchQuery, currentPage, maxPages) {
  try {
    // Call the original handlePagination but ensure it uses the same page instance
    const canContinue = await handlePagination(
      page,
      selector,
      company,
      searchQuery,
      currentPage,
      maxPages
    );
    
    // Add a small delay to let the page load
    if (canContinue) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    return canContinue;
  } catch (error) {
    console.error(`Pagination error on page ${currentPage}: ${error.message}`);
    return false;
  }
}

/**
 * Process and validate job data
 * @param {Array} jobData - Raw job data array
 * @returns {Array} Array of valid, sanitized job objects
 */
function processJobData(jobData) {
  const validJobs = [];

  if (!jobData || !Array.isArray(jobData)) {
    console.warn('Invalid job data provided to processJobData');
    return validJobs;
  }

  jobData.forEach((job, index) => {
    try {
      // Sanitize job data
      const sanitizedJob = sanitizeJobObject(job);
      
      // Validate job data
      const validation = validateJobObject(sanitizedJob);
      
      if (validation.isValid) {
        validJobs.push(sanitizedJob);
      } else {
        console.warn(`Invalid job data at index ${index}:`, validation.errors.join(', '));
      }
    } catch (error) {
      console.error(`Error processing job data at index ${index}:`, error.message);
    }
  });

  return validJobs;
}

/**
 * Scrape multiple companies
 * @param {Array} companyKeys - Array of company identifier keys
 * @param {string} searchQuery - Search query parameter
 * @param {number} maxPages - Maximum pages to scrape per company
 * @returns {Promise<Object>} Object with company keys as keys and job arrays as values
 */
async function scrapeMultipleCompanies(companyKeys, searchQuery, maxPages) {
  maxPages = maxPages || PAGINATION_CONSTANTS.DEFAULT_MAX_PAGES;
  const results = {};

  for (const companyKey of companyKeys) {
    console.log(`\n=== Starting scrape for ${companyKey} ===`);
    
    try {
      // Each company gets its own browser instance, but only ONE per company
      const jobs = await scrapeCompanyData(companyKey, searchQuery, maxPages);
      results[companyKey] = jobs;
      
      console.log(`=== Completed ${companyKey}: ${jobs.length} jobs ===\n`);
      
      // Add delay between companies to be respectful
      if (companyKeys.indexOf(companyKey) < companyKeys.length - 1) {
        console.log('Waiting before next company...');
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    } catch (error) {
      console.error(`Failed to scrape ${companyKey}:`, error.message);
      results[companyKey] = [];
    }
  }

  return results;
}

module.exports = { 
  scrapeCompanyData,
  scrapeMultipleCompanies
};

// JSearch API Configuration
const JSEARCH_API_KEY = 'YOUR_RAPIDAPI_KEY_HERE'; // Replace with your actual API key
const JSEARCH_BASE_URL = 'https://jsearch.p.rapidapi.com/search';

// Dream companies list
const DREAM_COMPANIES = [
    'Google', 'Apple', 'Microsoft', 'Amazon', 'Meta', 'Netflix', 'Tesla', 
    'Nvidia', 'Salesforce', 'Adobe', 'Uber', 'Airbnb', 'Spotify', 'Stripe',
    'OpenAI', 'Anthropic', 'DeepMind', 'SpaceX', 'Palantir', 'Databricks'
];

// Cache for API responses (to respect rate limits)
let jobsCache = {
    data: [],
    timestamp: 0,
    expiry: 24 * 60 * 60 * 1000 // 24 hours
};

// DOM Elements
const loadingIndicator = document.getElementById('loadingIndicator');
const jobsContainer = document.getElementById('jobsContainer');
const noJobsMessage = document.getElementById('noJobs');
const jobCountElement = document.getElementById('jobCount');
const companyFilter = document.getElementById('companyFilter');
const locationFilter = document.getElementById('locationFilter');
const levelFilter = document.getElementById('levelFilter');

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    loadDreamJobs();
    setupFilters();
});

// Load dream jobs from API or cache
async function loadDreamJobs() {
    try {
        showLoading(true);
        
        // Check if we have cached data that's still valid
        const now = Date.now();
        if (jobsCache.data.length > 0 && (now - jobsCache.timestamp) < jobsCache.expiry) {
            displayJobs(jobsCache.data);
            return;
        }

        // If no API key is set, show sample data
        if (JSEARCH_API_KEY === 'YOUR_RAPIDAPI_KEY_HERE') {
            console.warn('JSearch API key not configured. Showing sample data.');
            displaySampleJobs();
            return;
        }

        // Fetch jobs from multiple dream companies (respecting rate limits)
        const jobs = await fetchJobsFromDreamCompanies();
        
        // Cache the results
        jobsCache.data = jobs;
        jobsCache.timestamp = now;
        
        displayJobs(jobs);
    } catch (error) {
        console.error('Error loading jobs:', error);
        showError('Failed to load jobs. Please try again later.');
    } finally {
        showLoading(false);
    }
}

// Fetch jobs from dream companies using JSearch API
async function fetchJobsFromDreamCompanies() {
    const allJobs = [];
    
    // To respect free tier limits, we'll search for a few companies at a time
    const searchQueries = [
        'software engineer Google Apple Microsoft',
        'developer Amazon Meta Netflix',
        'engineer Tesla Nvidia Salesforce',
        'software Uber Airbnb Spotify'
    ];
    
    for (const query of searchQueries) {
        try {
            const jobs = await searchJobs(query);
            allJobs.push(...jobs);
            
            // Add delay between requests to respect rate limits
            await delay(1000);
        } catch (error) {
            console.error(`Error searching for "${query}":`, error);
        }
    }
    
    // Filter and deduplicate results
    return filterDreamCompanyJobs(allJobs);
}

// Search jobs using JSearch API
async function searchJobs(query, location = 'United States') {
    const url = new URL(JSEARCH_BASE_URL);
    url.searchParams.append('query', query);
    url.searchParams.append('page', '1');
    url.searchParams.append('num_pages', '1');
    url.searchParams.append('date_posted', 'week'); // Only recent jobs
    
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'X-RapidAPI-Key': JSEARCH_API_KEY,
            'X-RapidAPI-Host': 'jsearch.p.rapidapi.com'
        }
    });
    
    if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data || [];
}

// Filter jobs to only include dream companies
function filterDreamCompanyJobs(jobs) {
    const dreamJobs = jobs.filter(job => {
        const companyName = job.employer_name || '';
        return DREAM_COMPANIES.some(dreamCompany => 
            companyName.toLowerCase().includes(dreamCompany.toLowerCase())
        );
    });
    
    // Remove duplicates based on job title and company
    const uniqueJobs = dreamJobs.filter((job, index, self) => 
        index === self.findIndex(j => 
            j.job_title === job.job_title && j.employer_name === job.employer_name
        )
    );
    
    return uniqueJobs.slice(0, 50); // Limit to 50 jobs
}

// Display sample jobs when API is not configured
function displaySampleJobs() {
    const sampleJobs = [
        {
            job_title: "Software Engineer",
            employer_name: "Google",
            job_city: "Mountain View",
            job_state: "CA",
            job_description: "Join our team to build innovative products that impact billions of users worldwide. Work on cutting-edge technology with some of the brightest minds in the industry.",
            job_apply_link: "https://careers.google.com",
            job_posted_at_datetime_utc: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            job_employment_type: "FULLTIME"
        },
        {
            job_title: "Frontend Developer",
            employer_name: "Apple",
            job_city: "Cupertino",
            job_state: "CA",
            job_description: "Create beautiful, intuitive user experiences for Apple's next generation of products. Work with SwiftUI, React, and other modern frameworks.",
            job_apply_link: "https://jobs.apple.com",
            job_posted_at_datetime_utc: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            job_employment_type: "FULLTIME"
        },
        {
            job_title: "Machine Learning Engineer",
            employer_name: "Microsoft",
            job_city: "Seattle",
            job_state: "WA",
            job_description: "Build AI systems that power Microsoft's cloud services. Work with Azure ML, PyTorch, and other cutting-edge ML technologies.",
            job_apply_link: "https://careers.microsoft.com",
            job_posted_at_datetime_utc: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            job_employment_type: "FULLTIME"
        },
        {
            job_title: "Full Stack Developer",
            employer_name: "Meta",
            job_city: "Menlo Park",
            job_state: "CA",
            job_description: "Build the next generation of social technology. Work on React, GraphQL, and other modern web technologies at scale.",
            job_apply_link: "https://careers.meta.com",
            job_posted_at_datetime_utc: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
            job_employment_type: "FULLTIME"
        },
        {
            job_title: "DevOps Engineer",
            employer_name: "Amazon",
            job_city: "Remote",
            job_state: "WA",
            job_description: "Scale AWS infrastructure to serve millions of customers. Work with Docker, Kubernetes, and other cloud-native technologies.",
            job_apply_link: "https://amazon.jobs",
            job_posted_at_datetime_utc: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            job_employment_type: "FULLTIME"
        },
        {
            job_title: "Data Scientist",
            employer_name: "Netflix",
            job_city: "Los Angeles",
            job_state: "CA",
            job_description: "Use data to improve the Netflix experience for 200+ million subscribers. Work with Python, R, and big data technologies.",
            job_apply_link: "https://jobs.netflix.com",
            job_posted_at_datetime_utc: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
            job_employment_type: "FULLTIME"
        }
    ];
    
    displayJobs(sampleJobs);
}

// Display jobs in the UI
function displayJobs(jobs) {
    jobsContainer.innerHTML = '';
    
    if (jobs.length === 0) {
        showNoJobs(true);
        return;
    }
    
    showNoJobs(false);
    updateJobCount(jobs.length);
    
    jobs.forEach(job => {
        const jobCard = createJobCard(job);
        jobsContainer.appendChild(jobCard);
    });
}

// Create a job card element
function createJobCard(job) {
    const card = document.createElement('div');
    card.className = 'job-card';
    
    const companyInitials = getCompanyInitials(job.employer_name);
    const location = formatLocation(job.job_city, job.job_state);
    const timeAgo = getTimeAgo(job.job_posted_at_datetime_utc);
    const description = truncateDescription(job.job_description, 150);
    
    card.innerHTML = `
        <div class="job-header">
            <div class="company-logo">${companyInitials}</div>
            <div class="job-info">
                <h3>${job.job_title}</h3>
                <div class="job-company">${job.employer_name}</div>
            </div>
        </div>
        <div class="job-details">
            <div class="job-detail">
                <span class="job-detail-icon">📍</span>
                ${location}
            </div>
            <div class="job-detail">
                <span class="job-detail-icon">💼</span>
                ${formatEmploymentType(job.job_employment_type)}
            </div>
        </div>
        <div class="job-description">${description}</div>
        <div class="job-footer">
            <div class="job-posted">${timeAgo}</div>
            <a href="${job.job_apply_link}" class="apply-btn" target="_blank" rel="noopener noreferrer">
                Apply Now
            </a>
        </div>
    `;
    
    return card;
}

// Setup filter event listeners
function setupFilters() {
    [companyFilter, locationFilter, levelFilter].forEach(filter => {
        filter.addEventListener('change', applyFilters);
    });
}

// Apply filters to displayed jobs
function applyFilters() {
    const jobs = jobsCache.data;
    
    if (jobs.length === 0) return;
    
    const companyValue = companyFilter.value.toLowerCase();
    const locationValue = locationFilter.value.toLowerCase();
    const levelValue = levelFilter.value.toLowerCase();
    
    const filteredJobs = jobs.filter(job => {
        const matchesCompany = !companyValue || 
            job.employer_name.toLowerCase().includes(companyValue);
        
        const matchesLocation = !locationValue || 
            job.job_city?.toLowerCase().includes(locationValue) ||
            job.job_state?.toLowerCase().includes(locationValue) ||
            (locationValue === 'remote' && job.job_city?.toLowerCase().includes('remote'));
        
        const matchesLevel = !levelValue ||
            job.job_title.toLowerCase().includes(levelValue) ||
            job.job_description.toLowerCase().includes(levelValue);
        
        return matchesCompany && matchesLocation && matchesLevel;
    });
    
    displayJobs(filteredJobs);
}

// Utility functions
function getCompanyInitials(companyName) {
    return companyName
        .split(' ')
        .map(word => word.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

function formatLocation(city, state) {
    if (!city && !state) return 'Remote';
    if (!city) return state;
    if (!state) return city;
    return `${city}, ${state}`;
}

function formatEmploymentType(type) {
    const types = {
        'FULLTIME': 'Full-time',
        'PARTTIME': 'Part-time',
        'CONTRACT': 'Contract',
        'INTERNSHIP': 'Internship'
    };
    return types[type] || type;
}

function truncateDescription(description, maxLength) {
    if (!description || description.length <= maxLength) {
        return description || 'No description available.';
    }
    return description.substring(0, maxLength) + '...';
}

function getTimeAgo(dateString) {
    if (!dateString) return 'Recently';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 24) {
        return `${diffInHours}h ago`;
    } else {
        const diffInDays = Math.floor(diffInHours / 24);
        return `${diffInDays}d ago`;
    }
}

function updateJobCount(count) {
    jobCountElement.textContent = count;
}

function showLoading(show) {
    loadingIndicator.style.display = show ? 'block' : 'none';
}

function showNoJobs(show) {
    noJobsMessage.style.display = show ? 'block' : 'none';
}

function showError(message) {
    jobsContainer.innerHTML = `
        <div class="error-message">
            <h3>Error</h3>
            <p>${message}</p>
        </div>
    `;
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
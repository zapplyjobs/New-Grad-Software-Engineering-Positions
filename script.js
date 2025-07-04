// JSearch API Configuration
const JSEARCH_API_KEY = 'YOUR_RAPIDAPI_KEY_HERE'; // Replace with your actual API key
const JSEARCH_BASE_URL = 'https://jsearch.p.rapidapi.com/search';

// Dream companies list
const DREAM_COMPANIES = [
    'Google', 'Apple', 'Microsoft', 'Amazon', 'Meta', 'Netflix', 'Tesla', 
    'Nvidia', 'Salesforce', 'Adobe', 'Uber', 'Airbnb', 'Spotify', 'Stripe',
    'OpenAI', 'Anthropic', 'DeepMind', 'SpaceX', 'Palantir', 'Databricks'
];

// Global variables
let allJobs = [];
let filteredJobs = [];
let currentFilters = {
    company: '',
    location: '',
    role: ''
};

// DOM Elements
const loadingIndicator = document.getElementById('loadingIndicator');
const jobsContainer = document.getElementById('jobsContainer');
const noJobsMessage = document.getElementById('noJobs');
const jobCountElement = document.getElementById('jobCount');
const companyFilter = document.getElementById('companyFilter');
const locationFilter = document.getElementById('locationFilter');
const roleFilter = document.getElementById('roleFilter');
const clearFiltersBtn = document.getElementById('clearFilters');
const sortSelect = document.getElementById('sortSelect');

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    loadDreamJobs();
    setupFilters();
    setupSorting();
});

// Load dream jobs (using sample data for now)
async function loadDreamJobs() {
    try {
        showLoading(true);
        
        // If no API key is set, show sample data
        if (JSEARCH_API_KEY === 'YOUR_RAPIDAPI_KEY_HERE') {
            console.log('Using sample data - API key not configured');
            await delay(1500); // Simulate API call
            allJobs = generateSampleJobs();
        } else {
            // Use real API
            allJobs = await fetchJobsFromAPI();
        }
        
        filteredJobs = [...allJobs];
        displayJobs(filteredJobs);
        updateJobCount(filteredJobs.length);
        
    } catch (error) {
        console.error('Error loading jobs:', error);
        showError('Failed to load jobs. Please try again later.');
    } finally {
        showLoading(false);
    }
}

// Generate realistic sample jobs
function generateSampleJobs() {
    const jobTitles = [
        'Software Engineer', 'Senior Software Engineer', 'Frontend Developer', 
        'Backend Developer', 'Full Stack Developer', 'Machine Learning Engineer',
        'Data Scientist', 'DevOps Engineer', 'Product Manager', 'UX Designer',
        'iOS Developer', 'Android Developer', 'Cloud Engineer', 'Security Engineer',
        'Site Reliability Engineer', 'Principal Engineer', 'Technical Lead'
    ];
    
    const companies = [
        { name: 'Google', locations: ['Mountain View', 'New York', 'Austin', 'Remote'] },
        { name: 'Apple', locations: ['Cupertino', 'Austin', 'New York', 'Remote'] },
        { name: 'Microsoft', locations: ['Seattle', 'Redmond', 'San Francisco', 'Remote'] },
        { name: 'Amazon', locations: ['Seattle', 'Austin', 'New York', 'Remote'] },
        { name: 'Meta', locations: ['Menlo Park', 'New York', 'Austin', 'Remote'] },
        { name: 'Netflix', locations: ['Los Angeles', 'San Francisco', 'Remote'] },
        { name: 'Tesla', locations: ['Austin', 'Fremont', 'New York', 'Remote'] },
        { name: 'Nvidia', locations: ['Santa Clara', 'Austin', 'Remote'] },
        { name: 'Salesforce', locations: ['San Francisco', 'New York', 'Austin', 'Remote'] },
        { name: 'Adobe', locations: ['San Francisco', 'Austin', 'New York', 'Remote'] }
    ];
    
    const descriptions = [
        'Join our team to build innovative products that impact millions of users worldwide. Work with cutting-edge technology and collaborate with some of the brightest minds in the industry.',
        'We are looking for passionate engineers to help us scale our platform and deliver exceptional user experiences. You will work on challenging technical problems with significant impact.',
        'Build the future of technology with us. Work on large-scale systems, contribute to open source, and help shape the direction of our products used by billions.',
        'Join a fast-paced, collaborative environment where you will design and implement solutions that drive business growth and user engagement.',
        'Work with modern technologies and frameworks to build scalable, reliable systems. Collaborate with cross-functional teams to deliver high-quality products.',
        'Help us revolutionize the industry with innovative solutions. Work on challenging problems in a supportive environment with opportunities for growth.',
        'Build products that matter. Work with a talented team to create solutions that solve real-world problems and make a positive impact.',
        'Join our mission to democratize technology. Work on cutting-edge projects with the latest tools and technologies in a collaborative environment.',
        'Shape the future of our products. Work with engineering, design, and product teams to build features that delight our users and drive business success.',
        'Build scalable, high-performance systems that serve millions of users. Work with cloud technologies and modern development practices.'
    ];
    
    const sampleJobs = [];
    
    for (let i = 0; i < 24; i++) {
        const company = companies[Math.floor(Math.random() * companies.length)];
        const title = jobTitles[Math.floor(Math.random() * jobTitles.length)];
        const location = company.locations[Math.floor(Math.random() * company.locations.length)];
        const description = descriptions[Math.floor(Math.random() * descriptions.length)];
        const daysAgo = Math.floor(Math.random() * 7) + 1;
        const postedDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
        
        sampleJobs.push({
            job_title: title,
            employer_name: company.name,
            job_city: location === 'Remote' ? 'Remote' : location,
            job_state: location === 'Remote' ? '' : 'CA',
            job_description: description,
            job_apply_link: `https://careers.${company.name.toLowerCase()}.com`,
            job_posted_at_datetime_utc: postedDate.toISOString(),
            job_employment_type: 'FULLTIME',
            job_id: `${company.name}-${i}-${Date.now()}`
        });
    }
    
    return sampleJobs;
}

// Setup filter event listeners
function setupFilters() {
    companyFilter.addEventListener('change', function() {
        currentFilters.company = this.value;
        applyFilters();
    });
    
    locationFilter.addEventListener('change', function() {
        currentFilters.location = this.value;
        applyFilters();
    });
    
    roleFilter.addEventListener('change', function() {
        currentFilters.role = this.value;
        applyFilters();
    });
    
    clearFiltersBtn.addEventListener('click', function() {
        // Reset all filters
        companyFilter.value = '';
        locationFilter.value = '';
        roleFilter.value = '';
        currentFilters = { company: '', location: '', role: '' };
        applyFilters();
    });
}

// Setup sorting
function setupSorting() {
    sortSelect.addEventListener('change', function() {
        sortJobs(this.value);
    });
}

// Apply filters to jobs
function applyFilters() {
    filteredJobs = allJobs.filter(job => {
        // Company filter
        if (currentFilters.company && 
            !job.employer_name.toLowerCase().includes(currentFilters.company.toLowerCase())) {
            return false;
        }
        
        // Location filter
        if (currentFilters.location) {
            const jobLocation = `${job.job_city} ${job.job_state}`.toLowerCase();
            if (!jobLocation.includes(currentFilters.location.toLowerCase())) {
                return false;
            }
        }
        
        // Role filter
        if (currentFilters.role) {
            if (!job.job_title.toLowerCase().includes(currentFilters.role.toLowerCase())) {
                return false;
            }
        }
        
        return true;
    });
    
    // Apply current sort
    sortJobs(sortSelect.value);
    displayJobs(filteredJobs);
    updateJobCount(filteredJobs.length);
}

// Sort jobs
function sortJobs(sortType) {
    switch (sortType) {
        case 'newest':
            filteredJobs.sort((a, b) => new Date(b.job_posted_at_datetime_utc) - new Date(a.job_posted_at_datetime_utc));
            break;
        case 'oldest':
            filteredJobs.sort((a, b) => new Date(a.job_posted_at_datetime_utc) - new Date(b.job_posted_at_datetime_utc));
            break;
        case 'company':
            filteredJobs.sort((a, b) => a.employer_name.localeCompare(b.employer_name));
            break;
        case 'title':
            filteredJobs.sort((a, b) => a.job_title.localeCompare(b.job_title));
            break;
    }
    
    displayJobs(filteredJobs);
}

// Display jobs in the UI
function displayJobs(jobs) {
    jobsContainer.innerHTML = '';
    
    if (jobs.length === 0) {
        showNoJobs(true);
        return;
    }
    
    showNoJobs(false);
    
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
    
    // Add click handler for the entire card
    card.addEventListener('click', function(e) {
        // Don't trigger if clicking on the apply button
        if (!e.target.closest('.apply-btn')) {
            window.open(job.job_apply_link, '_blank');
        }
    });
    
    return card;
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
    if (city.toLowerCase() === 'remote') return 'Remote';
    return `${city}, ${state}`;
}

function formatEmploymentType(type) {
    const types = {
        'FULLTIME': 'Full-time',
        'PARTTIME': 'Part-time',
        'CONTRACT': 'Contract',
        'INTERNSHIP': 'Internship'
    };
    return types[type] || 'Full-time';
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
    jobsContainer.style.display = show ? 'none' : 'grid';
}

function showNoJobs(show) {
    noJobsMessage.style.display = show ? 'block' : 'none';
    jobsContainer.style.display = show ? 'none' : 'grid';
}

function showError(message) {
    jobsContainer.innerHTML = `
        <div class="error-message" style="text-align: center; padding: 60px 0; color: #ef4444;">
            <h3 style="margin-bottom: 10px;">Error</h3>
            <p>${message}</p>
        </div>
    `;
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Real API fetching (for when API key is configured)
async function fetchJobsFromAPI() {
    const searchQueries = [
        'software engineer Google Apple Microsoft',
        'developer Amazon Meta Netflix',
        'engineer Tesla Nvidia Salesforce',
        'software Uber Airbnb Spotify'
    ];
    
    const allJobs = [];
    
    for (const query of searchQueries) {
        try {
            const jobs = await searchJobs(query);
            allJobs.push(...jobs);
            await delay(1000); // Respect rate limits
        } catch (error) {
            console.error(`Error searching for "${query}":`, error);
        }
    }
    
    return filterDreamCompanyJobs(allJobs);
}

async function searchJobs(query) {
    const url = new URL(JSEARCH_BASE_URL);
    url.searchParams.append('query', query);
    url.searchParams.append('page', '1');
    url.searchParams.append('num_pages', '1');
    url.searchParams.append('date_posted', 'week');
    
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

function filterDreamCompanyJobs(jobs) {
    const dreamJobs = jobs.filter(job => {
        const companyName = job.employer_name || '';
        return DREAM_COMPANIES.some(dreamCompany => 
            companyName.toLowerCase().includes(dreamCompany.toLowerCase())
        );
    });
    
    // Remove duplicates
    const uniqueJobs = dreamJobs.filter((job, index, self) => 
        index === self.findIndex(j => 
            j.job_title === job.job_title && j.employer_name === job.employer_name
        )
    );
    
    return uniqueJobs.slice(0, 50);
}
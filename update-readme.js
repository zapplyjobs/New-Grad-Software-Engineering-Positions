const fs = require('fs');
const fetch = require('node-fetch');

// Configuration
const JSEARCH_API_KEY = process.env.JSEARCH_API_KEY || '315e3cea2bmshd51ab0ee7309328p18cecfjsna0f6b8e72f39';
const JSEARCH_BASE_URL = 'https://jsearch.p.rapidapi.com/search';

const DREAM_COMPANIES = [
    'Google', 'Apple', 'Microsoft', 'Amazon', 'Meta', 'Netflix', 'Tesla', 
    'Nvidia', 'Salesforce', 'Adobe', 'Uber', 'Airbnb', 'Spotify', 'Stripe',
    'OpenAI', 'Anthropic', 'DeepMind', 'SpaceX', 'Palantir', 'Databricks'
];

const COMPANY_EMOJIS = {
    'Google': '🟢',
    'Apple': '🍎', 
    'Microsoft': '🟦',
    'Amazon': '📦',
    'Meta': '🔵',
    'Netflix': '🎬',
    'Tesla': '⚡',
    'Nvidia': '🎮',
    'Salesforce': '☁️',
    'Adobe': '🎨',
    'Uber': '🚗',
    'Airbnb': '🏠',
    'Spotify': '🎵',
    'Stripe': '💳',
    'OpenAI': '🤖',
    'Anthropic': '🧠',
    'DeepMind': '🔬',
    'SpaceX': '🚀',
    'Palantir': '👁️',
    'Databricks': '📊'
};

// Utility functions
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function getCompanyEmoji(company) {
    return COMPANY_EMOJIS[company] || '🏢';
}

function formatTimeAgo(dateString) {
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

function getExperienceLevel(title, description) {
    const text = `${title} ${description}`.toLowerCase();
    
    if (text.includes('senior') || text.includes('sr.') || text.includes('lead') || text.includes('principal')) {
        return 'Senior';
    } else if (text.includes('entry') || text.includes('junior') || text.includes('jr.') || text.includes('new grad')) {
        return 'Entry-Level';
    } else {
        return 'Mid-Level';
    }
}

function getCompanyApplyLink(company) {
    const links = {
        'Google': 'https://careers.google.com',
        'Apple': 'https://jobs.apple.com',
        'Microsoft': 'https://careers.microsoft.com',
        'Amazon': 'https://amazon.jobs',
        'Meta': 'https://careers.meta.com',
        'Netflix': 'https://jobs.netflix.com',
        'Tesla': 'https://careers.tesla.com',
        'Nvidia': 'https://careers.nvidia.com',
        'Salesforce': 'https://careers.salesforce.com',
        'Adobe': 'https://careers.adobe.com',
        'Uber': 'https://careers.uber.com',
        'Airbnb': 'https://careers.airbnb.com',
        'Spotify': 'https://careers.spotify.com',
        'Stripe': 'https://careers.stripe.com'
    };
    return links[company] || '#';
}

// API functions
async function searchJobs(query) {
    try {
        const url = new URL(JSEARCH_BASE_URL);
        url.searchParams.append('query', query);
        url.searchParams.append('page', '1');
        url.searchParams.append('num_pages', '1');
        url.searchParams.append('date_posted', 'month');
        url.searchParams.append('employment_types', 'FULLTIME');
        
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
        console.log(`Query "${query}" returned ${data.data?.length || 0} jobs`);
        return data.data || [];
    } catch (error) {
        console.error(`Error searching for "${query}":`, error.message);
        return [];
    }
}

async function fetchAllJobs() {
    const searchQueries = [
        'software engineer',
        'frontend developer', 
        'backend developer',
        'data scientist',
        'product manager'
    ];
    
    const allJobs = [];
    
    for (const query of searchQueries) {
        console.log(`Searching for: ${query}`);
        const jobs = await searchJobs(query);
        allJobs.push(...jobs);
        await delay(1000); // Rate limiting
    }
    
    console.log(`Total jobs fetched: ${allJobs.length}`);
    return allJobs;
}

function filterDreamCompanyJobs(jobs) {
    const dreamJobs = jobs.filter(job => {
        const companyName = job.employer_name || '';
        return DREAM_COMPANIES.some(dreamCompany => 
            companyName.toLowerCase().includes(dreamCompany.toLowerCase())
        );
    });
    
    console.log(`Filtered to ${dreamJobs.length} dream company jobs`);
    
    // Remove duplicates
    const uniqueJobs = dreamJobs.filter((job, index, self) => 
        index === self.findIndex(j => 
            j.job_title === job.job_title && 
            j.employer_name === job.employer_name &&
            j.job_city === job.job_city
        )
    );
    
    console.log(`After deduplication: ${uniqueJobs.length} unique jobs`);
    return uniqueJobs.slice(0, 25); // Limit to 25 for clean display
}

function generateJobTable(jobs) {
    if (jobs.length === 0) {
        return `| Company | Role | Location | Posted | Experience | Apply |
|---------|------|----------|--------|------------|-------|
| *No jobs found* | *Try again later* | *- * | *-* | *-* | *-* |`;
    }
    
    let table = `| Company | Role | Location | Posted | Experience | Apply |
|---------|------|----------|--------|------------|-------|
`;
    
    jobs.forEach(job => {
        const emoji = getCompanyEmoji(job.employer_name);
        const company = `${emoji} **${job.employer_name}**`;
        const role = job.job_title;
        const location = job.job_city && job.job_state ? `${job.job_city}, ${job.job_state}` : 
                        job.job_city || 'Remote';
        const posted = formatTimeAgo(job.job_posted_at_datetime_utc);
        const experience = getExperienceLevel(job.job_title, job.job_description || '');
        const applyLink = job.job_apply_link || getCompanyApplyLink(job.employer_name);
        
        table += `| ${company} | ${role} | ${location} | ${posted} | ${experience} | [Apply](${applyLink}) |\n`;
    });
    
    return table;
}

function generateCompanyStats(jobs) {
    const companyCount = {};
    jobs.forEach(job => {
        companyCount[job.employer_name] = (companyCount[job.employer_name] || 0) + 1;
    });
    
    return companyCount;
}

function generateCategoryFilters(jobs) {
    const categories = {
        'Mobile Development': jobs.filter(job => 
            job.job_title.toLowerCase().includes('ios') || 
            job.job_title.toLowerCase().includes('android') ||
            job.job_title.toLowerCase().includes('mobile')
        ),
        'Frontend Development': jobs.filter(job => 
            job.job_title.toLowerCase().includes('frontend') ||
            job.job_title.toLowerCase().includes('front-end') ||
            job.job_title.toLowerCase().includes('react') ||
            job.job_title.toLowerCase().includes('vue')
        ),
        'Backend Development': jobs.filter(job => 
            job.job_title.toLowerCase().includes('backend') ||
            job.job_title.toLowerCase().includes('back-end') ||
            job.job_title.toLowerCase().includes('api')
        ),
        'Machine Learning & AI': jobs.filter(job => 
            job.job_title.toLowerCase().includes('machine learning') ||
            job.job_title.toLowerCase().includes('ml ') ||
            job.job_title.toLowerCase().includes('ai ') ||
            job.job_title.toLowerCase().includes('artificial intelligence')
        ),
        'Data Science': jobs.filter(job => 
            job.job_title.toLowerCase().includes('data scientist') ||
            job.job_title.toLowerCase().includes('data analyst') ||
            job.job_title.toLowerCase().includes('analytics')
        ),
        'Security & DevOps': jobs.filter(job => 
            job.job_title.toLowerCase().includes('devops') ||
            job.job_title.toLowerCase().includes('security') ||
            job.job_title.toLowerCase().includes('infrastructure')
        ),
        'Product & Design': jobs.filter(job => 
            job.job_title.toLowerCase().includes('product') ||
            job.job_title.toLowerCase().includes('design') ||
            job.job_title.toLowerCase().includes('ux') ||
            job.job_title.toLowerCase().includes('ui')
        )
    };
    
    let filtersSection = '';
    
    Object.entries(categories).forEach(([category, categoryJobs]) => {
        if (categoryJobs.length > 0) {
            const icon = {
                'Mobile Development': '📱',
                'Frontend Development': '🎨',
                'Backend Development': '⚙️',
                'Machine Learning & AI': '🤖',
                'Data Science': '📊',
                'Security & DevOps': '🛡️',
                'Product & Design': '📱'
            }[category];
            
            filtersSection += `### ${icon} **${category}**\n`;
            categoryJobs.slice(0, 3).forEach(job => {
                const location = job.job_city && job.job_state ? `${job.job_city}, ${job.job_state}` : 
                               job.job_city || 'Remote';
                const applyLink = job.job_apply_link || getCompanyApplyLink(job.employer_name);
                filtersSection += `- [${job.employer_name} - ${job.job_title}](${applyLink}) - ${location}\n`;
            });
            filtersSection += '\n';
        }
    });
    
    return filtersSection;
}

async function updateReadme() {
    try {
        console.log('🚀 Starting README update...');
        
        // Fetch jobs from API
        const allJobs = await fetchAllJobs();
        const dreamJobs = filterDreamCompanyJobs(allJobs);
        
        if (dreamJobs.length === 0) {
            console.log('⚠️ No dream company jobs found, keeping existing README');
            return;
        }
        
        // Generate content
        const jobTable = generateJobTable(dreamJobs);
        const companyStats = generateCompanyStats(dreamJobs);
        const categoryFilters = generateCategoryFilters(dreamJobs);
        
        // Count experience levels
        const experienceLevels = {
            'Entry-Level': 0,
            'Mid-Level': 0,
            'Senior': 0
        };
        
        dreamJobs.forEach(job => {
            const level = getExperienceLevel(job.job_title, job.job_description || '');
            experienceLevels[level]++;
        });
        
        // Generate new README content
        const currentDate = new Date().toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        
        const readmeContent = `# 💼 Dream Jobs at Top Tech Companies

**🚀 Fresh opportunities from FAANG+ companies • Updated daily via automation**

> A curated list of the latest job openings at the most sought-after tech companies. All positions are for full-time roles at companies like Google, Apple, Microsoft, Amazon, Meta, and other industry leaders.

## 📊 **Quick Stats**
- **🔥 Active Jobs**: ${dreamJobs.length}
- **🏢 Companies**: ${Object.keys(companyStats).length} top-tier companies
- **📅 Last Updated**: ${currentDate}
- **🤖 Auto-Updated**: Daily via GitHub Actions

---

## 🎯 **Available Positions**

${jobTable}

---

## 🔍 **Filter by Category**

${categoryFilters}

---

## 📈 **Experience Level Breakdown**

| Level | Count | Percentage |
|-------|-------|------------|
| 🟢 **Entry-Level** | ${experienceLevels['Entry-Level']} | ${Math.round(experienceLevels['Entry-Level'] / dreamJobs.length * 100)}% |
| 🟡 **Mid-Level** | ${experienceLevels['Mid-Level']} | ${Math.round(experienceLevels['Mid-Level'] / dreamJobs.length * 100)}% |
| 🔴 **Senior** | ${experienceLevels['Senior']} | ${Math.round(experienceLevels['Senior'] / dreamJobs.length * 100)}% |

---

## 🤖 **Automation Features**

This repository is automatically updated daily using:

- **JSearch API**: Fetches latest job postings
- **GitHub Actions**: Runs daily at 9 AM UTC
- **Smart Filtering**: Only includes positions from dream companies
- **Duplicate Removal**: Ensures clean, unique listings
- **Auto-Formatting**: Maintains consistent table structure

---

## 📋 **How to Use This Repository**

1. **⭐ Star this repo** to get notifications of new opportunities
2. **👀 Watch** for daily updates
3. **🔍 Use Ctrl+F** to search for specific companies/roles
4. **📱 Bookmark** for quick access during job hunting
5. **📤 Share** with friends who are job hunting

---

## 🎯 **Why This is Better Than Other Job Boards**

✅ **Curated Quality**: Only top-tier companies<br>
✅ **Daily Updates**: Fresh opportunities every day<br>
✅ **Zero Spam**: No recruiting agency posts<br>
✅ **Direct Links**: Apply directly to company career pages<br>
✅ **Mobile Friendly**: Perfect GitHub mobile experience<br>
✅ **Always Free**: No premium subscriptions<br>
✅ **Open Source**: Transparent automation process<br>

---

## 🚀 **Quick Apply Tips**

- **Tailor your resume** for each specific role
- **Research the company** culture and recent news
- **Follow up** on applications after 1-2 weeks
- **Network** with employees on LinkedIn
- **Practice** common technical interview questions

---

## 📬 **Stay Updated**

- **⭐ Star this repository** for bookmarking
- **👀 Watch** to get notified of new opportunities  
- **🔔 Enable notifications** for instant updates
- **📱 Check daily** - positions fill quickly at top companies

---

## 🤝 **Contributing**

Found a broken link or want to suggest improvements?
- 🐛 **Report issues** in the Issues tab
- 💡 **Suggest features** via Pull Requests
- 📧 **Contact us** for major suggestions

---

<div align="center">

**💼 Found this helpful? Give it a ⭐ to support the project!**

*This repository is not affiliated with any of the companies listed. All job postings link directly to official company career pages.*

**Last Updated**: ${currentDate} • **Jobs Found**: ${dreamJobs.length} positions

</div>`;

        // Write to file
        fs.writeFileSync('README.md', readmeContent);
        console.log(`✅ README updated successfully with ${dreamJobs.length} jobs!`);
        
    } catch (error) {
        console.error('❌ Error updating README:', error);
        process.exit(1);
    }
}

// Run the update
updateReadme();
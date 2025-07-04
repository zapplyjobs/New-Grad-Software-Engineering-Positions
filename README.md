# Zapply - Job Application Platform (In Development)

A professional job application automation platform designed for new graduates and job seekers aged 18-25. Currently in development with a preview of our dream company job listings.

## Current Features (Preview)

- **Dream Company Jobs**: Curated job listings from top companies (FAANG+)
- **Daily Updates**: Fresh job listings updated daily
- **Career Resources**: Free guides, templates, and tips
- **Mobile-First Design**: Optimized for young professionals

## Planned Features (Coming Soon)

- **Smart Application Assistant**: AI-powered application automation
- **Application Dashboard**: Track all applications in one place
- **Smart Matching**: Personalized job recommendations
- **Advanced Analytics**: Application success insights

## Live Preview

Visit: [https://zapplyjobs.github.io/](https://zapplyjobs.github.io/)

**Note**: This is a preview version. The full platform is currently in development.

## Setup Instructions

### 1. GitHub Pages Setup

1. Push this repository to your GitHub organization: `zapplyjobs`
2. Go to repository Settings > Pages
3. Set source to "Deploy from a branch"
4. Select "main" branch and "/ (root)" folder
5. Your site will be available at `https://zapplyjobs.github.io/`

### 2. JSearch API Configuration

1. Sign up for RapidAPI: [https://rapidapi.com/](https://rapidapi.com/)
2. Subscribe to JSearch API (free tier): [https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch](https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch)
3. Replace `YOUR_RAPIDAPI_KEY_HERE` in `jobs.js` with your actual API key

### 3. Free Tier Limits

JSearch free tier includes:
- 100 requests per month
- 10 results per request
- Rate limit: 1 request per second

The current implementation:
- Caches results for 24 hours
- Searches 4 query batches with 1-second delays
- Limits to 50 total jobs displayed
- Filters for dream companies only

## File Structure

```
├── index.html          # Main landing page
├── dream-jobs.html     # Job board page
├── styles.css          # Main stylesheet
├── jobs.css           # Job board specific styles
├── script.js          # Main page JavaScript
├── jobs.js            # Job board JavaScript with API integration
└── README.md          # This file
```

## Dream Companies Included

- Google, Apple, Microsoft, Amazon, Meta
- Netflix, Tesla, Nvidia, Salesforce, Adobe
- Uber, Airbnb, Spotify, Stripe, OpenAI
- Anthropic, DeepMind, SpaceX, Palantir, Databricks

## Customization

### Adding More Companies
Edit the `DREAM_COMPANIES` array in `jobs.js`:

```javascript
const DREAM_COMPANIES = [
    'Google', 'Apple', 'Microsoft', 'Amazon', 'Meta',
    // Add more companies here
];
```

### Modifying Search Queries
Update the `searchQueries` array in `jobs.js`:

```javascript
const searchQueries = [
    'software engineer Google Apple Microsoft',
    'developer Amazon Meta Netflix',
    // Add more targeted searches
];
```

### Styling Changes
- Main styles: `styles.css`
- Job board styles: `jobs.css`
- Colors use CSS custom properties for easy theming

## Target Demographic

Designed for ages 18-25 with:
- Modern, clean design
- Mobile-first responsive layout
- Fast loading times
- Intuitive navigation
- Development transparency

## Security Notes

- Never commit API keys to the repository
- Use environment variables for production
- Implement proper CORS handling for production
- Add rate limiting for API calls

## Development Status

### ✅ Completed
- [x] Landing page with waitlist signup
- [x] Dream jobs board with API integration
- [x] Career resources page
- [x] Mobile-responsive design
- [x] Daily job updates automation

### 🚧 In Progress
- [ ] User authentication system
- [ ] Application automation engine
- [ ] User dashboard
- [ ] Payment processing
- [ ] Advanced AI features

### 📋 Upcoming
- [ ] Browser extension
- [ ] Mobile app
- [ ] Enterprise features
- [ ] API for third-party integrations

## Development Updates

This is an active development project. The website currently shows:
- Preview of core functionality
- Development banners indicating work-in-progress status
- Waitlist signup instead of direct registration
- Free career resources during development

## Support

For issues or questions about the preview, please contact the development team or create an issue in this repository.

## License

Copyright © 2024 Zapply. All rights reserved.
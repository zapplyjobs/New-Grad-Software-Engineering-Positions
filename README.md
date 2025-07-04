# Dream Jobs Board - Top Tech Companies

A focused GitHub page showcasing the latest job opportunities from dream companies like Google, Apple, Microsoft, Amazon, and more. Updated daily with fresh listings from the most sought-after tech companies.

## Live Site

🚀 **Visit**: [https://zapplyjobs.github.io/](https://zapplyjobs.github.io/)

## Features

- **Fresh Job Listings**: Latest opportunities from 20+ top tech companies
- **Smart Filtering**: Filter by company, location, and role type
- **Real-time Sorting**: Sort by date, company, or job title
- **Mobile Optimized**: Works perfectly on all devices
- **Daily Updates**: Automated job fetching via GitHub Actions
- **Professional Design**: Clean, modern interface

## Dream Companies Included

- **Big Tech**: Google, Apple, Microsoft, Amazon, Meta
- **Streaming & Media**: Netflix, Spotify
- **Innovation Leaders**: Tesla, Nvidia, OpenAI, Anthropic
- **Enterprise**: Salesforce, Adobe, Oracle
- **Emerging**: Stripe, Airbnb, Uber, Palantir, Databricks

## How It Works

### Sample Data Mode (Default)
- Displays realistic sample job listings
- Perfect for demonstration and testing
- All filters and sorting work perfectly
- 24 sample jobs from 10 top companies

### Live API Mode (When Configured)
1. Uses JSearch API from RapidAPI
2. Fetches real job listings daily
3. Filters for dream companies only
4. Caches results to respect rate limits

## Setup Instructions

### Basic Setup (GitHub Pages)
1. Fork or clone this repository
2. Enable GitHub Pages in repository settings
3. Select "main" branch as source
4. Your job board will be live!

### API Configuration (Optional)
1. Sign up for [RapidAPI](https://rapidapi.com/)
2. Subscribe to [JSearch API](https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch) (free tier available)
3. Replace `YOUR_RAPIDAPI_KEY_HERE` in `script.js` with your API key
4. Jobs will automatically update daily

## File Structure

```
├── index.html       # Main job board page
├── styles.css       # Responsive styling
├── script.js        # Job fetching and filtering logic
├── README.md        # This documentation
└── .github/
    └── workflows/
        └── update-jobs.yml  # Automated daily updates
```

## Features in Detail

### Filtering System
- **Company Filter**: Filter by specific companies
- **Location Filter**: Remote, San Francisco, New York, etc.
- **Role Filter**: Software Engineer, Frontend, Backend, etc.
- **Clear All**: Reset all filters instantly

### Sorting Options
- **Newest First**: Latest job postings
- **Oldest First**: Earliest postings
- **Company A-Z**: Alphabetical by company
- **Job Title A-Z**: Alphabetical by role

### Responsive Design
- **Mobile-first**: Optimized for smartphones
- **Tablet-friendly**: Great experience on tablets
- **Desktop-ready**: Full-featured desktop view

## Customization

### Adding More Companies
Edit the `DREAM_COMPANIES` array in `script.js`:

```javascript
const DREAM_COMPANIES = [
    'Google', 'Apple', 'Microsoft', 'Amazon', 'Meta',
    'YourCompany', 'AnotherCompany'  // Add here
];
```

### Modifying Sample Data
Edit the `companies` array in `generateSampleJobs()` function:

```javascript
const companies = [
    { name: 'Google', locations: ['Mountain View', 'New York', 'Remote'] },
    { name: 'YourCompany', locations: ['Your City', 'Remote'] }  // Add here
];
```

### Styling Changes
- Main styles: `styles.css`
- Modern CSS Grid and Flexbox layout
- CSS custom properties for easy theming
- Mobile-first responsive design

## API Rate Limits (JSearch Free Tier)

- **100 requests/month**: Carefully managed
- **10 results per request**: Optimized queries
- **24-hour caching**: Reduces API calls
- **Smart batching**: 4 search queries max

## Browser Support

- **Chrome** 70+
- **Firefox** 65+
- **Safari** 12+
- **Edge** 79+
- **Mobile browsers**: Full support

## Performance

- **Fast Loading**: Under 2 seconds
- **Efficient Filtering**: Instant results
- **Optimized Images**: SVG icons only
- **Minimal JavaScript**: ~15KB total

## Security & Privacy

- **No tracking**: No analytics or cookies
- **External links**: All job applications open in new tabs
- **API security**: Keys not exposed to client
- **HTTPS only**: Secure connections

## Deployment

### GitHub Pages (Recommended)
1. Push code to `main` branch
2. Enable Pages in repository settings
3. Select "main" branch as source
4. Site deploys automatically

### Custom Domain (Optional)
1. Add `CNAME` file with your domain
2. Configure DNS settings
3. Enable HTTPS in GitHub settings

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - feel free to use for personal or commercial projects.

## Support

For issues or questions:
- Create an issue in this repository
- Check existing issues for solutions
- Review the code documentation

---

**Note**: This is a job aggregation tool. We are not affiliated with any of the companies listed. All job applications redirect to official company career pages.
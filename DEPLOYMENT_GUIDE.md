# 🚀 Deployment Guide - InstantHPI6 to Netlify

## 📍 Deployment Target
- **Domain**: instanthpi.ca
- **Platform**: Netlify
- **Project**: InstantHPI6 Medical Practice Management System

## 🎯 What's Ready for Deployment
- ✅ Static frontend files in `dist/` folder
- ✅ Netlify serverless functions in `netlify/functions/`
- ✅ Netlify configuration in `netlify.toml`
- ✅ Build process configured in `package.json`

## 🚀 Deployment Steps

### 1. Connect to Netlify
```bash
# Install Netlify CLI (if not already installed)
npm install -g netlify-cli

# Login to Netlify
netlify login

# Navigate to project directory
cd /Users/carlosfavielfont/instanthpi-ollama
```

### 2. Deploy to Netlify
```bash
# Deploy the site
netlify deploy --prod --dir=dist

# Or use the Netlify dashboard to drag and drop the dist folder
```

### 3. Configure Environment Variables
In Netlify dashboard, set these environment variables:
- `JWT_SECRET` - Secret key for JWT tokens
- `DOCTOR_USERNAME` - Doctor's username (default: carlosfont)
- `DOCTOR_PASSWORD` - Doctor's password (default: CarlosFont2024!)
- `DOCTOR_EMAIL` - Doctor's email (default: cff@centremedicalfont.ca)
- `DOCTOR_OPENAI_KEY` - Doctor's OpenAI API key
- `DOCTOR_CLAUDE_KEY` - Doctor's Claude API key
- `DOCTOR_PREFERRED_AI_MODEL` - Preferred OpenAI model (default: gpt-4)
- `DOCTOR_PREFERRED_CLAUDE_MODEL` - Preferred Claude model (default: claude-3-sonnet-20240229)

### 4. Custom Domain Setup
- In Netlify dashboard, go to Domain settings
- Add custom domain: `instanthpi.ca`
- Configure DNS records as instructed by Netlify

## 📁 Deployment Structure
```
dist/
├── index.html          # Main dashboard page
├── dashboard.html      # Full dashboard (backup)
├── form.html          # Patient form
├── package.json       # Dependencies
├── server.js          # Server code (for reference)
└── instanthpi.db      # Database (for reference)

netlify/
└── functions/
    └── api.js         # Serverless API functions

netlify.toml           # Netlify configuration
```

## 🔧 API Endpoints (Serverless Functions)
- `POST /api/login` - User authentication
- `GET /api/dashboard` - Dashboard data
- `GET /api/doctor/settings` - Get AI settings
- `PUT /api/doctor/settings` - Update AI settings
- `POST /api/doctor/test-keys` - Test API keys

## 🎯 Features Available After Deployment
- ✅ JWT-based authentication (Dr. Carlos Faviel Font only)
- ✅ Medical dashboard with statistics
- ✅ AI settings configuration
- ✅ API key testing functionality
- ✅ Responsive design
- ✅ Secure headers and CORS

## 🔐 Security Features
- ✅ JWT token authentication
- ✅ CORS headers configured
- ✅ Security headers (X-Frame-Options, X-XSS-Protection, etc.)
- ✅ Rate limiting (via Netlify)
- ✅ Environment variable protection

## 📊 Post-Deployment Checklist
- [ ] Verify site loads at instanthpi.ca
- [ ] Test login functionality
- [ ] Verify dashboard displays correctly
- [ ] Test AI settings configuration
- [ ] Test API key validation
- [ ] Verify responsive design on mobile
- [ ] Check all API endpoints work
- [ ] Verify security headers

## 🆘 Troubleshooting

### Common Issues
1. **Build fails**: Check `netlify.toml` configuration
2. **API not working**: Verify serverless functions are deployed
3. **Login issues**: Check environment variables
4. **CORS errors**: Verify CORS headers in netlify.toml

### Debug Commands
```bash
# Check build locally
netlify build

# Test functions locally
netlify functions:serve

# View deployment logs
netlify logs
```

## 🔄 Updates and Maintenance
- To update: Make changes, run `npm run build`, redeploy
- Environment variables can be updated in Netlify dashboard
- Database changes require serverless function updates

---
**🎯 Ready for deployment! The system is configured for Netlify with all necessary files and settings.**



















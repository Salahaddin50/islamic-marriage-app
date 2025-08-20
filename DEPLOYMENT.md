# 🚀 Deployment Guide - Hume Islamic Marriage App

This guide explains how to deploy the Hume Islamic Marriage App to Vercel with automatic GitHub integration.

## 🎯 Overview

This project is configured for automatic deployment to Vercel when you push to GitHub. The setup includes:

- **Automatic builds** on every push to `main`
- **Preview deployments** for pull requests
- **Production deployment** from the main branch
- **Environment variable management**
- **Build optimization for web**

## 📋 Prerequisites

Before deploying, ensure you have:

1. **Node.js 18+** installed
2. **Git** configured
3. **GitHub account** for repository hosting
4. **Vercel account** (free tier available)
5. **Environment variables** properly configured

## 🔧 Setup Steps

### 1. Prepare Your Environment

1. Copy the environment example:
   ```bash
   cp env.example .env
   ```

2. Fill in your actual environment variables:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=your_actual_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_actual_key
   # ... other variables
   ```

### 2. GitHub Repository Setup

1. Create a new repository on GitHub
2. Push your code:
   ```bash
   git add .
   git commit -m "Initial deployment setup"
   git push origin main
   ```

### 3. Vercel Setup

#### Option A: Automatic Setup (Recommended)

1. Go to [vercel.com](https://vercel.com)
2. Sign in with your GitHub account
3. Click "Import Project"
4. Select your repository
5. Vercel will automatically detect the configuration

#### Option B: Manual Setup with CLI

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Login and deploy:
   ```bash
   vercel login
   vercel --prod
   ```

### 4. Environment Variables in Vercel

In your Vercel dashboard:

1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add all variables from your `.env` file
4. Make sure to set the appropriate environment (Production, Preview, Development)

**Required Environment Variables:**
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`
- Any other variables specific to your setup

### 5. GitHub Actions Setup (Optional)

If you want to use GitHub Actions for deployment:

1. Add these secrets to your GitHub repository:
   - `VERCEL_TOKEN` (from Vercel account settings)
   - `VERCEL_ORG_ID` (from Vercel project settings)
   - `VERCEL_PROJECT_ID` (from Vercel project settings)

2. The workflow file is already included at `.github/workflows/deploy.yml`

## 🏗️ Build Configuration

The project includes optimized build settings:

### Package.json Scripts
```json
{
  "build:production": "expo export --platform web --clear",
  "deploy": "npm run build:production",
  "type-check": "tsc --noEmit"
}
```

### Vercel Configuration
```json
{
  "buildCommand": "npm run build:production",
  "outputDirectory": "dist",
  "framework": null
}
```

## 🔄 Automatic Deployment Workflow

Once set up, the deployment workflow is:

1. **Push to main branch** → **Production deployment**
2. **Create pull request** → **Preview deployment**
3. **Environment variables** are automatically applied
4. **Build logs** are available in Vercel dashboard

## 🌍 Domain Configuration

### Custom Domain Setup

1. In Vercel dashboard, go to your project
2. Navigate to "Settings" → "Domains"
3. Add your custom domain
4. Follow DNS configuration instructions

### SSL Certificate

Vercel automatically provides SSL certificates for all domains.

## 📊 Monitoring & Analytics

### Deployment Monitoring
- View build logs in Vercel dashboard
- Monitor deployment status and performance
- Set up error tracking with Sentry (optional)

### Performance Optimization
- Automatic static asset optimization
- Image optimization enabled
- CDN distribution worldwide

## 🚨 Troubleshooting

### Common Issues

1. **Build Failures**
   - Check build logs in Vercel dashboard
   - Ensure all dependencies are properly installed
   - Verify environment variables are set

2. **Environment Variable Issues**
   - Ensure all required variables are set in Vercel
   - Check variable names match exactly (case-sensitive)
   - Redeploy after adding variables

3. **OAuth Issues**
   - Update OAuth redirect URLs in your providers
   - Add Vercel domain to authorized origins
   - Check environment-specific client IDs

### Build Commands

```bash
# Local development
npm run web

# Production build (local testing)
npm run build:production

# Type checking
npm run type-check

# Linting
npm run lint
```

## 🔐 Security Considerations

1. **Environment Variables**
   - Never commit actual API keys to git
   - Use different keys for production and development
   - Regularly rotate sensitive credentials

2. **OAuth Configuration**
   - Restrict OAuth domains to your actual domains
   - Use HTTPS in production
   - Validate redirect URLs

3. **Content Security**
   - Headers are configured in vercel.json
   - Enable content moderation features
   - Monitor for security vulnerabilities

## 📞 Support

For deployment issues:

1. Check Vercel documentation
2. Review build logs for errors
3. Verify environment variable configuration
4. Contact support if needed

## 🎉 Success!

Once deployed, your app will be available at:
- **Production**: `https://your-project.vercel.app`
- **Custom domain**: `https://yourdomain.com` (if configured)

The app will automatically update with each push to the main branch!

---

**Happy Deploying! 🚀**

*May Allah bless your project and help connect righteous people in marriage. Ameen.* 🤲

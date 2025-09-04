# Vercel Deployment Guide for Zawajplus Islamic Dating App

This guide provides detailed instructions on how to deploy the Zawajplus Islamic Dating App to Vercel, a platform for hosting web applications.

## Prerequisites

Before you begin, ensure you have the following:
- A Vercel account ([Sign up here](https://vercel.com/signup))
- GitHub repository with the Zawajplus app codebase
- Node.js and npm installed on your local machine

## Step 1: Prepare Your Project for Deployment

1. **Ensure your project structure** is correct. The Zawajplus app should be in `main/Zawajplus/` directory.
2. **Check your `vercel.json` configuration** at the root of your repository. It should look like this:

    ```json
    {
      "buildCommand": "cd main/Zawajplus && npx expo export:web",
      "outputDirectory": "main/Zawajplus/web-build",
      "devCommand": "cd main/Zawajplus && npx expo start --web",
      "installCommand": "cd main/Zawajplus && npm install",
      "framework": null,
      "cleanUrls": true,
      "trailingSlash": false,
      "routes": [
        { "handle": "filesystem" },
        { "src": "/(.*)", "dest": "/index.html" }
      ],
      "headers": [
        {
          "source": "/(.*)",
          "headers": [
            {
              "key": "X-Content-Type-Options",
              "value": "nosniff"
            },
            {
              "key": "X-Frame-Options",
              "value": "DENY"
            },
            {
              "key": "X-XSS-Protection",
              "value": "1; mode=block"
            }
          ]
        },
        {
          "source": "/static/(.*)",
          "headers": [
            {
              "key": "Cache-Control",
              "value": "public, max-age=31536000, immutable"
            }
          ]
        },
        {
          "source": "/(.*.css)$",
          "headers": [
            {
              "key": "Content-Type",
              "value": "text/css"
            }
          ]
        },
        {
          "source": "/(.*.js)$",
          "headers": [
            {
              "key": "Content-Type",
              "value": "application/javascript"
            }
          ]
        }
      ]
    }
    ```

   This configuration ensures that Vercel builds the Expo web app correctly and routes all requests to `index.html` for client-side routing.

3. **Test the build locally** (optional but recommended):
   - Navigate to `main/Zawajplus`
   - Run `npx expo export:web`
   - Check if `web-build` directory is created with `index.html` and other assets

## Step 2: Connect Your Repository to Vercel

1. Log in to your Vercel account.
2. Click on **New Project**.
3. Select **Import Git Repository** and choose your Zawajplus app repository from GitHub.
4. Vercel will automatically detect the `vercel.json` configuration and set up the build settings accordingly.

## Step 3: Configure Build Settings (if needed)

If Vercel doesn't automatically configure based on `vercel.json`, manually set:
- **Build Command**: `cd main/Zawajplus && npx expo export:web`
- **Output Directory**: `main/Zawajplus/web-build`
- **Install Command**: `cd main/Zawajplus && npm install`

## Step 4: Deploy Your App

1. Click **Deploy** on Vercel.
2. Wait for the build to complete. You can monitor the build logs for any errors.
3. Once deployed, Vercel will provide a URL for your app (e.g., `https://your-app-name.vercel.app`).

## Troubleshooting Common Issues

### 404 Not Found Error

If you encounter a 404 error after deployment:
- Ensure your `vercel.json` has the correct routing configuration as shown above.
- Verify that the `web-build` directory contains `index.html` after the build.
- Check if your Expo app's client-side routing is correctly set up in `app/_layout.tsx`.

### Build Errors

- Check if all dependencies are correctly listed in `package.json`.
- Ensure Node.js version compatibility (use the version specified in `.nvmrc` if present).

## Additional Notes

- For continuous deployment, set up Vercel to automatically deploy on every push to your main branch in GitHub.
- If you update environment variables or other configurations, redeploy the app for changes to take effect.

If issues persist, reach out to Vercel support or check the Expo documentation for web deployment specifics.

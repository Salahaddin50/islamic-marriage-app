# Google OAuth Setup for Zawajplus Islamic Dating App

## 🎯 Overview
This guide will help you set up Google OAuth authentication for your Islamic dating app using Supabase.

## 📋 Prerequisites
- Supabase project set up
- Google Cloud Console access
- Your app deployed or running locally

## 🔧 Step 1: Google Cloud Console Setup

### 1.1 Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Name it something like "Zawajplus Islamic Dating App"

### 1.2 Enable Google+ API
1. Go to **APIs & Services > Library**
2. Search for "Google+ API"
3. Click **Enable**

### 1.3 Create OAuth Credentials
1. Go to **APIs & Services > Credentials**
2. Click **Create Credentials > OAuth 2.0 Client IDs**
3. Select **Web application**
4. Configure:
   - **Name**: `Zawajplus Islamic Dating Web Client`
   - **Authorized JavaScript origins**:
     - `http://localhost:8081` (for development)
     - `http://localhost:8082` (backup port)
     - `https://yourdomain.com` (for production)
   - **Authorized redirect URIs**:
     - `https://rpzkugodaacelruquhtc.supabase.co/auth/v1/callback`
     - (Replace with your actual Supabase URL)

### 1.4 Save Credentials
- Copy the **Client ID** and **Client Secret**
- You'll need these for Supabase configuration

## 🔧 Step 2: Supabase Configuration

### 2.1 Enable Google Provider
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `rpzkugodaacelruquhtc`
3. Navigate to **Authentication > Providers**
4. Find **Google** and toggle it **ON**

### 2.2 Configure Google Settings
1. **Client ID**: Paste from Google Cloud Console
2. **Client Secret**: Paste from Google Cloud Console
3. **Redirect URL**: Should auto-populate as:
   ```
   https://rpzkugodaacelruquhtc.supabase.co/auth/v1/callback
   ```

### 2.3 Additional Settings
- ✅ **Skip email confirmation**: Enabled (Google accounts are pre-verified)
- ✅ **Auto confirm users**: Enabled for OAuth
- 🔧 **Custom SMTP**: Optional (configure if you want custom emails)

## 🔧 Step 3: App Configuration

### 3.1 Environment Variables
Update your `.env` file:
```env
EXPO_PUBLIC_SUPABASE_URL=https://rpzkugodaacelruquhtc.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

### 3.2 OAuth Redirect URLs
The app is already configured to use:
- **Development**: `http://localhost:8082/auth/callback`
- **Production**: `https://yourdomain.com/auth/callback`

## 🧪 Step 4: Testing

### 4.1 Development Testing
1. Start your development server:
   ```bash
   cd main/Zawajplus
   npm start
   ```
2. Open in web browser
3. Go to Login or Signup page
4. Click "Continue with Google"
5. Complete Google OAuth flow

### 4.2 Expected Flow
1. **User clicks Google button**
2. **Redirects to Google OAuth**
3. **User authorizes app**
4. **Redirects to `/auth/callback`**
5. **New users**: Go to profile setup
6. **Existing users**: Go to main app

## 🚨 Troubleshooting

### Common Issues

#### 1. "redirect_uri_mismatch" Error
- Check that your redirect URI in Google Cloud Console matches exactly
- Include protocol (http/https)
- No trailing slashes

#### 2. "OAuth Error in URL" 
- Check Supabase project URL is correct
- Verify Google credentials in Supabase dashboard
- Ensure Google+ API is enabled

#### 3. "Popup Blocked"
- Modern browsers block popups
- OAuth will use redirect flow instead
- This is normal and expected behavior

#### 4. CORS Issues
- Ensure your domain is in Google Cloud Console origins
- Check Supabase CORS settings if needed

### Debug Steps
1. **Check Browser Console** for detailed error messages
2. **Verify Supabase Logs** in dashboard
3. **Test with different browser** (incognito mode)
4. **Check Network tab** for failed requests

## 🔐 Security Notes

### For Production
1. **Update redirect URIs** to your production domain
2. **Remove localhost** from authorized origins
3. **Enable additional security** features in Google Cloud Console
4. **Monitor OAuth usage** in both platforms

### Best Practices
- ✅ Use HTTPS in production
- ✅ Regularly rotate client secrets
- ✅ Monitor authentication logs
- ✅ Implement proper error handling

## 📱 Islamic Marriage Features

### Auto-Profile Creation
When users sign in with Google for the first time:
1. ✅ **Basic profile created** from Google account
2. 🔄 **Redirected to profile setup** for Islamic preferences
3. 📝 **Complete Islamic questionnaire** (polygamy preferences, etc.)
4. 🎯 **Ready for matching** in the Islamic community

### Data Collection
- **From Google**: Name, email, profile picture
- **From User**: Islamic preferences, marriage intentions, location
- **Privacy**: Only Islamic-relevant data is collected

## 🆘 Need Help?

If you encounter issues:
1. Check this documentation first
2. Verify all URLs and credentials
3. Test in incognito/private browsing mode
4. Check Supabase and Google Cloud Console logs

## ✅ Completion Checklist

- [ ] Google Cloud project created
- [ ] OAuth credentials configured
- [ ] Supabase Google provider enabled
- [ ] Environment variables updated
- [ ] Development testing successful
- [ ] Production URLs configured (when ready)

Your Islamic dating app now supports Google OAuth with automatic profile setup! 🎉

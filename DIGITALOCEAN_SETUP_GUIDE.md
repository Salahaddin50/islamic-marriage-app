# 🌊 DigitalOcean Spaces Setup for Islamic Marriage App

## 📋 **STEP-BY-STEP SETUP**

### **Step 1: Create DigitalOcean Account**
1. Go to [DigitalOcean.com](https://digitalocean.com)
2. Sign up for account (get $200 free credit with referral links)
3. Verify your email and add payment method

### **Step 2: Create a Space**
1. **Login to DigitalOcean Dashboard**
2. **Click "Create" → "Spaces Object Storage"**
3. **Configure Space:**
   - **Region:** Choose closest to your users (e.g., NYC3, SGP1, LON1)
   - **Enable CDN:** ✅ YES (free global CDN)
   - **Restrict File Listing:** ✅ YES (for privacy)
   - **Space Name:** `islamic-marriage-media` (must be unique globally)
4. **Click "Create a Space"**

### **Step 3: Generate API Keys**
1. **Go to API → Spaces Keys**
2. **Click "Generate New Key"**
3. **Name:** `Islamic Marriage App Key`
4. **Save:**
   - `Spaces Access Key ID` 
   - `Spaces Secret Access Key`
   - **⚠️ Important:** Copy secret key now (won't be shown again)

### **Step 4: Get Space Information**
After creation, note:
- **Space Name:** `islamic-marriage-media`
- **Region:** `nyc3` (example)
- **Endpoint:** `https://nyc3.digitaloceanspaces.com`
- **CDN Endpoint:** `https://islamic-marriage-media.nyc3.cdn.digitaloceanspaces.com`

## 🔧 **ENVIRONMENT CONFIGURATION**

### **Add to your `.env` file:**
```bash
# DigitalOcean Spaces Configuration
EXPO_PUBLIC_DO_SPACES_KEY=your_spaces_access_key_id
EXPO_PUBLIC_DO_SPACES_SECRET=your_spaces_secret_access_key
EXPO_PUBLIC_DO_SPACES_NAME=islamic-marriage-media
EXPO_PUBLIC_DO_SPACES_REGION=nyc3
EXPO_PUBLIC_DO_SPACES_ENDPOINT=https://nyc3.digitaloceanspaces.com
EXPO_PUBLIC_DO_SPACES_CDN=https://islamic-marriage-media.nyc3.cdn.digitaloceanspaces.com

# App Settings
EXPO_PUBLIC_MAX_PHOTO_SIZE=10485760  # 10MB
EXPO_PUBLIC_MAX_VIDEO_SIZE=104857600  # 100MB
```

## 💡 **PRICING BREAKDOWN**

### **DigitalOcean Spaces Pricing:**
- **Storage:** $0.02/GB/month after 250GB
- **Bandwidth:** $0.01/GB after 1TB/month  
- **Base Plan:** $5/month includes:
  - 250GB storage
  - 1TB outbound transfer
  - Built-in CDN (worldwide)
  - 99.9% uptime SLA

### **Cost Examples for Islamic Marriage App:**
| Users | Photos | Videos | Monthly Cost |
|-------|--------|--------|--------------|
| 1,000 | 50GB | 20GB | $5 |
| 5,000 | 200GB | 100GB | $5-8 |
| 10,000 | 400GB | 200GB | $8-15 |
| 50,000 | 1TB | 500GB | $25-40 |

## 🛡️ **SECURITY FEATURES**

### **Built-in Security:**
- ✅ **Private by default** - Files not publicly listable
- ✅ **Access control** - Fine-grained permissions
- ✅ **HTTPS only** - Encrypted data transfer
- ✅ **Regional compliance** - Choose data location

### **Islamic App Privacy:**
- ✅ **User-specific folders** - Organize by user ID
- ✅ **Visibility controls** - Public/private/matched-only
- ✅ **Content moderation** - Easy file management
- ✅ **Audit trails** - Track access and changes

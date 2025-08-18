# 🚀 DigitalOcean Spaces Installation Guide

## 📦 **INSTALL DEPENDENCIES**

### **Step 1: Install AWS SDK**
```bash
cd main/Hume
npm install aws-sdk
npm install @types/aws-sdk --save-dev
```

### **Step 2: Install Additional Dependencies**
```bash
# For file handling and utilities
npm install buffer
npm install @expo/vector-icons

# For environment variables
npm install react-native-dotenv
```

### **Step 3: Update package.json**
Your `package.json` should include:
```json
{
  "dependencies": {
    "aws-sdk": "^2.1519.0",
    "buffer": "^6.0.3",
    "@expo/vector-icons": "^14.0.2"
  },
  "devDependencies": {
    "@types/aws-sdk": "^2.7.0"
  }
}
```

## ⚙️ **ENVIRONMENT SETUP**

### **Step 1: Create .env file**
Create `.env` file in `main/Hume/`:
```bash
# DigitalOcean Spaces Configuration
EXPO_PUBLIC_DO_SPACES_KEY=your_spaces_access_key_id
EXPO_PUBLIC_DO_SPACES_SECRET=your_spaces_secret_access_key
EXPO_PUBLIC_DO_SPACES_NAME=islamic-marriage-media
EXPO_PUBLIC_DO_SPACES_REGION=nyc3
EXPO_PUBLIC_DO_SPACES_ENDPOINT=https://nyc3.digitaloceanspaces.com
EXPO_PUBLIC_DO_SPACES_CDN=https://islamic-marriage-media.nyc3.cdn.digitaloceanspaces.com

# File size limits
EXPO_PUBLIC_MAX_PHOTO_SIZE=10485760
EXPO_PUBLIC_MAX_VIDEO_SIZE=104857600
```

### **Step 2: Update app.config.js**
Add environment plugin to `app.config.js`:
```javascript
module.exports = {
  expo: {
    name: "Hume",
    // ... existing config
    plugins: [
      [
        "expo-build-properties",
        {
          android: {
            packagingOptions: {
              pickFirst: ["**/libc++_shared.so", "**/libjsc.so"]
            }
          }
        }
      ]
    ]
  }
};
```

## 🔧 **DATABASE UPDATES**

### **Add DigitalOcean columns to media_references table:**
```sql
-- Add DigitalOcean specific columns
ALTER TABLE media_references 
ADD COLUMN IF NOT EXISTS do_spaces_key VARCHAR(500),
ADD COLUMN IF NOT EXISTS do_spaces_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS do_spaces_cdn_url VARCHAR(500);

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_media_references_do_key 
ON media_references(do_spaces_key);

-- Add index for user media queries
CREATE INDEX IF NOT EXISTS idx_media_references_user_type 
ON media_references(user_id, media_type);
```

## 🔄 **UPDATE YOUR EXISTING CODE**

### **Step 1: Update PhotosVideosAPI**
Replace your existing upload calls:

**Before:**
```typescript
// Old way
const result = await PhotosVideosService.uploadMediaItem(file, 'photo', options);
```

**After:**
```typescript
// New DigitalOcean way
import { MediaIntegrationService } from '../services/media-integration.service';

const result = await MediaIntegrationService.uploadMedia(file, {
  userId: 'current-user-id',
  mediaType: 'photo',
  isProfilePicture: options.isProfilePicture,
  visibility: options.visibility
});
```

### **Step 2: Update Frontend (app/photosvideos.tsx)**
Replace import in your photos page:
```typescript
// Update this import
import { MediaIntegrationService } from '../src/services/media-integration.service';

// Update upload method
const result = await MediaIntegrationService.uploadMedia(blob, {
  userId: user.id, // Get from auth
  mediaType: type,
  visibility: 'private'
});
```

## 🧪 **TESTING SETUP**

### **Test your DigitalOcean connection:**
```typescript
// Test file: test-digitalocean.ts
import { DigitalOceanMediaService } from './src/services/digitalocean-media.service';

// Test connection
async function testConnection() {
  try {
    const stats = await DigitalOceanMediaService.getUserStorageStats('test-user');
    console.log('✅ DigitalOcean connection successful!', stats);
  } catch (error) {
    console.error('❌ DigitalOcean connection failed:', error);
  }
}

testConnection();
```

## 🚀 **DEPLOYMENT CHECKLIST**

### **Before going live:**
- [ ] ✅ DigitalOcean Space created
- [ ] ✅ API keys generated and secured
- [ ] ✅ Environment variables set
- [ ] ✅ Database columns added
- [ ] ✅ CDN enabled on Space
- [ ] ✅ File upload tested
- [ ] ✅ File deletion tested
- [ ] ✅ Profile picture setting tested
- [ ] ✅ Media visibility working
- [ ] ✅ Error handling tested

## 💡 **BEST PRACTICES**

### **Security:**
- ✅ Never commit `.env` files
- ✅ Use different Spaces for dev/prod
- ✅ Implement file type validation
- ✅ Set up proper CORS rules
- ✅ Monitor usage and costs

### **Performance:**
- ✅ Use CDN URLs for all media display
- ✅ Implement image lazy loading
- ✅ Compress files before upload
- ✅ Use appropriate image sizes
- ✅ Cache thumbnails locally

### **Islamic App Considerations:**
- ✅ Default to private visibility
- ✅ Implement content moderation
- ✅ Respect user privacy settings
- ✅ Provide easy media deletion
- ✅ Secure profile pictures

## 🎉 **YOU'RE READY!**

After completing these steps, your Islamic marriage app will have:
- ✅ **Fast global media delivery** via DigitalOcean CDN
- ✅ **Predictable pricing** starting at $5/month
- ✅ **Scalable storage** for millions of photos/videos
- ✅ **Secure private media** with access controls
- ✅ **Professional architecture** following best practices

Your media system is now production-ready! 🌊

# Agora Video Calling Setup Guide

This guide will help you set up proper Agora video calling integration for your Hume dating app.

## Current Status ✅

- ✅ Agora Web SDK integration (working on web)
- ✅ `react-native-agora` package installed (v4.5.3)
- ✅ Native video calling implementation enabled
- ✅ Token service for secure authentication
- ✅ Environment configuration setup

## Quick Start

### 1. Get Your Agora Credentials

1. Visit [Agora Console](https://console.agora.io/)
2. Sign up or log in to your account
3. Create a new project:
   - Click "Create Project"
   - Choose **"Secure mode: APP ID + Token"** (recommended for production)
   - Note down your **App ID** and **App Certificate**

### 2. Configure Your App

1. Copy `env.example` to `.env`:
   ```bash
   cp env.example .env
   ```

2. Update your `.env` file with your Agora credentials:
   ```env
   EXPO_PUBLIC_AGORA_APP_ID=your_actual_agora_app_id_here
   EXPO_PUBLIC_TOKEN_SERVER_URL=https://your-token-server.com
   ```

### 3. Deploy Token Server (Production Only)

For production, you need a secure token server. Use the provided `token-server-example.js`:

1. **Install dependencies:**
   ```bash
   npm install express agora-access-token
   ```

2. **Update the server with your credentials:**
   ```javascript
   const APP_ID = 'your_agora_app_id';
   const APP_CERTIFICATE = 'your_agora_app_certificate';
   ```

3. **Deploy to your preferred platform:**
   - Heroku, Railway, DigitalOcean, AWS, etc.
   - Update `EXPO_PUBLIC_TOKEN_SERVER_URL` in your `.env`

### 4. Test Your Setup

1. **Build and run your app:**
   ```bash
   # For iOS
   npx expo run:ios
   
   # For Android  
   npx expo run:android
   
   # For Web
   npx expo start --web
   ```

2. **Test video calling:**
   - Navigate to a user profile
   - Tap "Video meet" button
   - Accept the meet request
   - Start the video call

## Development vs Production

### Development Mode
- Uses test App ID: `027ee1488c5a4188bdc04fe44853cda8`
- No token server required (uses `AGORA_TEMP_TOKEN: null`)
- Works for testing but has limitations

### Production Mode
- Requires your own Agora App ID
- Requires token server for security
- Supports unlimited concurrent users
- Better performance and reliability

## How Video Calls Work

### Web Implementation
- Uses Agora Web SDK 4.18.0
- Embedded in WebView modal
- Automatic camera/microphone access
- Full-screen video experience

### Native Implementation (iOS/Android)
- Uses `react-native-agora` v4.5.3
- Native video rendering for better performance
- Picture-in-picture support
- Hardware acceleration

### Call Flow
1. User taps "Video meet" → sends meet request
2. Other user approves → creates unique channel ID
3. Both users join the same Agora channel
4. Real-time video/audio communication begins
5. Either user can end the call

## Troubleshooting

### Common Issues

**1. "Authentication Error" on Web**
- Your App ID requires a certificate and token
- Either disable certificate in Agora Console (dev only)
- Or set up proper token server (recommended)

**2. Native calls not working**
- Ensure `react-native-agora` is properly linked
- Check iOS/Android permissions for camera/microphone
- Rebuild the app after installing Agora SDK

**3. Token server errors**
- Verify your App Certificate is correct
- Check token server URL is accessible
- Ensure proper CORS settings if needed

### Permissions Required

**iOS (ios/Info.plist):**
```xml
<key>NSCameraUsageDescription</key>
<string>This app needs camera access for video calls</string>
<key>NSMicrophoneUsageDescription</key>
<string>This app needs microphone access for video calls</string>
```

**Android (android/app/src/main/AndroidManifest.xml):**
```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
```

## Security Best Practices

1. **Never expose App Certificate in client code**
2. **Always use token server for production**
3. **Implement proper user authentication**
4. **Set reasonable token expiration times**
5. **Monitor usage and costs in Agora Console**

## Cost Optimization

- Agora charges based on usage (minutes)
- First 10,000 minutes/month are free
- Monitor usage in Agora Console
- Consider implementing call time limits
- Use audience role for viewers to save costs

## Token Server Example

Here's a complete Node.js token server implementation:

```javascript
// token-server.js
const express = require('express');
const { RtcTokenBuilder, RtcRole } = require('agora-access-token');

const app = express();
app.use(express.json());

// Your Agora credentials (keep these secret!)
const APP_ID = 'your_agora_app_id';
const APP_CERTIFICATE = 'your_agora_app_certificate';

// Generate RTC token
app.post('/generate-token', (req, res) => {
  try {
    const { channelName, uid, role = 'publisher' } = req.body;
    
    if (!channelName) {
      return res.status(400).json({ error: 'Channel name is required' });
    }

    // Set token expiration time (24 hours from now)
    const expirationTimeInSeconds = 3600 * 24;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    // Determine role
    const rtcRole = role === 'audience' ? RtcRole.SUBSCRIBER : RtcRole.PUBLISHER;

    // Generate token
    const token = RtcTokenBuilder.buildTokenWithUid(
      APP_ID,
      APP_CERTIFICATE,
      channelName,
      uid || 0,
      rtcRole,
      privilegeExpiredTs
    );

    res.json({
      token,
      appId: APP_ID,
      channelName,
      uid: uid || 0,
      expiresAt: privilegeExpiredTs
    });

  } catch (error) {
    console.error('Token generation error:', error);
    res.status(500).json({ error: 'Failed to generate token' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Agora Token Server running on port ${PORT}`);
});
```

**Package.json for token server:**
```json
{
  "name": "agora-token-server",
  "version": "1.0.0",
  "main": "token-server.js",
  "dependencies": {
    "express": "^4.18.2",
    "agora-access-token": "^2.0.4"
  },
  "scripts": {
    "start": "node token-server.js"
  }
}
```

## Support

- [Agora Documentation](https://docs.agora.io/)
- [React Native Agora SDK](https://github.com/AgoraIO-Community/react-native-agora)
- [Agora Community](https://www.agora.io/en/community/)

---

**Next Steps:**
1. Get your Agora credentials
2. Update your `.env` file  
3. Deploy token server (for production)
4. Test video calling functionality
5. Configure permissions for mobile apps

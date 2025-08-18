# 🕌 Islamic Marriage Dating App - Hume

A modern, secure, and Islamic-compliant dating application built with React Native, Expo, and TypeScript. Designed specifically for Muslim singles seeking marriage partners with Islamic values and principles.

## ✨ Features

### 🎯 Core Functionality
- **Islamic-compliant matching** system with religious preferences
- **Secure authentication** with Google OAuth integration
- **Photo & video uploads** with DigitalOcean Spaces integration
- **Real-time messaging** and video calling
- **Advanced filtering** by Islamic preferences (Prayer frequency, Hijab preference, etc.)
- **Profile verification** with ID card and selfie verification
- **Cross-platform support** (iOS, Android, Web)

### 🕌 Islamic Features
- **Halal matching** based on Islamic principles
- **Religious preferences** questionnaire
- **Privacy-focused** design respecting Islamic values
- **Family involvement** options
- **Islamic calendar** integration
- **Prayer time** awareness
- **Modest photo** guidelines and enforcement

### 🔒 Security & Privacy
- **Multi-factor authentication**
- **Profile verification** with government ID
- **End-to-end encryption** for messages
- **Privacy controls** for profile visibility
- **Secure media storage** with DigitalOcean

## 🛠️ Tech Stack

### Frontend
- **React Native 0.76.5** - Cross-platform mobile development
- **Expo 52** - Development platform and build service
- **TypeScript 5.3.3** - Type-safe JavaScript
- **React Native Web** - Web platform support
- **Expo Router** - File-based navigation

### Backend & Services
- **Supabase** - Backend-as-a-Service with PostgreSQL
- **DigitalOcean Spaces** - Cloud storage for media files
- **Google OAuth** - Authentication service
- **Real-time subscriptions** - Live chat and notifications

### Development Tools
- **Metro** - JavaScript bundler
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Git** - Version control

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm/yarn
- Expo CLI (`npm install -g @expo/cli`)
- Git
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Salahaddin50/islamic-marriage-app.git
   cd islamic-marriage-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment setup**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

4. **Start development server**
   ```bash
   # For web
   npx expo start --web
   
   # For mobile (requires Expo Go app)
   npx expo start
   ```

### Environment Variables
Create a `.env` file with the following variables:

```env
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# DigitalOcean Spaces
EXPO_PUBLIC_DO_SPACES_ENDPOINT=your_spaces_endpoint
EXPO_PUBLIC_DO_SPACES_BUCKET=your_bucket_name
EXPO_PUBLIC_DO_ACCESS_KEY=your_access_key
EXPO_PUBLIC_DO_SECRET_KEY=your_secret_key

# Google OAuth
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your_google_client_id
```

## 📱 Platform Support

| Platform | Status | Notes |
|----------|--------|--------|
| **iOS** | ✅ Supported | Requires iOS 13+ |
| **Android** | ✅ Supported | Requires Android 6.0+ |
| **Web** | ✅ Supported | Modern browsers |

## 🔧 Development

### Project Structure
```
src/
├── api/              # API integration
├── components/       # Reusable UI components
├── config/           # Configuration files
├── contexts/         # React contexts
├── database/         # Database schemas
├── screens/          # Screen components
├── services/         # Business logic services
├── types/            # TypeScript type definitions
└── utils/            # Utility functions

app/                  # Expo Router pages
components/           # UI components
constants/           # App constants
data/                # Static data
hooks/               # Custom React hooks
```

### Key Services
- **Authentication**: Google OAuth, email/password, phone verification
- **Media Management**: DigitalOcean Spaces integration for photos/videos
- **Islamic Matching**: Religious preference-based matching algorithm
- **Profile Management**: Comprehensive user profiles with Islamic preferences
- **Messaging**: Real-time chat with Islamic moderation

## 🕌 Islamic Compliance Features

### Matching Criteria
- **Religious Practice Level** (Very religious, Moderate, etc.)
- **Prayer Frequency** (5 times daily, Sometimes, etc.)
- **Hijab Preference** (Yes, No, Doesn't matter)
- **Beard Preference** (Yes, No, Doesn't matter)
- **Islamic Education** (Formal Islamic education, Self-taught, etc.)
- **Family Values** (Traditional, Modern, Balanced)

### Privacy & Modesty
- **Photo Guidelines** - Modest photo requirements
- **Chat Moderation** - Inappropriate content filtering
- **Profile Privacy** - Control who can see your profile
- **Family Involvement** - Options for family member access

## 🚀 Deployment

### Mobile Apps
```bash
# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android
```

### Web Deployment
```bash
# Build for web
npx expo export --platform web

# Deploy to your preferred hosting service
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Islamic scholars for guidance on halal dating principles
- Muslim community for feedback and feature requests
- Open source community for amazing tools and libraries

## 📞 Support

For support and inquiries:
- **Email**: support@islamicmarriageapp.com
- **GitHub Issues**: [Create an issue](https://github.com/Salahaddin50/islamic-marriage-app/issues)

---

**Built with ❤️ for the Muslim community seeking halal marriage connections.**

May Allah bless all users in finding their righteous spouse. Ameen. 🤲
# Complete Authentication & Registration Setup Guide

## 🎯 Overview

I've successfully implemented a complete authentication and registration system for the Islamic marriage app with full Supabase database integration. Here's what's been built:

## ✅ Features Implemented

### 🔐 **Authentication System**
- **Login Page** (`app/login.tsx`) - Full Supabase integration
- **Signup Page** (`src/screens/EnterpriseSignup.tsx`) - Multi-step Islamic registration
- **Registration Flow** (`src/components/RegistrationFlow.tsx`) - 11-step comprehensive profile creation
- **Auth Context** (`src/contexts/AuthContext.tsx`) - Global authentication state management

### 🕌 **Islamic Marriage Features**
- **Complete Islamic Preferences** - Sect, madhab, prayer frequency, polygamy preferences
- **Polygamy Support** - Full support for multiple wives (up to 4 as per Islamic law)
- **Religious Compatibility** - Detailed Islamic practice matching
- **Family Background** - Parents' occupation, religious level, financial status
- **Physical Characteristics** - Height, weight, eye color, hair color, etc.
- **Professional Information** - Education, career, income ranges

### 🛠 **Backend Services**
- **Registration Service** (`src/services/registration.service.ts`) - Complete registration flow
- **Islamic Marriage Service** (`src/services/islamic-marriage.service.ts`) - Matching and compatibility
- **Media Service** (`src/services/media.service.ts`) - External server integration
- **API Hooks** (`src/api/hooks.ts`) - React Query hooks for all operations
- **Supabase Config** (`src/config/supabase.ts`) - Database client and helpers

### 📱 **User Experience**
- **Multi-step Registration** - 11 carefully designed steps
- **Form Validation** - Comprehensive validation with Zod schemas
- **Progress Tracking** - Visual progress indicator
- **Islamic Questionnaire** - Detailed religious compatibility assessment
- **Real-time Updates** - Live authentication state management

## 🚀 Setup Instructions

### 1. Database Setup
```bash
# 1. Run the SQL schema in your Supabase dashboard
# Execute: main/Hume/src/database/islamic-marriage-schema.sql

# 2. Set up environment variables
# Copy and configure: main/Hume/env.example
```

### 2. Environment Configuration
Create `.env` file in `main/Hume/`:
```env
EXPO_PUBLIC_SUPABASE_URL=https://rpzkugodaacelruquhtc.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
EXPO_PUBLIC_MEDIA_SERVER_URL=https://your-media-server.com
EXPO_PUBLIC_MEDIA_SERVER_API_KEY=your_media_server_api_key_here
```

### 3. Install Dependencies
```bash
cd main/Hume
npm install
```

### 4. Wrap App with Providers
Update your `_layout.tsx`:
```tsx
import { AuthProvider } from './src/contexts/AuthContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {/* Your existing app structure */}
      </AuthProvider>
    </QueryClientProvider>
  );
}
```

## 📋 Registration Flow Steps

### Step 1: Personal Information
- First name, last name
- Email, password, confirm password
- Date of birth
- Gender selection
- Phone number (optional)

### Step 2: Location Information
- Country (required)
- State/Province
- City (required)
- Postal code
- Willing to relocate

### Step 3: Islamic Information
- Islamic sect (Sunni, Shia, Other)
- Madhab (Hanafi, Maliki, Shafii, Hanbali, Jafari)
- Prayer frequency
- Quran memorization level
- Islamic education
- Hajj/Umrah status
- Hijab/Beard preferences

### Step 4: Marriage Information
- Marital status (Never married, Divorced, Widowed)
- Children status
- Children preferences
- **Polygamy preferences:**
  - For men: Seeking wife number (1st-4th)
  - For women: Willing wife positions
  - Current wives count
  - Polygamy acceptance level

### Step 5: Physical Characteristics (Optional)
- Height and weight
- Eye color, hair color
- Skin tone, body type

### Step 6: Professional Information (Optional)
- Education level
- Field of study
- Occupation and category
- Income range
- Employment status

### Step 7: Family Background (Optional)
- Parents' occupation
- Number of siblings
- Family religious level
- Family financial status

### Step 8: Personal Details (Optional)
- Bio/About me
- Hobbies and interests
- Languages spoken
- What you're looking for

### Step 9: Partner Preferences
- Age range preferences
- Physical preferences
- Location preferences
- Islamic preferences
- Marriage preferences
- **Polygamy compatibility**

### Step 10: Islamic Questionnaire
- Religious practice details
- Gender roles views
- Family planning views
- **Detailed polygamy understanding:**
  - Polygamy comfort level
  - Co-wife relationship expectations
  - Time sharing expectations
  - Financial responsibility views

### Step 11: Verification
- Email verification
- Account activation
- Welcome to the app

## 🔄 Usage Examples

### Login
```tsx
import { useAuth } from './src/contexts/AuthContext';

const LoginComponent = () => {
  const { signIn, isLoading } = useAuth();

  const handleLogin = async () => {
    const result = await signIn(email, password);
    if (result.success) {
      // Navigate to main app
    }
  };
};
```

### Registration
```tsx
import { useRegister } from './src/api/hooks';

const RegisterComponent = () => {
  const registerMutation = useRegister();

  const handleRegister = async () => {
    await registerMutation.mutateAsync({
      registrationData,
      preferencesData,
      questionnaireData
    });
  };
};
```

### Profile Management
```tsx
import { useUserProfile, useUpdateProfile } from './src/api/hooks';

const ProfileComponent = () => {
  const { data: profile } = useUserProfile(userId);
  const updateProfileMutation = useUpdateProfile();

  const updateProfile = async (updates) => {
    await updateProfileMutation.mutateAsync({ userId, updates });
  };
};
```

## 🔐 Security Features

### Authentication
- **Secure passwords** - Minimum 8 characters with complexity requirements
- **Email verification** - Required before account activation
- **Session management** - Automatic token refresh
- **Secure storage** - Sensitive data protection

### Database Security
- **Row Level Security (RLS)** - Database-level access control
- **User isolation** - Users can only access their own data
- **Match privacy** - Controlled access to matched users' data
- **Media privacy** - Three-tier visibility system

### Privacy Controls
- **Profile visibility** - Control who can see your profile
- **Media visibility** - Public, private, or matched-only
- **Location privacy** - Optional precise location sharing
- **Contact protection** - No direct contact until mutual match

## 🕌 Islamic Compliance

### Marriage Guidelines
- **Halal matching** - Ensures Islamic compliance
- **4-wife maximum** - Enforced polygamy limits
- **Religious compatibility** - Sect and madhab matching
- **Modesty preservation** - Privacy-first approach

### Cultural Sensitivity
- **Gender-appropriate** - Different flows for men/women
- **Religious respect** - Islamic terminology and concepts
- **Family involvement** - Family background consideration
- **Community values** - Emphasis on marriage intention

## 🎨 UI/UX Features

### Responsive Design
- **Mobile-first** - Optimized for mobile devices
- **Web compatibility** - Works on web browsers
- **Cross-platform** - React Native + React Native Web

### User Experience
- **Progress tracking** - Clear step indication
- **Form validation** - Real-time error feedback
- **Loading states** - Clear loading indicators
- **Error handling** - User-friendly error messages

## 🚦 Testing the System

### 1. Test Login
- Create a test account
- Verify email login works
- Test "Remember me" functionality
- Test forgot password flow

### 2. Test Registration
- Complete full registration flow
- Test form validation
- Verify all steps work correctly
- Test Islamic preferences

### 3. Test Database
- Verify data is saved correctly
- Test profile updates
- Test preference changes
- Test polygamy settings

### 4. Test Authentication State
- Test login/logout
- Test session persistence
- Test auto-login on app restart

## 🔧 Customization

### Adding New Fields
1. Update database schema
2. Update TypeScript types
3. Update registration forms
4. Update validation schemas

### Modifying Islamic Options
1. Update enum types in schema
2. Update TypeScript types
3. Update form options
4. Update validation rules

### Custom Validation
1. Modify Zod schemas
2. Add custom validation functions
3. Update error messages
4. Test validation logic

## 📞 Support

For technical issues:
1. Check database connection
2. Verify environment variables
3. Check Supabase console for errors
4. Review browser/app console logs

The system is now fully functional and ready for Islamic marriage matching! 🎉

---

**Barakallahu feekum - May Allah bless this project and help Muslims find righteous spouses through this platform. Ameen.** 🤲

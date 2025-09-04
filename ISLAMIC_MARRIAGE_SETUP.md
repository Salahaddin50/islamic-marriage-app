# Islamic Marriage Database Setup Guide

This guide will help you set up the complete Islamic marriage database system with Supabase for the Zawajplus dating app.

## 🗄️ Database Schema Overview

The Islamic marriage database includes:

- **User Management**: Authentication, profiles, and verification
- **Islamic Preferences**: Sect, madhab, prayer frequency, religious practices
- **Polygamy Support**: Wife positions, multiple marriage preferences
- **Physical Characteristics**: Height, weight, eye color, hair color, etc.
- **Location Matching**: Country, state, city with distance preferences
- **Media Management**: External server references for photos/videos
- **Compatibility Scoring**: Islamic-specific matching algorithm
- **Detailed Questionnaire**: Religious views and polygamy expectations

## 🚀 Setup Instructions

### 1. Supabase Project Setup

1. Go to [Supabase](https://supabase.com) and create a new project
2. Note your project URL: `https://rpzkugodaacelruquhtc.supabase.co` (already configured)
3. Get your `anon` key from Settings > API

### 2. Environment Configuration

Create a `.env` file in the main/Zawajplus directory:

```env
EXPO_PUBLIC_SUPABASE_URL=https://rpzkugodaacelruquhtc.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# External Media Server Configuration
EXPO_PUBLIC_MEDIA_SERVER_URL=https://your-media-server.com
EXPO_PUBLIC_MEDIA_SERVER_API_KEY=your_media_server_api_key_here

# App Configuration
EXPO_PUBLIC_APP_NAME=Zawajplus Islamic Marriage
EXPO_PUBLIC_APP_VERSION=1.0.0
```

### 3. Database Schema Setup

1. Open Supabase Dashboard > SQL Editor
2. Copy and paste the contents of `src/database/islamic-marriage-schema.sql`
3. Click "Run" to create all tables, types, and functions

The schema includes:
- 8 main tables with proper relationships
- Custom enum types for Islamic preferences
- Row Level Security (RLS) policies
- Automatic timestamp triggers
- Islamic compatibility scoring function

### 4. Install Dependencies

```bash
cd main/Zawajplus
npm install @supabase/supabase-js
```

### 5. Row Level Security (RLS) Setup

The schema automatically sets up RLS policies for:

- **Users can only see their own data**
- **Matched users can see each other's public/matched-only content**
- **Admin verification system for documents**
- **Privacy controls for media visibility**

### 6. External Media Server Integration

For photos and videos, you'll need to set up an external server that supports:

```javascript
// Upload endpoint
POST /api/upload
Headers: Authorization: Bearer <api_key>
Body: FormData with file, userId, mediaType

// Delete endpoint
DELETE /api/delete
Headers: Authorization: Bearer <api_key>
Body: { fileUrl }

// Secure URL generation
POST /api/secure-url
Headers: Authorization: Bearer <api_key>
Body: { mediaId, viewerUserId, expiryHours }
```

## 📋 Key Features

### Islamic Marriage Preferences

- **Polygamy Support**: Complete support for up to 4 wives as per Islamic law
- **Sect & Madhab**: Sunni, Shia with detailed madhab preferences
- **Religious Practices**: Prayer frequency, Hajj, Umrah, Quran memorization
- **Modesty Preferences**: Hijab styles, beard preferences
- **Marriage Positions**: First, second, third, fourth wife preferences

### Advanced Matching

- **Compatibility Scoring**: Islamic-specific algorithm considering religious practice
- **Location Matching**: Country, state, city with distance preferences
- **Age Compatibility**: Flexible age ranges with cultural considerations
- **Education Matching**: From basic to Islamic studies specialization
- **Family Background**: Parents' occupation, siblings, religious level

### Privacy & Security

- **Media Privacy Levels**: Public, private, matched-only
- **Document Verification**: ID, passport, birth certificate verification
- **Profile Verification**: Multi-step verification process
- **Activity Logging**: Comprehensive activity tracking

## 🔧 Usage Examples

### Registration

```typescript
import RegistrationService from './src/services/registration.service';

const registrationData = {
  email: 'user@example.com',
  password: 'securePassword123',
  firstName: 'Ahmed',
  lastName: 'Al-Rashid',
  gender: 'male',
  dateOfBirth: '1990-01-01',
  country: 'Saudi Arabia',
  city: 'Riyadh',
  sect: 'sunni',
  madhab: 'hanafi',
  maritalStatus: 'never_married',
  prayerFrequency: 'five_times_daily',
  seekingWifeNumber: 'first',
  // ... other fields
};

const preferencesData = {
  minAge: 22,
  maxAge: 35,
  preferredSects: ['sunni'],
  acceptPolygamousMarriage: 'no',
  preferredMaritalStatus: ['never_married'],
  // ... other preferences
};

const questionnaireData = {
  dailyPrayersConsistency: 5,
  polygamyUnderstanding: 'Complete understanding of Islamic guidelines',
  // ... other questionnaire data
};

const result = await RegistrationService.registerIslamicMarriageUser(
  registrationData,
  preferencesData,
  questionnaireData
);
```

### Search & Matching

```typescript
import IslamicMarriageService from './src/services/islamic-marriage.service';

const searchFilters = {
  gender: 'female',
  minAge: 20,
  maxAge: 30,
  sect: 'sunni',
  acceptPolygamy: 'accept',
  seekingWifeNumber: 'second'
};

const matches = await IslamicMarriageService.searchIslamicProfiles(
  currentUserId,
  searchFilters
);
```

### Media Upload

```typescript
import MediaService from './src/services/media.service';

const mediaFile = // File object from image picker
const result = await MediaService.uploadMedia(mediaFile, {
  userId: 'user-id',
  mediaType: 'photo',
  isProfilePicture: true,
  visibility: 'matched_only'
});
```

## 🔐 Security Considerations

1. **Data Encryption**: All sensitive data is encrypted in transit and at rest
2. **RLS Policies**: Strict database-level access controls
3. **Media Privacy**: External server with secure URL generation
4. **Verification System**: Multi-step identity and document verification
5. **Activity Monitoring**: Complete audit trail of user actions

## 📊 Islamic Compliance Features

- **Halal Matching**: Ensures matches comply with Islamic marriage guidelines
- **Polygamy Rules**: Enforces 4-wife maximum as per Islamic law
- **Religious Compatibility**: Detailed sect, madhab, and practice matching
- **Modesty Preservation**: Privacy-first approach with controlled media sharing
- **Family Values**: Emphasis on family background and religious upbringing

## 🛠️ Customization

The system is designed to be easily customizable for different Islamic communities:

- **Add new sects/madhabs** in the enum types
- **Customize questionnaire** for specific community needs
- **Adjust compatibility scoring** based on community priorities
- **Add regional preferences** for location-specific matching

## 📞 Support

For technical support or customization requests, please refer to:
- Database schema: `src/database/islamic-marriage-schema.sql`
- Type definitions: `src/types/database.types.ts`
- Service implementations: `src/services/`

## 🔄 Updates and Migrations

When updating the schema:
1. Create migration files in `src/database/migrations/`
2. Test on development environment first
3. Update TypeScript types accordingly
4. Run migrations on production with proper backups

## ✅ Testing

Before going live:
1. Test all registration flows
2. Verify RLS policies work correctly
3. Test media upload/download with external server
4. Validate Islamic compatibility scoring
5. Test polygamy preference matching
6. Verify privacy controls work as expected

---

**May Allah bless this project and help it serve the Muslim community in finding righteous spouses. Ameen.** 🤲

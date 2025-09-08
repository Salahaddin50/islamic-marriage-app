# 🛡️ Admin Panel Setup Guide

## Overview

This comprehensive admin panel provides full management capabilities for your Hume dating app, including user profile management, media approval, analytics, and super admin controls.

## 🚀 Features Implemented

### ✅ Authentication System
- **Email/Password Authentication**: Secure admin authentication with email and password
- **Registration System**: Self-registration with super admin approval required
- **Session Management**: Secure token-based sessions with expiration
- **Super Admin Controls**: Hierarchical admin approval system

### ✅ Dashboard Analytics
- **User Statistics**: Daily/weekly new registrations by gender
- **Subscription Analytics**: Revenue tracking and subscription metrics
- **Interactive Charts**: Visual data representation with monthly/yearly views
- **Real-time Metrics**: Live updates of key performance indicators

### ✅ Profile Management
- **Female Profiles Section**: Complete profile management with media approval
- **Male Profiles Section**: Dedicated male profile management
- **Bulk Operations**: Approve/reject multiple profiles at once
- **Media Management**: Review and delete inappropriate content
- **Advanced Filters**: Search by status, location, age, and more

### ✅ Interaction Management
- **Interests Tracking**: Monitor all user interests and interactions
- **Meet Requests**: Oversee video call requests and scheduling
- **Bulk Moderation**: Efficient management of large volumes of data
- **Analytics Dashboard**: Track engagement metrics

### ✅ Super Admin Features
- **Admin Approval System**: Control who gets admin access
- **Activity Logging**: Complete audit trail of admin actions
- **Role Management**: Hierarchical permission system

## 📋 Setup Instructions

### Step 1: Database Migration

Run the database migration to add admin tables and approval columns:

```sql
-- Execute this file to set up admin tables
\i add-admin-approval-column.sql
```

This creates:
- `admin_users` table for admin authentication
- `admin_sessions` table for session management
- `admin_activity_log` table for audit trails
- `admin_approved` column in `user_profiles` table
- Necessary indexes and RLS policies

### Step 2: Supabase Authentication Setup

1. **Enable Email Authentication**:
   - In your Supabase dashboard, go to Authentication > Settings
   - Ensure "Enable email confirmations" is configured as needed
   - Set up email templates if desired

2. **Environment Variables**:
   Your `.env` file should already have:
   ```bash
   # Already configured in your Supabase project
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
   ```

### Step 3: Create First Super Admin

You have two options to create your first super admin:

**Option A: Update the migration file before running it**
1. Edit `add-admin-approval-column.sql`
2. Replace `'admin@example.com'` with your actual email
3. Run the migration

**Option B: Register and approve yourself**
1. Run the migration as-is
2. Go to `/nimda/login` and click "Register"
3. Create your admin account
4. Run this SQL to approve yourself:
   ```sql
   UPDATE admin_users 
   SET is_super_admin = TRUE, is_approved = TRUE
   WHERE email = 'your-actual-email@example.com';
   ```

### Step 4: Deploy and Test

1. **Build and Deploy**:
   ```bash
   npm run build
   # Deploy to your hosting platform
   ```

2. **Test Admin Access**:
   - Navigate to `/nimda/login`
   - Sign in with your email and password (or register first)
   - Complete the approval process (if needed)
   - Access the admin dashboard

## 🔧 Configuration Options

### Admin Panel Routes

- `/nimda/login` - Admin login page
- `/nimda/dashboard` - Main analytics dashboard
- `/nimda/female-profiles` - Female profile management
- `/nimda/male-profiles` - Male profile management
- `/nimda/interests` - Interest management
- `/nimda/meet-requests` - Meet request management
- `/nimda/admin-management` - Super admin controls

### Security Features

1. **Row Level Security**: All admin tables have RLS enabled
2. **Session Expiration**: 24-hour session timeout
3. **Activity Logging**: All admin actions are logged
4. **IP Tracking**: Admin activities include IP addresses
5. **Approval Required**: New admins need super admin approval

### Customization

#### Adding New Analytics
To add new analytics to the dashboard:

1. Update `AdminAnalyticsService` with new methods
2. Add new chart components to the dashboard
3. Update the analytics views in the database

#### Adding New Admin Features
1. Create new service in `src/services/`
2. Add new route in `app/nimda/`
3. Update navigation in dashboard
4. Add necessary database tables/columns

## 🛡️ Security Considerations

### Best Practices Implemented

1. **Principle of Least Privilege**: Admins only see what they need
2. **Audit Trail**: All actions are logged with timestamps
3. **Session Management**: Secure token-based authentication
4. **Input Validation**: All user inputs are validated and sanitized
5. **Rate Limiting**: Prevent abuse through bulk operations

### Monitoring

Monitor these key areas:
- Failed login attempts
- Bulk operations (watch for abuse)
- Media deletions (ensure legitimate removals)
- Profile approval patterns

## 📊 Analytics & Reporting

### Available Metrics

1. **User Metrics**:
   - Daily/weekly new registrations
   - Gender distribution
   - Approval rates
   - Geographic distribution

2. **Engagement Metrics**:
   - Interest success rates
   - Meet request acceptance rates
   - Active user patterns

3. **Content Metrics**:
   - Media approval rates
   - Profile completion rates
   - Content moderation statistics

### Custom Reports

The system supports custom date ranges and filters for all analytics. Data can be exported for further analysis.

## 🚨 Troubleshooting

### Common Issues

1. **Google OAuth Errors**:
   - Check redirect URLs in Google Console
   - Verify Supabase OAuth configuration
   - Ensure domain is properly configured

2. **Database Errors**:
   - Check RLS policies are correctly set
   - Verify admin user has proper permissions
   - Review migration logs for errors

3. **Session Issues**:
   - Clear browser cache and cookies
   - Check session expiration settings
   - Verify token storage is working

### Support

For technical support:
1. Check the admin activity logs for error details
2. Review browser console for client-side errors
3. Check Supabase logs for server-side issues
4. Verify all environment variables are set correctly

## 🔄 Updates and Maintenance

### Regular Maintenance

1. **Weekly**:
   - Review admin activity logs
   - Check for failed operations
   - Monitor system performance

2. **Monthly**:
   - Update admin passwords/tokens
   - Review user approval patterns
   - Analyze usage metrics

3. **Quarterly**:
   - Security audit
   - Performance optimization
   - Feature usage analysis

### Backup Strategy

Ensure regular backups of:
- Admin user data
- Activity logs
- Configuration settings
- Analytics data

## 📈 Future Enhancements

Potential improvements:
1. **Advanced Analytics**: Machine learning insights
2. **Automated Moderation**: AI-powered content filtering
3. **Mobile Admin App**: Native mobile admin interface
4. **Advanced Reporting**: Custom dashboard builder
5. **Integration APIs**: Connect with external tools

---

## 🎯 Quick Start Checklist

- [ ] Run database migration (`add-admin-approval-column.sql`)
- [ ] Configure Google OAuth in Supabase
- [ ] Update first super admin record
- [ ] Test admin login flow
- [ ] Verify all sections are accessible
- [ ] Test bulk operations
- [ ] Review security settings
- [ ] Set up monitoring alerts

Your robust admin panel is now ready for production use! 🚀

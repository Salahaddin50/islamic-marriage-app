# 🔐 FIX FOR 401 UNAUTHORIZED ERROR

You're getting a 401 Unauthorized error because the authentication system is trying to log in but either:

1. The user doesn't exist in Supabase Auth, or
2. The user exists but the credentials are incorrect, or
3. The user exists in Supabase Auth but not in the `admin_users` table

## 🚀 SOLUTION

### Step 1: Create a User in Supabase Auth

1. Go to your Supabase dashboard: https://app.supabase.com/
2. Select your project
3. Go to "Authentication" → "Users"
4. Click "Add User"
5. Enter an email and password
6. Remember these credentials - you'll use them to log in to the admin panel

### Step 2: Add the User to admin_users Table

1. Go to "SQL Editor" in your Supabase dashboard
2. Run the provided `admin-user-setup.sql` script
3. **IMPORTANT**: Edit the script to use the same email you created in Step 1

```sql
-- Change this line in the script
'your-email@example.com' -- CHANGE THIS to your email
```

### Step 3: Disable RLS Temporarily (if needed)

If you're still having issues, you might need to temporarily disable Row Level Security:

```sql
-- Run this in SQL Editor
ALTER TABLE admin_users DISABLE ROW LEVEL SECURITY;
```

### Step 4: Try Logging In Again

1. Go to your admin panel: `/admin.html`
2. Use the email and password you created in Supabase Auth
3. You should now be able to log in successfully

## 🔍 TROUBLESHOOTING

If you're still getting the 401 error:

1. **Check Console**: Look for detailed error messages in the browser console
2. **Verify User**: Make sure the user exists in both Supabase Auth and the `admin_users` table
3. **Check Credentials**: Ensure you're using the correct email and password
4. **Check Supabase URL and Key**: Make sure the Supabase URL and Anon Key are correct in `admin.html` and `admin-common.js`

## 📋 CURRENT CONFIGURATION

Your Supabase configuration is:

```javascript
const SUPABASE_URL = 'https://rpzkugodaacelruquhtc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwemt1Z29kYWFjZWxydXF1aHRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjU3OTc2MzYsImV4cCI6MjA0MTM3MzYzNn0.7aMVg4nCUB1-jKNOsaKYaO9eG5-MwIqBkzSEP9lEV1M';
```

This configuration looks correct based on the error message you provided.

## 🔄 NEXT STEPS

After fixing the authentication issue:

1. Re-enable RLS if you disabled it:
   ```sql
   ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
   ```

2. Set up proper RLS policies for security:
   ```sql
   CREATE POLICY "admin_users_select_policy" ON admin_users
     FOR SELECT USING (
       auth.uid()::text = id::text OR
       EXISTS (SELECT 1 FROM admin_users WHERE id::text = auth.uid()::text AND is_super_admin = TRUE)
     );
   ```

3. Complete the setup of other admin tables using the `db-setup.sql` script

Your admin panel is now fully connected to the database and should work properly once the authentication issue is resolved! 🎉

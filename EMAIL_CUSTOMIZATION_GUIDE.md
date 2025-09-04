# Email Customization Guide - Zawajplus Islamic Dating App

This guide will help you customize Supabase Auth emails to use your website name instead of "Supabase Auth".

## 🎯 What We'll Customize

- **Sender Name**: Change from "Supabase Auth" to "Zawajplus Islamic Marriage"
- **Email Templates**: Custom HTML templates with your branding
- **SMTP Settings**: Use your own email service (optional but recommended)
- **Email Content**: Islamic-appropriate messaging and styling

## 🚀 Method 1: Supabase Dashboard Configuration (Easiest)

### Step 1: Access Email Templates

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `rpzkugodaacelruquhtc`
3. Navigate to **Authentication** → **Email Templates**

### Step 2: Configure Email Settings

1. Click on **Settings** tab in Authentication
2. Find **SMTP Settings** section
3. Configure the following:

```
Sender Name: Zawajplus Islamic Marriage
Sender Email: noreply@humeislamic.com (use your domain)
```

### Step 3: Customize Email Templates

#### Password Reset Email Template

Replace the default template with:

```html
<h2>Reset Your Password - Zawajplus Islamic Marriage</h2>

<p>Assalamu Alaikum,</p>

<p>We received a request to reset your password for your Zawajplus Islamic Marriage account.</p>

<p>Click the link below to create a new password:</p>

<p><a href="{{ .ConfirmationURL }}" style="background-color: #E91E63; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Reset Password</a></p>

<p>If you didn't request this password reset, please ignore this email. Your password will remain unchanged.</p>

<p>This link will expire in 24 hours for your security.</p>

<p>Barakallahu feeki,<br>
The Zawajplus Islamic Marriage Team</p>

<hr>
<p style="font-size: 12px; color: #666;">
This email was sent from Zawajplus Islamic Marriage. If you have any questions, please contact our support team.
</p>
```

#### Email Confirmation Template

```html
<h2>Confirm Your Email - Zawajplus Islamic Marriage</h2>

<p>Assalamu Alaikum and welcome to Zawajplus Islamic Marriage!</p>

<p>Thank you for joining our Islamic community. Please confirm your email address to activate your account:</p>

<p><a href="{{ .ConfirmationURL }}" style="background-color: #E91E63; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Confirm Email Address</a></p>

<p>Once confirmed, you can complete your profile and start connecting with other Muslims looking for marriage.</p>

<p>If you didn't create this account, please ignore this email.</p>

<p>Barakallahu feeki,<br>
The Zawajplus Islamic Marriage Team</p>

<hr>
<p style="font-size: 12px; color: #666;">
This email was sent from Zawajplus Islamic Marriage. If you have any questions, please contact our support team.
</p>
```

## 🔧 Method 2: Custom SMTP Configuration (Recommended)

### Step 1: Choose an Email Service

Popular options:
- **SendGrid** (recommended)
- **Mailgun**
- **Amazon SES**
- **Postmark**

### Step 2: Configure SMTP in Supabase

1. In Supabase Dashboard → Authentication → Settings
2. Enable **Custom SMTP**
3. Configure with your provider's settings:

#### Example for SendGrid:
```
SMTP Host: smtp.sendgrid.net
SMTP Port: 587
SMTP User: apikey
SMTP Password: [Your SendGrid API Key]
Sender Name: Zawajplus Islamic Marriage
Sender Email: noreply@yourdomain.com
```

#### Example for Mailgun:
```
SMTP Host: smtp.mailgun.org
SMTP Port: 587
SMTP User: [Your Mailgun SMTP username]
SMTP Password: [Your Mailgun SMTP password]
Sender Name: Zawajplus Islamic Marriage
Sender Email: noreply@yourdomain.com
```

### Step 3: Update Environment Variables

Add to your `.env` file:

```env
# Email Configuration
EXPO_PUBLIC_APP_NAME=Zawajplus Islamic Marriage
EXPO_PUBLIC_SUPPORT_EMAIL=support@humeislamic.com
EXPO_PUBLIC_NOREPLY_EMAIL=noreply@humeislamic.com
```

## 📧 Method 3: Programmatic Email Customization

### Update Password Reset Function

Update your `forgotpasswordemail.tsx` to use custom redirect URL:

```typescript
// Send password reset email using Supabase with custom options
const { error } = await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: `${window.location.protocol}//${window.location.host}/createnewpassword`,
  data: {
    app_name: 'Zawajplus Islamic Marriage',
    support_email: 'support@humeislamic.com'
  }
});
```

## 🎨 Advanced Customization

### Create Custom Email Service

Create `src/services/email.service.ts`:

```typescript
import { supabase } from '../config/supabase';

export class EmailService {
  static async sendPasswordReset(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.protocol}//${window.location.host}/createnewpassword`,
      data: {
        app_name: process.env.EXPO_PUBLIC_APP_NAME || 'Zawajplus Islamic Marriage',
        website_url: window.location.origin,
        support_email: process.env.EXPO_PUBLIC_SUPPORT_EMAIL || 'support@humeislamic.com',
        greeting: 'Assalamu Alaikum',
        signature: 'Barakallahu feeki,\nThe Zawajplus Islamic Marriage Team'
      }
    });
    
    return { error };
  }

  static async sendEmailConfirmation(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          app_name: process.env.EXPO_PUBLIC_APP_NAME || 'Zawajplus Islamic Marriage',
          website_url: window.location.origin,
          support_email: process.env.EXPO_PUBLIC_SUPPORT_EMAIL || 'support@humeislamic.com'
        }
      }
    });
    
    return { data, error };
  }
}
```

## 🧪 Testing Your Email Configuration

### Test Password Reset Email

1. Go to your forgot password page
2. Enter a test email address
3. Check the email received
4. Verify:
   - ✅ Sender shows "Zawajplus Islamic Marriage"
   - ✅ Email content uses your custom template
   - ✅ Links work correctly
   - ✅ Branding is consistent

### Test Email Confirmation

1. Create a new account
2. Check confirmation email
3. Verify customization is applied

## 🔍 Troubleshooting

### Common Issues

#### 1. Emails Still Show "Supabase Auth"
- Clear browser cache
- Wait 5-10 minutes for changes to propagate
- Check SMTP configuration is saved

#### 2. Custom Templates Not Applied
- Ensure HTML is valid
- Check for template syntax errors
- Verify variables like `{{ .ConfirmationURL }}` are correct

#### 3. SMTP Authentication Errors
- Verify SMTP credentials
- Check if 2FA is enabled on email provider
- Use app-specific passwords if required

### Debug Steps

1. **Check Supabase Logs**: Dashboard → Logs → Auth logs
2. **Test SMTP Connection**: Use online SMTP testing tools
3. **Verify DNS**: Ensure your domain's SPF/DKIM records are set up

## 📋 Checklist

- [ ] Configure sender name in Supabase Dashboard
- [ ] Update email templates with Islamic greetings
- [ ] Set up custom SMTP (recommended)
- [ ] Update environment variables
- [ ] Test password reset emails
- [ ] Test email confirmation
- [ ] Verify all links work correctly
- [ ] Check spam folder settings

## 🎯 Final Result

After configuration, your users will receive emails that:
- ✅ Come from "Zawajplus Islamic Marriage" instead of "Supabase Auth"
- ✅ Include Islamic greetings (Assalamu Alaikum)
- ✅ Have consistent branding and messaging
- ✅ Provide clear instructions in appropriate language
- ✅ Include your support contact information

This creates a much more professional and culturally appropriate experience for your Islamic dating app users.

#!/usr/bin/env node

// ============================================================================
// EMAIL TEMPLATES SETUP SCRIPT - HUME ISLAMIC DATING APP
// ============================================================================
// This script provides the email templates to copy into Supabase Dashboard
// ============================================================================

console.log('🕌 Zawajplus Islamic Marriage - Email Templates Setup');
console.log('======================================================\n');

console.log('📧 STEP 1: Go to your Supabase Dashboard');
console.log('   → https://supabase.com/dashboard');
console.log('   → Select project: rpzkugodaacelruquhtc');
console.log('   → Navigate to Authentication → Email Templates\n');

console.log('⚙️  STEP 2: Configure SMTP Settings');
console.log('   → Go to Authentication → Settings');
console.log('   → Enable Custom SMTP (recommended)');
console.log('   → Set Sender Name: "Zawajplus Islamic Marriage"');
console.log('   → Set Sender Email: "noreply@yourdomain.com"\n');

console.log('📝 STEP 3: Copy the templates below into Supabase\n');

console.log('🔐 PASSWORD RESET EMAIL TEMPLATE:');
console.log('=====================================');
console.log(`
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
  <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
    
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="color: #E91E63; margin: 0; font-size: 28px;">Zawajplus Islamic Marriage</h1>
      <p style="color: #666; margin: 5px 0 0 0;">Islamic Community for Halal Relationships</p>
    </div>
    
    <!-- Main Content -->
    <h2 style="color: #333; margin-bottom: 20px;">Reset Your Password</h2>
    
    <p style="color: #333; line-height: 1.6; margin-bottom: 15px;">Assalamu Alaikum,</p>
    
    <p style="color: #333; line-height: 1.6; margin-bottom: 20px;">
      We received a request to reset your password for your Zawajplus Islamic Marriage account.
    </p>
    
    <p style="color: #333; line-height: 1.6; margin-bottom: 25px;">
      Click the button below to create a new password:
    </p>
    
    <!-- Reset Button -->
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{ .ConfirmationURL }}" 
         style="background-color: #E91E63; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px;">
        Reset Password
      </a>
    </div>
    
    <p style="color: #666; line-height: 1.6; margin-bottom: 15px; font-size: 14px;">
      If the button doesn't work, copy and paste this link into your browser:
    </p>
    <p style="color: #E91E63; word-break: break-all; font-size: 14px; margin-bottom: 20px;">
      {{ .ConfirmationURL }}
    </p>
    
    <p style="color: #333; line-height: 1.6; margin-bottom: 15px;">
      If you didn't request this password reset, please ignore this email. Your password will remain unchanged.
    </p>
    
    <p style="color: #666; line-height: 1.6; margin-bottom: 25px; font-size: 14px;">
      This link will expire in 24 hours for your security.
    </p>
    
    <!-- Footer -->
    <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px;">
      <p style="color: #333; line-height: 1.6; margin-bottom: 5px;">
        Barakallahu feeki,<br>
        <strong>The Zawajplus Islamic Marriage Team</strong>
      </p>
      
      <p style="color: #666; font-size: 12px; line-height: 1.4; margin-top: 20px;">
        This email was sent from Zawajplus Islamic Marriage. If you have any questions, 
        please contact our support team at support@zawajplus.com
      </p>
    </div>
  </div>
</div>
`);

console.log('\n✉️  EMAIL CONFIRMATION TEMPLATE:');
console.log('=================================');
console.log(`
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
  <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
    
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="color: #E91E63; margin: 0; font-size: 28px;">Zawajplus Islamic Marriage</h1>
      <p style="color: #666; margin: 5px 0 0 0;">Islamic Community for Halal Relationships</p>
    </div>
    
    <!-- Main Content -->
    <h2 style="color: #333; margin-bottom: 20px;">Confirm Your Email Address</h2>
    
    <p style="color: #333; line-height: 1.6; margin-bottom: 15px;">Assalamu Alaikum and welcome to Zawajplus Islamic Marriage!</p>
    
    <p style="color: #333; line-height: 1.6; margin-bottom: 20px;">
      Thank you for joining our Islamic community. Please confirm your email address to activate your account:
    </p>
    
    <!-- Confirm Button -->
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{ .ConfirmationURL }}" 
         style="background-color: #E91E63; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px;">
        Confirm Email Address
      </a>
    </div>
    
    <p style="color: #666; line-height: 1.6; margin-bottom: 15px; font-size: 14px;">
      If the button doesn't work, copy and paste this link into your browser:
    </p>
    <p style="color: #E91E63; word-break: break-all; font-size: 14px; margin-bottom: 20px;">
      {{ .ConfirmationURL }}
    </p>
    
    <p style="color: #333; line-height: 1.6; margin-bottom: 20px;">
      Once confirmed, you can complete your profile and start connecting with other Muslims looking for marriage.
    </p>
    
    <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
      If you didn't create this account, please ignore this email.
    </p>
    
    <!-- Footer -->
    <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px;">
      <p style="color: #333; line-height: 1.6; margin-bottom: 5px;">
        Barakallahu feeki,<br>
        <strong>The Zawajplus Islamic Marriage Team</strong>
      </p>
      
      <p style="color: #666; font-size: 12px; line-height: 1.4; margin-top: 20px;">
        This email was sent from Zawajplus Islamic Marriage. If you have any questions, 
        please contact our support team at support@zawajplus.com
      </p>
    </div>
  </div>
</div>
`);

console.log('\n🚀 STEP 4: Test Your Configuration');
console.log('===================================');
console.log('1. Save the templates in Supabase Dashboard');
console.log('2. Test password reset from your app');
console.log('3. Test email confirmation for new signups');
console.log('4. Check that emails now show "Zawajplus Islamic Marriage" as sender\n');

console.log('✅ STEP 5: Optional - Set up Custom SMTP');
console.log('=========================================');
console.log('For better deliverability, consider using:');
console.log('• SendGrid (recommended)');
console.log('• Mailgun');
console.log('• Amazon SES');
console.log('• Postmark\n');

console.log('📚 For detailed instructions, see: EMAIL_CUSTOMIZATION_GUIDE.md\n');

console.log('🎉 Setup Complete!');
console.log('Your users will now receive professionally branded emails with Islamic greetings.');

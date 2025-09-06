# PayPal Card Payments Setup Guide

## ✅ Code Changes Completed

The PayPal integration has been updated with:

1. **Enhanced SDK Loading** - Now includes `card-fields` component and enables card funding
2. **Better Error Handling** - Proper error messages for card payment failures  
3. **Card Fields Support** - Direct card input fields alongside PayPal buttons
4. **Improved Configuration** - Better order creation with descriptions and branding

## 🔧 Required PayPal Account Setup

### Step 1: Enable Advanced Credit and Debit Card Payments

1. **Go to PayPal Developer Dashboard:**
   - Visit: https://developer.paypal.com/
   - Sign in and select your app

2. **Enable ACDC Feature:**
   - Go to your app → "Features" tab
   - Find "Advanced Credit and Debit Card Payments"
   - Click "Enable" (this is crucial for card payments)
   - Accept the terms and conditions

3. **Verify App Settings:**
   - Ensure "Accept payments" is enabled
   - Ensure "PayPal Checkout" is enabled
   - Ensure "Advanced Credit and Debit Card Payments" shows as "Active"

### Step 2: Update Environment Variables

Make sure your `.env` file has the correct Sandbox Client ID:

```env
# Replace with your actual Sandbox Client ID
EXPO_PUBLIC_PAYPAL_CLIENT_ID=AZabc123...your-sandbox-client-id
```

### Step 3: Test with Proper Sandbox Cards

Use these PayPal Sandbox test cards:

**Visa (Success):**
- Card: 4032035728926109
- Expiry: Any future date
- CVV: Any 3 digits

**Mastercard (Success):**
- Card: 5555555555554444  
- Expiry: Any future date
- CVV: Any 3 digits

**Visa (Decline - for testing):**
- Card: 4000000000000002
- Expiry: Any future date  
- CVV: Any 3 digits

## 🚫 Common Issues & Solutions

### "This card can't be used" Error

**Cause:** ACDC not enabled or wrong environment
**Solution:** 
1. Enable ACDC in PayPal app settings (Step 1 above)
2. Use Sandbox cards with Sandbox Client ID
3. Never mix Live cards with Sandbox environment

### Card Fields Not Showing

**Cause:** Missing components in SDK URL
**Solution:** Already fixed in code - SDK now loads with `components=buttons,card-fields`

### 403 Forbidden on Payment Insert

**Cause:** Supabase RLS policies
**Solution:** Run the `fix-paypal-rls.sql` script in Supabase SQL Editor

## 🧪 Testing Checklist

1. ✅ **Environment Setup**
   - [ ] Real Sandbox Client ID in `.env`
   - [ ] ACDC enabled in PayPal app
   - [ ] Supabase RLS policies fixed

2. ✅ **PayPal Button Testing**
   - [ ] PayPal button renders
   - [ ] Clicking opens PayPal popup
   - [ ] Can complete payment with Sandbox PayPal account

3. ✅ **Card Fields Testing**  
   - [ ] Card input fields render below PayPal button
   - [ ] Can enter test card details
   - [ ] Successful payment with test cards
   - [ ] Proper error handling with decline cards

4. ✅ **Database Integration**
   - [ ] Successful payments create `completed` records
   - [ ] Failed payments don't create records
   - [ ] Cancelled payments don't create records

## 🔄 Next Steps

1. **Enable ACDC** in your PayPal Developer app (most important!)
2. **Test with sandbox cards** listed above
3. **Verify database records** are created correctly
4. **Move to Live environment** when ready (get Live Client ID)

## 📞 Support

If you still get card errors after enabling ACDC:
- Check PayPal Developer logs in your dashboard
- Verify your app is approved for card processing
- Contact PayPal Developer Support if needed

The code is now ready - the main requirement is enabling ACDC in your PayPal app settings!


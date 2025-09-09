# PayPal Sandbox Test Cards

## ✅ WORKING Sandbox Test Cards

### Visa Cards (Success)
**Card 1:**
- Number: `4032035728926109`
- Expiry: `12/2028` (any future date)
- CVV: `123` (any 3 digits)

**Card 2:**
- Number: `4111111111111111`
- Expiry: `12/2028`
- CVV: `123`

### Mastercard (Success)
- Number: `5555555555554444`
- Expiry: `12/2028`
- CVV: `123`

### American Express (Success)
- Number: `378282246310005`
- Expiry: `12/2028`
- CVV: `1234` (4 digits for Amex)

## ❌ Test Decline Cards (For Testing Failures)

### Visa Decline
- Number: `4000000000000002`
- Expiry: `12/2028`
- CVV: `123`
- Result: Will be declined (for testing error handling)

### Insufficient Funds
- Number: `4000000000009995`
- Expiry: `12/2028`
- CVV: `123`
- Result: Insufficient funds error

## 🚫 NEVER Use These in Sandbox:
- Real credit/debit card numbers
- Your personal cards
- Live production cards

## 🔧 Important Notes:
1. **Environment Match**: Sandbox cards ONLY work with Sandbox Client ID
2. **Expiry Date**: Use any future date (month/year after today)
3. **CVV**: Any valid length (3 digits for Visa/MC, 4 for Amex)
4. **Name**: Use any name (e.g., "Test User")
5. **Address**: Use any valid format address

## 🧪 Testing Steps:
1. Use Sandbox Client ID in your `.env`
2. Use ONLY the success cards above
3. Test with decline cards to verify error handling
4. Never mix Live cards with Sandbox environment







# Gmail OAuth Setup for InstantHPI

## Step 1: Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API"
   - Click Enable

## Step 2: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Configure OAuth consent screen first:
   - User Type: External
   - App name: InstantHPI Medical
   - User support email: carlos@instanthpi.ca
   - Developer contact: carlos@instanthpi.ca

4. Create OAuth client:
   - Application type: Web application
   - Name: InstantHPI Supabase
   - Authorized JavaScript origins:
     ```
     https://uoahrhroyqsqixusewwe.supabase.co
     ```
   - Authorized redirect URIs:
     ```
     https://uoahrhroyqsqixusewwe.supabase.co/auth/v1/callback
     ```

5. Save your credentials:
   - Client ID: (copy this)
   - Client Secret: (copy this)

## Step 3: Configure in Supabase Dashboard

1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/uoahrhroyqsqixusewwe/auth/providers)
2. Find "Google" provider
3. Enable it
4. Add your credentials:
   - Client ID: (paste from Google)
   - Client Secret: (paste from Google)
5. Save

## Step 4: Email OTP is Already Enabled!

✅ Email OTP is already configured and working
✅ Users can sign in with:

- Email + 6-digit code
- Google OAuth (once configured)

## Testing the Login

1. Visit: http://localhost:3000/login
2. Try either:
   - Enter email → Get OTP code → Verify
   - Click "Sign in with Google"

## Security Features Active:

- ✅ Row Level Security (RLS) enabled
- ✅ Email verification required
- ✅ Session management
- ✅ Secure JWT tokens
- ✅ HTTPS only in production

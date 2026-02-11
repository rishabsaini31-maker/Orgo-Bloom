# Email/Password Login - Setup Complete ✅

## Database Fixed

- ✅ Password column added to users table
- ✅ Provider account ID made nullable
- ✅ All migrations applied successfully

## Test User Created

A test admin user has been created with the following credentials:

### Login Details

- **Email:** `omsable55426@gmail.com`
- **Password:** `orgobloom2025`
- **Role:** ADMIN

## How to Test

1. **Go to Login Page:**
   - Navigate to `http://localhost:9000/login`
   - Or click "Admin Login" in the header

2. **Switch to Email Tab:**
   - You'll see two tabs: "Google" and "Email"
   - Click on the "Email" tab

3. **Enter Credentials:**
   - Email: `omsable55426@gmail.com`
   - Password: `orgobloom2025`
   - Click "Sign In"

4. **Expected Result:**
   - ✅ Successful login
   - ✅ Redirected to dashboard
   - ✅ Admin features available

## Additional Users

You can also create more test users by:

1. **Sign up with email:**
   - Go to `/register`
   - Enter name, email, and password
   - Submit the form

2. **Login with created account:**
   - Go to `/login`
   - Use "Email" tab
   - Enter your credentials

## API Endpoints

- POST `/api/auth/register` - Register new user
- POST `/api/auth/login` - Login with email/password (via NextAuth)
- POST `/api/auth/logout` - Logout
- GET `/api/auth/me` - Get current user

## Troubleshooting

If you still see "Invalid email or password":

1. Clear browser cache/cookies
2. Verify you're using the correct credentials: `omsable55426@gmail.com` / `orgobloom2025`
3. Check that you're on the Email login tab (not Google)
4. Ensure the backend is running: `npm run dev`

## Database Schema

The User model now supports both authentication methods:

- **Google OAuth:** Uses `provider="google"` with `providerAccountId`
- **Email/Password:** Uses `provider="email"` with `password` hash

Both methods can coexist for the same email address.

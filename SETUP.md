# Attendance System - Setup Guide

## Current Status
✅ Frontend: Running on http://localhost:3000  
✅ Backend: Running on http://localhost:3001  
⚠️ Database: **Tables Not Created Yet**

## Quick Start - Using Demo Credentials

You can immediately log in with **demo credentials** (no database needed):

**Login Page:**
- Email: `admin`
- Password: `admin123`

This allows you to explore the app interface. All data will be stored in browser local storage.

---

## Setting Up Supabase Database (Required for Persistent Data)

### Step 1: Open Supabase SQL Editor

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** (left sidebar)
3. Click **+ New Query**

### Step 2: Copy and Run the Schema

Copy the entire contents of `supabase-schema.sql` from this project and paste it into the Supabase SQL editor.

The script will create these tables:
- `users` - User accounts
- `students` - Student records
- `fees` - Fee payments
- `absent_students` - Absence tracking
- `settings` - App settings
- `inactive_students` - Inactive student archive

### Step 3: Execute the Script

1. Click **Run** button
2. Wait for the script to complete (you should see "Success" message)
3. Refresh the Supabase page to see the new tables

### Step 4: Verify Tables Were Created

In Supabase, check the **Table Editor** (left sidebar) and confirm you see:
- ✅ users
- ✅ students
- ✅ fees
- ✅ absent_students
- ✅ settings
- ✅ inactive_students

---

## Troubleshooting

### "Could not find table" Error
- **Cause:** Tables haven't been created yet
- **Fix:** Run the SQL schema (see Step 2-4 above)

### "Could not authenticate" Error
- **Cause:** Supabase credentials in `.env` are incorrect
- **Fix:** Check your `.env` file:
  ```env
  SUPABASE_URL=https://your-project.supabase.co
  SUPABASE_KEY=your_public_key
  SERVER_PORT=3001
  ```

### Still Seeing White Screen
1. Open browser Developer Tools (F12)
2. Check **Console** tab for any error messages
3. Check **Network** tab to see API responses
4. Try using demo credentials: `admin` / `admin123`

---

## Demo Credentials

These credentials **always work** without needing database:
- **Email:** admin
- **Password:** admin123

Use these to test the user interface while setting up the database.

---

## Database Already Set Up?

If all tables are created, you can sign in with your registered account or use the demo credentials above.

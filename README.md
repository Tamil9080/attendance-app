# Attendance App 🥋

A React-based attendance management system for martial arts classes with MySQL database.

## Features

- ✅ PIN-based login (default: 1234)
- ✅ Add/manage students
- ✅ Mark attendance for Sundays
- ✅ View attendance history
- ✅ Inactive students management
- ✅ Mobile responsive design
- ✅ Settings to change PIN

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Setup MySQL database:**
   - Create database: `attendance_db`
   - Update credentials in `server.js`

3. **Start the application:**
   ```bash
   # Start server (port 3001)
   npm run server

   # Start React app (port 3000)
   npm start
   ```

## Default Credentials

- **PIN:** 1234 (can be changed in Settings)

## Database Tables

- `students` - Active students
- `inactive_students` - Students who stopped attending
- `users` - Login credentials

## Usage

1. Enter PIN to login
2. Add students using "Add Student" button
3. Mark attendance by clicking attendance buttons
4. View detailed attendance in "View Attendance"
5. Manage stopped students in "Stopped Students"
6. Change PIN in Settings

## Tech Stack

- React.js
- Node.js/Express
- MySQL
- HTML/CSS
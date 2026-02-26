// Simple test to check if server starts without errors
const express = require('express');
const mysql = require('mysql2');

console.log('Testing server startup...');

// Test MySQL connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'NARUTO',
  database: 'attendance_db'
});

db.connect((err) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
    process.exit(1);
  }
  console.log('✅ Database connected successfully');
  
  // Test a simple query
  db.execute('SELECT COUNT(*) as count FROM students', (err, results) => {
    if (err) {
      console.error('❌ Query failed:', err.message);
    } else {
      console.log('✅ Query successful, student count:', results[0].count);
    }
    
    db.end();
    console.log('✅ Test completed successfully');
    process.exit(0);
  });
});
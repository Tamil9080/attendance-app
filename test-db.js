const mysql = require('mysql2');

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'NARUTO',
  database: 'attendance_db'
});

// Test connection
db.connect((err) => {
  if (err) {
    console.error('Connection failed:', err);
    return;
  }
  console.log('Connected to database');
  
  // Test select
  db.execute('SELECT * FROM students', (err, results) => {
    if (err) {
      console.error('Select failed:', err);
    } else {
      console.log('Current students:', results);
    }
    db.end();
  });
});
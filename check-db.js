const mysql = require('mysql2');

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'NARUTO',
  database: 'attendance_db'
});

console.log('Testing database connection...');

db.connect((err) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
    if (err.code === 'ECONNREFUSED') {
      console.log('💡 MySQL server is not running. Please start MySQL server.');
    }
    if (err.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('💡 Check your MySQL username and password.');
    }
    if (err.code === 'ER_BAD_DB_ERROR') {
      console.log('💡 Database "attendance_db" does not exist. Create it first.');
    }
  } else {
    console.log('✅ Connected to MySQL database successfully!');
    
    // Test query
    db.execute('SELECT COUNT(*) as count FROM students', (err, results) => {
      if (err) {
        console.error('❌ Query failed:', err.message);
      } else {
        console.log(`✅ Found ${results[0].count} students in database`);
      }
      db.end();
    });
  }
});
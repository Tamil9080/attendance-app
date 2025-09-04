const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// MySQL connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'NARUTO', // Enter your MySQL root password here
  database: 'attendance_db'
});

// Connect to MySQL
db.connect((err) => {
  if (err) {
    console.error('Database connection failed:', err);
    return;
  }
  console.log('Connected to MySQL database');
});

// Create tables if they don't exist
db.execute(`
  CREATE TABLE IF NOT EXISTS students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    firstName VARCHAR(255) NOT NULL,
    lastName VARCHAR(255) NOT NULL,
    phoneNumber VARCHAR(255),
    gender VARCHAR(10),
    fatherName VARCHAR(255),
    address TEXT,
    attendance JSON
  )
`);

db.execute(`
  CREATE TABLE IF NOT EXISTS inactive_students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    original_id INT,
    firstName VARCHAR(255) NOT NULL,
    lastName VARCHAR(255) NOT NULL,
    phoneNumber VARCHAR(255),
    gender VARCHAR(10),
    fatherName VARCHAR(255),
    address TEXT,
    attendance JSON,
    moved_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`);

db.execute(`
  CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`);

// Insert default admin user if not exists
db.execute('SELECT COUNT(*) as count FROM users WHERE username = ?', ['admin'], (err, results) => {
  if (!err && results[0].count === 0) {
    db.execute('INSERT INTO users (username, password) VALUES (?, ?)', ['admin', 'admin123'], (err) => {
      if (!err) console.log('Default admin user created');
    });
  }
});

// Add new columns if they don't exist (MySQL syntax)
db.execute(`ALTER TABLE students ADD COLUMN gender VARCHAR(10)`, (err) => {
  if (err && !err.message.includes('Duplicate column')) {
    console.error('Error adding gender column:', err);
  }
});
db.execute(`ALTER TABLE students ADD COLUMN fatherName VARCHAR(255)`, (err) => {
  if (err && !err.message.includes('Duplicate column')) {
    console.error('Error adding fatherName column:', err);
  }
});
db.execute(`ALTER TABLE students ADD COLUMN address TEXT`, (err) => {
  if (err && !err.message.includes('Duplicate column')) {
    console.error('Error adding address column:', err);
  }
});
db.execute(`ALTER TABLE students ADD COLUMN status VARCHAR(20) DEFAULT 'active'`, (err) => {
  if (err && !err.message.includes('Duplicate column')) {
    console.error('Error adding status column:', err);
  }
});

// Get all students
app.get('/students', (req, res) => {
  const status = req.query.status || 'active';
  const query = status === 'all' ? 'SELECT * FROM students' : 'SELECT * FROM students WHERE status = ?';
  const params = status === 'all' ? [] : [status];
  
  db.execute(query, params, (err, results) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    // Parse JSON attendance data and ensure all fields exist
    const students = results.map(student => ({
      ...student,
      attendance: typeof student.attendance === 'string' ? JSON.parse(student.attendance) : student.attendance,
      gender: student.gender || null,
      fatherName: student.fatherName || null,
      address: student.address || null
    }));
    res.json(students);
  });
});

// Add new student
app.post('/students', (req, res) => {
  const { firstName, lastName, phoneNumber, gender, fatherName, address, attendance } = req.body;
  db.execute(
    'INSERT INTO students (firstName, lastName, phoneNumber, gender, fatherName, address, attendance, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [firstName, lastName, phoneNumber, gender, fatherName, address, JSON.stringify(attendance), 'active'],
    (err, results) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ id: results.insertId, firstName, lastName, phoneNumber, gender, fatherName, address, attendance });
    }
  );
});

// Update student
app.put('/students/:id', (req, res) => {
  const { id } = req.params;
  const { firstName, lastName, phoneNumber, gender, fatherName, address, attendance, status } = req.body;
  console.log('Updating student:', id, { firstName, lastName, phoneNumber, gender, fatherName, address, attendance, status });
  
  db.execute(
    'UPDATE students SET firstName = ?, lastName = ?, phoneNumber = ?, gender = ?, fatherName = ?, address = ?, attendance = ?, status = ? WHERE id = ?',
    [firstName, lastName, phoneNumber || null, gender || null, fatherName || null, address || null, JSON.stringify(attendance || {}), status || 'active', id],
    (err, results) => {
      if (err) {
        console.error('Update error:', err);
        res.status(500).json({ error: err.message });
        return;
      }
      console.log('Update results:', results);
      if (results.affectedRows === 0) {
        res.status(404).json({ error: 'Student not found' });
        return;
      }
      res.json({ id, firstName, lastName, phoneNumber, gender, fatherName, address, attendance, status });
    }
  );
});

// Move student to inactive table
app.delete('/students/:id', (req, res) => {
  const { id } = req.params;
  
  // First get the student data
  db.execute('SELECT * FROM students WHERE id = ?', [id], (err, results) => {
    if (err || results.length === 0) {
      res.status(404).json({ error: 'Student not found' });
      return;
    }
    
    const student = results[0];
    
    // Insert into inactive_students table
    db.execute(
      'INSERT INTO inactive_students (original_id, firstName, lastName, phoneNumber, gender, fatherName, address, attendance) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [student.id, student.firstName, student.lastName, student.phoneNumber, student.gender, student.fatherName, student.address, student.attendance],
      (err) => {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        
        // Delete from students table
        db.execute('DELETE FROM students WHERE id = ?', [id], (err) => {
          if (err) {
            res.status(500).json({ error: err.message });
            return;
          }
          
          res.json({ message: 'Student moved to inactive table' });
        });
      }
    );
  });
});

// Get inactive students
app.get('/inactive-students', (req, res) => {
  db.execute('SELECT * FROM inactive_students', (err, results) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    const students = results.map(student => ({
      ...student,
      attendance: typeof student.attendance === 'string' ? JSON.parse(student.attendance) : student.attendance
    }));
    res.json(students);
  });
});

// Login endpoint
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  db.execute('SELECT * FROM users WHERE username = ? AND password = ?', [username, password], (err, results) => {
    if (err) {
      res.status(500).json({ error: 'Database error' });
      return;
    }
    
    if (results.length > 0) {
      res.json({ success: true, message: 'Login successful' });
    } else {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
  });
});

// Reactivate student
app.post('/reactivate/:id', (req, res) => {
  const { id } = req.params;
  
  db.execute('SELECT * FROM inactive_students WHERE id = ?', [id], (err, results) => {
    if (err || results.length === 0) {
      res.status(404).json({ error: 'Inactive student not found' });
      return;
    }
    
    const student = results[0];
    
    db.execute(
      'INSERT INTO students (firstName, lastName, phoneNumber, gender, fatherName, address, attendance) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [student.firstName, student.lastName, student.phoneNumber, student.gender, student.fatherName, student.address, student.attendance],
      (err) => {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        
        db.execute('DELETE FROM inactive_students WHERE id = ?', [id], (err) => {
          if (err) {
            res.status(500).json({ error: err.message });
            return;
          }
          
          res.json({ message: 'Student reactivated successfully' });
        });
      }
    );
  });
});

// Delete inactive student permanently
app.delete('/inactive-students/:id', (req, res) => {
  const { id } = req.params;
  
  db.execute('DELETE FROM inactive_students WHERE id = ?', [id], (err, results) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (results.affectedRows === 0) {
      res.status(404).json({ error: 'Inactive student not found' });
      return;
    }
    
    res.json({ message: 'Student permanently deleted' });
  });
});

app.listen(3001, '0.0.0.0', () => {
  console.log('Server running on port 3001');
  console.log('Web app runs on: http://192.168.1.36:3000');
  console.log('API server runs on: http://192.168.1.36:3001');
});
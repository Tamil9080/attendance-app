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
  password: 'NARUTO',
  database: 'attendance_db'
});

// Connect to MySQL
db.connect((err) => {
  if (err) {
    console.error('Database connection failed:', err);
    process.exit(1);
  }
  console.log('Connected to MySQL database successfully');
});

// Create tables
db.execute(`
  CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50),
    email VARCHAR(255) UNIQUE,
    phone_number VARCHAR(20),
    password VARCHAR(255) NOT NULL,
    pin VARCHAR(4) DEFAULT '1234'
  )
`);

// Helper to add column if not exists
const addColumn = (table, column, definition) => {
  db.execute(`SHOW COLUMNS FROM ${table} LIKE '${column}'`, (err, results) => {
    if (!err && results.length === 0) {
      db.execute(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`, (err) => {
        if (err) console.error(`Error adding ${column} to ${table}:`, err);
        else console.log(`Added ${column} to ${table}`);
      });
    }
  });
};

// Ensure columns exist for existing tables
setTimeout(() => {
  addColumn('users', 'email', 'VARCHAR(255) UNIQUE');
  addColumn('users', 'phone_number', 'VARCHAR(20)');
  addColumn('students', 'user_id', 'INT');
  addColumn('fees', 'user_id', 'INT');
  addColumn('fees', 'student_name', 'VARCHAR(255)');
  addColumn('absent_students', 'user_id', 'INT');
  addColumn('inactive_students', 'user_id', 'INT');
}, 1000);

db.execute(`
  CREATE TABLE IF NOT EXISTS students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    firstName VARCHAR(255) NOT NULL,
    lastName VARCHAR(255) NOT NULL,
    phoneNumber VARCHAR(255),
    gender VARCHAR(10),
    fatherName VARCHAR(255),
    address TEXT,
    status VARCHAR(20) DEFAULT 'active',
    beltColor VARCHAR(20) DEFAULT 'white',
    attendance JSON
  )
`);

db.execute(`
  CREATE TABLE IF NOT EXISTS fees (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    student_name VARCHAR(255),
    amount DECIMAL(10,2) NOT NULL,
    month VARCHAR(20) NOT NULL,
    year INT NOT NULL,
    payment_date DATE NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'cash',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_student_month_year (student_id, month, year)
  )
`);

db.execute(`
  CREATE TABLE IF NOT EXISTS absent_students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT,
    student_name VARCHAR(255),
    phone_number VARCHAR(255),
    absent_date DATE,
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`);

db.execute(`
  CREATE TABLE IF NOT EXISTS settings (
    \`key\` VARCHAR(255) NOT NULL PRIMARY KEY,
    \`value\` VARCHAR(255) NOT NULL
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
    beltColor VARCHAR(20) DEFAULT 'white',
    attendance JSON,
    moved_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`);

// Insert default admin user
db.execute('SELECT COUNT(*) as count FROM users WHERE username = ?', ['admin'], (err, results) => {
  if (!err && results[0].count === 0) {
    db.execute('INSERT INTO users (username, password, pin) VALUES (?, ?, ?)', ['admin', 'admin123', '1234']);
  }
});

// Auth routes
app.post('/register', (req, res) => {
  const { email, password, phone_number, username, pin } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  db.execute(
    'INSERT INTO users (email, password, phone_number, username, pin) VALUES (?, ?, ?, ?, ?)',
    [email, password, phone_number, username || email.split('@')[0], pin || '1234'],
    (err, results) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(400).json({ error: 'Email already exists' });
        }
        return res.status(500).json({ error: err.message });
      }
      res.json({ success: true, userId: results.insertId, message: 'Registration successful' });
    }
  );
});

app.post('/login', (req, res) => {
  const { email, password } = req.body;
  
  db.execute('SELECT * FROM users WHERE email = ? AND password = ?', [email, password], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (results.length > 0) {
      const user = results[0];
      res.json({ 
        success: true, 
        user: { 
          id: user.id, 
          email: user.email, 
          username: user.username,
          phone_number: user.phone_number 
        } 
      });
    } else {
      // Fallback for old username login
      db.execute('SELECT * FROM users WHERE username = ? AND password = ?', [email, password], (err, results) => {
         if (!err && results.length > 0) {
            const user = results[0];
            res.json({ 
              success: true, 
              user: { 
                id: user.id, 
                email: user.email, 
                username: user.username,
                phone_number: user.phone_number 
              } 
            });
         } else {
            res.status(401).json({ success: false, message: 'Invalid email or password' });
         }
      });
    }
  });
});

// Student routes
app.get('/students', (req, res) => {
  const userId = req.query.userId;
  let query = 'SELECT * FROM students WHERE status = "active"';
  const params = [];

  if (userId) {
    query += ' AND (user_id = ? OR user_id IS NULL)';
    params.push(userId);
  }

  db.execute(query, params, (err, results) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    const students = results.map(student => {
      let attendance = {};
      try {
        if (student.attendance) {
          attendance = typeof student.attendance === 'string' ? JSON.parse(student.attendance) : student.attendance;
        }
      } catch (e) {
        console.error('Error parsing attendance for student', student.id, e);
        attendance = {};
      }
      return {
        ...student,
        attendance
      };
    });
    res.json(students);
  });
});

app.post('/students', (req, res) => {
  const { firstName, lastName, phoneNumber, gender, fatherName, address, beltColor, userId } = req.body;
  db.execute(
    'INSERT INTO students (firstName, lastName, phoneNumber, gender, fatherName, address, beltColor, attendance, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [firstName, lastName, phoneNumber, gender, fatherName, address, beltColor || 'white', JSON.stringify({}), userId || null],
    (err, results) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ id: results.insertId, message: 'Student added successfully' });
    }
  );
});

app.put('/students/:id', (req, res) => {
  const { id } = req.params;
  const { firstName, lastName, phoneNumber, gender, fatherName, address, beltColor, attendance, status } = req.body;
  
  console.log('Updating student', id, 'with attendance:', attendance);
  
  db.execute(
    'UPDATE students SET firstName = ?, lastName = ?, phoneNumber = ?, gender = ?, fatherName = ?, address = ?, beltColor = ?, attendance = ?, status = ? WHERE id = ?',
    [firstName, lastName, phoneNumber, gender, fatherName, address, beltColor, JSON.stringify(attendance || {}), status || 'active', id],
    (err, results) => {
      if (err) {
        console.error('Error updating student:', err);
        res.status(500).json({ error: err.message });
        return;
      }
      console.log('Student updated successfully, affected rows:', results.affectedRows);
      res.json({ message: 'Student updated successfully' });
    }
  );
});

// Fees management routes
app.post('/fees', (req, res) => {
  const { student_id, amount, month, year, payment_date, payment_method, notes, userId } = req.body;
  
  // Get student name for record keeping
  db.execute('SELECT firstName, lastName FROM students WHERE id = ?', [student_id], (err, studentResults) => {
    const student_name = studentResults.length > 0 ? `${studentResults[0].firstName} ${studentResults[0].lastName}` : 'Unknown Student';
    
    db.execute(
      'INSERT INTO fees (student_id, student_name, amount, month, year, payment_date, payment_method, notes, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [student_id, student_name, amount, month, year, payment_date, payment_method || 'cash', notes || '', userId || null],
      (err, results) => {
        if (err) {
          if (err.code === 'ER_DUP_ENTRY') {
            res.status(400).json({ error: 'Fee already paid for this month' });
          } else {
            res.status(500).json({ error: err.message });
          }
          return;
        }
        res.json({ id: results.insertId, message: 'Fee payment recorded successfully' });
      }
    );
  });
});

app.get('/fees', (req, res) => {
  const { student_id, month, year, userId } = req.query;
  let query = `
    SELECT f.*, 
           COALESCE(s.firstName, SUBSTRING_INDEX(f.student_name, ' ', 1)) as firstName,
           COALESCE(s.lastName, SUBSTRING_INDEX(f.student_name, ' ', -1)) as lastName
    FROM fees f 
    LEFT JOIN students s ON f.student_id = s.id 
    WHERE 1=1
  `;
  const params = [];
  
  if (userId) {
    query += ' AND (f.user_id = ? OR f.user_id IS NULL)';
    params.push(userId);
  }

  if (student_id) {
    query += ' AND f.student_id = ?';
    params.push(student_id);
  }
  if (month) {
    query += ' AND f.month = ?';
    params.push(month);
  }
  if (year) {
    query += ' AND f.year = ?';
    params.push(year);
  }
  
  query += ' ORDER BY f.year DESC, f.month DESC, f.payment_date DESC';
  
  db.execute(query, params, (err, results) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(results);
  });
});

app.get('/fees/student/:id', (req, res) => {
  const { id } = req.params;
  
  db.execute(
    'SELECT * FROM fees WHERE student_id = ? ORDER BY year DESC, month DESC',
    [id],
    (err, results) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(results);
    }
  );
});

app.put('/fees/:id', (req, res) => {
  const { id } = req.params;
  const { amount, payment_date, payment_method, notes } = req.body;
  
  db.execute(
    'UPDATE fees SET amount = ?, payment_date = ?, payment_method = ?, notes = ? WHERE id = ?',
    [amount, payment_date, payment_method, notes, id],
    (err, results) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      if (results.affectedRows === 0) {
        res.status(404).json({ error: 'Fee record not found' });
        return;
      }
      res.json({ message: 'Fee record updated successfully' });
    }
  );
});

app.delete('/fees/:id', (req, res) => {
  const { id } = req.params;
  
  db.execute('DELETE FROM fees WHERE id = ?', [id], (err, results) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (results.affectedRows === 0) {
      res.status(404).json({ error: 'Fee record not found' });
      return;
    }
    res.json({ message: 'Fee record deleted successfully' });
  });
});

// Mark fee as paid (for Paid button)
app.post('/fees/mark-paid', (req, res) => {
  const { student_id, amount, month, year, userId } = req.body;
  const currentDate = new Date().toISOString().split('T')[0]; // Current date in YYYY-MM-DD format
  
  // Get student name
  db.execute('SELECT firstName, lastName FROM students WHERE id = ?', [student_id], (err, studentResults) => {
    const student_name = studentResults.length > 0 ? `${studentResults[0].firstName} ${studentResults[0].lastName}` : 'Unknown Student';
    
    db.execute(
      'INSERT INTO fees (student_id, student_name, amount, month, year, payment_date, payment_method, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [student_id, student_name, amount || 0, month, year, currentDate, 'cash', userId || null],
      (err, results) => {
        if (err) {
          if (err.code === 'ER_DUP_ENTRY') {
            res.status(400).json({ error: 'Fee already paid for this month' });
          } else {
            res.status(500).json({ error: err.message });
          }
          return;
        }
        res.json({ success: true, message: 'Fee marked as paid successfully', id: results.insertId });
      }
    );
  });
});

// Check if fee is already paid for a specific month/year
app.get('/fees/check-paid/:student_id/:month/:year', (req, res) => {
  const { student_id, month, year } = req.params;
  
  db.execute(
    'SELECT COUNT(*) as count FROM fees WHERE student_id = ? AND month = ? AND year = ?',
    [student_id, month, year],
    (err, results) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ isPaid: results[0].count > 0 });
    }
  );
});

// Get fee summary for a student
app.get('/fees/summary/:student_id', (req, res) => {
  const { student_id } = req.params;
  
  db.execute(
    `SELECT 
      COUNT(*) as total_payments,
      SUM(amount) as total_amount,
      MAX(payment_date) as last_payment_date
    FROM fees WHERE student_id = ?`,
    [student_id],
    (err, results) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(results[0]);
    }
  );
});

// PIN login
app.post('/pin-login', (req, res) => {
  const { pin, email } = req.body;
  
  let query = 'SELECT * FROM users WHERE username = ?';
  let params = ['admin'];

  if (email) {
    query = 'SELECT * FROM users WHERE email = ?';
    params = [email];
  }
  
  db.execute(query, params, (err, results) => {
    if (err) {
      res.status(500).json({ error: 'Database error' });
      return;
    }
    
    if (results.length === 0) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    const user = results[0];
    const storedPin = user.pin || '1234';
    
    if (pin === storedPin) {
      res.json({ 
        success: true, 
        message: 'Login successful',
        user: { 
          id: user.id, 
          email: user.email, 
          username: user.username,
          phone_number: user.phone_number 
        }
      });
    } else {
      res.status(401).json({ success: false, message: 'Invalid PIN' });
    }
  });
});

app.put('/update-pin', (req, res) => {
  const { newPin } = req.body;
  
  db.execute('UPDATE users SET pin = ? WHERE username = ?', [newPin, 'admin'], (err) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ success: true, message: 'PIN updated successfully' });
  });
});

// Absent students endpoints
app.get('/absent-students', (req, res) => {
  const userId = req.query.userId;
  let query = 'SELECT * FROM absent_students';
  const params = [];

  if (userId) {
    query += ' WHERE user_id = ? OR user_id IS NULL';
    params.push(userId);
  }
  
  query += ' ORDER BY absent_date DESC';

  db.execute(query, params, (err, results) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(results || []);
  });
});

app.post('/absent-students', (req, res) => {
  const { student_id, student_name, phone_number, absent_date, reason, userId } = req.body;
  
  db.execute(
    'INSERT INTO absent_students (student_id, student_name, phone_number, absent_date, reason, user_id) VALUES (?, ?, ?, ?, ?, ?)',
    [student_id, student_name, phone_number || '', absent_date, reason || '', userId || null],
    (err, results) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ id: results.insertId, message: 'Absent student recorded' });
    }
  );
});

app.put('/absent-students/:id', (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  
  db.execute(
    'UPDATE absent_students SET reason = ? WHERE id = ?',
    [reason, id],
    (err, results) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      if (results.affectedRows === 0) {
        res.status(404).json({ error: 'Absent student not found' });
        return;
      }
      res.json({ message: 'Reason updated successfully' });
    }
  );
});

app.delete('/absent-students/:id', (req, res) => {
  const { id } = req.params;
  
  db.execute('DELETE FROM absent_students WHERE id = ?', [id], (err, results) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (results.affectedRows === 0) {
      res.status(404).json({ error: 'Absent student not found' });
      return;
    }
    res.json({ message: 'Student removed from absent list' });
  });
});

// Settings endpoints
app.get('/settings/:key', (req, res) => {
  const { key } = req.params;
  db.execute('SELECT value FROM settings WHERE `key` = ?', [key], (err, results) => {
    if (err || results.length === 0) {
      res.json({ value: '' });
      return;
    }
    res.json({ value: results[0].value });
  });
});

app.put('/settings', (req, res) => {
  const { key, value } = req.body;
  db.execute('INSERT INTO settings (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = ?', [key, value, value], (err) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'Setting updated successfully' });
  });
});

// PIN endpoints
app.get('/pin', (req, res) => {
  const userId = req.query.userId;
  let query = 'SELECT pin FROM users WHERE username = ?';
  let params = ['admin'];

  if (userId) {
    query = 'SELECT pin FROM users WHERE id = ?';
    params = [userId];
  }

  db.execute(query, params, (err, results) => {
    if (err || results.length === 0) {
      res.json({ pin: '1234' });
      return;
    }
    res.json({ pin: results[0].pin });
  });
});

app.put('/pin', (req, res) => {
  const { pin, userId } = req.body;
  let query = 'UPDATE users SET pin = ? WHERE username = ?';
  let params = [pin, 'admin'];

  if (userId) {
    query = 'UPDATE users SET pin = ? WHERE id = ?';
    params = [pin, userId];
  }
  
  db.execute(query, params, (err) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'PIN updated successfully' });
  });
});

// Inactive students endpoints
app.get('/inactive-students', (req, res) => {
  const userId = req.query.userId;
  let query = 'SELECT * FROM inactive_students';
  const params = [];

  if (userId) {
    query += ' WHERE user_id = ? OR user_id IS NULL';
    params.push(userId);
  }

  query += ' ORDER BY moved_date DESC';

  db.execute(query, params, (err, results) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    const students = results.map(student => ({
      ...student,
      attendance: typeof student.attendance === 'string' ? JSON.parse(student.attendance) : student.attendance || {}
    }));
    res.json(students);
  });
});

app.post('/reactivate/:id', (req, res) => {
  const { id } = req.params;
  
  db.execute('SELECT * FROM inactive_students WHERE id = ?', [id], (err, results) => {
    if (err || results.length === 0) {
      res.status(404).json({ error: 'Inactive student not found' });
      return;
    }
    
    const student = results[0];
    
    db.execute(
      'INSERT INTO students (firstName, lastName, phoneNumber, gender, fatherName, address, attendance, status, beltColor) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [student.firstName, student.lastName, student.phoneNumber, student.gender, student.fatherName, student.address, student.attendance, 'active', student.beltColor || 'white'],
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

// Move student to inactive (when deleting from main list)
app.delete('/students/:id', (req, res) => {
  const { id } = req.params;
  
  db.execute('SELECT * FROM students WHERE id = ?', [id], (err, results) => {
    if (err || results.length === 0) {
      res.status(404).json({ error: 'Student not found' });
      return;
    }
    
    const student = results[0];
    
    db.execute(
      'INSERT INTO inactive_students (original_id, firstName, lastName, phoneNumber, gender, fatherName, address, attendance, beltColor, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [student.id, student.firstName, student.lastName, student.phoneNumber, student.gender, student.fatherName, student.address, student.attendance, student.beltColor, student.user_id],
      (err) => {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        
        db.execute('DELETE FROM students WHERE id = ?', [id], (err) => {
          if (err) {
            res.status(500).json({ error: err.message });
            return;
          }
          
          res.json({ message: 'Student moved to inactive list' });
        });
      }
    );
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
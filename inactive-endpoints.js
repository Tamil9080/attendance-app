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

// Reactivate student (move back to students table)
app.post('/reactivate/:id', (req, res) => {
  const { id } = req.params;
  
  // Get student from inactive table
  db.execute('SELECT * FROM inactive_students WHERE id = ?', [id], (err, results) => {
    if (err || results.length === 0) {
      res.status(404).json({ error: 'Inactive student not found' });
      return;
    }
    
    const student = results[0];
    
    // Insert back into students table
    db.execute(
      'INSERT INTO students (firstName, lastName, phoneNumber, gender, fatherName, address, attendance) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [student.firstName, student.lastName, student.phoneNumber, student.gender, student.fatherName, student.address, student.attendance],
      (err) => {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        
        // Delete from inactive table
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
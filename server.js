require('dotenv').config();
const express = require('express');
const cors = require('cors');
const supabase = require('./supabaseClient');

const app = express();
app.use(cors());
app.use(express.json());

// Helper to handle Supabase errors or return data
const handleResponse = (res, { data, error }, successStatus = 200, successBody = null) => {
  if (error) {
    console.error('Supabase error:', error);
    return res.status(500).json({ error: error.message });
  }
  if (successBody) {
    return res.status(successStatus).json(successBody);
  }
  return res.status(successStatus).json(data);
};

// Auth routes
app.post('/register', async (req, res) => {
  const { email, password, phone_number, username, pin } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const { data, error } = await supabase
    .from('users')
    .insert([
      { 
        email, 
        password, 
        phone_number, 
        username: username || email.split('@')[0], 
        pin: pin || '1234',
        workspaces: JSON.stringify(['gym', 'school', 'college', 'other'])
      }
    ])
    .select();

  if (error) {
    if (error.code === '23505') { // Postgres unique violation code
      return res.status(400).json({ error: 'Email already exists' });
    }
    return res.status(500).json({ error: error.message });
  }
  
  res.json({ success: true, userId: data[0].id, message: 'Registration successful' });
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  // Try finding by email
  let { data: users, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .eq('password', password);

  if (error) return res.status(500).json({ error: error.message });

  if (!users || users.length === 0) {
    // Fallback for username login
    const { data: usersByUsername, error: errorUsername } = await supabase
        .from('users')
        .select('*')
        .eq('username', email)
        .eq('password', password);
        
    if (errorUsername || !usersByUsername || usersByUsername.length === 0) {
       return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
    users = usersByUsername;
  }

  const user = users[0];
  let workspaces = ['gym', 'school', 'college', 'other'];
  if (user.workspaces) {
    try {
      workspaces = JSON.parse(user.workspaces);
    } catch (e) {
      console.error('Error parsing user workspaces:', e);
    }
  }

  res.json({ 
    success: true, 
    user: { 
      id: user.id, 
      email: user.email, 
      username: user.username, 
      phone_number: user.phone_number,
      workspaces
    } 
  });
});

app.put('/users/:id/workspaces', async (req, res) => {
  const { id } = req.params;
  const { workspaces } = req.body;
  
  const { error } = await supabase
    .from('users')
    .update({ workspaces: JSON.stringify(workspaces) })
    .eq('id', id);

  if (error) {
    console.error('Error updating workspaces:', error);
    return res.status(500).json({ error: error.message });
  }
  res.json({ success: true, workspaces });
});

// Student routes
app.get('/students', async (req, res) => {
  const userId = req.query.userId;
  const instituteType = req.query.instituteType || 'other';
  
  let query = supabase
    .from('students')
    .select('*')
    .eq('status', 'active')
    .eq('institute_type', instituteType);

  if (userId) {
    query = query.or(`user_id.eq.${userId},user_id.is.null`);
  }

  const { data, error } = await query;

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  const students = data.map(student => {
    let attendance = student.attendance || {};
    // Ensure attendance is an object
    if (typeof attendance === 'string') {
        try { attendance = JSON.parse(attendance); } catch(e) {}
    }
    return { ...student, attendance };
  });
  
  res.json(students);
});

app.post('/students', async (req, res) => {
  const { firstName, lastName, phoneNumber, gender, fatherName, address, beltColor, userId, instituteType } = req.body;
  
  const { data, error } = await supabase
    .from('students')
    .insert([{
      "firstName": firstName,
      "lastName": lastName,
      "phoneNumber": phoneNumber,
      gender,
      "fatherName": fatherName,
      address,
      "beltColor": beltColor || 'white',
      attendance: {},
      user_id: userId || null,
      institute_type: instituteType || 'other'
    }])
    .select();

  if (error) {
    return res.status(500).json({ error: error.message });
  }
  res.json({ id: data[0].id, message: 'Student added successfully' });
});

app.put('/students/:id', async (req, res) => {
  const { id } = req.params;
  const { firstName, lastName, phoneNumber, gender, fatherName, address, beltColor, attendance, status } = req.body;
  
  const { error } = await supabase
    .from('students')
    .update({
      "firstName": firstName,
      "lastName": lastName,
      "phoneNumber": phoneNumber,
      gender,
      "fatherName": fatherName,
      address,
      "beltColor": beltColor,
      attendance: attendance || {},
      status: status || 'active'
    })
    .eq('id', id);

  if (error) {
    return res.status(500).json({ error: error.message });
  }
  res.json({ message: 'Student updated successfully' });
});

// Fees management routes
app.post('/fees', async (req, res) => {
  const { student_id, amount, month, year, payment_date, payment_method, notes, userId, instituteType } = req.body;
  
  // Get student name
  const { data: studentData } = await supabase
    .from('students')
    .select('"firstName", "lastName"')
    .eq('id', student_id)
    .single();
    
  const student_name = studentData 
    ? `${studentData.firstName} ${studentData.lastName}` 
    : 'Unknown Student';

  const { data, error } = await supabase
    .from('fees')
    .insert([{
      student_id,
      student_name,
      amount,
      month,
      year,
      payment_date,
      payment_method: payment_method || 'cash',
      notes: notes || '',
      user_id: userId || null,
      institute_type: instituteType || 'other'
    }])
    .select();

  if (error) {
    if (error.code === '23505') {
       return res.status(400).json({ error: 'Fee already paid for this month' });
    }
    return res.status(500).json({ error: error.message });
  }
  res.json({ id: data[0].id, message: 'Fee payment recorded successfully' });
});

app.get('/fees', async (req, res) => {
  const { student_id, month, year, userId, instituteType } = req.query;
  
  let query = supabase
    .from('fees')
    .select('*, students("firstName", "lastName")')
    .eq('institute_type', instituteType || 'other')
    .order('year', { ascending: false })
    .order('month', { ascending: false })
    .order('payment_date', { ascending: false });

  if (userId) query = query.or(`user_id.eq.${userId},user_id.is.null`);
  if (student_id) query = query.eq('student_id', student_id);
  if (month) query = query.eq('month', month);
  if (year) query = query.eq('year', year);

  const { data, error } = await query;
  
  if (error) return res.status(500).json({ error: error.message });

  const results = data.map(f => {
    // Flatten the student name if student exists, else fallback
    const firstName = f.students ? f.students.firstName : (f.student_name ? f.student_name.split(' ')[0] : '');
    const lastName = f.students ? f.students.lastName : (f.student_name ? f.student_name.split(' ').slice(1).join(' ') : '');
    return {
      ...f,
      firstName,
      lastName
    };
  });

  res.json(results);
});

app.get('/fees/student/:id', async (req, res) => {
  const { id } = req.params;
  
  const { data, error } = await supabase
    .from('fees')
    .select('*')
    .eq('student_id', id)
    .order('year', { ascending: false })
    .order('month', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.put('/fees/:id', async (req, res) => {
  const { id } = req.params;
  const { amount, payment_date, payment_method, notes } = req.body;
  
  const { error, data } = await supabase
    .from('fees')
    .update({ amount, payment_date, payment_method, notes })
    .eq('id', id)
    .select();

  if (error) return res.status(500).json({ error: error.message });
  if (data.length === 0) return res.status(404).json({ error: 'Fee record not found' });
  
  res.json({ message: 'Fee record updated successfully' });
});

app.delete('/fees/:id', async (req, res) => {
  const { id } = req.params;
  
  const { error, data } = await supabase
    .from('fees')
    .delete()
    .eq('id', id)
    .select();

  if (error) return res.status(500).json({ error: error.message });
  if (data.length === 0) return res.status(404).json({ error: 'Fee record not found' });
  
  res.json({ message: 'Fee record deleted successfully' });
});

// Mark fee as paid (for Paid button)
app.post('/fees/mark-paid', async (req, res) => {
  const { student_id, amount, month, year, userId, instituteType } = req.body;
  const currentDate = new Date().toISOString().split('T')[0];
  
  // Get student name
  const { data: studentData } = await supabase
    .from('students')
    .select('"firstName", "lastName"')
    .eq('id', student_id)
    .single();

  const student_name = studentData 
    ? `${studentData.firstName} ${studentData.lastName}` 
    : 'Unknown Student';
    
  const { data, error } = await supabase
    .from('fees')
    .insert([{
      student_id,
      student_name,
      amount: amount || 0,
      month,
      year,
      payment_date: currentDate,
      payment_method: 'cash',
      user_id: userId || null,
      institute_type: instituteType || 'other'
    }])
    .select();

  if (error) {
    if (error.code === '23505') {
       return res.status(400).json({ error: 'Fee already paid for this month' });
    }
    return res.status(500).json({ error: error.message });
  }
  res.json({ success: true, message: 'Fee marked as paid successfully', id: data[0].id });
});

// Check if fee is already paid for a specific month/year
app.get('/fees/check-paid/:student_id/:month/:year', async (req, res) => {
  const { student_id, month, year } = req.params;
  
  const { count, error } = await supabase
    .from('fees')
    .select('*', { count: 'exact', head: true })
    .eq('student_id', student_id)
    .eq('month', month)
    .eq('year', year);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ isPaid: count > 0 });
});

// Get fee summary for a student
app.get('/fees/summary/:student_id', async (req, res) => {
  const { student_id } = req.params;
  
  // Supabase/Postgrest aggregation needs RPC or manual calculation if complex.
  // But we can just fetch all and calculate in JS for simplicity, or use .select with summary?
  // Supabase JS doesn't support aggregate functions directly in .select() easily without RPC.
  // I'll fetch all payments for student and aggregate in JS.
  
  const { data, error } = await supabase
    .from('fees')
    .select('amount, payment_date')
    .eq('student_id', student_id);
    
  if (error) return res.status(500).json({ error: error.message });

  const total_payments = data.length;
  const total_amount = data.reduce((sum, fee) => sum + parseFloat(fee.amount), 0);
  // find max payment date
  let last_payment_date = null;
  if (data.length > 0) {
      // sort
      data.sort((a,b) => new Date(b.payment_date) - new Date(a.payment_date));
      last_payment_date = data[0].payment_date;
  }

  res.json({
      total_payments,
      total_amount,
      last_payment_date
  });
});

// PIN login
app.post('/pin-login', async (req, res) => {
  const { pin, email } = req.body;
  
  let query = supabase.from('users').select('*');
  
  if (email) {
    query = query.eq('email', email);
  } else {
    query = query.eq('username', 'admin');
  }
  
  const { data, error } = await query;
  
  if (error) return res.status(500).json({ error: 'Database error' });
  
  if (!data || data.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
  }

  const user = data[0];
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

app.put('/update-pin', async (req, res) => {
  const { newPin } = req.body;
  
  // Assume generic admin update
  const { error } = await supabase
    .from('users')
    .update({ pin: newPin })
    .eq('username', 'admin'); // Restrict to admin for now based on original code

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true, message: 'PIN updated successfully' });
});

// Absent students endpoints
app.get('/absent-students', async (req, res) => {
  const userId = req.query.userId;
  const instituteType = req.query.instituteType || 'other';
  let query = supabase
    .from('absent_students')
    .select('*')
    .eq('institute_type', instituteType)
    .order('absent_date', { ascending: false });

  if (userId) {
    query = query.or(`user_id.eq.${userId},user_id.is.null`);
  }
  
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});

app.post('/absent-students', async (req, res) => {
  const { student_id, student_name, phone_number, absent_date, reason, userId, instituteType } = req.body;
  
  const { data, error } = await supabase
    .from('absent_students')
    .insert([{
        student_id, 
        student_name, 
        phone_number: phone_number || '', 
        absent_date, 
        reason: reason || '', 
        user_id: userId || null,
        institute_type: instituteType || 'other'
    }])
    .select();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ id: data[0].id, message: 'Absent student recorded' });
});

app.put('/absent-students/:id', async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  
  const { error, data } = await supabase
    .from('absent_students')
    .update({ reason })
    .eq('id', id)
    .select();

  if (error) return res.status(500).json({ error: error.message });
  if (data.length === 0) return res.status(404).json({ error: 'Absent student not found' });
  
  res.json({ message: 'Reason updated successfully' });
});

app.delete('/absent-students/:id', async (req, res) => {
  const { id } = req.params;
  
  const { error, data } = await supabase
    .from('absent_students')
    .delete()
    .eq('id', id)
    .select();

  if (error) return res.status(500).json({ error: error.message });
  if (data.length === 0) return res.status(404).json({ error: 'Absent student not found' });
  
  res.json({ message: 'Student removed from absent list' });
});

// Settings endpoints
app.get('/settings/:key', async (req, res) => {
  const { key } = req.params;
  const instituteType = req.query.instituteType || 'other';
  const { data, error } = await supabase
    .from('settings')
    .select('value')
    .eq('key', key)
    .eq('institute_type', instituteType)
    .single();

  if (error || !data) {
    return res.json({ value: '' });
  }
  res.json({ value: data.value });
});

app.put('/settings', async (req, res) => {
  const { key, value, instituteType } = req.body;
  const { error } = await supabase
    .from('settings')
    .upsert({ key, value: value, institute_type: instituteType || 'other' });

  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Setting updated successfully' });
});

// PIN endpoints (duplicate of pin-login functionality but for retrieval/update)
app.get('/pin', async (req, res) => {
  const userId = req.query.userId;
  let query = supabase.from('users').select('pin');
  
  if (userId) query = query.eq('id', userId);
  else query = query.eq('username', 'admin');

  const { data, error } = await query;

  if (error || !data || data.length === 0) {
    return res.json({ pin: '1234' });
  }
  res.json({ pin: data[0].pin });
});

app.put('/pin', async (req, res) => {
  const { pin, userId } = req.body;
  
  let query = supabase.from('users').update({ pin });
  
  if (userId) query = query.eq('id', userId);
  else query = query.eq('username', 'admin');
  
  const { error } = await query;
  
  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'PIN updated successfully' });
});

// Inactive students endpoints
app.get('/inactive-students', async (req, res) => {
  const userId = req.query.userId;
  const instituteType = req.query.instituteType || 'other';
  let query = supabase
    .from('inactive_students')
    .select('*')
    .eq('institute_type', instituteType)
    .order('moved_date', { ascending: false });

  if (userId) {
    query = query.or(`user_id.eq.${userId},user_id.is.null`);
  }

  const { data, error } = await query;

  if (error) return res.status(500).json({ error: error.message });
  
  const students = data.map(student => ({
    ...student,
    attendance: student.attendance || {}
  }));
  res.json(students);
});

app.post('/reactivate/:id', async (req, res) => {
  const { id } = req.params;
  
  // 1. Get inactive student
  const { data: student, error: fetchError } = await supabase
    .from('inactive_students')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError || !student) {
      return res.status(404).json({ error: 'Inactive student not found' });
  }
  
  // 2. Insert into students
  const { error: insertError } = await supabase
    .from('students')
    .insert([{
      "firstName": student.firstName,
      "lastName": student.lastName,
      "phoneNumber": student.phoneNumber,
      gender: student.gender,
      "fatherName": student.fatherName,
      address: student.address,
      attendance: student.attendance,
      status: 'active',
      "beltColor": student.beltColor || 'white',
      institute_type: student.institute_type || 'other'
    }]);

  if (insertError) return res.status(500).json({ error: insertError.message });
  
  // 3. Delete from inactive
  const { error: deleteError } = await supabase
    .from('inactive_students')
    .delete()
    .eq('id', id);

  if (deleteError) return res.status(500).json({ error: deleteError.message });
  
  res.json({ message: 'Student reactivated successfully' });
});

app.delete('/inactive-students/:id', async (req, res) => {
  const { id } = req.params;
  
  const { error, data } = await supabase
    .from('inactive_students')
    .delete()
    .eq('id', id)
    .select();

  if (error) return res.status(500).json({ error: error.message });
  if (data.length === 0) return res.status(404).json({ error: 'Inactive student not found' });
  
  res.json({ message: 'Student permanently deleted' });
});

// Move student to inactive
app.delete('/students/:id', async (req, res) => {
  const { id } = req.params;
  
  // 1. Get student
  const { data: student, error: fetchError } = await supabase
    .from('students')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError || !student) {
    return res.status(404).json({ error: 'Student not found' });
  }
  
  // 2. Insert into inactive
  const { error: insertError } = await supabase
    .from('inactive_students')
    .insert([{
        original_id: student.id,
        "firstName": student.firstName,
        "lastName": student.lastName,
        "phoneNumber": student.phoneNumber,
        gender: student.gender,
        "fatherName": student.fatherName,
        address: student.address,
        attendance: student.attendance,
        "beltColor": student.beltColor,
        user_id: student.user_id,
        institute_type: student.institute_type || 'other'
    }]);

  if (insertError) return res.status(500).json({ error: insertError.message });

  // 3. Delete from students
  const { error: deleteError } = await supabase
    .from('students')
    .delete()
    .eq('id', id);

  if (deleteError) return res.status(500).json({ error: deleteError.message });
  
  res.json({ message: 'Student moved to inactive list' });
});

const PORT = process.env.SERVER_PORT || 3001;
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

server.on('error', (err) => {
  console.error('Server failed to start:', err);
  process.exit(1);
});

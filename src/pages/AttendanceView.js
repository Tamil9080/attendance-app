import React, { useState, useEffect } from 'react';

const AttendanceView = ({ onBack }) => {
  const goBack = () => {
    onBack();
  };
  const [students, setStudents] = useState([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [editingStudent, setEditingStudent] = useState(null);
  const [editForm, setEditForm] = useState({});

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const getCurrentMonthKey = () => `${monthNames[selectedMonth]}-${selectedYear}`;

  // Load students from database
  useEffect(() => {
    fetch('http://localhost:3001/students')
      .then(res => res.json())
      .then(data => setStudents(data))
      .catch(e => console.error("Could not load data", e));
  }, []);

  // Get all Sundays in the selected month
  const getSundaysInMonth = () => {
    const sundays = [];
    let date = 1;
    let day = new Date(selectedYear, selectedMonth, date);
    while (day.getMonth() === selectedMonth) {
      if (day.getDay() === 0) {
        sundays.push(date);
      }
      date++;
      day = new Date(selectedYear, selectedMonth, date);
    }
    return sundays;
  };

  // Generate year options
  const getYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear - 5; i <= currentYear + 5; i++) {
      years.push(i);
    }
    return years;
  };

  return (
    <div style={{padding: '20px', fontFamily: 'Arial, sans-serif'}}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px'}}>
        <button
          onClick={goBack}
          style={{padding: '8px 16px', backgroundColor: '#6b7280', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer'}}
        >
          Back to Main
        </button>
        <h1 style={{margin: 0}}>Attendance View</h1>
        <div></div>
      </div>
      
      <div style={{marginBottom: '20px', display: 'flex', gap: '10px', justifyContent: 'center'}}>
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
          style={{padding: '8px', border: '1px solid #ccc', borderRadius: '4px'}}
        >
          {monthNames.map((month, index) => (
            <option key={index} value={index}>{month}</option>
          ))}
        </select>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(parseInt(e.target.value))}
          style={{padding: '8px', border: '1px solid #ccc', borderRadius: '4px'}}
        >
          {getYearOptions().map((year) => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
      </div>

      <h2 style={{textAlign: 'center', marginBottom: '20px'}}>
        {monthNames[selectedMonth]} {selectedYear}
      </h2>

      <table style={{width: '100%', borderCollapse: 'collapse', border: '1px solid #ddd'}}>
        <thead>
          <tr style={{backgroundColor: '#f5f5f5'}}>
            <th style={{padding: '10px', border: '1px solid #ddd', textAlign: 'left'}}>Name</th>
            <th style={{padding: '10px', border: '1px solid #ddd', textAlign: 'left'}}>Phone</th>
            {getSundaysInMonth().map((day) => (
              <th key={day} style={{padding: '10px', border: '1px solid #ddd', textAlign: 'center'}}>
                {day}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {students.map((student) => (
            <tr key={student.id}>
              <td style={{padding: '10px', border: '1px solid #ddd'}}>
                <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                  <span>{student.firstName} {student.lastName}</span>
                  <button
                    onClick={() => setSelectedStudent(student)}
                    style={{padding: '4px 8px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px'}}
                  >
                    Details
                  </button>
                </div>
              </td>
              <td style={{padding: '10px', border: '1px solid #ddd'}}>
                {student.phoneNumber || 'N/A'}
              </td>
              {getSundaysInMonth().map((day) => {
                const monthKey = getCurrentMonthKey();
                const status = student.attendance?.[monthKey]?.[day];
                return (
                  <td key={day} style={{padding: '10px', border: '1px solid #ddd', textAlign: 'center'}}>
                    {status === true ? (
                      <span style={{color: 'green', fontSize: '18px'}}>✓</span>
                    ) : status === false ? (
                      <span style={{color: 'red', fontSize: '18px'}}>✗</span>
                    ) : (
                      <span style={{color: '#ccc'}}>-</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {selectedStudent && (
        <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000}}>
          <div style={{backgroundColor: 'white', padding: '30px', borderRadius: '8px', maxWidth: '500px', width: '90%'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
              <h2 style={{margin: 0}}>Student Details</h2>
              <div style={{display: 'flex', gap: '10px'}}>
                <button
                  onClick={() => {
                    setEditingStudent(selectedStudent.id);
                    setEditForm({
                      firstName: selectedStudent.firstName,
                      lastName: selectedStudent.lastName,
                      phoneNumber: selectedStudent.phoneNumber || '',
                      gender: selectedStudent.gender || '',
                      fatherName: selectedStudent.fatherName || '',
                      address: selectedStudent.address || ''
                    });
                  }}
                  style={{padding: '8px 12px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer'}}
                >
                  Edit
                </button>
                <button
                  onClick={async () => {
                    if (window.confirm(`Mark ${selectedStudent.firstName} ${selectedStudent.lastName} as inactive?`)) {
                      try {
                        await fetch(`http://localhost:3001/students/${selectedStudent.id}`, {
                          method: 'DELETE'
                        });
                        setStudents(prev => prev.filter(s => s.id !== selectedStudent.id));
                        setSelectedStudent(null);
                      } catch (e) {
                        console.error('Error marking student inactive:', e);
                      }
                    }
                  }}
                  style={{padding: '8px 12px', backgroundColor: '#dc2626', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer'}}
                >
                  Mark Inactive
                </button>
                <button
                  onClick={() => setSelectedStudent(null)}
                  style={{padding: '8px 12px', backgroundColor: '#6b7280', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer'}}
                >
                  Close
                </button>
              </div>
            </div>
            
            {editingStudent === selectedStudent.id ? (
              <div style={{display: 'grid', gap: '15px'}}>
                <div>
                  <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>First Name:</label>
                  <input
                    type="text"
                    value={editForm.firstName}
                    onChange={(e) => setEditForm({...editForm, firstName: e.target.value})}
                    style={{width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px'}}
                  />
                </div>
                <div>
                  <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>Last Name:</label>
                  <input
                    type="text"
                    value={editForm.lastName}
                    onChange={(e) => setEditForm({...editForm, lastName: e.target.value})}
                    style={{width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px'}}
                  />
                </div>
                <div>
                  <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>Phone:</label>
                  <input
                    type="tel"
                    value={editForm.phoneNumber}
                    onChange={(e) => setEditForm({...editForm, phoneNumber: e.target.value})}
                    style={{width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px'}}
                  />
                </div>
                <div>
                  <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>Gender:</label>
                  <select
                    value={editForm.gender}
                    onChange={(e) => setEditForm({...editForm, gender: e.target.value})}
                    style={{width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px'}}
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div>
                  <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>Father's Name:</label>
                  <input
                    type="text"
                    value={editForm.fatherName}
                    onChange={(e) => setEditForm({...editForm, fatherName: e.target.value})}
                    style={{width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px'}}
                  />
                </div>
                <div>
                  <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>Address:</label>
                  <textarea
                    value={editForm.address}
                    onChange={(e) => setEditForm({...editForm, address: e.target.value})}
                    rows="3"
                    style={{width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', resize: 'vertical'}}
                  />
                </div>
                <div style={{display: 'flex', gap: '10px', justifyContent: 'flex-end'}}>
                  <button
                    onClick={async () => {
                      try {
                        const updatedStudent = {
                          ...selectedStudent,
                          ...editForm,
                          attendance: selectedStudent.attendance
                        };
                        
                        const response = await fetch(`http://localhost:3001/students/${selectedStudent.id}`, {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(updatedStudent)
                        });
                        
                        if (response.ok) {
                          setStudents(prev => prev.map(s => s.id === selectedStudent.id ? updatedStudent : s));
                          setSelectedStudent(updatedStudent);
                          setEditingStudent(null);
                        }
                      } catch (e) {
                        console.error('Error updating student:', e);
                      }
                    }}
                    style={{padding: '8px 16px', backgroundColor: '#059669', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer'}}
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingStudent(null)}
                    style={{padding: '8px 16px', backgroundColor: '#6b7280', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer'}}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div style={{display: 'grid', gap: '15px'}}>
                <div><strong>Name:</strong> {selectedStudent.firstName} {selectedStudent.lastName}</div>
                <div><strong>Phone:</strong> {selectedStudent.phoneNumber || 'N/A'}</div>
                <div><strong>Gender:</strong> {selectedStudent.gender || 'N/A'}</div>
                <div><strong>Father's Name:</strong> {selectedStudent.fatherName || 'N/A'}</div>
                <div><strong>Address:</strong> {selectedStudent.address || 'N/A'}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceView;
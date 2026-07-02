import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';

const AttendanceView = ({ onBack, instituteType }) => {
  const goBack = () => {
    onBack();
  };
  const [students, setStudents] = useState([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [editingStudent, setEditingStudent] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [viewType, setViewType] = useState('single');

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const getCurrentMonthKey = () => `${monthNames[selectedMonth]}-${selectedYear}`;

  // Load students from database
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    const userId = user ? user.id : null;

    fetch(`${API_BASE_URL}/students?userId=${userId}&instituteType=${instituteType}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setStudents(data);
        } else {
          console.error("API error:", data);
          setStudents([]);
        }
      })
      .catch(e => console.error("Could not load data", e));
  }, [instituteType]);

  // Get all Sundays in the selected month
  const getSundaysInMonth = (year = selectedYear, month = selectedMonth) => {
    const sundays = [];
    let date = 1;
    let day = new Date(year, month, date);
    while (day.getMonth() === month) {
      if (day.getDay() === 0) {
        sundays.push(date);
      }
      date++;
      day = new Date(year, month, date);
    }
    return sundays;
  };

  const getMonthsToShow = () => {
    const currentDate = new Date();
    const months = [];
    
    if (viewType === 'single') {
      months.push({ month: selectedMonth, year: selectedYear });
    } else if (viewType === '3months') {
      for (let i = 2; i >= 0; i--) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        months.push({ month: date.getMonth(), year: date.getFullYear() });
      }
    } else if (viewType === '6months') {
      for (let i = 5; i >= 0; i--) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        months.push({ month: date.getMonth(), year: date.getFullYear() });
      }
    }
    
    return months;
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
    <div className="app-container">
      <div className="app-content fade-in">
        <div className="card-header">
          <button onClick={goBack} className="btn btn-secondary hover-lift">
            ← Back to Main
          </button>
          <h1 className="card-title gradient-text">📈 Attendance View</h1>
          <div></div>
        </div>
      
        <div className="card">
          <div className="flex gap-2 justify-center mb-3">
            <button
              onClick={() => setViewType('single')}
              className={`btn hover-lift ${viewType === 'single' ? 'btn-primary' : 'btn-secondary'}`}
            >
              📅 Single Month
            </button>
            <button
              onClick={() => setViewType('3months')}
              className={`btn hover-lift ${viewType === '3months' ? 'btn-primary' : 'btn-secondary'}`}
            >
              📆 3 Months
            </button>
            <button
              onClick={() => setViewType('6months')}
              className={`btn hover-lift ${viewType === '6months' ? 'btn-primary' : 'btn-secondary'}`}
            >
              🗓️ 6 Months
            </button>
          </div>
        
          {viewType === 'single' && (
            <div className="flex gap-2 justify-center">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="form-input"
                style={{minWidth: '150px'}}
              >
                {monthNames.map((month, index) => (
                  <option key={index} value={index}>{month}</option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="form-input"
                style={{minWidth: '120px'}}
              >
                {getYearOptions().map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="card-title text-center mb-3">
            {viewType === 'single'
              ? `${monthNames[selectedMonth]} ${selectedYear}`
              : `Last ${viewType === '3months' ? '3' : '6'} Months`
            }
          </h2>

          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Phone</th>
                  {getMonthsToShow().map(({month, year}) => 
                    getSundaysInMonth(year, month).map((day) => (
                      <th key={`${month}-${year}-${day}`} className="text-center">
                        {viewType === 'single' ? day : `${monthNames[month].slice(0,3)} ${day}`}
                      </th>
                    ))
                  )}
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student.id}>
                    <td className="names">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <select
                            value={student.beltColor || 'white'}
                            onChange={(e) => {
                              const updatedStudent = {...student, beltColor: e.target.value};
                              fetch(`${API_BASE_URL}/students/${student.id}`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(updatedStudent)
                              })
                              .then(() => {
                                setStudents(prev => prev.map(s => s.id === student.id ? updatedStudent : s));
                              })
                              .catch(e => {
                                console.error('Error updating belt color:', e);
                              });
                            }}
                            style={{width: '50px', fontSize: '10px', padding: '2px', margin: 0}}
                            className="form-input"
                          >
                            <option value="white">⚪</option>
                            <option value="yellow">🟡</option>
                            <option value="orange">🟠</option>
                            <option value="green">🟢</option>
                            <option value="blue">🔵</option>
                            <option value="brown">🟤</option>
                            <option value="black">⚫</option>
                          </select>
                          <span>{student.firstName} {student.lastName}</span>
                        </div>
                        <button
                          onClick={() => setSelectedStudent(student)}
                          className="btn btn-primary hover-lift"
                          style={{fontSize: '10px', padding: 'var(--spacing-xs) var(--spacing-sm)'}}
                        >
                          📝 Details
                        </button>
                      </div>
                    </td>
                    <td>
                      {student.phoneNumber || 'N/A'}
                    </td>
                    {getMonthsToShow().map(({month, year}) => 
                      getSundaysInMonth(year, month).map((day) => {
                        const monthKey = `${monthNames[month]}-${year}`;
                        const status = student.attendance?.[monthKey]?.[day];
                        return (
                          <td key={`${student.id}-${month}-${year}-${day}`} className="text-center">
                            {status === true ? (
                              <span className="present" style={{fontSize: '18px'}}>✓</span>
                            ) : status === false ? (
                              <span className="absent" style={{fontSize: '18px'}}>✗</span>
                            ) : (
                              <span style={{color: 'var(--text-secondary)'}}>-</span>
                            )}
                          </td>
                        );
                      })
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {selectedStudent && (
          <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'var(--bg-overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000}}>
            <div className="card" style={{maxWidth: '600px', width: '90%', margin: 0}}>
              <div className="card-header">
                <h2 className="card-title">👤 Student Details</h2>
                <div className="flex gap-2">
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
                    className="btn btn-primary hover-lift"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={async () => {
                      if (window.confirm(`Mark ${selectedStudent.firstName} ${selectedStudent.lastName} as inactive?`)) {
                        try {
                          await fetch(`${API_BASE_URL}/students/${selectedStudent.id}`, {
                            method: 'DELETE'
                          });
                          setStudents(prev => prev.filter(s => s.id !== selectedStudent.id));
                          setSelectedStudent(null);
                        } catch (e) {
                          console.error('Error marking student inactive:', e);
                        }
                      }
                    }}
                    className="btn btn-danger hover-lift"
                  >
                    ⚠️ Inactive
                  </button>
                  <button
                    onClick={() => setSelectedStudent(null)}
                    className="btn btn-secondary hover-lift"
                  >
                    ✖ Close
                  </button>
                </div>
              </div>
            
              {editingStudent === selectedStudent.id ? (
                <div style={{display: 'grid', gap: 'var(--spacing-lg)'}}>
                  <div className="form-group">
                    <label className="form-label">First Name:</label>
                    <input
                      type="text"
                      value={editForm.firstName}
                      onChange={(e) => setEditForm({...editForm, firstName: e.target.value})}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Last Name:</label>
                    <input
                      type="text"
                      value={editForm.lastName}
                      onChange={(e) => setEditForm({...editForm, lastName: e.target.value})}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone:</label>
                    <input
                      type="tel"
                      value={editForm.phoneNumber}
                      onChange={(e) => setEditForm({...editForm, phoneNumber: e.target.value})}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Gender:</label>
                    <select
                      value={editForm.gender}
                      onChange={(e) => setEditForm({...editForm, gender: e.target.value})}
                      className="form-input"
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Father's Name:</label>
                    <input
                      type="text"
                      value={editForm.fatherName}
                      onChange={(e) => setEditForm({...editForm, fatherName: e.target.value})}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Address:</label>
                    <textarea
                      value={editForm.address}
                      onChange={(e) => setEditForm({...editForm, address: e.target.value})}
                      rows="3"
                      className="form-input"
                      style={{resize: 'vertical'}}
                    />
                  </div>
                  <div className="flex gap-2 justify-between">
                    <button
                      onClick={async () => {
                        try {
                          const updatedStudent = {
                            ...selectedStudent,
                            ...editForm,
                            attendance: selectedStudent.attendance
                          };

                          const response = await fetch(`${API_BASE_URL}/students/${selectedStudent.id}`, {
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
                      className="btn btn-success hover-lift"
                    >
                      ✅ Save
                    </button>
                    <button
                      onClick={() => setEditingStudent(null)}
                      className="btn btn-secondary hover-lift"
                    >
                      ✖ Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{display: 'grid', gap: 'var(--spacing-lg)'}}>
                  <div><strong className="text-secondary">Name:</strong> {selectedStudent.firstName} {selectedStudent.lastName}</div>
                  <div><strong className="text-secondary">Phone:</strong> {selectedStudent.phoneNumber || 'N/A'}</div>
                  <div><strong className="text-secondary">Gender:</strong> {selectedStudent.gender || 'N/A'}</div>
                  <div><strong className="text-secondary">Father's Name:</strong> {selectedStudent.fatherName || 'N/A'}</div>
                  <div><strong className="text-secondary">Address:</strong> {selectedStudent.address || 'N/A'}</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* Mobile responsiveness */
const mobileStyles = `
  @media (max-width: 768px) {
    .attendance-view-container {
      padding: 10px !important;
    }
    .attendance-view-header {
      flex-direction: column !important;
      text-align: center !important;
      gap: 10px !important;
    }
    .attendance-view-title {
      font-size: 18px !important;
    }
    .attendance-view-controls {
      flex-direction: column !important;
      gap: 8px !important;
    }
    .attendance-view-select {
      width: 100% !important;
      padding: 8px !important;
      font-size: 16px !important;
    }
    .attendance-view-table {
      font-size: 12px !important;
      overflow-x: auto !important;
    }
    .attendance-view-th, .attendance-view-td {
      padding: 6px !important;
      min-width: 60px !important;
    }
    .attendance-view-modal {
      width: 95% !important;
      padding: 20px !important;
    }
    .attendance-view-modal-header {
      flex-direction: column !important;
      gap: 10px !important;
    }
    .attendance-view-modal-buttons {
      flex-wrap: wrap !important;
      gap: 8px !important;
    }
  }
`;

// Inject mobile styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.type = 'text/css';
  styleSheet.innerText = mobileStyles;
  document.head.appendChild(styleSheet);
}

export default AttendanceView;

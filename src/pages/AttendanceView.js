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
  const [viewType, setViewType] = useState('single');

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const getCurrentMonthKey = () => `${monthNames[selectedMonth]}-${selectedYear}`;

  // Load students from database
  useEffect(() => {
    fetch(`${window.location.protocol}//${window.location.hostname}:3001/students`)
      .then(res => res.json())
      .then(data => setStudents(data))
      .catch(e => console.error("Could not load data", e));
  }, []);

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
    <div style={{padding: '20px', fontFamily: 'Arial, sans-serif', backgroundColor: '#1a1a1a', color: '#ffffff', minHeight: '100vh'}}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px'}}>
        <button
          onClick={goBack}
          style={{padding: '8px 16px', background: 'linear-gradient(135deg, #6b7280 0%, #4a4845 100%)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer'}}
        >
          Back to Main
        </button>
        <h1 style={{margin: 0, color: '#ffffff'}}>Attendance View</h1>
        <div></div>
      </div>
      
      <div style={{marginBottom: '20px'}}>
        <div style={{marginBottom: '15px', display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap'}}>
          <button
            onClick={() => setViewType('single')}
            style={{
              padding: '8px 16px',
              minWidth: '100px',
              background: viewType === 'single' ? 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)' : 'linear-gradient(135deg, #2d2d2d 0%, #1f1f1f 100%)',
              color: 'white',
              border: '1px solid #404040',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Single Month
          </button>
          <button
            onClick={() => setViewType('3months')}
            style={{
              padding: '8px 16px',
              minWidth: '100px',
              background: viewType === '3months' ? 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)' : 'linear-gradient(135deg, #2d2d2d 0%, #1f1f1f 100%)',
              color: 'white',
              border: '1px solid #404040',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            3 Months
          </button>
          <button
            onClick={() => setViewType('6months')}
            style={{
              padding: '8px 16px',
              minWidth: '100px',
              background: viewType === '6months' ? 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)' : 'linear-gradient(135deg, #2d2d2d 0%, #1f1f1f 100%)',
              color: 'white',
              border: '1px solid #404040',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            6 Months
          </button>
        </div>
        
        {viewType === 'single' && (
          <div style={{display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap'}}>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              style={{
                padding: '10px 15px',
                border: '2px solid #007bff',
                borderRadius: '8px',
                backgroundColor: '#1a1a1a',
                color: '#ffffff',
                fontSize: '16px',
                outline: 'none',
                minWidth: '120px'
              }}
            >
              {monthNames.map((month, index) => (
                <option key={index} value={index}>{month}</option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              style={{
                padding: '10px 15px',
                border: '2px solid #007bff',
                borderRadius: '8px',
                backgroundColor: '#1a1a1a',
                color: '#ffffff',
                fontSize: '16px',
                outline: 'none',
                minWidth: '100px'
              }}
            >
              {getYearOptions().map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <h2 style={{textAlign: 'center', marginBottom: '20px', color: '#ffffff'}}>
        {viewType === 'single'
          ? `${monthNames[selectedMonth]} ${selectedYear}`
          : `Last ${viewType === '3months' ? '3' : '6'} Months`
        }
      </h2>

      <div style={{overflowX: 'auto'}}>
        <table style={{width: '100%', borderCollapse: 'collapse', border: '1px solid #404040', backgroundColor: '#2d2d2d', minWidth: '600px'}}>
        <thead>
          <tr style={{background: 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)'}}>
            <th style={{padding: '10px', border: '1px solid #404040', textAlign: 'left', color: '#ffffff'}}>Name</th>
            <th style={{padding: '10px', border: '1px solid #404040', textAlign: 'left', color: '#ffffff'}}>Phone</th>
            {getMonthsToShow().map(({month, year}) => 
              getSundaysInMonth(year, month).map((day) => (
                <th key={`${month}-${year}-${day}`} style={{padding: '10px', border: '1px solid #404040', textAlign: 'center', color: '#ffffff'}}>
                  {viewType === 'single' ? day : `${monthNames[month].slice(0,3)} ${day}`}
                </th>
              ))
            )}
          </tr>
        </thead>
        <tbody>
          {students.map((student) => (
            <tr key={student.id}>
              <td style={{padding: '10px', border: '1px solid #404040', color: '#ffffff'}}>
                <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                  <span>{student.firstName} {student.lastName}</span>
                  <button
                    onClick={() => setSelectedStudent(student)}
                    style={{padding: '4px 8px', background: 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px'}}
                  >
                    Details
                  </button>
                </div>
              </td>
              <td style={{padding: '10px', border: '1px solid #404040', color: '#ffffff'}}>
                {student.phoneNumber || 'N/A'}
              </td>
              {getMonthsToShow().map(({month, year}) => 
                getSundaysInMonth(year, month).map((day) => {
                  const monthKey = `${monthNames[month]}-${year}`;
                  const status = student.attendance?.[monthKey]?.[day];
                  return (
                    <td key={`${student.id}-${month}-${year}-${day}`} style={{padding: '10px', border: '1px solid #ddd', textAlign: 'center'}}>
                      {status === true ? (
                        <span style={{color: 'green', fontSize: '18px'}}>✓</span>
                      ) : status === false ? (
                        <span style={{color: 'red', fontSize: '18px'}}>✗</span>
                      ) : (
                        <span style={{color: '#ccc'}}>-</span>
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

      {selectedStudent && (
        <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000}}>
          <div style={{backgroundColor: '#2d2d2d', padding: '30px', borderRadius: '8px', maxWidth: '500px', width: '90%', border: '1px solid #404040'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
              <h2 style={{margin: 0, color: '#ffffff'}}>Student Details</h2>
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
                  style={{padding: '8px 12px', background: 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer'}}
                >
                  Edit
                </button>
                <button
                  onClick={async () => {
                    if (window.confirm(`Mark ${selectedStudent.firstName} ${selectedStudent.lastName} as inactive?`)) {
                      try {
                        await fetch(`${window.location.protocol}//${window.location.hostname}:3001/students/${selectedStudent.id}`, {
                          method: 'DELETE'
                        });
                        setStudents(prev => prev.filter(s => s.id !== selectedStudent.id));
                        setSelectedStudent(null);
                      } catch (e) {
                        console.error('Error marking student inactive:', e);
                      }
                    }
                  }}
                  style={{padding: '8px 12px', background: 'linear-gradient(135deg, #dc3545 0%, #a71d2a 100%)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer'}}
                >
                  Mark Inactive
                </button>
                <button
                  onClick={() => setSelectedStudent(null)}
                  style={{padding: '8px 12px', background: 'linear-gradient(135deg, #6b7280 0%, #4a4845 100%)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer'}}
                >
                  Close
                </button>
              </div>
            </div>
            
            {editingStudent === selectedStudent.id ? (
              <div style={{display: 'grid', gap: '15px'}}>
                <div>
                  <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#ffffff'}}>First Name:</label>
                  <input
                    type="text"
                    value={editForm.firstName}
                    onChange={(e) => setEditForm({...editForm, firstName: e.target.value})}
                    style={{width: '100%', padding: '8px', border: '2px solid #404040', borderRadius: '4px', backgroundColor: '#1a1a1a', color: '#ffffff'}}
                  />
                </div>
                <div>
                  <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#ffffff'}}>Last Name:</label>
                  <input
                    type="text"
                    value={editForm.lastName}
                    onChange={(e) => setEditForm({...editForm, lastName: e.target.value})}
                    style={{width: '100%', padding: '8px', border: '2px solid #404040', borderRadius: '4px', backgroundColor: '#1a1a1a', color: '#ffffff'}}
                  />
                </div>
                <div>
                  <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#ffffff'}}>Phone:</label>
                  <input
                    type="tel"
                    value={editForm.phoneNumber}
                    onChange={(e) => setEditForm({...editForm, phoneNumber: e.target.value})}
                    style={{width: '100%', padding: '8px', border: '2px solid #404040', borderRadius: '4px', backgroundColor: '#1a1a1a', color: '#ffffff'}}
                  />
                </div>
                <div>
                  <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#ffffff'}}>Gender:</label>
                  <select
                    value={editForm.gender}
                    onChange={(e) => setEditForm({...editForm, gender: e.target.value})}
                    style={{width: '100%', padding: '8px', border: '2px solid #404040', borderRadius: '4px', backgroundColor: '#1a1a1a', color: '#ffffff'}}
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div>
                  <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#ffffff'}}>Father's Name:</label>
                  <input
                    type="text"
                    value={editForm.fatherName}
                    onChange={(e) => setEditForm({...editForm, fatherName: e.target.value})}
                    style={{width: '100%', padding: '8px', border: '2px solid #404040', borderRadius: '4px', backgroundColor: '#1a1a1a', color: '#ffffff'}}
                  />
                </div>
                <div>
                  <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#ffffff'}}>Address:</label>
                  <textarea
                    value={editForm.address}
                    onChange={(e) => setEditForm({...editForm, address: e.target.value})}
                    rows="3"
                    style={{width: '100%', padding: '8px', border: '2px solid #404040', borderRadius: '4px', resize: 'vertical', backgroundColor: '#1a1a1a', color: '#ffffff'}}
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

                        const response = await fetch(`${window.location.protocol}//${window.location.hostname}:3001/students/${selectedStudent.id}`, {
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
                    style={{padding: '8px 16px', background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer'}}
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingStudent(null)}
                    style={{padding: '8px 16px', background: 'linear-gradient(135deg, #6b7280 0%, #4a4845 100%)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer'}}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div style={{display: 'grid', gap: '15px'}}>
                <div style={{color: '#ffffff'}}><strong style={{color: '#cccccc'}}>Name:</strong> {selectedStudent.firstName} {selectedStudent.lastName}</div>
                <div style={{color: '#ffffff'}}><strong style={{color: '#cccccc'}}>Phone:</strong> {selectedStudent.phoneNumber || 'N/A'}</div>
                <div style={{color: '#ffffff'}}><strong style={{color: '#cccccc'}}>Gender:</strong> {selectedStudent.gender || 'N/A'}</div>
                <div style={{color: '#ffffff'}}><strong style={{color: '#cccccc'}}>Father's Name:</strong> {selectedStudent.fatherName || 'N/A'}</div>
                <div style={{color: '#ffffff'}}><strong style={{color: '#cccccc'}}>Address:</strong> {selectedStudent.address || 'N/A'}</div>
              </div>
            )}
          </div>
        </div>
      )}
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

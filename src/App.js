import React, { useState, useEffect } from 'react';
import './App.css';
import AttendanceView from './pages/AttendanceView';
import AddStudent from './pages/AddStudent';
import InactiveStudents from './pages/InactiveStudents';
import PinLogin from './pages/PinLogin';
import Settings from './pages/Settings';
import AttendanceControl from './components/AttendanceControl';

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    // Clear login status on app start
    localStorage.removeItem('isLoggedIn');
    return false;
  });
  const [students, setStudents] = useState([]);

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [message, setMessage] = useState('');
  const [isMessageVisible, setIsMessageVisible] = useState(false);

  const [lockedDays, setLockedDays] = useState({});

  // Check login status
  useEffect(() => {
    const loginStatus = localStorage.getItem('isLoggedIn');
    if (loginStatus === 'true') {
      setIsLoggedIn(true);
    }
  }, []);

  // Load locked days from localStorage
  useEffect(() => {
    const savedLocks = localStorage.getItem('lockedDays');
    if (savedLocks) {
      setLockedDays(JSON.parse(savedLocks));
    }
  }, []);
  const [currentView, setCurrentView] = useState('main');

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const getCurrentMonthKey = () => `${monthNames[selectedMonth]}-${selectedYear}`;

  // Load students from database on initial render
  useEffect(() => {
    fetch('http://localhost:3001/students')
      .then(res => res.json())
      .then(data => setStudents(data))
      .catch(e => {
        console.error("Could not load data from database", e);
        showMessage("Error loading data from database.");
      });
  }, []);

  // Helper function to show a message
  const showMessage = (text) => {
    setMessage(text);
    setIsMessageVisible(true);
    setTimeout(() => {
      setIsMessageVisible(false);
    }, 3000);
  };







  // Handle changing a student's attendance
  const handleAttendanceChange = async (studentId, day, newStatus) => {
    const monthKey = getCurrentMonthKey();
    const student = students.find(s => s.id === studentId);
    if (student) {
      const monthAttendance = student.attendance[monthKey] || {};
      const updatedStudent = {
        ...student,
        attendance: {
          ...student.attendance,
          [monthKey]: {
            ...monthAttendance,
            [day]: newStatus
          }
        }
      };
      
      // Update locally first for immediate UI response
      setStudents(prev => prev.map(s => s.id === studentId ? updatedStudent : s));
      
      // Save to database
      try {
        const response = await fetch(`http://localhost:3001/students/${studentId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedStudent)
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        showMessage(`Attendance saved for ${student.firstName}`);
      } catch (e) {
        console.error("Could not save attendance", e);
        showMessage("Error saving attendance to database.");
        setStudents(prev => prev.map(s => s.id === studentId ? student : s));
      }
    }
  };

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

  // Generate year options (current year ± 5 years)
  const getYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear - 5; i <= currentYear + 5; i++) {
      years.push(i);
    }
    return years;
  };

  const renderDays = () => {
    return getSundaysInMonth().map((day) => (
      <th key={day} className="day-th">
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px'}}>
          <span>{day}</span>
          <div style={{display: 'flex', gap: '3px'}}>
            <button
              onClick={() => toggleDayLock(day)}
              style={{
                padding: '2px 6px',
                backgroundColor: lockedDays[day] ? '#dc2626' : '#059669',
                color: 'white',
                border: 'none',
                borderRadius: '3px',
                cursor: 'pointer',
                fontSize: '10px'
              }}
            >
              {lockedDays[day] ? 'Edit' : 'Save'}
            </button>
          </div>
        </div>
      </th>
    ));
  };

  const toggleDayLock = (day) => {
    const newLockedDays = {
      ...lockedDays,
      [day]: !lockedDays[day]
    };
    setLockedDays(newLockedDays);
    // Save to localStorage
    localStorage.setItem('lockedDays', JSON.stringify(newLockedDays));
    
    showMessage(newLockedDays[day] ? `Day ${day} locked` : `Day ${day} unlocked`);
  };
  


  const calculateAttendanceSummary = (student) => {
    const monthKey = getCurrentMonthKey();
    const attendanceRecords = student.attendance[monthKey] || {};
    let presentCount = 0;
    let absentCount = 0;
    for (const day in attendanceRecords) {
      if (attendanceRecords[day] === true) {
        presentCount++;
      } else if (attendanceRecords[day] === false) {
        absentCount++;
      }
    }
    return { presentCount, absentCount };
  };

  if (currentView === 'view') {
    return <AttendanceView onBack={() => setCurrentView('main')} />;
  }

  if (currentView === 'add') {
    return <AddStudent onBack={() => setCurrentView('main')} onStudentAdded={() => {
      // Reload from database
      fetch('http://localhost:3001/students')
        .then(res => res.json())
        .then(data => setStudents(data))
        .catch(e => console.error("Could not reload students", e));
    }} />;
  }

  if (currentView === 'inactive') {
    return <InactiveStudents onBack={() => setCurrentView('main')} />;
  }

  if (currentView === 'settings') {
    return <Settings onBack={() => setCurrentView('main')} />;
  }

  // Show PIN login if not logged in
  if (!isLoggedIn) {
    return <PinLogin onLogin={() => setIsLoggedIn(true)} />;
  }

  return (
    <div className="app-container">
      <div className="app-content">
        {isMessageVisible && (
          <div className="message-box">
            {message}
          </div>
        )}
        <header className="app-header">
          <div className="app-header-left">
            <span className="karate-emoji" role="img" aria-label="karate">
              🥋
            </span>
            <h1 className="app-title">
              Attendance App
            </h1>
          </div>
          <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
            <button
              onClick={() => setCurrentView('add')}
              style={{padding: '8px 16px', backgroundColor: '#059669', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '10px'}}
            >
              Add Student
            </button>
            <button
              onClick={() => setCurrentView('view')}
              style={{padding: '8px 16px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '10px'}}
            >
              View Attendance
            </button>
            <button
              onClick={() => setCurrentView('inactive')}
              style={{padding: '8px 16px', backgroundColor: '#dc2626', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer'}}
            >
              Stopped Students
            </button>
            <div className="year-display">{selectedYear}</div>
            <button
              onClick={() => setCurrentView('settings')}
              style={{padding: '8px 16px', backgroundColor: '#6b7280', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer'}}
            >
              Settings
            </button>
          </div>
        </header>

        <section className="selection-section">
          <h2>Select Month & Year</h2>
          <div className="select-container">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="select-input"
            >
              {monthNames.map((month, index) => (
                <option key={index} value={index}>{month}</option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="select-input"
            >
              {getYearOptions().map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </section>

        <section className="attendance-section">
          <h2>
            Attendance for {monthNames[selectedMonth]} {selectedYear}
          </h2>
          <table className="attendance-table">
            <thead>
              <tr>
                <th>
                  Names
                </th>
                {renderDays()}
                <th className="center">
                  Total
                </th>

              </tr>
            </thead>
            <tbody>
              {students.length === 0 && (
                <tr>
                  <td colSpan={getSundaysInMonth().length + 2} className="no-students">
                    No students added yet.
                  </td>
                </tr>
              )}
              {students.map((student) => {
                const { presentCount, absentCount } = calculateAttendanceSummary(student);
                return (
                  <tr key={student.id}>
                    <td className="names">
                      <span>{student.firstName} {student.lastName}</span>
                    </td>
                    {getSundaysInMonth().map((day) => (
                      <td key={day} className="attendance-cell">
                        <AttendanceControl
                          studentId={student.id}
                          day={day}
                          status={student.attendance?.[getCurrentMonthKey()]?.[day]}
                          handleAttendanceChange={handleAttendanceChange}
                          showMessage={showMessage}
                          isLocked={lockedDays[day]}
                        />
                      </td>
                    ))}
                    <td className="center">
                      <span className="present">P: {presentCount}</span> / <span className="absent">A: {absentCount}</span>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>


      </div>
    </div>
  );
};



export default App;

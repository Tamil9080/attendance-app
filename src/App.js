import React, { useState, useEffect } from 'react';
import './App.css';
import AttendanceView from './pages/AttendanceView';
import AddStudent from './pages/AddStudent';
import InactiveStudents from './pages/InactiveStudents';
import AbsentStudents from './pages/AbsentStudents';
import PinLogin from './pages/PinLogin';
import Settings from './pages/Settings';
import Dashboard from './pages/Dashboard';
import BulkOperations from './pages/BulkOperations';
import Analytics from './pages/Analytics';
import Notifications from './pages/Notifications';
import Fees from './pages/Fees';
import AttendanceControl from './components/AttendanceControl';

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    // Clear login status on app start
    localStorage.removeItem('isLoggedIn');
    return false;
  });
  const [students, setStudents] = useState([]);
  const [isDarkTheme, setIsDarkTheme] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

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

  // Theme management
  useEffect(() => {
    if (isDarkTheme) {
      document.body.classList.add('dark-theme');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark-theme');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkTheme]);

  const toggleTheme = () => {
    setIsDarkTheme(!isDarkTheme);
  };

  // Load locked days from localStorage
  useEffect(() => {
    const savedLocks = localStorage.getItem('lockedDays');
    if (savedLocks) {
      setLockedDays(JSON.parse(savedLocks));
    }
  }, []);
  const [currentView, setCurrentView] = useState('main');
  const [showMenu, setShowMenu] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudents, setSelectedStudents] = useState([]);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const getCurrentMonthKey = () => `${monthNames[selectedMonth]}-${selectedYear}`;

  // Load students from database on initial render
  useEffect(() => {
    fetch(`${window.location.protocol}//${window.location.hostname}:3001/students`)
      .then(res => res.json())
      .then(data => setStudents(data))
      .catch(e => {
        console.error("Could not load data from database", e);
        showMessage("Error loading data from database.");
      });
  }, []);

  // Enhanced message system
  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setIsMessageVisible(true);
    setTimeout(() => {
      setIsMessageVisible(false);
    }, 4000);
  };

  // Bulk attendance operations
  const handleBulkAttendance = async (status) => {
    if (selectedStudents.length === 0) {
      showMessage('Please select students first', 'error');
      return;
    }
    
    setLoading(true);
    const promises = selectedStudents.map(studentId => 
      getSundaysInMonth().map(day => 
        handleAttendanceChange(studentId, day, status)
      )
    ).flat();
    
    await Promise.all(promises);
    setSelectedStudents([]);
    setLoading(false);
    showMessage(`Marked ${selectedStudents.length} students as ${status ? 'present' : 'absent'}`);
  };

  // Filter students based on search
  const filteredStudents = students.filter(student => 
    `${student.firstName} ${student.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  );


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
        const response = await fetch(`${window.location.protocol}//${window.location.hostname}:3001/students/${studentId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedStudent)
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        // WhatsApp messages will be sent when day is saved/locked
        
        // Save absent students when marked absent
        if (newStatus === false) {
          const absentRecord = {
            student_id: studentId,
            student_name: `${student.firstName} ${student.lastName}`,
            phone_number: student.phoneNumber || '',
            absent_date: `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
            reason: ''
          };
          
          fetch(`${window.location.protocol}//${window.location.hostname}:3001/absent-students`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(absentRecord)
          })
          .catch(e => {
            console.error('Error saving absent student:', e);
          });
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

  if (currentView === 'dashboard') {
    return <Dashboard onBack={() => setCurrentView('main')} />;
  }

  if (currentView === 'view') {
    return <AttendanceView onBack={() => setCurrentView('main')} />;
  }

  if (currentView === 'add') {
    return <AddStudent onBack={() => setCurrentView('main')} onStudentAdded={() => {
      // Reload from database
      fetch(`${window.location.protocol}//${window.location.hostname}:3001/students`)
        .then(res => res.json())
        .then(data => setStudents(data))
        .catch(e => console.error("Could not reload students", e));
    }} />;
  }

  if (currentView === 'bulk') {
    return <BulkOperations onBack={() => setCurrentView('main')} />;
  }

  if (currentView === 'analytics') {
    return <Analytics onBack={() => setCurrentView('main')} />;
  }

  if (currentView === 'notifications') {
    return <Notifications onBack={() => setCurrentView('main')} />;
  }

  if (currentView === 'fees') {
    return <Fees onBack={() => setCurrentView('main')} />;
  }

  if (currentView === 'inactive') {
    return <InactiveStudents onBack={() => setCurrentView('main')} />;
  }

  if (currentView === 'settings') {
    return <Settings onBack={() => setCurrentView('main')} />;
  }
  if (currentView === 'absent') {
    return <AbsentStudents onBack={() => setCurrentView('main')} />;
  }

  // Show PIN login if not logged in
  if (!isLoggedIn) {
    return <PinLogin onLogin={() => setIsLoggedIn(true)} />;
  }

  return (
    <div className="app-container">
      <div className="app-content">
        {isMessageVisible && (
          <div className={`toast ${message.type === 'error' ? 'error' : ''}`}>
            {message.type === 'success' ? '✅' : '❌'} {message.text}
          </div>
        )}
        <header className="app-header">
          <div className="app-header-left">
            <span className="karate-emoji" role="img" aria-label="karate">
              🥋
            </span>
            <h1 className="app-title">
              Attendance System
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="status-info" style={{cursor: 'default', padding: 'var(--spacing-md) var(--spacing-lg)', fontSize: '14px', fontWeight: '600'}}>
              📅 {monthNames[selectedMonth]} {selectedYear}
            </div>
            <button
              onClick={toggleTheme}
              className="theme-toggle"
              title={isDarkTheme ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDarkTheme ? '☀️' : '🌙'}
            </button>
            <div style={{position: 'relative'}}>
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="btn btn-primary hover-lift"
              >
                ☰ Menu
              </button>
              {showMenu && (
                <>
                  <div 
                    style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.3)', zIndex: 999}}
                    onClick={() => setShowMenu(false)}
                  />
                  <div className="dropdown-menu">
                    <button className="dropdown-item" onClick={() => {setCurrentView('dashboard'); setShowMenu(false);}}>
                      📊 Dashboard
                    </button>
                    <button className="dropdown-item" onClick={() => {setCurrentView('add'); setShowMenu(false);}}>
                      👤 Add Student
                    </button>
                    <button className="dropdown-item" onClick={() => {setCurrentView('bulk'); setShowMenu(false);}}>
                      ⚡ Bulk Operations
                    </button>
                    <button className="dropdown-item" onClick={() => {setCurrentView('analytics'); setShowMenu(false);}}>
                      📈 Analytics
                    </button>
                    <button className="dropdown-item" onClick={() => {setCurrentView('notifications'); setShowMenu(false);}}>
                      🔔 Notifications
                    </button>
                    <button className="dropdown-item" onClick={() => {setCurrentView('fees'); setShowMenu(false);}}>
                      💰 Fees Management
                    </button>
                    <button className="dropdown-item" onClick={() => {setCurrentView('view'); setShowMenu(false);}}>
                      📋 View Reports
                    </button>
                    <button className="dropdown-item" onClick={() => {setCurrentView('absent'); setShowMenu(false);}}>
                      ❌ Absent Students
                    </button>
                    <button className="dropdown-item" onClick={() => {setCurrentView('inactive'); setShowMenu(false);}}>
                      ⏸️ Inactive Students
                    </button>
                    <button className="dropdown-item" onClick={() => {setCurrentView('settings'); setShowMenu(false);}}>
                      ⚙️ Settings
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <div className="card">
          <div className="card-header">
            <h2 className="card-title">📅 Select Period</h2>
            <div className="flex gap-2">
              <button 
                className="btn btn-primary hover-lift"
                onClick={() => {
                  const today = new Date();
                  setSelectedMonth(today.getMonth());
                  setSelectedYear(today.getFullYear());
                }}
              >
                📍 Current Month
              </button>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="form-group" style={{flex: 1}}>
              <label className="form-label">Month</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="form-input"
              >
                {monthNames.map((month, index) => (
                  <option key={index} value={index}>{month}</option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{flex: 1}}>
              <label className="form-label">Year</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="form-input"
              >
                {getYearOptions().map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="card-title">
              📋 Attendance for {monthNames[selectedMonth]} {selectedYear}
            </h2>
            <div className="flex gap-2">
              <button 
                className="btn btn-success hover-lift"
                onClick={() => {
                  const monthKey = getCurrentMonthKey();
                  const sundays = getSundaysInMonth();
                  
                  let csvContent = `Student Name,${sundays.join(',')},Present,Absent\n`;
                  
                  students.forEach(student => {
                    const { presentCount, absentCount } = calculateAttendanceSummary(student);
                    const attendanceRow = sundays.map(day => {
                      const status = student.attendance?.[monthKey]?.[day];
                      return status === true ? 'P' : status === false ? 'A' : '-';
                    });
                    
                    csvContent += `"${student.firstName} ${student.lastName}",${attendanceRow.join(',')},${presentCount},${absentCount}\n`;
                  });
                  
                  const blob = new Blob([csvContent], { type: 'text/csv' });
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `Attendance_${monthNames[selectedMonth]}_${selectedYear}.csv`;
                  a.click();
                  window.URL.revokeObjectURL(url);
                  
                  showMessage('Attendance report exported successfully!');
                }}
              >
                📊 Export Report
              </button>
            </div>
          </div>
          <div className="table-container">
            <table className="table">
            <thead>
              <tr>
                <th>Names ({students.length})</th>
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
              {students.sort((a, b) => {
                // Sort by belt color order: White, Yellow, Orange, Green, Blue, Brown, Black
                const beltOrder = ['white', 'yellow', 'orange', 'green', 'blue', 'brown', 'black'];
                const aBelt = (a.beltColor || 'white').toLowerCase();
                const bBelt = (b.beltColor || 'white').toLowerCase();
                const aIndex = beltOrder.indexOf(aBelt);
                const bIndex = beltOrder.indexOf(bBelt);
                
                if (aIndex !== bIndex) {
                  return aIndex - bIndex;
                }
                // If same belt, sort by name
                return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
              }).map((student) => {
                const { presentCount, absentCount } = calculateAttendanceSummary(student);
                return (
                  <tr key={student.id}>
                    <td className="names">
                      <span style={{fontWeight: '600'}}>{student.firstName} {student.lastName}</span>
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
          </div>
        </div>


      </div>
    </div>
  );
};



export default App;
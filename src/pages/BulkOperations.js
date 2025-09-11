import React, { useState, useEffect } from 'react';

const BulkOperations = ({ onBack }) => {
  const [students, setStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [operation, setOperation] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch(`${window.location.protocol}//${window.location.hostname}:3001/students`)
      .then(res => res.json())
      .then(data => setStudents(data))
      .catch(e => console.error('Error loading students:', e));
  }, []);

  const handleSelectAll = () => {
    if (selectedStudents.length === students.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(students.map(s => s.id));
    }
  };

  const executeBulkOperation = async () => {
    if (!operation || selectedStudents.length === 0) {
      setMessage('Please select students and operation');
      return;
    }

    try {
      if (operation === 'present' || operation === 'absent') {
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'];
        const date = new Date(selectedDate);
        const monthKey = `${monthNames[date.getMonth()]}-${date.getFullYear()}`;
        const day = date.getDate();

        await Promise.all(selectedStudents.map(async (studentId) => {
          const student = students.find(s => s.id === studentId);
          if (student) {
            const updatedStudent = {
              ...student,
              attendance: {
                ...student.attendance,
                [monthKey]: {
                  ...student.attendance[monthKey],
                  [day]: operation === 'present'
                }
              }
            };

            await fetch(`${window.location.protocol}//${window.location.hostname}:3001/students/${studentId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(updatedStudent)
            });
          }
        }));

        setMessage(`Marked ${selectedStudents.length} students as ${operation}`);
      } else if (operation === 'whatsapp') {
        selectedStudents.forEach(studentId => {
          const student = students.find(s => s.id === studentId);
          if (student && student.phoneNumber) {
            const message = `Hello ${student.firstName}, this is a reminder about your karate class. Thank you!`;
            let phoneNumber = student.phoneNumber.replace(/[^0-9]/g, '');
            if (phoneNumber.length === 10) phoneNumber = '91' + phoneNumber;
            const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
            window.open(whatsappUrl, '_blank');
          }
        });
        setMessage(`Sent WhatsApp to ${selectedStudents.length} students`);
      }

      setSelectedStudents([]);
      setOperation('');
    } catch (e) {
      console.error('Error executing bulk operation:', e);
      setMessage('Error executing operation');
    }
  };

  return (
    <div className="app-container">
      <div className="app-content fade-in">
        <div className="card-header">
          <button onClick={onBack} className="btn btn-secondary hover-lift">
            ← Back to Main
          </button>
          <h1 className="card-title gradient-text">⚡ Bulk Operations</h1>
          <div></div>
        </div>

        {message && (
          <div className="card">
            <div className="status-success">{message}</div>
          </div>
        )}

        {/* Operation Controls */}
        <div className="card">
          <h2 className="card-title">Select Operation</h2>
          <div className="flex gap-3 mb-3">
            <select
              value={operation}
              onChange={(e) => setOperation(e.target.value)}
              className="form-input"
              style={{minWidth: '200px'}}
            >
              <option value="">Choose operation...</option>
              <option value="present">Mark Present</option>
              <option value="absent">Mark Absent</option>
              <option value="whatsapp">Send WhatsApp</option>
            </select>
            
            {(operation === 'present' || operation === 'absent') && (
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="form-input"
              />
            )}
            
            <button
              onClick={executeBulkOperation}
              className="btn btn-primary hover-lift"
              disabled={!operation || selectedStudents.length === 0}
            >
              Execute ({selectedStudents.length} selected)
            </button>
          </div>
        </div>

        {/* Student Selection */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Select Students</h2>
            <button onClick={handleSelectAll} className="btn btn-secondary hover-lift">
              {selectedStudents.length === students.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>
          
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 'var(--spacing-md)'}}>
            {students.map(student => (
              <div
                key={student.id}
                className={`card hover-lift cursor-pointer ${selectedStudents.includes(student.id) ? 'shadow-lg' : ''}`}
                style={{
                  border: selectedStudents.includes(student.id) ? '2px solid var(--primary)' : '1px solid var(--border)',
                  background: selectedStudents.includes(student.id) ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-card)'
                }}
                onClick={() => {
                  if (selectedStudents.includes(student.id)) {
                    setSelectedStudents(selectedStudents.filter(id => id !== student.id));
                  } else {
                    setSelectedStudents([...selectedStudents, student.id]);
                  }
                }}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selectedStudents.includes(student.id)}
                    onChange={() => {}}
                  />
                  <div>
                    <strong>{student.firstName} {student.lastName}</strong>
                    <div style={{fontSize: '12px', color: 'var(--text-secondary)'}}>
                      {student.phoneNumber || 'No phone'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkOperations;
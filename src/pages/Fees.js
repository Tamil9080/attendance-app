import React, { useState, useEffect } from 'react';

const Fees = ({ onBack }) => {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [editingId, setEditingId] = useState(null);
  const [feeAmount, setFeeAmount] = useState('');

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  useEffect(() => {
    fetch(`${window.location.protocol}//${window.location.hostname}:3001/students`)
      .then(res => res.json())
      .then(data => {
        setStudents(data);
        setFilteredStudents(data);
      })
      .catch(e => console.error('Error loading students:', e));
  }, []);

  useEffect(() => {
    const filtered = students.filter(student => 
      `${student.firstName} ${student.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredStudents(filtered);
  }, [searchTerm, students]);

  const getFeeStatus = (student, monthIndex) => {
    const monthKey = `${monthNames[monthIndex]}-${selectedYear}`;
    return student.feesPaid?.[monthKey] || false;
  };

  const toggleFeeStatus = async (studentId, monthIndex) => {
    const student = students.find(s => s.id === studentId);
    const monthKey = `${monthNames[monthIndex]}-${selectedYear}`;
    const currentStatus = student.feesPaid?.[monthKey] || false;
    const feeAmount = student.monthlyFees || 0;
    
    // Create fee record for database
    const feeRecord = {
      student_id: studentId,
      student_name: `${student.firstName} ${student.lastName}`,
      month: monthNames[monthIndex],
      year: selectedYear,
      amount: feeAmount,
      paid_date: new Date().toISOString().split('T')[0],
      status: !currentStatus ? 'paid' : 'unpaid'
    };
    
    const updatedStudent = {
      ...student,
      feesPaid: {
        ...student.feesPaid,
        [monthKey]: !currentStatus
      }
    };

    try {
      // Save fee record to database
      if (!currentStatus) {
        await fetch(`${window.location.protocol}//${window.location.hostname}:3001/fees`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(feeRecord)
        });
      }
      
      // Update student record
      const response = await fetch(`${window.location.protocol}//${window.location.hostname}:3001/students/${studentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedStudent)
      });

      if (response.ok) {
        setStudents(prev => prev.map(s => s.id === studentId ? updatedStudent : s));
      }
    } catch (e) {
      console.error('Error updating fee status:', e);
    }
  };

  const updateFeeAmount = async (studentId) => {
    const student = students.find(s => s.id === studentId);
    const updatedStudent = {
      ...student,
      monthlyFees: parseFloat(feeAmount) || 0
    };

    try {
      const response = await fetch(`${window.location.protocol}//${window.location.hostname}:3001/students/${studentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedStudent)
      });

      if (response.ok) {
        setStudents(prev => prev.map(s => s.id === studentId ? updatedStudent : s));
        setEditingId(null);
        setFeeAmount('');
      }
    } catch (e) {
      console.error('Error updating fee amount:', e);
    }
  };

  const getBeltEmoji = (beltColor) => {
    const beltEmojis = {
      white: '⚪',
      yellow: '🟡',
      orange: '🟠',
      green: '🟢',
      blue: '🔵',
      brown: '🟤',
      black: '⚫'
    };
    return beltEmojis[beltColor?.toLowerCase()] || '⚪';
  };

  const getYearlyStats = () => {
    let totalPaid = 0;
    let totalUnpaid = 0;
    let totalCollected = 0;
    let totalExpected = 0;

    filteredStudents.forEach(student => {
      monthNames.forEach((_, monthIndex) => {
        const isPaid = getFeeStatus(student, monthIndex);
        const feeAmount = student.monthlyFees || 0;
        
        if (isPaid) {
          totalPaid++;
          totalCollected += feeAmount;
        } else {
          totalUnpaid++;
        }
        totalExpected += feeAmount;
      });
    });

    return { totalPaid, totalUnpaid, totalCollected, totalExpected };
  };

  const { totalPaid, totalUnpaid, totalCollected, totalExpected } = getYearlyStats();

  return (
    <div className="app-container">
      <div className="app-content fade-in">
        <div className="card-header">
          <button onClick={onBack} className="btn btn-secondary hover-lift">
            ← Back to Main
          </button>
          <h1 className="card-title gradient-text">💰 Fees Management ({selectedYear})</h1>
        </div>

        <div className="card">
          <div className="flex gap-3 mb-3">
            <input
              type="text"
              placeholder="🔍 Search by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input"
              style={{flex: 1}}
            />

            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="form-input"
              style={{minWidth: '100px'}}
            >
              {Array.from({length: 10}, (_, i) => new Date().getFullYear() - 5 + i).map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-lg)', marginBottom: 'var(--spacing-lg)'}}>
            <div className="status-success" style={{padding: 'var(--spacing-md)', textAlign: 'center'}}>
              <div style={{fontSize: '20px', fontWeight: '600'}}>✅ {totalPaid}</div>
              <div style={{fontSize: '12px'}}>Paid</div>
            </div>
            <div className="status-error" style={{padding: 'var(--spacing-md)', textAlign: 'center'}}>
              <div style={{fontSize: '20px', fontWeight: '600'}}>❌ {totalUnpaid}</div>
              <div style={{fontSize: '12px'}}>Unpaid</div>
            </div>
            <div className="status-info" style={{padding: 'var(--spacing-md)', textAlign: 'center'}}>
              <div style={{fontSize: '20px', fontWeight: '600'}}>₹{totalCollected}</div>
              <div style={{fontSize: '12px'}}>Collected</div>
            </div>
            <div className="status-warning" style={{padding: 'var(--spacing-md)', textAlign: 'center'}}>
              <div style={{fontSize: '20px', fontWeight: '600'}}>₹{totalExpected}</div>
              <div style={{fontSize: '12px'}}>Expected</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Belt</th>
                  <th>Fees</th>
                  {monthNames.map((month, index) => (
                    <th key={index} className="text-center" style={{minWidth: '80px'}}>
                      {month.slice(0, 3)}
                    </th>
                  ))}
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student) => (
                  <tr key={student.id}>
                    <td className="names">
                      {student.firstName} {student.lastName}
                    </td>
                    <td>
                      <span style={{display: 'flex', alignItems: 'center', gap: '5px'}}>
                        {getBeltEmoji(student.beltColor)}
                        <span style={{fontSize: '12px', color: 'var(--text-secondary)'}}>
                          {(student.beltColor || 'white').charAt(0).toUpperCase() + (student.beltColor || 'white').slice(1)}
                        </span>
                      </span>
                    </td>
                    <td>
                      {editingId === student.id ? (
                        <input
                          type="number"
                          value={feeAmount}
                          onChange={(e) => setFeeAmount(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              updateFeeAmount(student.id);
                            }
                          }}
                          placeholder="Amount..."
                          className="form-input"
                          style={{margin: 0, width: '80px', fontSize: '12px'}}
                          autoFocus
                        />
                      ) : (
                        <span style={{fontWeight: '600', fontSize: '12px'}}>
                          ₹{student.monthlyFees || 0}
                        </span>
                      )}
                    </td>
                    {monthNames.map((_, monthIndex) => (
                      <td key={monthIndex} className="text-center">
                        <div style={{display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'center'}}>
                          <button
                            onClick={() => toggleFeeStatus(student.id, monthIndex)}
                            className={`btn ${getFeeStatus(student, monthIndex) ? 'btn-success' : 'btn-danger'} hover-lift`}
                            style={{fontSize: '10px', padding: '2px 6px', minWidth: '40px'}}
                          >
                            {getFeeStatus(student, monthIndex) ? '✅' : '❌'}
                          </button>
                          {getFeeStatus(student, monthIndex) && (
                            <span style={{fontSize: '8px', color: 'var(--success)', fontWeight: '600'}}>
                              ₹{student.monthlyFees || 0}
                            </span>
                          )}
                        </div>
                      </td>
                    ))}
                    <td className="text-center">
                      {editingId === student.id ? (
                        <button
                          onClick={() => updateFeeAmount(student.id)}
                          className="btn btn-success hover-lift"
                          style={{fontSize: '10px', padding: '4px 8px'}}
                        >
                          ✅
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingId(student.id);
                            setFeeAmount(student.monthlyFees || '');
                          }}
                          className="btn btn-primary hover-lift"
                          style={{fontSize: '10px', padding: '4px 8px'}}
                        >
                          ✏️
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Fees;
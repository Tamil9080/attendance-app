import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';

const AbsentStudents = ({ onBack }) => {
  const [absentStudents, setAbsentStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [reason, setReason] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [dateFilter, setDateFilter] = useState('');

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    const userId = user ? user.id : null;

    Promise.all([
      fetch(`${API_BASE_URL}/absent-students?userId=${userId}`),
      fetch(`${API_BASE_URL}/students?userId=${userId}`)
    ])
    .then(([absentRes, studentsRes]) => Promise.all([absentRes.json(), studentsRes.json()]))
    .then(([absentData, studentsData]) => {
      setAllStudents(studentsData);
      
      const countMap = {};
      absentData.forEach(student => {
        const key = `${student.student_name}_${student.absent_date}`;
        countMap[key] = (countMap[key] || 0) + 1;
      });
      const filteredAbsents = absentData.filter(student => {
        const key = `${student.student_name}_${student.absent_date}`;
        return countMap[key] === 1;
      });
      
      // Merge with belt information
      const enrichedAbsentStudents = filteredAbsents.map(absent => {
        const student = studentsData.find(s => s.id === absent.student_id);
        return {
          ...absent,
          beltColor: student?.beltColor || 'white'
        };
      });
      
      const students = Array.isArray(enrichedAbsentStudents) ? enrichedAbsentStudents : [];
      setAbsentStudents(students);
      setFilteredStudents(students);
    })
    .catch(e => {
      console.error('Error loading data:', e);
      setAbsentStudents([]);
    });
  }, []);

  const sendWhatsAppMessage = (student) => {
    const message = `Hi ${student.student_name}, you were marked absent on ${student.absent_date}. Please let us know why you couldn't attend. Thank you!`;
    let phoneNumber = student.phone_number.replace(/[^0-9]/g, '');
    
    if (phoneNumber.length === 10 && !phoneNumber.startsWith('91')) {
      phoneNumber = '91' + phoneNumber;
    }
    
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  useEffect(() => {
    let filtered = absentStudents;
    
    if (searchTerm) {
      filtered = filtered.filter(student => 
        student.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (student.phone_number && student.phone_number.includes(searchTerm))
      );
    }
    
    if (dateFilter) {
      filtered = filtered.filter(student => 
        student.absent_date.includes(dateFilter)
      );
    }
    
    // Sort by belt order (highest to lowest)
    const beltOrder = ['black', 'brown', 'blue', 'green', 'orange', 'yellow', 'white'];
    filtered = filtered.sort((a, b) => {
      const aBelt = (a.beltColor || 'white').toLowerCase();
      const bBelt = (b.beltColor || 'white').toLowerCase();
      const aIndex = beltOrder.indexOf(aBelt);
      const bIndex = beltOrder.indexOf(bBelt);
      
      if (aIndex !== bIndex) {
        return aIndex - bIndex;
      }
      return a.student_name.localeCompare(b.student_name);
    });
    
    setFilteredStudents(filtered);
  }, [absentStudents, searchTerm, dateFilter]);

  const handleSelectAll = () => {
    if (selectedStudents.length === filteredStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(filteredStudents.map(s => s.id));
    }
  };

  const sendBulkWhatsApp = () => {
    selectedStudents.forEach(id => {
      const student = absentStudents.find(s => s.id === id);
      if (student) sendWhatsAppMessage(student);
    });
    setSelectedStudents([]);
  };

  const deleteBulkStudents = async () => {
    if (window.confirm(`Delete ${selectedStudents.length} students from absent list?`)) {
      try {
        await Promise.all(selectedStudents.map(id => 
          fetch(`${API_BASE_URL}/absent-students/${id}`, {
            method: 'DELETE'
          })
        ));
        setAbsentStudents(prev => prev.filter(s => !selectedStudents.includes(s.id)));
        setSelectedStudents([]);
      } catch (e) {
        console.error('Error deleting students:', e);
      }
    }
  };

  const saveReason = async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/absent-students/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });
      
      if (response.ok) {
        const updatedStudents = absentStudents.map(s => 
          s.id === id ? { ...s, reason } : s
        );
        setAbsentStudents(updatedStudents);

        setEditingId(null);
        setReason('');
      }
    } catch (e) {
      console.error('Error saving reason:', e);
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

  const getBeltName = (beltColor) => {
    const beltNames = {
      white: 'White',
      yellow: 'Yellow',
      orange: 'Orange',
      green: 'Green',
      blue: 'Blue',
      brown: 'Brown',
      black: 'Black'
    };
    return beltNames[beltColor?.toLowerCase()] || 'White';
  };

  return (
    <div className="app-container">
      <div className="app-content fade-in">
        <div className="card-header">
          <button onClick={onBack} className="btn btn-secondary hover-lift">
            ← Back to Main
          </button>
          <h1 className="card-title gradient-text">❌ Absent Students ({filteredStudents.length})</h1>
          <div></div>
        </div>

        <div className="card">
          <div className="flex gap-3 mb-3">
            <input
              type="text"
              placeholder="🔍 Search by name or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input"
              style={{flex: 1}}
            />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="form-input"
              style={{minWidth: '150px'}}
            />
            <button
              onClick={() => {setSearchTerm(''); setDateFilter('');}}
              className="btn btn-secondary hover-lift"
            >
              🔄 Clear
            </button>
          </div>
          
          {selectedStudents.length > 0 && (
            <div className="flex gap-2 mb-3">
              <span className="status-info">{selectedStudents.length} selected</span>
              <button onClick={sendBulkWhatsApp} className="btn btn-success hover-lift">
                📱 Send WhatsApp to All
              </button>
              <button onClick={deleteBulkStudents} className="btn btn-danger hover-lift">
                🗑️ Delete Selected
              </button>
              <button onClick={() => setSelectedStudents([])} className="btn btn-secondary hover-lift">
                ❌ Clear Selection
              </button>
            </div>
          )}
        </div>

        {!Array.isArray(filteredStudents) || filteredStudents.length === 0 ? (
          <div className="card">
            <p className="text-center no-students">
              {absentStudents.length === 0 ? 'No absent students found.' : 'No students match your search criteria.'}
            </p>
          </div>
        ) : (
          <div className="card">
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>
                      <input
                        type="checkbox"
                        checked={selectedStudents.length === filteredStudents.length && filteredStudents.length > 0}
                        onChange={handleSelectAll}
                        style={{marginRight: '8px'}}
                      />
                      Name
                    </th>
                    <th>Belt</th>
                    <th>Phone</th>
                    <th>Date</th>
                    <th>Reason</th>
                    <th className="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student) => (
                    <tr key={student.id}>
                      <td className="names">
                        <input
                          type="checkbox"
                          checked={selectedStudents.includes(student.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedStudents([...selectedStudents, student.id]);
                            } else {
                              setSelectedStudents(selectedStudents.filter(id => id !== student.id));
                            }
                          }}
                          style={{marginRight: '8px'}}
                        />
                        {student.student_name}
                      </td>
                      <td>
                        <span style={{display: 'flex', alignItems: 'center', gap: '5px'}}>
                          {getBeltEmoji(student.beltColor)}
                          <span style={{fontSize: '12px', color: 'var(--text-secondary)'}}>
                            {getBeltName(student.beltColor)}
                          </span>
                        </span>
                      </td>
                      <td>
                        {student.phone_number || 'N/A'}
                      </td>
                      <td>
                        {new Date(student.absent_date).toLocaleDateString()}
                      </td>
                      <td>
                        {editingId === student.id ? (
                          <input
                            type="text"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                saveReason(student.id);
                              }
                            }}
                            placeholder="Enter reason..."
                            className="form-input"
                            style={{margin: 0}}
                            autoFocus
                          />
                        ) : (
                          <span className={student.reason ? 'text-primary' : 'text-secondary'}>
                            {student.reason || 'No reason provided'}
                          </span>
                        )}
                      </td>
                      <td className="text-center">
                        <div className="flex gap-1 justify-center">
                          <button
                            onClick={() => sendWhatsAppMessage(student)}
                            className="btn btn-success hover-lift"
                            style={{fontSize: '12px', padding: 'var(--spacing-xs) var(--spacing-sm)'}}
                          >
                            📱 WhatsApp
                          </button>
                          {editingId === student.id ? (
                            <button
                              onClick={() => saveReason(student.id)}
                              className="btn btn-success hover-lift"
                              style={{fontSize: '12px', padding: 'var(--spacing-xs) var(--spacing-sm)'}}
                            >
                              ✅ Save
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setEditingId(student.id);
                                setReason(student.reason || '');
                              }}
                              className="btn btn-primary hover-lift"
                              style={{fontSize: '12px', padding: 'var(--spacing-xs) var(--spacing-sm)'}}
                            >
                              ✏️ Edit
                            </button>
                          )}
                          <button
                            onClick={async () => {
                              if (window.confirm('Remove this student from absent list?')) {
                                try {
                                  const response = await fetch(`${API_BASE_URL}/absent-students/${student.id}`, {
                                    method: 'DELETE'
                                  });
                                  
                                  if (response.ok) {
                                    setAbsentStudents(prev => prev.filter(s => s.id !== student.id));
                                  }
                                } catch (e) {
                                  console.error('Error deleting:', e);
                                }
                              }
                            }}
                            className="btn btn-danger hover-lift"
                            style={{fontSize: '12px', padding: 'var(--spacing-xs) var(--spacing-sm)'}}
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AbsentStudents;
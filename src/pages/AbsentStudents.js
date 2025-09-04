import React, { useState, useEffect } from 'react';

const AbsentStudents = ({ onBack }) => {
  const [absentStudents, setAbsentStudents] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [reason, setReason] = useState('');

  useEffect(() => {
    fetch(`${window.location.protocol}//${window.location.hostname}:3001/absent-students`)
      .then(res => res.json())
      .then(data => {
        setAbsentStudents(Array.isArray(data) ? data : []);
      })
      .catch(e => {
        console.error('Error loading absent students:', e);
        setAbsentStudents([]);
      });
  }, []);

  const sendWhatsAppMessage = (student) => {
    const message = `Hi ${student.student_name}, you were marked absent on ${student.absent_date}. Please let us know why you couldn't attend. Thank you!`;
    let phoneNumber = student.phone_number.replace(/[^0-9]/g, '');
    
    // Add +91 if not present and number is 10 digits
    if (phoneNumber.length === 10 && !phoneNumber.startsWith('91')) {
      phoneNumber = '91' + phoneNumber;
    }
    
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const saveReason = async (id) => {
    try {
      const response = await fetch(`${window.location.protocol}//${window.location.hostname}:3001/absent-students/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });
      
      if (response.ok) {
        setAbsentStudents(prev => prev.map(s => 
          s.id === id ? { ...s, reason } : s
        ));
        setEditingId(null);
        setReason('');
        console.log('Reason saved successfully');
      } else {
        console.error('Failed to save reason:', response.status);
      }
    } catch (e) {
      console.error('Error saving reason:', e);
    }
  };

  return (
    <div style={{padding: '20px', fontFamily: 'Arial, sans-serif'}}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px'}}>
        <button
          onClick={onBack}
          style={{padding: '8px 16px', backgroundColor: '#6b7280', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer'}}
        >
          Back to Main
        </button>
        <h1 style={{margin: 0}}>Absent Students</h1>
        <div></div>
      </div>

      {!Array.isArray(absentStudents) || absentStudents.length === 0 ? (
        <p style={{textAlign: 'center', fontSize: '18px', color: '#666'}}>
          No absent students found.
        </p>
      ) : (
        <table style={{width: '100%', borderCollapse: 'collapse', border: '1px solid #ddd'}}>
          <thead>
            <tr style={{backgroundColor: '#dc2626', color: 'white'}}>
              <th style={{padding: '12px', border: '1px solid #ddd', textAlign: 'left'}}>Name</th>
              <th style={{padding: '12px', border: '1px solid #ddd', textAlign: 'left'}}>Phone</th>
              <th style={{padding: '12px', border: '1px solid #ddd', textAlign: 'left'}}>Date</th>
              <th style={{padding: '12px', border: '1px solid #ddd', textAlign: 'left'}}>Reason</th>
              <th style={{padding: '12px', border: '1px solid #ddd', textAlign: 'center'}}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {Array.isArray(absentStudents) && absentStudents.map((student) => (
              <tr key={student.id}>
                <td style={{padding: '12px', border: '1px solid #ddd'}}>
                  {student.student_name}
                </td>
                <td style={{padding: '12px', border: '1px solid #ddd'}}>
                  {student.phone_number || 'N/A'}
                </td>
                <td style={{padding: '12px', border: '1px solid #ddd'}}>
                  {new Date(student.absent_date).toLocaleDateString()}
                </td>
                <td style={{padding: '12px', border: '1px solid #ddd'}}>
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
                      style={{width: '100%', padding: '4px'}}
                      autoFocus
                    />
                  ) : (
                    student.reason || 'No reason provided'
                  )}
                </td>
                <td style={{padding: '12px', border: '1px solid #ddd', textAlign: 'center'}}>
                  <div style={{display: 'flex', gap: '5px', justifyContent: 'center'}}>
                    <button
                      onClick={() => sendWhatsAppMessage(student)}
                      style={{padding: '6px 12px', backgroundColor: '#25d366', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer'}}
                    >
                      WhatsApp
                    </button>
                    {editingId === student.id ? (
                      <button
                        onClick={() => saveReason(student.id)}
                        style={{padding: '6px 12px', backgroundColor: '#059669', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer'}}
                      >
                        Save
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingId(student.id);
                          setReason(student.reason || '');
                        }}
                        style={{padding: '6px 12px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer'}}
                      >
                        Edit Reason
                      </button>
                    )}
                    <button
                      onClick={async () => {
                        if (window.confirm('Remove this student from absent list?')) {
                          try {
                            const response = await fetch(`${window.location.protocol}//${window.location.hostname}:3001/absent-students/${student.id}`, {
                              method: 'DELETE'
                            });
                            console.log('Delete response status:', response.status);
                            const result = await response.json();
                            console.log('Delete response:', result);
                            
                            if (response.ok) {
                              setAbsentStudents(prev => prev.filter(s => s.id !== student.id));
                              console.log('Student deleted successfully');
                            } else {
                              console.error('Delete failed:', response.status, result);
                            }
                          } catch (e) {
                            console.error('Error deleting:', e);
                          }
                        }
                      }}
                      style={{padding: '6px 12px', backgroundColor: '#dc2626', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer'}}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AbsentStudents;
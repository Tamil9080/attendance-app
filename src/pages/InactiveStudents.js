import React, { useState, useEffect } from 'react';

const InactiveStudents = ({ onBack }) => {
  const [inactiveStudents, setInactiveStudents] = useState([]);

  // Load inactive students
  useEffect(() => {
    fetch('http://localhost:3001/inactive-students')
      .then(res => res.json())
      .then(data => setInactiveStudents(data))
      .catch(e => console.error("Could not load inactive students", e));
  }, []);

  const reactivateStudent = async (studentId, studentName) => {
    if (window.confirm(`Reactivate ${studentName}?`)) {
      try {
        await fetch(`http://localhost:3001/reactivate/${studentId}`, {
          method: 'POST'
        });
        
        // Remove from inactive list
        setInactiveStudents(prev => prev.filter(s => s.id !== studentId));
        
        alert('Student reactivated successfully!');
      } catch (e) {
        console.error('Error reactivating student:', e);
      }
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
        <h1 style={{margin: 0}}>Stopped Students</h1>
        <div></div>
      </div>

      {inactiveStudents.length === 0 ? (
        <p style={{textAlign: 'center', fontSize: '18px', color: '#666'}}>
          No stopped students found.
        </p>
      ) : (
        <table style={{width: '100%', borderCollapse: 'collapse', border: '1px solid #ddd'}}>
          <thead>
            <tr style={{backgroundColor: '#dc2626', color: 'white'}}>
              <th style={{padding: '12px', border: '1px solid #ddd', textAlign: 'left'}}>Name</th>
              <th style={{padding: '12px', border: '1px solid #ddd', textAlign: 'left'}}>Phone</th>
              <th style={{padding: '12px', border: '1px solid #ddd', textAlign: 'left'}}>Gender</th>
              <th style={{padding: '12px', border: '1px solid #ddd', textAlign: 'center'}}>Action</th>
            </tr>
          </thead>
          <tbody>
            {inactiveStudents.map((student) => (
              <tr key={student.id}>
                <td style={{padding: '12px', border: '1px solid #ddd'}}>
                  {student.firstName} {student.lastName}
                </td>
                <td style={{padding: '12px', border: '1px solid #ddd'}}>
                  {student.phoneNumber || 'N/A'}
                </td>
                <td style={{padding: '12px', border: '1px solid #ddd'}}>
                  {student.gender || 'N/A'}
                </td>
                <td style={{padding: '12px', border: '1px solid #ddd', textAlign: 'center'}}>
                  <button
                    onClick={() => reactivateStudent(student.id, `${student.firstName} ${student.lastName}`)}
                    style={{padding: '6px 12px', backgroundColor: '#059669', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer'}}
                  >
                    Reactivate
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default InactiveStudents;
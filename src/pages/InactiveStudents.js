import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';

const InactiveStudents = ({ onBack, instituteType }) => {
  const [inactiveStudents, setInactiveStudents] = useState([]);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    const userId = user ? user.id : null;

    console.log('Loading inactive students from:', `${API_BASE_URL}/inactive-students?userId=${userId}&instituteType=${instituteType}`);
    fetch(`${API_BASE_URL}/inactive-students?userId=${userId}&instituteType=${instituteType}`)
      .then(res => {
        console.log('Inactive students response status:', res.status);
        return res.json();
      })
      .then(data => {
        console.log('Inactive students data:', data);
        setInactiveStudents(data || []);
      })
      .catch(e => {
        console.error("Could not load inactive students", e);
        setInactiveStudents([]);
      });
  }, [instituteType]);

  const reactivateStudent = async (studentId, studentName) => {
    if (window.confirm(`Reactivate ${studentName}?`)) {
      try {
        console.log('Reactivating student:', studentId);
        const response = await fetch(`${API_BASE_URL}/reactivate/${studentId}`, {
          method: 'POST'
        });
        
        console.log('Reactivate response status:', response.status);
        
        if (response.ok) {
          setInactiveStudents(prev => prev.filter(s => s.id !== studentId));
          alert('Student reactivated successfully!');
        } else {
          const errorData = await response.json();
          console.error('Reactivate error:', errorData);
          alert('Error reactivating student: ' + (errorData.error || 'Unknown error'));
        }
      } catch (e) {
        console.error('Error reactivating student:', e);
        alert('Error reactivating student: ' + e.message);
      }
    }
  };

  const removeStudent = async (studentId, studentName) => {
    if (window.confirm(`Permanently delete ${studentName}? This cannot be undone.`)) {
      try {
        console.log('Deleting inactive student:', studentId);
        const response = await fetch(`${API_BASE_URL}/inactive-students/${studentId}`, {
          method: 'DELETE'
        });
        
        console.log('Delete response status:', response.status);
        
        if (response.ok) {
          setInactiveStudents(prev => prev.filter(s => s.id !== studentId));
          alert('Student permanently deleted!');
        } else {
          const errorData = await response.json();
          console.error('Delete error:', errorData);
          alert('Error: Could not delete student - ' + (errorData.error || 'Unknown error'));
        }
      } catch (e) {
        console.error('Error deleting student:', e);
        alert('Error deleting student: ' + e.message);
      }
    }
  };

  return (
    <div className="app-container">
      <div className="app-content fade-in">
        <div className="card-header">
          <button onClick={onBack} className="btn btn-secondary hover-lift">
            ← Back to Main
          </button>
          <h1 className="card-title gradient-text">⏸️ Inactive Students ({inactiveStudents.length})</h1>
          <div></div>
        </div>

        <div className="card">
          {inactiveStudents.length === 0 ? (
            <p className="text-center no-students">
              No inactive students found.
            </p>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>Gender</th>
                    <th>Belt</th>
                    <th>Moved Date</th>
                    <th className="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {inactiveStudents.map((student) => (
                    <tr key={student.id}>
                      <td className="names">
                        {student.firstName} {student.lastName}
                      </td>
                      <td>
                        {student.phoneNumber || 'N/A'}
                      </td>
                      <td>
                        {student.gender || 'N/A'}
                      </td>
                      <td>
                        {student.beltColor || 'white'}
                      </td>
                      <td>
                        {student.moved_date ? new Date(student.moved_date).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="text-center">
                        <div className="flex gap-1 justify-center">
                          <button
                            onClick={() => reactivateStudent(student.id, `${student.firstName} ${student.lastName}`)}
                            className="btn btn-success hover-lift"
                            style={{fontSize: '12px', padding: '4px 8px'}}
                          >
                            ↩️ Reactivate
                          </button>
                          <button
                            onClick={() => removeStudent(student.id, `${student.firstName} ${student.lastName}`)}
                            className="btn btn-danger hover-lift"
                            style={{fontSize: '12px', padding: '4px 8px'}}
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
          )}
        </div>
      </div>
    </div>
  );
};

export default InactiveStudents;
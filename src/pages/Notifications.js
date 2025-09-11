import React, { useState, useEffect } from 'react';

const Notifications = ({ onBack }) => {
  const [students, setStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [messageType, setMessageType] = useState('reminder');
  const [customMessage, setCustomMessage] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    fetch(`${window.location.protocol}//${window.location.hostname}:3001/students`)
      .then(res => res.json())
      .then(data => setStudents(data))
      .catch(e => console.error('Error loading students:', e));
    
    // Load saved notifications from localStorage
    const saved = localStorage.getItem('notifications');
    if (saved) {
      setNotifications(JSON.parse(saved));
    }
  }, []);

  const messageTemplates = {
    reminder: "Hi {name}, this is a reminder about your karate class today. See you there! 🥋",
    absent: "Hi {name}, we missed you in today's class. Please let us know if everything is okay. 🤗",
    achievement: "Congratulations {name}! Great progress in your karate journey. Keep it up! 🏆",
    payment: "Hi {name}, this is a friendly reminder about your monthly fee payment. Thank you! 💳",
    custom: customMessage
  };

  const sendNotifications = () => {
    if (selectedStudents.length === 0) {
      alert('Please select at least one student');
      return;
    }

    const message = messageTemplates[messageType];
    if (!message) {
      alert('Please enter a custom message');
      return;
    }

    selectedStudents.forEach(studentId => {
      const student = students.find(s => s.id === studentId);
      if (student && student.phoneNumber) {
        const personalizedMessage = message.replace('{name}', student.firstName);
        let phoneNumber = student.phoneNumber.replace(/[^0-9]/g, '');
        if (phoneNumber.length === 10) phoneNumber = '91' + phoneNumber;
        
        const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(personalizedMessage)}`;
        
        if (scheduledTime) {
          // Save for later (in real app, this would use a proper scheduler)
          const notification = {
            id: Date.now() + Math.random(),
            studentName: `${student.firstName} ${student.lastName}`,
            message: personalizedMessage,
            scheduledTime,
            status: 'scheduled',
            createdAt: new Date().toISOString()
          };
          
          const updatedNotifications = [...notifications, notification];
          setNotifications(updatedNotifications);
          localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
        } else {
          window.open(whatsappUrl, '_blank');
        }
      }
    });

    if (!scheduledTime) {
      alert(`Messages sent to ${selectedStudents.length} students!`);
    } else {
      alert(`Messages scheduled for ${selectedStudents.length} students!`);
    }
    
    setSelectedStudents([]);
    setCustomMessage('');
    setScheduledTime('');
  };

  const deleteNotification = (id) => {
    const updated = notifications.filter(n => n.id !== id);
    setNotifications(updated);
    localStorage.setItem('notifications', JSON.stringify(updated));
  };

  return (
    <div className="app-container">
      <div className="app-content fade-in">
        <div className="card-header">
          <button onClick={onBack} className="btn btn-secondary hover-lift">
            ← Back to Main
          </button>
          <h1 className="card-title gradient-text">🔔 Notifications</h1>
          <div></div>
        </div>

        {/* Message Composer */}
        <div className="card">
          <h2 className="card-title">📝 Compose Message</h2>
          
          <div className="form-group">
            <label className="form-label">Message Type</label>
            <select
              value={messageType}
              onChange={(e) => setMessageType(e.target.value)}
              className="form-input"
            >
              <option value="reminder">Class Reminder</option>
              <option value="absent">Absence Follow-up</option>
              <option value="achievement">Achievement Congratulation</option>
              <option value="payment">Payment Reminder</option>
              <option value="custom">Custom Message</option>
            </select>
          </div>

          {messageType === 'custom' && (
            <div className="form-group">
              <label className="form-label">Custom Message</label>
              <textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="Enter your custom message... Use {name} for student name"
                className="form-input"
                rows="3"
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Schedule Time (Optional)</label>
            <input
              type="datetime-local"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Message Preview</label>
            <div style={{
              padding: 'var(--spacing-md)',
              background: 'var(--border-light)',
              borderRadius: 'var(--radius)',
              fontStyle: 'italic',
              color: 'var(--text-secondary)'
            }}>
              {messageTemplates[messageType]?.replace('{name}', 'Student Name') || 'Enter a custom message above'}
            </div>
          </div>

          <button
            onClick={sendNotifications}
            className="btn btn-primary hover-lift"
            disabled={selectedStudents.length === 0}
          >
            {scheduledTime ? '⏰ Schedule' : '📤 Send'} to {selectedStudents.length} students
          </button>
        </div>

        {/* Student Selection */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">👥 Select Recipients</h2>
            <button
              onClick={() => {
                if (selectedStudents.length === students.length) {
                  setSelectedStudents([]);
                } else {
                  setSelectedStudents(students.map(s => s.id));
                }
              }}
              className="btn btn-secondary hover-lift"
            >
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
                      📱 {student.phoneNumber || 'No phone number'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Scheduled Notifications */}
        {notifications.length > 0 && (
          <div className="card">
            <h2 className="card-title">⏰ Scheduled Notifications</h2>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Message</th>
                    <th>Scheduled Time</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {notifications.map(notification => (
                    <tr key={notification.id}>
                      <td className="names">{notification.studentName}</td>
                      <td style={{maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis'}}>
                        {notification.message}
                      </td>
                      <td>{new Date(notification.scheduledTime).toLocaleString()}</td>
                      <td>
                        <span className="status-warning">📅 Scheduled</span>
                      </td>
                      <td>
                        <button
                          onClick={() => deleteNotification(notification.id)}
                          className="btn btn-danger hover-lift"
                          style={{fontSize: '12px', padding: 'var(--spacing-xs) var(--spacing-sm)'}}
                        >
                          🗑️ Delete
                        </button>
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

export default Notifications;
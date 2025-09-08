import React, { useState } from 'react';

const AddStudent = ({ onBack, onStudentAdded }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [gender, setGender] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [address, setAddress] = useState('');
  const [beltColor, setBeltColor] = useState('white');
  const [message, setMessage] = useState('');
  const [isMessageVisible, setIsMessageVisible] = useState(false);

  const showMessage = (text) => {
    setMessage(text);
    setIsMessageVisible(true);
    setTimeout(() => {
      setIsMessageVisible(false);
    }, 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!firstName || !lastName) {
      showMessage('First and Last name are required.');
      return;
    }

    const newStudent = {
      firstName,
      lastName,
      phoneNumber,
      gender,
      fatherName,
      address,
      beltColor,
      attendance: {},
    };

    try {
      const response = await fetch(`${window.location.protocol}//${window.location.hostname}:3001/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStudent)
      });
      
      if (response.ok) {
        showMessage('Student added successfully!');
        setFirstName('');
        setLastName('');
        setPhoneNumber('');
        setGender('');
        setFatherName('');
        setAddress('');
        setBeltColor('white');
        
        if (onStudentAdded) onStudentAdded();
      } else {
        showMessage('Error adding student to database.');
      }
    } catch (e) {
      console.error("Could not save student", e);
      showMessage("Error saving student to database.");
    }
  };

  return (
    <div className="app-container">
      <div className="app-content" style={{maxWidth: '800px'}}>
        {isMessageVisible && (
          <div className="toast">
            ✅ {message}
          </div>
        )}
        
        <div className="card-header">
          <button onClick={onBack} className="btn btn-secondary">
            ← Back to Main
          </button>
          <h1 className="card-title">👤 Add New Student</h1>
          <div></div>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} style={{display: 'flex', flexDirection: 'column', gap: 'calc(var(--spacing) * 3)'}}>
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'calc(var(--spacing) * 3)'}}>
              <div className="form-group">
                <label className="form-label">First Name *</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="form-input"
                  required
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Last Name *</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="form-input"
                  required
                />
              </div>
            </div>

            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'calc(var(--spacing) * 3)'}}>
              <div className="form-group">
                <label className="form-label">📱 Phone Number</label>
                <input
                  type="tel"
                  placeholder="10-digit mobile number"
                  value={phoneNumber}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    if (value.length <= 10) {
                      setPhoneNumber(value);
                    }
                  }}
                  maxLength="10"
                  className="form-input"
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">⚧️ Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="form-input"
                >
                  <option value="">Select Gender</option>
                  <option value="Male">👨 Male</option>
                  <option value="Female">👩 Female</option>
                </select>
              </div>
            </div>

            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'calc(var(--spacing) * 3)'}}>
              <div className="form-group">
                <label className="form-label">🥋 Belt Color</label>
                <select
                  value={beltColor}
                  onChange={(e) => setBeltColor(e.target.value)}
                  className="form-input"
                >
                  <option value="white">⚪ White Belt</option>
                  <option value="yellow">🟡 Yellow Belt</option>
                  <option value="orange">🟠 Orange Belt</option>
                  <option value="green">🟢 Green Belt</option>
                  <option value="blue">🔵 Blue Belt</option>
                  <option value="brown">🟤 Brown Belt</option>
                  <option value="black">⚫ Black Belt</option>
                </select>
              </div>
              <div></div>
            </div>

            <div className="form-group">
              <label className="form-label">👨‍👧‍👦 Father's Name</label>
              <input
                type="text"
                value={fatherName}
                onChange={(e) => setFatherName(e.target.value)}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">🏠 Address</label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows="3"
                className="form-input"
                style={{resize: 'vertical'}}
              />
            </div>

            <button type="submit" className="btn btn-success" style={{fontSize: '16px', padding: 'calc(var(--spacing) * 2) calc(var(--spacing) * 4)'}}>
              ➕ Add Student
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddStudent;
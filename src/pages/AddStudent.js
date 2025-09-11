import React, { useState } from 'react';

const AddStudent = ({ onBack, onStudentAdded }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [gender, setGender] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [address, setAddress] = useState('');
  const [beltColor, setBeltColor] = useState('white');
  const [monthlyFees, setMonthlyFees] = useState('');
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
      monthlyFees: parseFloat(monthlyFees) || 0,
      attendance: {},
      feesPaid: {},
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
        setMonthlyFees('');
        
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
          <button onClick={onBack} className="btn btn-secondary hover-lift">
            ← Back to Main
          </button>
          <h1 className="card-title gradient-text">👤 Add New Student</h1>
          <div></div>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="fade-in" style={{display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xl)'}}>
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-xl)'}}>
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

            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-xl)'}}>
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

            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-xl)'}}>
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
              <div className="form-group">
                <label className="form-label">💰 Monthly Fees</label>
                <input
                  type="number"
                  placeholder="Enter monthly fees amount"
                  value={monthlyFees}
                  onChange={(e) => setMonthlyFees(e.target.value)}
                  className="form-input"
                  min="0"
                  step="0.01"
                />
              </div>
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

            <button type="submit" className="btn btn-success hover-lift" style={{fontSize: '16px', padding: 'var(--spacing-lg) var(--spacing-2xl)', fontWeight: '600'}}>
              ➕ Add Student
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddStudent;
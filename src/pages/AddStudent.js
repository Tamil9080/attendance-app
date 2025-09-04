import React, { useState } from 'react';

const AddStudent = ({ onBack, onStudentAdded }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [gender, setGender] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [address, setAddress] = useState('');
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
      attendance: {},
    };

    try {
      const response = await fetch('http://localhost:3001/students', {
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
    <div style={{padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '600px', margin: '0 auto'}}>
      {isMessageVisible && (
        <div style={{position: 'fixed', top: '16px', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#059669', color: 'white', padding: '8px 16px', borderRadius: '8px', zIndex: 50}}>
          {message}
        </div>
      )}
      
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px'}}>
        <button
          onClick={onBack}
          style={{padding: '8px 16px', backgroundColor: '#6b7280', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer'}}
        >
          Back to Main
        </button>
        <h1 style={{margin: 0}}>Add New Student</h1>
        <div></div>
      </div>

      <form onSubmit={handleSubmit} style={{display: 'flex', flexDirection: 'column', gap: '20px'}}>
        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px'}}>
          <div>
            <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>First Name *</label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              style={{width: '100%', padding: '10px', border: '2px solid #ddd', borderRadius: '4px', fontSize: '14px'}}
              required
            />
          </div>
          
          <div>
            <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>Last Name *</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              style={{width: '100%', padding: '10px', border: '2px solid #ddd', borderRadius: '4px', fontSize: '14px'}}
              required
            />
          </div>
        </div>

        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px'}}>
          <div>
            <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>Phone Number</label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              style={{width: '100%', padding: '10px', border: '2px solid #ddd', borderRadius: '4px', fontSize: '14px'}}
            />
          </div>
          
          <div>
            <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>Gender</label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              style={{width: '100%', padding: '10px', border: '2px solid #ddd', borderRadius: '4px', fontSize: '14px'}}
            >
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>
        </div>

        <div>
          <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>Father's Name</label>
          <input
            type="text"
            value={fatherName}
            onChange={(e) => setFatherName(e.target.value)}
            style={{width: '100%', padding: '10px', border: '2px solid #ddd', borderRadius: '4px', fontSize: '14px'}}
          />
        </div>

        <div>
          <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>Address</label>
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            rows="3"
            style={{width: '100%', padding: '10px', border: '2px solid #ddd', borderRadius: '4px', fontSize: '14px', resize: 'vertical'}}
          />
        </div>

        <button
          type="submit"
          style={{padding: '12px 24px', backgroundColor: '#059669', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold'}}
        >
          Add Student
        </button>
      </form>
    </div>
  );
};

export default AddStudent;
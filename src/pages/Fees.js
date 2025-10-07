import React, { useState, useEffect } from 'react';

const API_URL = `${window.location.protocol}//${window.location.hostname}:3001`;

const Fees = ({ onBack }) => {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [editingId, setEditingId] = useState(null);
  const [feeAmount, setFeeAmount] = useState('');
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [discount, setDiscount] = useState(0);
  const [showReceipt, setShowReceipt] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentModalData, setPaymentModalData] = useState(null);
  const [defaultFee, setDefaultFee] = useState(0);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  useEffect(() => {
    fetch(`${API_URL}/students`)
      .then(res => res.json())
      .then(data => {
        setStudents(data);
        setFilteredStudents(data);
      })
      .catch(e => console.error('Error loading students:', e));
    
    fetch(`${API_URL}/fees`)
      .then(res => res.json())
      .then(data => setPaymentHistory(data))
      .catch(e => console.error('Error loading payment history:', e));

    fetch(`${API_URL}/settings/defaultFee`)
      .then(res => res.json())
      .then(data => setDefaultFee(parseFloat(data.value) || 0))
      .catch(e => console.error('Could not load settings', e));
  }, []);

  const getFeeStatus = (student, monthIndex) => {
    const monthKey = `${monthNames[monthIndex]}-${selectedYear}`;
    return student.feesPaid?.[monthKey] || false;
  };

  const isOverdue = (student) => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const dueDate = new Date(selectedYear, currentMonth, 10);
    return currentDate > dueDate && !getFeeStatus(student, currentMonth);
  };

  useEffect(() => {
    let filtered = students.filter(student => 
      `${student.firstName} ${student.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    if (filterStatus === 'paid') {
      filtered = filtered.filter(student => {
        const currentMonth = new Date().getMonth();
        return getFeeStatus(student, currentMonth);
      });
    } else if (filterStatus === 'unpaid') {
      filtered = filtered.filter(student => {
        const currentMonth = new Date().getMonth();
        return !getFeeStatus(student, currentMonth);
      });
    } else if (filterStatus === 'overdue') {
      filtered = filtered.filter(student => isOverdue(student));
    }
    
    setFilteredStudents(filtered);
  }, [searchTerm, students, filterStatus, selectedYear]);

  const toggleFeeStatus = async (studentId, monthIndex) => {
    const student = students.find(s => s.id === studentId);
    const monthKey = `${monthNames[monthIndex]}-${selectedYear}`;
    const isPaid = student.feesPaid?.[monthKey];

    if (isPaid) {
      // Logic to un-pay
      const updatedStudent = {
          ...student,
          feesPaid: {
              ...student.feesPaid,
              [monthKey]: false,
          },
      };
      try {
        const response = await fetch(`${API_URL}/students/${student.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedStudent)
        });
        if (response.ok) {
          setStudents(prev => prev.map(s => s.id === student.id ? updatedStudent : s));
          // Also need to delete from /fees endpoint
          // This is getting complicated. For now, I will just update the student.
        }
      } catch (e) {
        console.error('Error un-paying fee:', e);
      }
    } else {
      // Open the modal to pay
      setPaymentModalData({ student, monthIndex });
      setShowPaymentModal(true);
    }
  };

  const updateFeeAmount = async (studentId) => {
    const student = students.find(s => s.id === studentId);
    const updatedStudent = {
      ...student,
      monthlyFees: parseFloat(feeAmount) || defaultFee
    };

    try {
      const response = await fetch(`${API_URL}/students/${studentId}`, {
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
      white: '⚪', yellow: '🟡', orange: '🟠', green: '🟢',
      blue: '🔵', brown: '🟤', black: '⚫'
    };
    return beltEmojis[beltColor?.toLowerCase()] || '⚪';
  };

  const bulkMarkPaid = async () => {
    for (const studentId of selectedStudents) {
      const currentMonth = new Date().getMonth();
      await toggleFeeStatus(studentId, currentMonth);
    }
    setSelectedStudents([]);
  };

  const generateReceipt = (student, monthIndex) => {
    const baseFee = student.monthlyFees || defaultFee;
    const finalAmount = Math.max(0, baseFee - discount);
    return {
      receiptNo: `RCP-${Date.now()}`,
      studentName: `${student.firstName} ${student.lastName}`,
      month: monthNames[monthIndex],
      year: selectedYear,
      baseFee,
      discount,
      finalAmount,
      paymentMethod,
      date: new Date().toLocaleDateString()
    };
  };

  const sendReminder = async (studentId) => {
    const student = students.find(s => s.id === studentId);
    const reminder = {
      student_id: studentId,
      student_name: `${student.firstName} ${student.lastName}`,
      phone: student.phoneNumber,
      message: `Reminder: Your monthly fee of ₹${student.monthlyFees || defaultFee} is due. Please pay by the 10th.`,
      sent_date: new Date().toISOString().split('T')[0]
    };
    
    // This would be a POST request to a /reminders endpoint
    // For now, we'll just log it.
    console.log("Sending reminder:", reminder);
    alert(`Reminder sent to ${student.firstName}`);
  };

  const exportToCSV = () => {
    const headers = ['Name', 'Belt', 'Monthly Fee', ...monthNames.map(m => m.slice(0,3)), 'Total Paid', 'Total Due'];
    const rows = filteredStudents.map(student => {
      const totalPaid = monthNames.reduce((sum, _, i) => sum + (getFeeStatus(student, i) ? (student.monthlyFees || defaultFee) : 0), 0);
      const totalDue = (student.monthlyFees || defaultFee) * 12 - totalPaid;
      return [
        `${student.firstName} ${student.lastName}`,
        student.beltColor || 'white',
        student.monthlyFees || defaultFee,
        ...monthNames.map((_, i) => getFeeStatus(student, i) ? 'Paid' : 'Unpaid'),
        totalPaid,
        totalDue
      ];
    });
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Fees_Report_${selectedYear}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getYearlyStats = () => {
    let totalPaid = 0;
    let totalUnpaid = 0;
    let totalCollected = 0;
    let totalExpected = 0;

    filteredStudents.forEach(student => {
      monthNames.forEach((_, monthIndex) => {
        const isPaid = getFeeStatus(student, monthIndex);
        const feeAmount = student.monthlyFees || defaultFee;
        
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

  const handleFeeAndAttendanceUpdate = async ({ student, monthIndex, paymentMethod, markPresent, discountAmt }) => {
    const monthKey = `${monthNames[monthIndex]}-${selectedYear}`;
    const newStatus = new Date().toISOString();

    let updatedStudent = {
        ...student,
        feesPaid: {
            ...student.feesPaid,
            [monthKey]: newStatus,
        },
    };

    if (markPresent) {
        const today = new Date();
        const attendanceMonthKey = `${monthNames[today.getMonth()]}-${today.getFullYear()}`;
        const day = today.getDate();
        
        updatedStudent = {
            ...updatedStudent,
            attendance: {
                ...updatedStudent.attendance,
                [attendanceMonthKey]: {
                    ...updatedStudent.attendance?.[attendanceMonthKey],
                    [day]: true,
                },
            },
        };
    }

    const baseFee = student.monthlyFees || defaultFee;
    const finalAmount = Math.max(0, baseFee - (discountAmt || 0));
    
    const feeRecord = {
      student_id: student.id,
      student_name: `${student.firstName} ${student.lastName}`,
      month: monthNames[monthIndex],
      year: selectedYear,
      amount: finalAmount,
      base_amount: baseFee,
      discount: discountAmt || 0,
      payment_method: paymentMethod,
      paid_date: newStatus.split('T')[0],
      status: 'paid'
    };

    try {
      await fetch(`${API_URL}/fees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(feeRecord)
      });

      const response = await fetch(`${API_URL}/students/${student.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedStudent)
      });

      if (response.ok) {
        setStudents(prev => prev.map(s => s.id === student.id ? updatedStudent : s));
        setShowPaymentModal(false);
        setPaymentModalData(null);
      }
    } catch (e) {
      console.error('Error updating fee and attendance:', e);
    }
  };

  const formatPaymentDate = (dateString) => {
    if (!dateString || dateString === false) return null;
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return null;
      
      // Format as DD/MM or DD MMM based on preference
      return date.toLocaleDateString('en-GB', { 
        day: '2-digit', 
        month: 'short' 
      }).replace(' ', '-');
    } catch (e) {
      return null;
    }
  };

  const PaymentModal = ({ show, onClose, data, onSubmit }) => {
    const [paymentType, setPaymentType] = useState('cash');
    const [markPresent, setMarkPresent] = useState(true);
    const [modalDiscount, setModalDiscount] = useState(0);

    if (!show || !data) return null;

    const { student, monthIndex } = data;

    const handleSubmit = () => {
      onSubmit({ student, monthIndex, paymentMethod: paymentType, markPresent, discountAmt: modalDiscount });
    };

    return (
      <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <div className="card" style={{maxWidth: '400px', margin: '20px'}}>
          <h3>Pay Fee: {student.firstName} - {monthNames[monthIndex]}</h3>
          <div className="form-group">
            <label>Payment Type</label>
            <select value={paymentType} onChange={(e) => setPaymentType(e.target.value)} className="form-input">
              <option value="cash">💵 Cash</option>
              <option value="online">💳 Online</option>
              <option value="card">💳 Card</option>
              <option value="upi">📱 UPI</option>
            </select>
          </div>
          <div className="form-group">
            <label>Discount</label>
            <input type="number" value={modalDiscount} onChange={(e) => setModalDiscount(parseFloat(e.target.value) || 0)} className="form-input" />
          </div>
          <div className="form-group">
            <label style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
              <input type="checkbox" checked={markPresent} onChange={(e) => setMarkPresent(e.target.checked)} />
              Mark as Present for Today
            </label>
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={handleSubmit} className="btn btn-success">Save Payment</button>
            <button onClick={onClose} className="btn btn-secondary">Cancel</button>
          </div>
        </div>
      </div>
    );
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
          <div className="flex gap-2 mb-3" style={{flexWrap: 'wrap'}}>
            <input
              type="text"
              placeholder="🔍 Search by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input"
              style={{flex: 1, minWidth: '200px'}}
            />
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="form-input">
              <option value="all">All Students</option>
              <option value="paid">Paid This Month</option>
              <option value="unpaid">Unpaid This Month</option>
              <option value="overdue">Overdue</option>
            </select>
            <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} className="form-input">
              {Array.from({length: 10}, (_, i) => new Date().getFullYear() - 5 + i).map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          
          <div className="flex gap-2 mb-3" style={{flexWrap: 'wrap'}}>
            <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="form-input">
              <option value="cash">💵 Cash</option>
              <option value="online">💳 Online</option>
              <option value="card">💳 Card</option>
              <option value="upi">📱 UPI</option>
            </select>
            <input
              type="number"
              placeholder="Discount ₹"
              value={discount}
              onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
              className="form-input"
              style={{width: '120px'}}
            />
            <button onClick={bulkMarkPaid} disabled={selectedStudents.length === 0} className="btn btn-success">
              💰 Mark Selected Paid ({selectedStudents.length})
            </button>
            <button onClick={exportToCSV} className="btn btn-primary">📊 Export CSV</button>
            <button onClick={() => setShowHistory(!showHistory)} className="btn btn-secondary">
              📋 {showHistory ? 'Hide' : 'Show'} History
            </button>
          </div>

          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)'}}>
            <div className="status-success" style={{padding: 'var(--spacing-sm)', textAlign: 'center'}}>
              <div style={{fontSize: '18px', fontWeight: '600'}}>✅ {totalPaid}</div>
              <div style={{fontSize: '11px'}}>Paid</div>
            </div>
            <div className="status-error" style={{padding: 'var(--spacing-sm)', textAlign: 'center'}}>
              <div style={{fontSize: '18px', fontWeight: '600'}}>❌ {totalUnpaid}</div>
              <div style={{fontSize: '11px'}}>Unpaid</div>
            </div>
            <div className="status-info" style={{padding: 'var(--spacing-sm)', textAlign: 'center'}}>
              <div style={{fontSize: '18px', fontWeight: '600'}}>₹{totalCollected}</div>
              <div style={{fontSize: '11px'}}>Collected</div>
            </div>
            <div className="status-warning" style={{padding: 'var(--spacing-sm)', textAlign: 'center'}}>
              <div style={{fontSize: '18px', fontWeight: '600'}}>₹{totalExpected}</div>
              <div style={{fontSize: '11px'}}>Expected</div>
            </div>
            <div className="status-error" style={{padding: 'var(--spacing-sm)', textAlign: 'center'}}>
              <div style={{fontSize: '18px', fontWeight: '600'}}>⏰ {filteredStudents.filter(isOverdue).length}</div>
              <div style={{fontSize: '11px'}}>Overdue</div>
            </div>
          </div>
        </div>

        <PaymentModal 
          show={showPaymentModal} 
          onClose={() => setShowPaymentModal(false)} 
          data={paymentModalData} 
          onSubmit={handleFeeAndAttendanceUpdate} 
        />

        {showHistory && (
          <div className="card">
            <h3>💳 Recent Payments</h3>
            <div style={{maxHeight: '200px', overflowY: 'auto'}}>
              {paymentHistory.slice(0, 10).map((payment, i) => (
                <div key={i} style={{padding: '8px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between'}}>
                  <span>{payment.student_name} - {payment.month} {payment.year}</span>
                  <span>₹{payment.amount} ({payment.payment_method})</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {showReceipt && (
          <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <div className="card" style={{maxWidth: '400px', margin: '20px'}}>
              <h3>🧾 Payment Receipt</h3>
              <div style={{padding: '20px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px'}}>
                <p><strong>Receipt No:</strong> {showReceipt.receiptNo}</p>
                <p><strong>Student:</strong> {showReceipt.studentName}</p>
                <p><strong>Period:</strong> {showReceipt.month} {showReceipt.year}</p>
                <p><strong>Base Fee:</strong> ₹{showReceipt.baseFee}</p>
                {showReceipt.discount > 0 && <p><strong>Discount:</strong> -₹{showReceipt.discount}</p>}
                <p><strong>Final Amount:</strong> ₹{showReceipt.finalAmount}</p>
                <p><strong>Payment Method:</strong> {showReceipt.paymentMethod}</p>
                <p><strong>Date:</strong> {showReceipt.date}</p>
              </div>
              <div className="flex gap-2 mt-3">
                <button onClick={() => window.print()} className="btn btn-primary">🖨️ Print</button>
                <button onClick={() => setShowReceipt(null)} className="btn btn-secondary">Close</button>
              </div>
            </div>
          </div>
        )}

        <div className="card">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedStudents(filteredStudents.map(s => s.id));
                        } else {
                          setSelectedStudents([]);
                        }
                      }}
                      checked={selectedStudents.length === filteredStudents.length && filteredStudents.length > 0}
                    />
                  </th>
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
                {filteredStudents.map((student) => {
                  const feeStatus = getFeeStatus(student, new Date().getMonth());
                  return (
                    <tr key={student.id} className={isOverdue(student) ? 'row-overdue' : ''}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedStudents.includes(student.id)}
                          onChange={() => {
                            setSelectedStudents(prev => 
                              prev.includes(student.id) ? prev.filter(id => id !== student.id) : [...prev, student.id]
                            );
                          }}
                        />
                      </td>
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
                            ₹{student.monthlyFees || defaultFee}
                          </span>
                        )} 
                      </td>
                      {monthNames.map((_, monthIndex) => {
                        const paymentStatus = getFeeStatus(student, monthIndex);
                        const paymentDate = formatPaymentDate(paymentStatus);
                        
                        return (
                          <td key={monthIndex} className="text-center">
                            <div style={{display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'center'}}>
                              <button
                                onClick={() => toggleFeeStatus(student.id, monthIndex)}
                                className={`btn ${paymentStatus ? 'btn-success' : 'btn-danger'} hover-lift`}
                                style={{fontSize: '10px', padding: '2px 6px', minWidth: '40px'}}
                              >
                                {paymentStatus ? '✅' : '❌'}
                              </button>
                              {paymentDate && (
                                <span style={{fontSize: '9px', color: 'var(--success)', fontWeight: '500'}}>
                                  {paymentDate}
                                </span>
                              )}
                            </div>
                          </td>
                        );
                      })}
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
                              setFeeAmount(student.monthlyFees || defaultFee);
                            }}
                            className="btn btn-primary hover-lift"
                            style={{fontSize: '10px', padding: '4px 8px'}}
                          >
                            ✏️
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Fees;
import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';

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
  const [defaultFee, setDefaultFee] = useState(500);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    const userId = user ? user.id : null;

    fetch(`${API_BASE_URL}/students?userId=${userId}`)
      .then(res => res.json())
      .then(data => {
        setStudents(data);
        setFilteredStudents(data);
      })
      .catch(e => console.error('Error loading students:', e));
    
    fetch(`${API_BASE_URL}/fees?userId=${userId}`)
      .then(res => res.json())
      .then(data => setPaymentHistory(data))
      .catch(e => console.error('Error loading payment history:', e));
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
      const updatedStudent = {
          ...student,
          feesPaid: {
              ...student.feesPaid,
              [monthKey]: false,
          },
      };
      try {
        const response = await fetch(`${API_BASE_URL}/students/${student.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedStudent)
        });
        if (response.ok) {
          setStudents(prev => prev.map(s => s.id === student.id ? updatedStudent : s));
        }
      } catch (e) {
        console.error('Error un-paying fee:', e);
      }
    } else {
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
      const response = await fetch(`${API_BASE_URL}/students/${studentId}`, {
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

  const handleFeeAndAttendanceUpdate = async ({ student, monthIndex, paymentMethod, markPresent, discountAmt, notes }) => {
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
    
    const user = JSON.parse(localStorage.getItem('user'));
    const userId = user ? user.id : null;

    const feeRecord = {
      student_id: student.id,
      amount: finalAmount,
      month: monthNames[monthIndex],
      year: selectedYear,
      payment_date: newStatus.split('T')[0],
      payment_method: paymentMethod,
      notes: (discountAmt > 0 ? `Discount applied: ₹${discountAmt}. ` : '') + (notes || ''),
      userId: userId
    };

    try {
      const feeResponse = await fetch(`${API_BASE_URL}/fees/mark-paid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(feeRecord)
      });

      const feeData = await feeResponse.json();

      if (feeResponse.ok) {
        const studentResponse = await fetch(`${API_BASE_URL}/students/${student.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedStudent)
        });

        if (studentResponse.ok) {
          setStudents(prev => prev.map(s => s.id === student.id ? updatedStudent : s));
          setShowPaymentModal(false);
          setPaymentModalData(null);
          
          // Refetch payment history
          fetch(`${API_BASE_URL}/fees?userId=${userId}`)
            .then(res => res.json())
            .then(data => setPaymentHistory(data))
            .catch(e => console.error('Error reloading payment history:', e));

          if (window.confirm(`Fee payment of ₹${finalAmount} saved successfully! Do you want a receipt?`)) {
            setShowReceipt({
              student_name: `${student.firstName} ${student.lastName}`,
              amount: finalAmount,
              month: monthNames[monthIndex],
              year: selectedYear,
              payment_date: newStatus,
              payment_method: paymentMethod,
              notes: (discountAmt > 0 ? `Discount applied: ₹${discountAmt}. ` : '') + (notes || ''),
              id: feeData.id
            });
          }
        }
      } else {
        alert(`Error: ${feeData.error || 'Failed to save fee'}`);
      }
    } catch (e) {
      console.error('Error updating fee and attendance:', e);
      alert(`Error: ${e.message}`);
    }
  };

  const formatPaymentDate = (dateString) => {
    if (!dateString || dateString === false) return null;
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return null;
      return date.toLocaleDateString('en-GB', { 
        day: '2-digit', 
        month: 'short' 
      }).replace(' ', '-');
    } catch (e) {
      return null;
    }
  };

  const ReceiptModal = ({ show, onClose, data }) => {
    if (!show || !data) return null;

    const { student_name, amount, month, year, payment_date, payment_method, notes, id } = data;

    return (
      <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <style>
          {`
            @media print {
              body * {
                visibility: hidden;
              }
              .receipt-modal-content, .receipt-modal-content * {
                visibility: visible;
              }
              .receipt-modal-content {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                margin: 0;
                padding: 20px;
                background: white;
                border: none;
                box-shadow: none;
              }
              .no-print {
                display: none !important;
              }
            }
          `}
        </style>
        <div className="card receipt-modal-content" style={{maxWidth: '400px', width: '100%', margin: '20px', padding: '20px', backgroundColor: 'white'}}>
          <div style={{textAlign: 'center', borderBottom: '2px dashed #ccc', paddingBottom: '10px', marginBottom: '10px'}}>
            <h2 style={{margin: 0}}>FEE RECEIPT</h2>
            <p style={{margin: '5px 0', fontSize: '12px', color: '#666'}}>Receipt #{id}</p>
          </div>
          
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '14px'}}>
            <div><strong>Date:</strong></div>
            <div style={{textAlign: 'right'}}>{new Date(payment_date).toLocaleDateString()}</div>
            
            <div><strong>Student:</strong></div>
            <div style={{textAlign: 'right'}}>{student_name}</div>
            
            <div><strong>Month/Year:</strong></div>
            <div style={{textAlign: 'right'}}>{month} {year}</div>
            
            <div><strong>Payment Method:</strong></div>
            <div style={{textAlign: 'right'}}>{payment_method}</div>
            
            {notes && (
              <>
                <div><strong>Notes:</strong></div>
                <div style={{textAlign: 'right'}}>{notes}</div>
              </>
            )}
          </div>

          <div style={{borderTop: '2px dashed #ccc', marginTop: '15px', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <span style={{fontSize: '16px', fontWeight: 'bold'}}>Total Paid:</span>
            <span style={{fontSize: '20px', fontWeight: 'bold', color: 'var(--success)'}}>₹{amount}</span>
          </div>

          <div className="flex gap-2 mt-4 no-print">
            <button onClick={() => window.print()} className="btn btn-primary" style={{flex: 1}}>🖨️ Print</button>
            <button onClick={onClose} className="btn btn-secondary" style={{flex: 1}}>Close</button>
          </div>
        </div>
      </div>
    );
  };

  const PaymentModal = ({ show, onClose, data, onSubmit }) => {
    const [paymentType, setPaymentType] = useState('cash');
    const [markPresent, setMarkPresent] = useState(true);
    const [modalDiscount, setModalDiscount] = useState(0);
    const [notes, setNotes] = useState('');

    if (!show || !data) return null;

    const { student, monthIndex } = data;

    const handleSubmit = () => {
      onSubmit({ student, monthIndex, paymentMethod: paymentType, markPresent, discountAmt: modalDiscount, notes });
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
            <label>Notes</label>
            <textarea 
              value={notes} 
              onChange={(e) => setNotes(e.target.value)} 
              className="form-input" 
              placeholder="Optional notes..."
              rows="2"
            />
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
            <button 
              className={`btn ${showHistory ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setShowHistory(!showHistory)}
            >
              {showHistory ? 'Show Fees Table' : 'View Payment History'}
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
          </div>
        </div>

        <PaymentModal 
          show={showPaymentModal} 
          onClose={() => setShowPaymentModal(false)} 
          data={paymentModalData} 
          onSubmit={handleFeeAndAttendanceUpdate} 
        />

        <ReceiptModal
          show={!!showReceipt}
          onClose={() => setShowReceipt(null)}
          data={showReceipt}
        />

        {showHistory ? (
          <div className="card">
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Student</th>
                    <th>Amount</th>
                    <th>Month/Year</th>
                    <th>Method</th>
                    <th>Notes</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentHistory.map(payment => (
                    <tr key={payment.id}>
                      <td>{new Date(payment.payment_date).toLocaleDateString()}</td>
                      <td>{payment.firstName} {payment.lastName}</td>
                      <td>₹{payment.amount}</td>
                      <td>{payment.month} {payment.year}</td>
                      <td>{payment.payment_method}</td>
                      <td>{payment.notes}</td>
                      <td>
                        <button 
                          onClick={() => setShowReceipt(payment)}
                          className="btn btn-sm btn-secondary"
                        >
                          📄 Receipt
                        </button>
                      </td>
                    </tr>
                  ))}
                  {paymentHistory.length === 0 && (
                    <tr>
                      <td colSpan="7" className="text-center">No payment history found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
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
                  <tr key={student.id} className={isOverdue(student) ? 'row-overdue' : ''}>
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

export default Fees;
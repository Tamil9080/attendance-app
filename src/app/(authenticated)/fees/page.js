'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/app/providers';
import { API_BASE_URL } from '@/config';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import { Search, DollarSign, Clock, CheckCircle2, History, AlertCircle } from 'lucide-react';

export default function FeesPage() {
  const { selectedInstitute, user, selectedMonth, selectedYear } = useApp();

  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, paid, unpaid, overdue
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState({ text: '', type: 'success' });
  const [isMessageVisible, setIsMessageVisible] = useState(false);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const getMonthKey = () => `${monthNames[selectedMonth]}-${selectedYear}`;

  useEffect(() => {
    if (!selectedInstitute || !user) return;

    setIsLoading(true);
    Promise.all([
      fetch(`${API_BASE_URL}/students?userId=${user.id}&instituteType=${selectedInstitute}`),
      fetch(`${API_BASE_URL}/fees?userId=${user.id}&instituteType=${selectedInstitute}`)
    ])
    .then(([studentsRes, feesRes]) => Promise.all([studentsRes.json(), feesRes.json()]))
    .then(([studentsData, feesData]) => {
      setStudents(studentsData || []);
      setPaymentHistory(feesData || []);
    })
    .catch(e => console.error('Error loading fees data:', e))
    .finally(() => setIsLoading(false));
  }, [selectedInstitute, user, selectedMonth, selectedYear]);

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setIsMessageVisible(true);
    setTimeout(() => {
      setIsMessageVisible(false);
    }, 3000);
  };

  const getFeeStatus = (student) => {
    const monthKey = getMonthKey();
    return student.feesPaid?.[monthKey] || false;
  };

  const isOverdue = (student) => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    const dueDate = new Date(currentYear, currentMonth, 10);
    
    // Scoped check for the current calendar period
    const isCurrentPeriod = selectedMonth === currentMonth && selectedYear === currentYear;
    if (!isCurrentPeriod) return false;

    return currentDate > dueDate && !getFeeStatus(student);
  };

  // Filter students
  useEffect(() => {
    let filtered = students.filter(student =>
      `${student.firstName} ${student.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (filterStatus === 'paid') {
      filtered = filtered.filter(student => getFeeStatus(student));
    } else if (filterStatus === 'unpaid') {
      filtered = filtered.filter(student => !getFeeStatus(student));
    } else if (filterStatus === 'overdue') {
      filtered = filtered.filter(student => isOverdue(student));
    }

    // Sort by belt order
    const beltOrder = ['white', 'yellow', 'orange', 'green', 'blue', 'brown', 'black'];
    filtered.sort((a, b) => {
      const aIndex = beltOrder.indexOf((a.beltColor || 'white').toLowerCase());
      const bIndex = beltOrder.indexOf((b.beltColor || 'white').toLowerCase());
      if (aIndex !== bIndex) return aIndex - bIndex;
      return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
    });

    setFilteredStudents(filtered);
  }, [searchTerm, students, filterStatus, selectedMonth, selectedYear]);

  const toggleFeeStatus = async (student) => {
    const monthKey = getMonthKey();
    const isPaid = getFeeStatus(student);

    if (isPaid) {
      // Toggle unpaid: remove record
      const updatedStudent = {
        ...student,
        feesPaid: {
          ...(student.feesPaid || {}),
          [monthKey]: false
        }
      };

      try {
        const response = await fetch(`${API_BASE_URL}/students/${student.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedStudent)
        });

        if (response.ok) {
          setStudents(prev => prev.map(s => s.id === student.id ? updatedStudent : s));
          
          // Find and delete the corresponding fee history item
          const matchedFee = paymentHistory.find(f => 
            f.student_id === student.id && 
            f.month === monthNames[selectedMonth] && 
            f.year === selectedYear
          );

          if (matchedFee) {
            await fetch(`${API_BASE_URL}/fees/${matchedFee.id}`, { method: 'DELETE' });
            setPaymentHistory(prev => prev.filter(f => f.id !== matchedFee.id));
          }

          showMessage('Fee marked as Unpaid.');
        }
      } catch (e) {
        console.error(e);
        showMessage('Connection error.', 'error');
      }
    } else {
      // Toggle paid: create record
      const amount = student.monthlyFees || 1500; // fallback
      const updatedStudent = {
        ...student,
        feesPaid: {
          ...(student.feesPaid || {}),
          [monthKey]: true
        }
      };

      try {
        const response = await fetch(`${API_BASE_URL}/students/${student.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedStudent)
        });

        if (response.ok) {
          setStudents(prev => prev.map(s => s.id === student.id ? updatedStudent : s));

          // Post to fee history
          const feeResponse = await fetch(`${API_BASE_URL}/fees`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              student_id: student.id,
              amount,
              month: monthNames[selectedMonth],
              year: selectedYear,
              payment_date: new Date().toISOString().split('T')[0],
              payment_method: 'cash',
              notes: 'Recorded via quick toggle',
              userId: user.id,
              instituteType: selectedInstitute
            })
          });

          if (feeResponse.ok) {
            const data = await feeResponse.json();
            // Append to history
            const newHistoryItem = {
              id: data.id,
              student_id: student.id,
              student_name: `${student.firstName} ${student.lastName}`,
              amount,
              month: monthNames[selectedMonth],
              year: selectedYear,
              payment_date: new Date().toISOString().split('T')[0],
              payment_method: 'cash',
              notes: 'Recorded via quick toggle'
            };
            setPaymentHistory(prev => [newHistoryItem, ...prev]);
          }

          showMessage('Fee marked as Paid!');
        }
      } catch (e) {
        console.error(e);
        showMessage('Connection error.', 'error');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {isMessageVisible && (
        <div className={`fixed bottom-5 right-5 z-50 p-4 rounded-lg shadow-lg flex items-center gap-2 transition-all duration-300 transform translate-y-0 ${
          message.type === 'error' ? 'bg-red-500/10 border border-red-500/20 text-red-500' : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-500'
        }`}>
          <span>{message.type === 'error' ? '❌' : '✅'}</span>
          <span className="text-sm font-semibold">{message.text}</span>
        </div>
      )}

      {/* Top Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 border border-slate-800 p-6 rounded-xl">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Fees Management
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track student monthly fee collections for {monthNames[selectedMonth]} {selectedYear}.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowHistory(!showHistory)}
            variant="secondary"
            className="text-xs h-9 font-semibold border border-slate-800 bg-slate-900/40"
          >
            <History className="h-4 w-4 mr-1.5 text-indigo-400" />
            {showHistory ? 'Show Register' : 'Payment History'}
          </Button>
        </div>
      </div>

      {!showHistory ? (
        <>
          {/* Filters card */}
          <Card className="border border-border bg-card p-5">
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1 w-full relative">
                <Input
                  label="Search Students"
                  id="search"
                  placeholder="Search by student name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
                <Search className="absolute right-3 bottom-3 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>

              <div className="w-full md:w-56 flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Filter Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="h-10 px-3 rounded-lg border border-border bg-card text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary transition-all select-none"
                >
                  <option value="all">All Students</option>
                  <option value="paid">Paid</option>
                  <option value="unpaid">Unpaid</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>
            </div>
          </Card>

          {/* Student list with toggles */}
          <Card className="border border-border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border bg-slate-900/10 dark:bg-slate-900/50">
                    <th className="p-4 text-sm font-semibold text-muted-foreground">Student Name</th>
                    <th className="p-4 text-sm font-semibold text-muted-foreground">Belt</th>
                    <th className="p-4 text-sm font-semibold text-muted-foreground">Scheduled Amount</th>
                    <th className="p-4 text-center text-sm font-semibold text-muted-foreground">Payment Status</th>
                    <th className="p-4 text-center text-sm font-semibold text-muted-foreground w-40">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center">
                        <div className="flex justify-center items-center gap-2">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                          <span className="text-sm text-muted-foreground">Loading fee records...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-sm text-muted-foreground">
                        No students found matching current filter.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map(student => {
                      const isPaid = getFeeStatus(student);
                      const isDue = isOverdue(student);

                      return (
                        <tr key={student.id} className="border-b border-border/40 hover:bg-muted/40 transition-colors">
                          <td className="p-4 font-semibold text-sm text-foreground">
                            {student.firstName} {student.lastName}
                          </td>
                          <td className="p-4 text-sm text-foreground capitalize">
                            {student.beltColor || 'White'}
                          </td>
                          <td className="p-4 text-sm text-foreground font-semibold">
                            ₹{student.monthlyFees || 1500}
                          </td>
                          <td className="p-4 text-center">
                            {isPaid ? (
                              <Badge variant="success">Paid</Badge>
                            ) : isDue ? (
                              <Badge variant="danger">Overdue</Badge>
                            ) : (
                              <Badge variant="secondary">Unpaid</Badge>
                            )}
                          </td>
                          <td className="p-4 text-center">
                            <Button
                              onClick={() => toggleFeeStatus(student)}
                              variant={isPaid ? 'danger' : 'success'}
                              className="h-8 text-xs font-semibold px-4 w-full"
                            >
                              {isPaid ? 'Mark Unpaid' : 'Mark Paid'}
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      ) : (
        /* History Log List */
        <Card className="border border-border bg-card overflow-hidden">
          <Card.Header>
            <Card.Title>Payment Log History</Card.Title>
            <Card.Description>Chronological list of all recorded fee collections.</Card.Description>
          </Card.Header>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-slate-900/10 dark:bg-slate-900/50">
                  <th className="p-4 text-sm font-semibold text-muted-foreground">Student Name</th>
                  <th className="p-4 text-sm font-semibold text-muted-foreground">Collected Amount</th>
                  <th className="p-4 text-sm font-semibold text-muted-foreground">Period</th>
                  <th className="p-4 text-sm font-semibold text-muted-foreground">Payment Date</th>
                  <th className="p-4 text-sm font-semibold text-muted-foreground">Method</th>
                  <th className="p-4 text-sm font-semibold text-muted-foreground">Notes</th>
                </tr>
              </thead>
              <tbody>
                {paymentHistory.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-sm text-muted-foreground">
                      No payment log history entries.
                    </td>
                  </tr>
                ) : (
                  paymentHistory.map((fee) => (
                    <tr key={fee.id} className="border-b border-border/40 hover:bg-muted/40 transition-colors text-sm">
                      <td className="p-4 font-semibold text-foreground">{fee.student_name}</td>
                      <td className="p-4 text-foreground font-semibold">₹{fee.amount}</td>
                      <td className="p-4 text-foreground">{fee.month} {fee.year}</td>
                      <td className="p-4 text-muted-foreground">{new Date(fee.payment_date).toLocaleDateString()}</td>
                      <td className="p-4 text-foreground capitalize">{fee.payment_method}</td>
                      <td className="p-4 text-muted-foreground">{fee.notes || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

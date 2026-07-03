'use client';

import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { useApp } from '@/app/providers';
import { API_BASE_URL } from '@/config';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { Check, X, Lock, Unlock, Download, Calendar, Search, Trash2 } from 'lucide-react';

export default function HistoryPage() {
  const { 
    selectedInstitute, 
    user, 
    selectedMonth, 
    setSelectedMonth, 
    selectedYear, 
    setSelectedYear 
  } = useApp();

  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [lockedDays, setLockedDays] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState({ text: '', type: 'success' });
  const [isMessageVisible, setIsMessageVisible] = useState(false);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const getCurrentMonthKey = () => `${monthNames[selectedMonth]}-${selectedYear}`;

  // Load students from database
  useEffect(() => {
    if (!selectedInstitute || !user) return;

    setIsLoading(true);
    fetch(`${API_BASE_URL}/students?userId=${user.id}&instituteType=${selectedInstitute}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setStudents(data);
        } else {
          setStudents([]);
          showMessage('Error loading students from database.', 'error');
        }
      })
      .catch(e => {
        console.error("Could not load data", e);
        showMessage('Error connecting to database.', 'error');
      })
      .finally(() => setIsLoading(false));
  }, [selectedInstitute, user, selectedMonth, selectedYear]);

  // Load locked days from localStorage on mount
  useEffect(() => {
    const savedLocks = localStorage.getItem('lockedDays');
    if (savedLocks) {
      setLockedDays(JSON.parse(savedLocks));
    }
  }, []);

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setIsMessageVisible(true);
    setTimeout(() => {
      setIsMessageVisible(false);
    }, 3000);
  };

  // Get Sundays in month
  const getSundaysInMonth = () => {
    const sundays = [];
    let date = 1;
    let day = new Date(selectedYear, selectedMonth, date);
    while (day.getMonth() === selectedMonth) {
      if (day.getDay() === 0) {
        sundays.push(date);
      }
      date++;
      day = new Date(selectedYear, selectedMonth, date);
    }
    return sundays;
  };

  const getYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear - 5; i <= currentYear + 5; i++) {
      years.push(i);
    }
    return years;
  };

  const toggleDayLock = (day) => {
    const newLockedDays = {
      ...lockedDays,
      [day]: !lockedDays[day]
    };
    setLockedDays(newLockedDays);
    localStorage.setItem('lockedDays', JSON.stringify(newLockedDays));
    showMessage(newLockedDays[day] ? `Day ${day} locked` : `Day ${day} unlocked`);
  };

  const handleAttendanceChange = async (studentId, day, newStatus) => {
    if (lockedDays[day]) {
      showMessage("Day is locked. Click 'Save' to unlock first.", 'error');
      return;
    }

    const monthKey = getCurrentMonthKey();
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    const monthAttendance = (student.attendance && student.attendance[monthKey]) || {};
    const updatedStudent = {
      ...student,
      attendance: {
        ...student.attendance,
        [monthKey]: {
          ...monthAttendance,
          [day]: newStatus
        }
      }
    };

    // Update locally first
    setStudents(prev => prev.map(s => s.id === studentId ? updatedStudent : s));

    try {
      const response = await fetch(`${API_BASE_URL}/students/${studentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedStudent)
      });

      if (!response.ok) {
        throw new Error('Failed to update student');
      }

      // If marked absent, log in absent table
      if (newStatus === false) {
        const absentRecord = {
          student_id: studentId,
          student_name: `${student.firstName} ${student.lastName}`,
          phone_number: student.phoneNumber || '',
          absent_date: `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
          reason: '',
          instituteType: selectedInstitute,
          userId: user.id
        };

        fetch(`${API_BASE_URL}/absent-students`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(absentRecord)
        }).catch(err => console.error("Error creating absent record", err));
      }

      showMessage(`Attendance saved for ${student.firstName}`);
    } catch (e) {
      console.error(e);
      showMessage('Error saving to server.', 'error');
      // Rollback
      setStudents(prev => prev.map(s => s.id === studentId ? student : s));
    }
  };

  const handleMoveToInactive = async (student) => {
    if (window.confirm(`Move ${student.firstName} ${student.lastName} to inactive list?`)) {
      try {
        const response = await fetch(`${API_BASE_URL}/students/${student.id}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          setStudents(prev => prev.filter(s => s.id !== student.id));
          showMessage(`${student.firstName} moved to inactive list`);
        } else {
          showMessage('Error moving student.', 'error');
        }
      } catch (e) {
        console.error(e);
        showMessage('Error moving student.', 'error');
      }
    }
  };

  const calculateSummary = (student) => {
    const monthKey = getCurrentMonthKey();
    const attendanceRecords = (student.attendance && student.attendance[monthKey]) || {};
    let presentCount = 0;
    let absentCount = 0;
    for (const day in attendanceRecords) {
      if (attendanceRecords[day] === true) {
        presentCount++;
      } else if (attendanceRecords[day] === false) {
        absentCount++;
      }
    }
    return { presentCount, absentCount };
  };

  const exportReport = () => {
    const sundays = getSundaysInMonth();
    const monthKey = getCurrentMonthKey();
    let csvContent = `Student Name,${sundays.map(d => `Day ${d}`).join(',')},Present,Absent\n`;

    students.forEach(student => {
      const { presentCount, absentCount } = calculateSummary(student);
      const row = sundays.map(day => {
        const status = student.attendance?.[monthKey]?.[day];
        return status === true ? 'P' : status === false ? 'A' : '-';
      });
      csvContent += `"${student.firstName} ${student.lastName}",${row.join(',')},${presentCount},${absentCount}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Attendance_${monthNames[selectedMonth]}_${selectedYear}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    confetti({ particleCount: 30, spread: 40 });
    showMessage('CSV report exported!');
  };

  // Sort and filter students
  const filteredStudents = students
    .filter(s => `${s.firstName} ${s.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      const beltOrder = ['white', 'yellow', 'orange', 'green', 'blue', 'brown', 'black'];
      const aIndex = beltOrder.indexOf((a.beltColor || 'white').toLowerCase());
      const bIndex = beltOrder.indexOf((b.beltColor || 'white').toLowerCase());
      if (aIndex !== bIndex) return aIndex - bIndex;
      return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
    });

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

      {/* Top Filter Bar */}
      <Card className="border border-border bg-card p-5">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          {/* Period Selectors */}
          <div className="grid grid-cols-2 gap-3 w-full md:w-auto md:min-w-[300px]">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Month</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="h-10 px-3 rounded-lg border border-border bg-card text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary transition-all select-none"
              >
                {monthNames.map((month, idx) => (
                  <option key={idx} value={idx}>{month}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Year</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="h-10 px-3 rounded-lg border border-border bg-card text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary transition-all select-none"
              >
                {getYearOptions().map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Search bar */}
          <div className="flex-1 w-full relative">
            <Input
              label="Search Students"
              id="search"
              placeholder="Filter by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
            <Search className="absolute right-3 bottom-3 h-4 w-4 text-muted-foreground pointer-events-none" />
          </div>

          {/* Actions */}
          <div className="w-full md:w-auto">
            <Button
              onClick={exportReport}
              variant="secondary"
              className="w-full md:w-auto flex gap-2 h-10 border border-border"
            >
              <Download className="h-4 w-4" /> Export CSV
            </Button>
          </div>
        </div>
      </Card>

      {/* Main Table */}
      <Card className="border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-900/10 dark:bg-slate-900/50">
                <TableHead className="w-1/4">Name</TableHead>
                {getSundaysInMonth().map(day => (
                  <TableHead key={day} className="text-center">
                    <div className="flex flex-col items-center gap-1.5">
                      <span>Day {day}</span>
                      <button
                        onClick={() => toggleDayLock(day)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${
                          lockedDays[day]
                            ? 'bg-rose-500/10 border-rose-500/20 text-rose-500'
                            : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                        }`}
                      >
                        {lockedDays[day] ? (
                          <>
                            <Lock className="h-2.5 w-2.5" /> Lock
                          </>
                        ) : (
                          <>
                            <Unlock className="h-2.5 w-2.5" /> Save
                          </>
                        )}
                      </button>
                    </div>
                  </TableHead>
                ))}
                <TableHead className="text-center w-1/6">Attendance</TableHead>
                <TableHead className="text-center w-12">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={getSundaysInMonth().length + 3} className="p-8 text-center">
                    <div className="flex justify-center items-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                      <span className="text-sm text-muted-foreground">Loading active student roster...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredStudents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={getSundaysInMonth().length + 3} className="p-8 text-center text-sm text-muted-foreground">
                    No active students found in this workspace.
                  </TableCell>
                </TableRow>
              ) : (
                filteredStudents.map(student => {
                  const { presentCount, absentCount } = calculateSummary(student);
                  return (
                    <TableRow key={student.id}>
                      {/* Student Info */}
                      <TableCell className="font-semibold">
                        <div className="flex flex-col">
                          <span>{student.firstName} {student.lastName}</span>
                          <span className="text-[10px] text-muted-foreground capitalize font-normal">
                            Belt: {student.beltColor || 'White'}
                          </span>
                        </div>
                      </TableCell>

                      {/* Day Grid Controls */}
                      {getSundaysInMonth().map(day => {
                        const monthKey = getCurrentMonthKey();
                        const status = student.attendance?.[monthKey]?.[day];

                        return (
                          <TableCell key={day} className="text-center">
                            <button
                              disabled={lockedDays[day]}
                              onClick={() => {
                                let newStatus;
                                if (status === true) newStatus = false;
                                else if (status === false) newStatus = null;
                                else newStatus = true;
                                handleAttendanceChange(student.id, day, newStatus);
                              }}
                              className={`w-7 h-7 rounded-full border flex items-center justify-center mx-auto transition-all ${
                                status === true
                                  ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500 hover:bg-emerald-500/20'
                                  : status === false
                                  ? 'bg-rose-500/10 border-rose-500 text-rose-500 hover:bg-rose-500/20'
                                  : 'bg-slate-900/10 dark:bg-slate-800/40 border-border border-dashed text-slate-500 hover:border-slate-400'
                              } ${lockedDays[day] ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                            >
                              {status === true && <Check className="h-4 w-4" />}
                              {status === false && <X className="h-4 w-4" />}
                            </button>
                          </TableCell>
                        );
                      })}

                      {/* Summary Metrics */}
                      <TableCell className="text-center font-medium text-xs whitespace-nowrap">
                        <Badge variant="success">P: {presentCount}</Badge>
                        <span className="mx-1 text-muted-foreground">/</span>
                        <Badge variant="danger">A: {absentCount}</Badge>
                      </TableCell>

                      {/* Remove Button */}
                      <TableCell className="text-center">
                        <button
                          onClick={() => handleMoveToInactive(student)}
                          className="p-1.5 rounded-lg border border-border bg-card hover:bg-red-500/10 hover:text-red-500 text-muted-foreground transition-all duration-200"
                          title="Move to inactive roster"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/app/providers';
import { API_BASE_URL } from '@/config';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Zap, Users, Check, X, MessageSquare } from 'lucide-react';

export default function BulkPage() {
  const { selectedInstitute, user } = useApp();

  const [students, setStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [operation, setOperation] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: 'success' });

  useEffect(() => {
    if (!selectedInstitute || !user) return;

    fetch(`${API_BASE_URL}/students?userId=${user.id}&instituteType=${selectedInstitute}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setStudents(data);
        } else {
          setStudents([]);
        }
      })
      .catch(e => console.error('Error loading students:', e));
  }, [selectedInstitute, user]);

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => {
      setMessage({ text: '', type: 'success' });
    }, 4000);
  };

  const handleSelectAll = () => {
    if (selectedStudents.length === students.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(students.map(s => s.id));
    }
  };

  const handleSelectStudent = (id) => {
    if (selectedStudents.includes(id)) {
      setSelectedStudents(prev => prev.filter(item => item !== id));
    } else {
      setSelectedStudents(prev => [...prev, id]);
    }
  };

  const executeBulkOperation = async (e) => {
    e.preventDefault();
    if (!operation || selectedStudents.length === 0) {
      showMessage('Please select students and an operation.', 'error');
      return;
    }

    setIsLoading(true);

    try {
      if (operation === 'present' || operation === 'absent') {
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'];
        
        const date = new Date(selectedDate);
        const monthKey = `${monthNames[date.getMonth()]}-${date.getFullYear()}`;
        const day = date.getDate();

        await Promise.all(selectedStudents.map(async (studentId) => {
          const student = students.find(s => s.id === studentId);
          if (student) {
            const updatedStudent = {
              ...student,
              attendance: {
                ...student.attendance,
                [monthKey]: {
                  ...(student.attendance?.[monthKey] || {}),
                  [day]: operation === 'present'
                }
              }
            };

            await fetch(`${API_BASE_URL}/students/${studentId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(updatedStudent)
            });
          }
        }));

        showMessage(`Successfully marked ${selectedStudents.length} students as ${operation}!`);
      } else if (operation === 'whatsapp') {
        selectedStudents.forEach(studentId => {
          const student = students.find(s => s.id === studentId);
          if (student && student.phoneNumber) {
            const reminderMsg = `Hello ${student.firstName}, this is a friendly reminder about your class today. See you there!`;
            let phone = student.phoneNumber.replace(/[^0-9]/g, '');
            if (phone.length === 10) phone = '91' + phone;
            const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(reminderMsg)}`;
            window.open(whatsappUrl, '_blank');
          }
        });
        showMessage(`Dispatched WhatsApp triggers for ${selectedStudents.length} students.`);
      }

      setSelectedStudents([]);
      setOperation('');
    } catch (e) {
      console.error(e);
      showMessage('Error executing operation.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
          Bulk Actions
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Perform attendance logs or dispatch messages across multiple students.
        </p>
      </div>

      {message.text && (
        <div className={`p-4 rounded-lg flex items-center gap-2.5 border ${
          message.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
        }`}>
          <span>{message.type === 'error' ? '⚠️' : '✅'}</span>
          <span className="text-sm font-semibold">{message.text}</span>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Form Widget */}
        <div className="space-y-6">
          <Card className="border border-border bg-card">
            <Card.Header>
              <div className="flex items-center gap-2 text-indigo-500 mb-2">
                <Zap className="h-5 w-5" />
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Command console</span>
              </div>
              <Card.Title>Configure Operation</Card.Title>
            </Card.Header>
            <Card.Content>
              <form onSubmit={executeBulkOperation} className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Select Action</label>
                  <select
                    value={operation}
                    onChange={(e) => setOperation(e.target.value)}
                    required
                    className="h-10 px-3 rounded-lg border border-border bg-card text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary transition-all select-none"
                  >
                    <option value="">Choose Operation</option>
                    <option value="present">Mark Present</option>
                    <option value="absent">Mark Absent</option>
                    <option value="whatsapp">Send Class Reminder</option>
                  </select>
                </div>

                {(operation === 'present' || operation === 'absent') && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase">Select Date</label>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      required
                      className="h-10 px-3 rounded-lg border border-border bg-card text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary transition-all select-none"
                    />
                  </div>
                )}

                <Button
                  type="submit"
                  variant="primary"
                  isLoading={isLoading}
                  disabled={selectedStudents.length === 0}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold"
                >
                  Run Command ({selectedStudents.length})
                </Button>
              </form>
            </Card.Content>
          </Card>
        </div>

        {/* Right Student Multi-Select List */}
        <div className="lg:col-span-2">
          <Card className="border border-border bg-card overflow-hidden">
            <Card.Header className="flex flex-row justify-between items-center">
              <div>
                <Card.Title>Select Targets ({selectedStudents.length})</Card.Title>
                <Card.Description>Select which students to apply the bulk action to.</Card.Description>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleSelectAll}
                className="text-xs border border-border h-8"
              >
                {selectedStudents.length === students.length ? 'Deselect All' : 'Select All'}
              </Button>
            </Card.Header>
            <Card.Content className="max-h-[400px] overflow-y-auto space-y-2 p-6 pt-0">
              {students.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No students found.</p>
              ) : (
                students.map((student) => (
                  <div
                    key={student.id}
                    onClick={() => handleSelectStudent(student.id)}
                    className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all duration-200 select-none ${
                      selectedStudents.includes(student.id)
                        ? 'border-indigo-500/40 bg-indigo-500/5'
                        : 'border-border/60 hover:bg-muted/40'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedStudents.includes(student.id)}
                        onChange={() => {}} // Handled by outer click
                        className="rounded border-border text-primary focus:ring-primary h-4 w-4 pointer-events-none"
                      />
                      <span className="text-sm font-semibold text-foreground">
                        {student.firstName} {student.lastName}
                      </span>
                    </div>
                    <Badge variant="secondary" className="capitalize text-[10px]">
                      {student.beltColor || 'White'} Belt
                    </Badge>
                  </div>
                ))
              )}
            </Card.Content>
          </Card>
        </div>
      </div>
    </div>
  );
}

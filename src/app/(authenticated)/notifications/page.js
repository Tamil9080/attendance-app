'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/app/providers';
import { API_BASE_URL } from '@/config';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import { Bell, Send, Trash2, HelpCircle } from 'lucide-react';

export default function NotificationsPage() {
  const { selectedInstitute, user } = useApp();

  const [students, setStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [messageType, setMessageType] = useState('reminder');
  const [customMessage, setCustomMessage] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [notifications, setNotifications] = useState([]);

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
    
    // Load saved notifications
    const saved = localStorage.getItem('notifications');
    if (saved) {
      setNotifications(JSON.parse(saved));
    }
  }, [selectedInstitute, user]);

  const messageTemplates = {
    reminder: "Hi {name}, this is a reminder about your class today. See you there! 🥋",
    absent: "Hi {name}, we missed you in today's class. Hope to see you next time! 🤗",
    achievement: "Congratulations {name}! Great progress in your training journey. Keep it up! 🏆",
    payment: "Hi {name}, this is a friendly reminder about your monthly fee payment. Thank you! 💳",
    custom: customMessage
  };

  const handleSelectStudent = (id) => {
    if (selectedStudents.includes(id)) {
      setSelectedStudents(prev => prev.filter(item => item !== id));
    } else {
      setSelectedStudents(prev => [...prev, id]);
    }
  };

  const handleSelectAll = () => {
    if (selectedStudents.length === students.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(students.map(s => s.id));
    }
  };

  const sendNotifications = () => {
    if (selectedStudents.length === 0) {
      alert('Please select at least one student.');
      return;
    }

    const template = messageTemplates[messageType];
    if (messageType === 'custom' && !customMessage.trim()) {
      alert('Please write a custom message.');
      return;
    }

    selectedStudents.forEach(studentId => {
      const student = students.find(s => s.id === studentId);
      if (student && student.phoneNumber) {
        const personalizedMessage = template.replace('{name}', student.firstName);
        let phone = student.phoneNumber.replace(/[^0-9]/g, '');
        if (phone.length === 10 && !phone.startsWith('91')) {
          phone = '91' + phone;
        }

        const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(personalizedMessage)}`;

        if (scheduledTime) {
          // Log scheduled notification
          const notification = {
            id: Date.now() + Math.random(),
            studentName: `${student.firstName} ${student.lastName}`,
            message: personalizedMessage,
            scheduledTime,
            status: 'scheduled',
            createdAt: new Date().toISOString()
          };
          
          setNotifications(prev => {
            const updated = [...prev, notification];
            localStorage.setItem('notifications', JSON.stringify(updated));
            return updated;
          });
        } else {
          // Open WhatsApp web link directly
          window.open(whatsappUrl, '_blank');
        }
      }
    });

    alert(scheduledTime ? 'Notifications scheduled!' : 'Notification triggers dispatched!');
    setSelectedStudents([]);
    setCustomMessage('');
    setScheduledTime('');
  };

  const deleteNotification = (id) => {
    setNotifications(prev => {
      const updated = prev.filter(n => n.id !== id);
      localStorage.setItem('notifications', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
          Notifications
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Send announcements, templates, or payments alerts via WhatsApp.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left config form */}
        <div className="space-y-6 lg:col-span-1">
          <Card className="border border-border bg-card">
            <Card.Header>
              <div className="flex items-center gap-2 text-indigo-500 mb-2">
                <Bell className="h-5 w-5" />
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Notification panel</span>
              </div>
              <Card.Title>Configure Notification</Card.Title>
            </Card.Header>
            <Card.Content className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Template</label>
                <select
                  value={messageType}
                  onChange={(e) => setMessageType(e.target.value)}
                  className="h-10 px-3 rounded-lg border border-border bg-card text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary transition-all select-none"
                >
                  <option value="reminder">Class Reminder</option>
                  <option value="absent">Missed You (Absent)</option>
                  <option value="achievement">Achievement Award</option>
                  <option value="payment">Fee Reminder</option>
                  <option value="custom">Custom Message</option>
                </select>
              </div>

              {messageType === 'custom' && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Custom Message</label>
                  <textarea
                    placeholder="Type custom note... use {name} for student name"
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    rows={4}
                    className="flex w-full rounded-lg border border-border bg-card px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200"
                  />
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Schedule for later (Optional)</label>
                <input
                  type="datetime-local"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="h-10 px-3 rounded-lg border border-border bg-card text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary transition-all select-none"
                />
              </div>

              <div className="pt-2">
                <Button
                  onClick={sendNotifications}
                  disabled={selectedStudents.length === 0}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex gap-2"
                >
                  <Send className="h-4 w-4" /> Send ({selectedStudents.length})
                </Button>
              </div>
            </Card.Content>
          </Card>
        </div>

        {/* Right student selectors & history */}
        <div className="lg:col-span-2 space-y-6">
          {/* Target List */}
          <Card className="border border-border bg-card overflow-hidden">
            <Card.Header className="flex flex-row justify-between items-center">
              <div>
                <Card.Title>Recipients ({selectedStudents.length})</Card.Title>
                <Card.Description>Select students to message.</Card.Description>
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
            <Card.Content className="max-h-[300px] overflow-y-auto space-y-2 p-6 pt-0">
              {students.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No students registered.</p>
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
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-foreground">
                          {student.firstName} {student.lastName}
                        </span>
                        <span className="text-[10px] text-muted-foreground">{student.phoneNumber || 'No phone'}</span>
                      </div>
                    </div>
                    <Badge variant="secondary" className="capitalize text-[10px]">
                      {student.beltColor || 'White'} Belt
                    </Badge>
                  </div>
                ))
              )}
            </Card.Content>
          </Card>

          {/* Scheduled history log list */}
          {notifications.length > 0 && (
            <Card className="border border-border bg-card">
              <Card.Header>
                <Card.Title>Scheduled Queue ({notifications.length})</Card.Title>
              </Card.Header>
              <Card.Content className="space-y-3">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className="flex items-start justify-between p-3 rounded-lg border border-border/80 bg-slate-900/5"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">{notif.studentName}</span>
                        <Badge variant="warning" className="text-[9px] py-0">Scheduled</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{notif.message}</p>
                      <p className="text-[10px] text-muted-foreground pt-1">
                        Time: {new Date(notif.scheduledTime).toLocaleString()}
                      </p>
                    </div>
                    <button
                      onClick={() => deleteNotification(notif.id)}
                      className="p-1.5 rounded-lg border border-border bg-card hover:bg-red-500/10 hover:text-red-500 text-muted-foreground transition-all"
                      title="Delete scheduled event"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </Card.Content>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

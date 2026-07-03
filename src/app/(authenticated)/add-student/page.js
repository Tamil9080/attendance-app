'use client';

import React, { useState } from 'react';
import { useApp } from '@/app/providers';
import { API_BASE_URL } from '@/config';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { UserPlus, CheckCircle2, AlertCircle } from 'lucide-react';

export default function AddStudentPage() {
  const { selectedInstitute, user } = useApp();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [gender, setGender] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [address, setAddress] = useState('');
  const [beltColor, setBeltColor] = useState('white');
  const [monthlyFees, setMonthlyFees] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: 'success' });

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => {
      setMessage({ text: '', type: 'success' });
    }, 4000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!firstName || !lastName) {
      showMessage('First and Last names are required.', 'error');
      return;
    }

    setIsLoading(true);

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
      userId: user.id,
      instituteType: selectedInstitute
    };

    try {
      const response = await fetch(`${API_BASE_URL}/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStudent)
      });

      if (response.ok) {
        showMessage('Student enrolled successfully!');
        setFirstName('');
        setLastName('');
        setPhoneNumber('');
        setGender('');
        setFatherName('');
        setAddress('');
        setBeltColor('white');
        setMonthlyFees('');
      } else {
        const data = await response.json();
        showMessage(data.error || 'Failed to add student.', 'error');
      }
    } catch (e) {
      console.error(e);
      showMessage('Error saving student. Please check server status.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
          Student Enrollment
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Add new members to your active workspace register.
        </p>
      </div>

      {/* Alert toast */}
      {message.text && (
        <div className={`p-4 rounded-lg flex items-center gap-2.5 shadow-md border ${
          message.type === 'error' 
            ? 'bg-red-500/10 border-red-500/20 text-red-400' 
            : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
        }`}>
          {message.type === 'error' ? <AlertCircle className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
          <span className="text-sm font-semibold">{message.text}</span>
        </div>
      )}

      {/* Add Form */}
      <Card className="border border-border bg-card">
        <Card.Header>
          <div className="flex items-center gap-2 text-indigo-500 mb-2">
            <UserPlus className="h-5 w-5" />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Roster Enrollment</span>
          </div>
          <Card.Title>Enrolled Details</Card.Title>
        </Card.Header>
        <Card.Content>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="First Name"
                id="firstName"
                placeholder="Enter first name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
              <Input
                label="Last Name"
                id="lastName"
                placeholder="Enter last name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Phone Number"
                id="phoneNumber"
                type="tel"
                placeholder="Enter 10-digit number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="h-10 px-3 rounded-lg border border-border bg-card text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary transition-all select-none"
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Belt Level</label>
                <select
                  value={beltColor}
                  onChange={(e) => setBeltColor(e.target.value)}
                  className="h-10 px-3 rounded-lg border border-border bg-card text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary transition-all select-none"
                >
                  <option value="white">White</option>
                  <option value="yellow">Yellow</option>
                  <option value="orange">Orange</option>
                  <option value="green">Green</option>
                  <option value="blue">Blue</option>
                  <option value="brown">Brown</option>
                  <option value="black">Black</option>
                </select>
              </div>
              <Input
                label="Monthly Fees (INR)"
                id="monthlyFees"
                type="number"
                placeholder="Leave blank for default"
                value={monthlyFees}
                onChange={(e) => setMonthlyFees(e.target.value)}
              />
            </div>

            <Input
              label="Father Name / Guardian"
              id="fatherName"
              placeholder="Enter guardian name"
              value={fatherName}
              onChange={(e) => setFatherName(e.target.value)}
            />

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Address</label>
              <textarea
                id="address"
                placeholder="Enter address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={3}
                className="flex w-full rounded-lg border border-border bg-card px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200"
              />
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                isLoading={isLoading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold"
              >
                Complete Enrollment
              </Button>
            </div>
          </form>
        </Card.Content>
      </Card>
    </div>
  );
}

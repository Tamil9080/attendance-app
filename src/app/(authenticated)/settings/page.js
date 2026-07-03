'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/app/providers';
import { API_BASE_URL } from '@/config';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { KeyRound, CreditCard, CheckCircle2, AlertCircle } from 'lucide-react';

export default function SettingsPage() {
  const { selectedInstitute, user } = useApp();

  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  
  const [defaultFee, setDefaultFee] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: 'success' });

  // Load current settings on mount or institute change
  useEffect(() => {
    if (!selectedInstitute) return;
    
    fetch(`${API_BASE_URL}/settings/defaultFee?instituteType=${selectedInstitute}`)
      .then(res => res.json())
      .then(data => setDefaultFee(data.value || ''))
      .catch(e => console.error('Could not load settings', e));
  }, [selectedInstitute]);

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => {
      setMessage({ text: '', type: 'success' });
    }, 4000);
  };

  const handleSetDefaultFee = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'defaultFee', value: defaultFee, instituteType: selectedInstitute })
      });
      
      if (response.ok) {
        showMessage('Default fee updated successfully!');
      } else {
        showMessage('Failed to update default fee.', 'error');
      }
    } catch (e) {
      showMessage('Error: Server connection failed.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePIN = async (e) => {
    e.preventDefault();
    if (!user) return;
    setIsLoading(true);

    try {
      // 1. Get current PIN from server
      const response = await fetch(`${API_BASE_URL}/pin?userId=${user.id}`);
      const data = await response.json();
      
      if (currentPin !== data.pin) {
        showMessage('Current PIN is incorrect.', 'error');
        setIsLoading(false);
        return;
      }
      
      if (newPin.length !== 4) {
        showMessage('New PIN must be exactly 4 digits.', 'error');
        setIsLoading(false);
        return;
      }
      
      if (newPin !== confirmPin) {
        showMessage('New PIN and confirmation do not match.', 'error');
        setIsLoading(false);
        return;
      }
      
      // 2. Update PIN on server
      const updateResponse = await fetch(`${API_BASE_URL}/pin`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: newPin, userId: user.id })
      });
      
      if (!updateResponse.ok) {
        throw new Error('Failed to update PIN');
      }
      
      showMessage('PIN changed successfully!');
      setCurrentPin('');
      setNewPin('');
      setConfirmPin('');
    } catch (e) {
      console.error(e);
      showMessage('Error changing PIN. Check server status.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
          Settings
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage system variables, workspace defaults, and credentials.
        </p>
      </div>

      {/* Alert toast info */}
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

      {/* Settings Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Workspace Fee Setting */}
        <Card className="border border-border bg-card">
          <Card.Header>
            <div className="flex items-center gap-2 text-indigo-500 mb-2">
              <CreditCard className="h-5 w-5" />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Workspace defaults</span>
            </div>
            <Card.Title>Fee Configuration</Card.Title>
            <Card.Description>
              Configure default monthly fee amounts applied to new entries in this database.
            </Card.Description>
          </Card.Header>
          <Card.Content>
            <form onSubmit={handleSetDefaultFee} className="space-y-4">
              <Input
                label="Default Monthly Fee (INR)"
                id="defaultFee"
                type="number"
                placeholder="e.g. 1500"
                value={defaultFee}
                onChange={(e) => setDefaultFee(e.target.value)}
                required
              />
              <Button
                type="submit"
                variant="primary"
                isLoading={isLoading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold"
              >
                Save Fee Configuration
              </Button>
            </form>
          </Card.Content>
        </Card>

        {/* Security / PIN update */}
        <Card className="border border-border bg-card">
          <Card.Header>
            <div className="flex items-center gap-2 text-indigo-500 mb-2">
              <KeyRound className="h-5 w-5" />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Security Settings</span>
            </div>
            <Card.Title>Change Quick-PIN</Card.Title>
            <Card.Description>
              Update the 4-digit security PIN used for quick sign-in.
            </Card.Description>
          </Card.Header>
          <Card.Content>
            <form onSubmit={handleChangePIN} className="space-y-4">
              <Input
                label="Current PIN"
                id="currentPin"
                type="password"
                placeholder="••••"
                value={currentPin}
                onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                maxLength={4}
                required
                className="tracking-widest"
              />
              <Input
                label="New PIN"
                id="newPin"
                type="password"
                placeholder="••••"
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                maxLength={4}
                required
                className="tracking-widest"
              />
              <Input
                label="Confirm New PIN"
                id="confirmPin"
                type="password"
                placeholder="••••"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                maxLength={4}
                required
                className="tracking-widest"
              />
              <Button
                type="submit"
                variant="primary"
                isLoading={isLoading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold"
              >
                Update Security PIN
              </Button>
            </form>
          </Card.Content>
        </Card>
      </div>
    </div>
  );
}

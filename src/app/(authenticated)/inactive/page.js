'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/app/providers';
import { API_BASE_URL } from '@/config';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { Trash2, RotateCcw, AlertCircle } from 'lucide-react';

export default function InactivePage() {
  const { selectedInstitute, user } = useApp();

  const [inactiveStudents, setInactiveStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch inactive students list
  useEffect(() => {
    if (!selectedInstitute || !user) return;

    setIsLoading(true);
    fetch(`${API_BASE_URL}/inactive-students?userId=${user.id}&instituteType=${selectedInstitute}`)
      .then(res => res.json())
      .then(data => {
        setInactiveStudents(data || []);
      })
      .catch(e => {
        console.error("Could not load inactive students", e);
        setError('Error loading archives.');
      })
      .finally(() => setIsLoading(false));
  }, [selectedInstitute, user]);

  const reactivateStudent = async (studentId, studentName) => {
    if (window.confirm(`Reactivate ${studentName}?`)) {
      try {
        const response = await fetch(`${API_BASE_URL}/reactivate/${studentId}`, {
          method: 'POST'
        });
        
        if (response.ok) {
          setInactiveStudents(prev => prev.filter(s => s.id !== studentId));
          alert('Student reactivated successfully!');
        } else {
          const errorData = await response.json();
          alert('Error: ' + (errorData.error || 'Unknown error'));
        }
      } catch (e) {
        console.error('Error reactivating student', e);
      }
    }
  };

  const removeStudent = async (studentId, studentName) => {
    if (window.confirm(`Permanently delete ${studentName}? This action cannot be undone.`)) {
      try {
        const response = await fetch(`${API_BASE_URL}/inactive-students/${studentId}`, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          setInactiveStudents(prev => prev.filter(s => s.id !== studentId));
          alert('Student permanently deleted.');
        } else {
          const errorData = await response.json();
          alert('Error: ' + (errorData.error || 'Unknown error'));
        }
      } catch (e) {
        console.error('Error deleting student', e);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
          Archived Roster
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Review inactive student entries. You can restore them to the active roster or delete them permanently.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-lg flex items-center gap-2.5 bg-red-500/10 border border-red-500/20 text-red-400 shadow-md">
          <AlertCircle className="h-5 w-5" />
          <span className="text-sm font-semibold">{error}</span>
        </div>
      )}

      {/* Roster Table */}
      <Card className="border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-slate-900/10 dark:bg-slate-900/50">
                <th className="p-4 text-sm font-semibold text-muted-foreground">Student Name</th>
                <th className="p-4 text-sm font-semibold text-muted-foreground">Phone Number</th>
                <th className="p-4 text-sm font-semibold text-muted-foreground">Gender</th>
                <th className="p-4 text-sm font-semibold text-muted-foreground">Belt</th>
                <th className="p-4 text-sm font-semibold text-muted-foreground">Archived Date</th>
                <th className="p-4 text-center text-sm font-semibold text-muted-foreground w-48">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center">
                    <div className="flex justify-center items-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                      <span className="text-sm text-muted-foreground">Loading archives...</span>
                    </div>
                  </td>
                </tr>
              ) : inactiveStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-sm text-muted-foreground">
                    No inactive students found.
                  </td>
                </tr>
              ) : (
                inactiveStudents.map(student => (
                  <tr key={student.id} className="border-b border-border/40 hover:bg-muted/40 transition-colors">
                    {/* Student Name */}
                    <td className="p-4 font-semibold text-sm text-foreground">
                      {student.firstName} {student.lastName}
                    </td>

                    {/* Phone */}
                    <td className="p-4 text-sm text-foreground">
                      {student.phoneNumber || 'N/A'}
                    </td>

                    {/* Gender */}
                    <td className="p-4 text-sm text-foreground">
                      {student.gender || 'N/A'}
                    </td>

                    {/* Belt */}
                    <td className="p-4 text-sm text-foreground capitalize">
                      {student.beltColor || 'White'}
                    </td>

                    {/* Archived Date */}
                    <td className="p-4 text-sm text-foreground">
                      {student.moved_date ? new Date(student.moved_date).toLocaleDateString() : 'N/A'}
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-center">
                      <div className="flex justify-center gap-2">
                        <Button
                          onClick={() => reactivateStudent(student.id, `${student.firstName} ${student.lastName}`)}
                          variant="success"
                          className="h-8 px-2.5 text-xs flex gap-1 items-center"
                        >
                          <RotateCcw className="h-3.5 w-3.5" /> Restore
                        </Button>
                        <Button
                          onClick={() => removeStudent(student.id, `${student.firstName} ${student.lastName}`)}
                          variant="danger"
                          className="h-8 px-2.5 text-xs flex gap-1 items-center"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

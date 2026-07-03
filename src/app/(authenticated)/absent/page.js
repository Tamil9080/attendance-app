'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/app/providers';
import { API_BASE_URL } from '@/config';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import { Search, Send, Trash2, Edit2, Check, X, Calendar } from 'lucide-react';

export default function AbsentPage() {
  const { selectedInstitute, user } = useApp();

  const [absentStudents, setAbsentStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [selectedStudents, setSelectedStudents] = useState([]);
  
  const [editingId, setEditingId] = useState(null);
  const [editReason, setEditReason] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Load absent students and full student info for belt info
  useEffect(() => {
    if (!selectedInstitute || !user) return;

    setIsLoading(true);
    Promise.all([
      fetch(`${API_BASE_URL}/absent-students?userId=${user.id}&instituteType=${selectedInstitute}`),
      fetch(`${API_BASE_URL}/students?userId=${user.id}&instituteType=${selectedInstitute}`)
    ])
    .then(([absentRes, studentsRes]) => Promise.all([absentRes.json(), studentsRes.json()]))
    .then(([absentData, studentsData]) => {
      const absentList = Array.isArray(absentData) ? absentData : [];
      const studentsList = Array.isArray(studentsData) ? studentsData : [];

      // Deduplicate absents (one per name and date)
      const countMap = {};
      absentList.forEach(student => {
        const key = `${student.student_name}_${student.absent_date}`;
        countMap[key] = (countMap[key] || 0) + 1;
      });

      const uniqueAbsents = absentList.filter(student => {
        const key = `${student.student_name}_${student.absent_date}`;
        return countMap[key] === 1;
      });

      // Enrich with belt color
      const enriched = uniqueAbsents.map(abs => {
        const st = studentsList.find(s => s.id === abs.student_id);
        return {
          ...abs,
          beltColor: st?.beltColor || 'white'
        };
      });

      setAbsentStudents(enriched);
      setFilteredStudents(enriched);
    })
    .catch(e => console.error("Error loading absent data", e))
    .finally(() => setIsLoading(false));
  }, [selectedInstitute, user]);

  // Apply filters
  useEffect(() => {
    let filtered = absentStudents;

    if (searchTerm) {
      filtered = filtered.filter(s =>
        s.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.phone_number && s.phone_number.includes(searchTerm))
      );
    }

    if (dateFilter) {
      filtered = filtered.filter(s => s.absent_date.includes(dateFilter));
    }

    // Sort by belt color order
    const beltOrder = ['black', 'brown', 'blue', 'green', 'orange', 'yellow', 'white'];
    filtered.sort((a, b) => {
      const aIndex = beltOrder.indexOf((a.beltColor || 'white').toLowerCase());
      const bIndex = beltOrder.indexOf((b.beltColor || 'white').toLowerCase());
      if (aIndex !== bIndex) return aIndex - bIndex;
      return a.student_name.localeCompare(b.student_name);
    });

    setFilteredStudents(filtered);
  }, [absentStudents, searchTerm, dateFilter]);

  const sendWhatsApp = (student) => {
    const message = `Hi ${student.student_name}, you were marked absent on ${student.absent_date}. Please let us know if everything is alright. Thanks!`;
    let phone = (student.phone_number || '').replace(/[^0-9]/g, '');
    if (phone.length === 10 && !phone.startsWith('91')) {
      phone = '91' + phone;
    }
    if (phone) {
      const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
      window.open(url, '_blank');
    }
  };

  const handleSelectAll = () => {
    if (selectedStudents.length === filteredStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(filteredStudents.map(s => s.id));
    }
  };

  const handleSelectStudent = (id) => {
    if (selectedStudents.includes(id)) {
      setSelectedStudents(prev => prev.filter(item => item !== id));
    } else {
      setSelectedStudents(prev => [...prev, id]);
    }
  };

  const handleBulkWhatsApp = () => {
    selectedStudents.forEach(id => {
      const st = absentStudents.find(s => s.id === id);
      if (st) sendWhatsApp(st);
    });
    setSelectedStudents([]);
  };

  const handleBulkDelete = async () => {
    if (window.confirm(`Delete ${selectedStudents.length} records from absent list?`)) {
      try {
        await Promise.all(selectedStudents.map(id =>
          fetch(`${API_BASE_URL}/absent-students/${id}`, {
            method: 'DELETE'
          })
        ));
        setAbsentStudents(prev => prev.filter(s => !selectedStudents.includes(s.id)));
        setSelectedStudents([]);
      } catch (e) {
        console.error('Error deleting absent records', e);
      }
    }
  };

  const saveReason = async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/absent-students/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: editReason })
      });

      if (response.ok) {
        setAbsentStudents(prev => prev.map(s => s.id === id ? { ...s, reason: editReason } : s));
        setEditingId(null);
        setEditReason('');
      }
    } catch (e) {
      console.error('Error saving reason', e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 border border-slate-800 p-6 rounded-xl">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Absent Log
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Review and follow up on absent student records for this workspace.
          </p>
        </div>
        {selectedStudents.length > 0 && (
          <div className="flex gap-2">
            <Button
              onClick={handleBulkWhatsApp}
              variant="success"
              className="text-xs h-9 font-semibold"
            >
              💬 Bulk WhatsApp
            </Button>
            <Button
              onClick={handleBulkDelete}
              variant="danger"
              className="text-xs h-9 font-semibold"
            >
              🗑️ Delete Selected ({selectedStudents.length})
            </Button>
          </div>
        )}
      </div>

      {/* Filter and search */}
      <Card className="border border-border bg-card p-5">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full relative">
            <Input
              label="Search Absences"
              id="search"
              placeholder="Search by student name or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
            <Search className="absolute right-3 bottom-3 h-4 w-4 text-muted-foreground pointer-events-none" />
          </div>

          <div className="w-full md:w-56 flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase">Filter by Date</label>
            <div className="relative">
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="h-10 w-full px-3 pr-10 rounded-lg border border-border bg-card text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary transition-all select-none"
              />
              <Calendar className="absolute right-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>
        </div>
      </Card>

      {/* Roster Table */}
      <Card className="border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-slate-900/10 dark:bg-slate-900/50">
                <th className="p-4 w-12 text-center">
                  <input
                    type="checkbox"
                    checked={filteredStudents.length > 0 && selectedStudents.length === filteredStudents.length}
                    onChange={handleSelectAll}
                    className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                  />
                </th>
                <th className="p-4 text-sm font-semibold text-muted-foreground">Student Name</th>
                <th className="p-4 text-sm font-semibold text-muted-foreground">Phone Number</th>
                <th className="p-4 text-sm font-semibold text-muted-foreground">Absent Date</th>
                <th className="p-4 text-sm font-semibold text-muted-foreground">Reason / Note</th>
                <th className="p-4 text-center text-sm font-semibold text-muted-foreground w-36">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center">
                    <div className="flex justify-center items-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                      <span className="text-sm text-muted-foreground">Loading absent logs...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-sm text-muted-foreground">
                    No absent logs found matching filters.
                  </td>
                </tr>
              ) : (
                filteredStudents.map(student => (
                  <tr key={student.id} className="border-b border-border/40 hover:bg-muted/40 transition-colors">
                    {/* Checkbox */}
                    <td className="p-4 text-center">
                      <input
                        type="checkbox"
                        checked={selectedStudents.includes(student.id)}
                        onChange={() => handleSelectStudent(student.id)}
                        className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                      />
                    </td>

                    {/* Student Name */}
                    <td className="p-4 font-semibold text-sm text-foreground">
                      <div className="flex flex-col">
                        <span>{student.student_name}</span>
                        <span className="text-[10px] text-muted-foreground capitalize font-normal">
                          Belt: {student.beltColor || 'White'}
                        </span>
                      </div>
                    </td>

                    {/* Phone */}
                    <td className="p-4 text-sm text-foreground">
                      {student.phone_number || 'N/A'}
                    </td>

                    {/* Date */}
                    <td className="p-4 text-sm text-foreground">
                      {new Date(student.absent_date).toLocaleDateString()}
                    </td>

                    {/* Reason / Note inline editing */}
                    <td className="p-4 text-sm">
                      {editingId === student.id ? (
                        <div className="flex gap-2 items-center">
                          <input
                            type="text"
                            value={editReason}
                            onChange={(e) => setEditReason(e.target.value)}
                            className="h-8 px-2 border border-border bg-card rounded text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary w-full"
                          />
                          <button
                            onClick={() => saveReason(student.id)}
                            className="p-1 rounded bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"
                            title="Save"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingId(null);
                              setEditReason('');
                            }}
                            className="p-1 rounded bg-rose-500/10 text-rose-500 hover:bg-rose-500/20"
                            title="Cancel"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex justify-between group items-center max-w-xs">
                          <span className="text-muted-foreground truncate">
                            {student.reason || 'No note added'}
                          </span>
                          <button
                            onClick={() => {
                              setEditingId(student.id);
                              setEditReason(student.reason || '');
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-foreground transition-opacity"
                            title="Edit Note"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-center">
                      <div className="flex justify-center gap-2">
                        <Button
                          onClick={() => sendWhatsApp(student)}
                          variant="secondary"
                          className="h-8 px-2 border border-border text-xs flex gap-1 items-center"
                        >
                          <Send className="h-3 w-3 text-emerald-500" /> WhatsApp
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

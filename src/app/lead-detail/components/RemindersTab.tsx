'use client';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Bell, CheckCircle2, Plus, X, Clock, Calendar } from 'lucide-react';
import type { Lead, Reminder } from '@/data/mockData';

interface FormData {
  dueDate: string;
  dueTime: string;
  note: string;
}

interface Props {
  lead: Lead;
  onAddReminder: (reminder: Reminder) => void;
  onCompleteReminder: (remId: string) => void;
}

export default function RemindersTab({ lead, onAddReminder, onCompleteReminder }: Props) {
  const [showForm, setShowForm] = useState(false);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    defaultValues: { dueDate: '', dueTime: '09:00', note: '' },
  });

  function onSubmit(data: FormData) {
    const newReminder: Reminder = {
      id: `rem-new-${Date.now()}`,
      leadId: lead.id,
      dueDate: data.dueDate,
      dueTime: data.dueTime,
      note: data.note,
      isCompleted: false,
      createdAt: new Date().toISOString(),
    };
    onAddReminder(newReminder);
    reset();
    setShowForm(false);
  }

  const active = lead.reminders.filter((r) => !r.isCompleted);
  const completed = lead.reminders.filter((r) => r.isCompleted);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-600 text-foreground">Reminders</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 text-sm font-500 bg-primary text-white px-3 py-2 rounded-lg hover:bg-primary/90 active:scale-95 transition-all"
        >
          {showForm ? <X size={14} /> : <Plus size={14} />}
          {showForm ? 'Cancel' : 'Set Reminder'}
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <form onSubmit={handleSubmit(onSubmit)} className="bg-muted/30 border border-border rounded-xl p-4 mb-5 animate-slide-up">
          <h4 className="text-sm font-600 text-foreground mb-3">New Reminder</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs font-500 text-foreground mb-1">
                Due Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                {...register('dueDate', { required: 'Due date is required' })}
                className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
              {errors.dueDate && <p className="text-xs text-red-600 mt-1">{errors.dueDate.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-500 text-foreground mb-1">Time</label>
              <input
                type="time"
                {...register('dueTime')}
                className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
          </div>
          <div className="mb-3">
            <label className="block text-xs font-500 text-foreground mb-1">
              Reminder Note <span className="text-red-500">*</span>
            </label>
            <input
              {...register('note', { required: 'Reminder note is required' })}
              placeholder="What do you need to do? e.g. Follow up on Maldives quote"
              className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
            {errors.note && <p className="text-xs text-red-600 mt-1">{errors.note.message}</p>}
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="px-3 py-2 text-sm font-500 text-muted-foreground border border-border rounded-lg hover:bg-muted transition-all active:scale-95">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm font-500 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-all active:scale-95 flex items-center gap-2">
              {isSubmitting && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              Set Reminder
            </button>
          </div>
        </form>
      )}

      {/* Active reminders */}
      {active.length === 0 && completed.length === 0 ? (
        <div className="text-center py-12">
          <Bell size={32} className="text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm font-500 text-muted-foreground">No reminders set</p>
          <p className="text-xs text-muted-foreground mt-1">Set a reminder to get notified when a follow-up is due</p>
        </div>
      ) : (
        <div className="space-y-5">
          {active.length > 0 && (
            <div>
              <p className="text-xs font-600 uppercase tracking-wider text-muted-foreground mb-2">Active</p>
              <ul className="space-y-2">
                {active.map((rem) => {
                  const isToday = rem.dueDate === '2026-04-25';
                  const isPast = new Date(rem.dueDate) < new Date('2026-04-25');
                  return (
                    <li
                      key={`rem-active-${rem.id}`}
                      className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all ${
                        isPast
                          ? 'bg-red-50 border-red-200'
                          : isToday
                          ? 'bg-amber-50 border-amber-200' :'bg-white border-border'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        isPast ? 'bg-red-100' : isToday ? 'bg-amber-100' : 'bg-primary/10'
                      }`}>
                        <Bell size={14} className={isPast ? 'text-red-600' : isToday ? 'text-amber-600' : 'text-primary'} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-500 text-foreground">{rem.note}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className={`flex items-center gap-1 text-xs font-tabular ${
                            isPast ? 'text-red-600' : isToday ? 'text-amber-700' : 'text-muted-foreground'
                          }`}>
                            <Calendar size={11} />
                            {new Date(rem.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-muted-foreground font-tabular">
                            <Clock size={11} />
                            {rem.dueTime}
                          </span>
                          {isPast && <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full font-500">Overdue</span>}
                          {isToday && !isPast && <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-500">Due Today</span>}
                        </div>
                      </div>
                      <button
                        onClick={() => onCompleteReminder(rem.id)}
                        title="Mark as done"
                        className="p-1.5 rounded-lg text-muted-foreground hover:bg-green-50 hover:text-green-600 transition-colors flex-shrink-0"
                      >
                        <CheckCircle2 size={16} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {completed.length > 0 && (
            <div>
              <p className="text-xs font-600 uppercase tracking-wider text-muted-foreground mb-2">Completed</p>
              <ul className="space-y-2">
                {completed.map((rem) => (
                  <li key={`rem-done-${rem.id}`} className="flex items-start gap-3 p-3.5 rounded-xl border border-border bg-muted/20 opacity-60">
                    <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 size={14} className="text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-500 text-foreground line-through">{rem.note}</p>
                      <span className="text-xs text-muted-foreground font-tabular">
                        {new Date(rem.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · {rem.dueTime}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
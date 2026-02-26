import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Clock, Save, X, ChevronDown, ChevronUp, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  useGetWorkoutSchedules,
  useCreateOrUpdateWorkoutSchedule,
  useDeleteWorkoutSchedule,
} from '../hooks/useQueries';
import { WorkoutSchedule, DayOfWeek } from '../backend';
import AuthGuard from '../components/AuthGuard';

const DAYS: { key: DayOfWeek; label: string }[] = [
  { key: DayOfWeek.monday, label: 'Monday' },
  { key: DayOfWeek.tuesday, label: 'Tuesday' },
  { key: DayOfWeek.wednesday, label: 'Wednesday' },
  { key: DayOfWeek.thursday, label: 'Thursday' },
  { key: DayOfWeek.friday, label: 'Friday' },
  { key: DayOfWeek.saturday, label: 'Saturday' },
  { key: DayOfWeek.sunday, label: 'Sunday' },
];

interface SetRowDraft {
  id: bigint;
  description: string;
  completed: boolean;
}

interface EditForm {
  workoutName: string;
  workoutDetails: string;
  timeReminder: string;
  setRows: SetRowDraft[];
}

function generateId(day: DayOfWeek): string {
  return `${day}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function ScheduleContent() {
  const { data: schedules = [], isLoading } = useGetWorkoutSchedules();
  const createOrUpdate = useCreateOrUpdateWorkoutSchedule();
  const deleteSchedule = useDeleteWorkoutSchedule();

  const [editingDay, setEditingDay] = useState<DayOfWeek | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({
    workoutName: '',
    workoutDetails: '',
    timeReminder: '',
    setRows: [],
  });
  const [expandedDays, setExpandedDays] = useState<Set<DayOfWeek>>(new Set());
  const [saveError, setSaveError] = useState<string | null>(null);

  const getScheduleForDay = (day: DayOfWeek): WorkoutSchedule | undefined =>
    schedules.find((s) => s.dayOfWeek === day);

  const toggleExpand = (day: DayOfWeek) => {
    setExpandedDays((prev) => {
      const next = new Set(prev);
      if (next.has(day)) next.delete(day);
      else next.add(day);
      return next;
    });
  };

  const startEdit = (day: DayOfWeek) => {
    const existing = getScheduleForDay(day);
    setSaveError(null);
    if (existing) {
      setEditingId(
        // derive the stable id from the schedule list index as a fallback
        schedules.findIndex((s) => s.dayOfWeek === day) >= 0
          ? `${day}-entry`
          : generateId(day)
      );
      setEditForm({
        workoutName: existing.workoutName,
        workoutDetails: existing.workoutDetails,
        timeReminder: existing.timeReminder ?? '',
        setRows: existing.setRows.map((r) => ({
          id: typeof r.id === 'bigint' ? r.id : BigInt(r.id as unknown as number),
          description: r.description,
          completed: r.completed,
        })),
      });
    } else {
      setEditingId(generateId(day));
      setEditForm({ workoutName: '', workoutDetails: '', timeReminder: '', setRows: [] });
    }
    setEditingDay(day);
    setExpandedDays((prev) => new Set(prev).add(day));
  };

  const cancelEdit = () => {
    setEditingDay(null);
    setEditingId(null);
    setSaveError(null);
  };

  const addSetRow = () => {
    setEditForm((prev) => ({
      ...prev,
      setRows: [
        ...prev.setRows,
        { id: BigInt(prev.setRows.length), description: '', completed: false },
      ],
    }));
  };

  const updateSetRow = (index: number, description: string) => {
    setEditForm((prev) => {
      const rows = [...prev.setRows];
      rows[index] = { ...rows[index], description };
      return { ...prev, setRows: rows };
    });
  };

  const removeSetRow = (index: number) => {
    setEditForm((prev) => ({
      ...prev,
      setRows: prev.setRows.filter((_, i) => i !== index),
    }));
  };

  const handleSave = async () => {
    if (!editingDay || !editingId) return;
    setSaveError(null);

    // Determine a stable ID: reuse existing entry's key if one exists
    const existingIndex = schedules.findIndex((s) => s.dayOfWeek === editingDay);
    const stableId = existingIndex >= 0 ? `${editingDay}-entry` : editingId;

    // Re-index setRows so ids are sequential bigints
    const normalizedSetRows = editForm.setRows.map((row, idx) => ({
      id: BigInt(idx),
      description: row.description,
      completed: row.completed,
    }));

    const schedule: WorkoutSchedule = {
      dayOfWeek: editingDay,
      workoutName: editForm.workoutName,
      workoutDetails: editForm.workoutDetails,
      timeReminder: editForm.timeReminder || undefined,
      completed: getScheduleForDay(editingDay)?.completed ?? false,
      setRows: normalizedSetRows,
      // owner is overwritten by the backend with caller's principal
      // We must pass a structurally valid Principal — use anonymous()
      owner: { _isPrincipal: true, toText: () => '2vxsx-fae', toUint8Array: () => new Uint8Array([4]) } as any,
    };

    try {
      await createOrUpdate.mutateAsync({ id: stableId, schedule });
      setEditingDay(null);
      setEditingId(null);
    } catch (err: any) {
      console.error('Save failed:', err);
      setSaveError(err?.message ?? 'Failed to save workout. Please try again.');
    }
  };

  const handleDelete = async (day: DayOfWeek) => {
    const stableId = `${day}-entry`;
    try {
      await deleteSchedule.mutateAsync(stableId);
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold font-display text-foreground">Weekly Schedule</h1>
        <p className="text-muted-foreground mt-1">Plan your workouts for each day of the week.</p>
      </div>

      {DAYS.map(({ key, label }) => {
        const entry = getScheduleForDay(key);
        const isEditing = editingDay === key;
        const isExpanded = expandedDays.has(key);
        const isSaving = createOrUpdate.isPending && editingDay === key;

        return (
          <Card key={key} className="border border-border bg-card">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleExpand(key)}
                    className="flex items-center gap-2 text-left"
                  >
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    )}
                    <CardTitle className="text-base font-semibold">{label}</CardTitle>
                  </button>
                  {entry && (
                    <Badge
                      variant={entry.completed ? 'default' : 'outline'}
                      className="text-xs"
                    >
                      {entry.completed ? '✓ Done' : entry.workoutName}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {!isEditing && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => startEdit(key)}
                      className="h-8 px-2"
                    >
                      {entry ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    </Button>
                  )}
                  {entry && !isEditing && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(key)}
                      className="h-8 px-2 text-destructive hover:text-destructive"
                      disabled={deleteSchedule.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>

            {(isExpanded || isEditing) && (
              <CardContent className="pt-0 space-y-3">
                {isEditing ? (
                  <div className="space-y-3">
                    {/* Error message */}
                    {saveError && (
                      <div className="flex items-start gap-2 p-3 rounded-md bg-destructive/10 border border-destructive/30 text-destructive text-sm">
                        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                        <span>{saveError}</span>
                      </div>
                    )}

                    <div>
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1 block">
                        Workout Name
                      </label>
                      <Input
                        placeholder="e.g. Upper Body Strength"
                        value={editForm.workoutName}
                        onChange={(e) =>
                          setEditForm((prev) => ({ ...prev, workoutName: e.target.value }))
                        }
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1 block">
                        Notes / Details
                      </label>
                      <Input
                        placeholder="Optional notes about this workout"
                        value={editForm.workoutDetails}
                        onChange={(e) =>
                          setEditForm((prev) => ({ ...prev, workoutDetails: e.target.value }))
                        }
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1 block">
                        <Clock className="w-3 h-3 inline mr-1" />
                        Reminder Time (optional)
                      </label>
                      <Input
                        type="time"
                        value={editForm.timeReminder}
                        onChange={(e) =>
                          setEditForm((prev) => ({ ...prev, timeReminder: e.target.value }))
                        }
                      />
                    </div>

                    {/* Set Rows */}
                    <div>
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 block">
                        Sets / Exercises
                      </label>
                      <div className="space-y-2">
                        {editForm.setRows.map((row, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground w-5 text-right shrink-0">
                              {idx + 1}.
                            </span>
                            <Input
                              placeholder={`Set ${idx + 1} description`}
                              value={row.description}
                              onChange={(e) => updateSetRow(idx, e.target.value)}
                              className="flex-1"
                            />
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => removeSetRow(idx)}
                              className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={addSetRow}
                        className="mt-2 h-8 text-xs"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Add Set
                      </Button>
                    </div>

                    <div className="flex gap-2 pt-1">
                      <Button
                        size="sm"
                        onClick={handleSave}
                        disabled={isSaving || !editForm.workoutName.trim()}
                        className="flex-1"
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                            Saving…
                          </>
                        ) : (
                          <>
                            <Save className="w-3 h-3 mr-1" />
                            Save
                          </>
                        )}
                      </Button>
                      <Button size="sm" variant="outline" onClick={cancelEdit} disabled={isSaving}>
                        <X className="w-3 h-3 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : entry ? (
                  <div className="space-y-2 text-sm">
                    {entry.timeReminder && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>{entry.timeReminder}</span>
                      </div>
                    )}
                    {entry.setRows && entry.setRows.length > 0 ? (
                      <ul className="space-y-1">
                        {entry.setRows.map((row, idx) => (
                          <li key={idx} className="flex items-center gap-2 text-muted-foreground">
                            <span className="w-4 text-right text-xs">{idx + 1}.</span>
                            <span className={row.completed ? 'line-through opacity-60' : ''}>
                              {row.description}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : entry.workoutDetails ? (
                      <p className="text-muted-foreground">{entry.workoutDetails}</p>
                    ) : null}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No workout scheduled.</p>
                )}
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}

export default function Schedule() {
  return (
    <AuthGuard>
      <ScheduleContent />
    </AuthGuard>
  );
}

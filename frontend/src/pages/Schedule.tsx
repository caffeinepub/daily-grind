import { useState } from 'react';
import { useGetWorkoutSchedules, useCreateOrUpdateWorkoutSchedule, useDeleteWorkoutSchedule } from '../hooks/useQueries';
import { DayOfWeek, WorkoutSchedule } from '../backend';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, Edit2, Clock, CheckCircle2, X, GripVertical } from 'lucide-react';

const DAYS: { key: DayOfWeek; label: string; short: string }[] = [
  { key: DayOfWeek.monday, label: 'Monday', short: 'Mon' },
  { key: DayOfWeek.tuesday, label: 'Tuesday', short: 'Tue' },
  { key: DayOfWeek.wednesday, label: 'Wednesday', short: 'Wed' },
  { key: DayOfWeek.thursday, label: 'Thursday', short: 'Thu' },
  { key: DayOfWeek.friday, label: 'Friday', short: 'Fri' },
  { key: DayOfWeek.saturday, label: 'Saturday', short: 'Sat' },
  { key: DayOfWeek.sunday, label: 'Sunday', short: 'Sun' },
];

const TODAY_DAY = (() => {
  const d = new Date().getDay();
  const map: Record<number, DayOfWeek> = {
    0: DayOfWeek.sunday,
    1: DayOfWeek.monday,
    2: DayOfWeek.tuesday,
    3: DayOfWeek.wednesday,
    4: DayOfWeek.thursday,
    5: DayOfWeek.friday,
    6: DayOfWeek.saturday,
  };
  return map[d];
})();

interface LocalSetRow {
  localId: string;
  description: string;
  completed: boolean;
}

interface EditFormState {
  workoutName: string;
  timeReminder: string;
  setRows: LocalSetRow[];
}

function generateLocalId() {
  return Math.random().toString(36).slice(2);
}

function workoutToEditForm(entry: WorkoutSchedule | null): EditFormState {
  if (!entry) {
    return { workoutName: '', timeReminder: '', setRows: [{ localId: generateLocalId(), description: '', completed: false }] };
  }

  // If there are structured set rows, use them
  if (entry.setRows && entry.setRows.length > 0) {
    return {
      workoutName: entry.workoutName,
      timeReminder: entry.timeReminder ?? '',
      setRows: entry.setRows.map((r) => ({
        localId: generateLocalId(),
        description: r.description,
        completed: r.completed,
      })),
    };
  }

  // Backward compat: plain workoutDetails → single row
  return {
    workoutName: entry.workoutName,
    timeReminder: entry.timeReminder ?? '',
    setRows: entry.workoutDetails
      ? [{ localId: generateLocalId(), description: entry.workoutDetails, completed: false }]
      : [{ localId: generateLocalId(), description: '', completed: false }],
  };
}

export default function Schedule() {
  const { data: schedules = [], isLoading } = useGetWorkoutSchedules();
  const createOrUpdate = useCreateOrUpdateWorkoutSchedule();
  const deleteSchedule = useDeleteWorkoutSchedule();

  const [editingDay, setEditingDay] = useState<DayOfWeek | null>(null);
  const [editForm, setEditForm] = useState<EditFormState>({ workoutName: '', timeReminder: '', setRows: [] });

  const getEntryForDay = (day: DayOfWeek) =>
    schedules.find((s) => s.dayOfWeek === day) ?? null;

  const getEntryIdForDay = (day: DayOfWeek): string =>
    `${day}-${schedules.find((s) => s.dayOfWeek === day)?.workoutName ?? 'new'}`;

  const startEdit = (day: DayOfWeek) => {
    const entry = getEntryForDay(day);
    setEditForm(workoutToEditForm(entry));
    setEditingDay(day);
  };

  const cancelEdit = () => {
    setEditingDay(null);
  };

  // Set row helpers
  const addSetRow = () => {
    setEditForm((prev) => ({
      ...prev,
      setRows: [...prev.setRows, { localId: generateLocalId(), description: '', completed: false }],
    }));
  };

  const removeSetRow = (localId: string) => {
    setEditForm((prev) => ({
      ...prev,
      setRows: prev.setRows.filter((r) => r.localId !== localId),
    }));
  };

  const updateSetRowDescription = (localId: string, description: string) => {
    setEditForm((prev) => ({
      ...prev,
      setRows: prev.setRows.map((r) => (r.localId === localId ? { ...r, description } : r)),
    }));
  };

  const handleSave = async (day: DayOfWeek) => {
    const existing = getEntryForDay(day);
    const id = existing
      ? schedules.findIndex((s) => s.dayOfWeek === day).toString() + '-' + day
      : `${day}-${Date.now()}`;

    // Build the actual id key consistently
    const entryId = existing
      ? Object.keys(schedules).find((_, i) => schedules[i].dayOfWeek === day) ?? `${day}-${Date.now()}`
      : `${day}-${Date.now()}`;

    const filteredRows = editForm.setRows.filter((r) => r.description.trim() !== '');

    const schedule: WorkoutSchedule = {
      dayOfWeek: day,
      workoutName: editForm.workoutName,
      workoutDetails: filteredRows.map((r) => r.description).join('\n'),
      timeReminder: editForm.timeReminder || undefined,
      completed: existing?.completed ?? false,
      setRows: filteredRows.map((r, idx) => ({
        id: BigInt(idx),
        description: r.description,
        completed: r.completed,
      })),
      owner: existing?.owner ?? ({} as any),
    };

    // Use a stable ID: day-based so updates overwrite the same key
    const stableId = `schedule-${day}`;

    await createOrUpdate.mutateAsync({ id: stableId, schedule });
    setEditingDay(null);
  };

  const handleDelete = async (day: DayOfWeek) => {
    const stableId = `schedule-${day}`;
    await deleteSchedule.mutateAsync(stableId);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">
      <div className="mb-6">
        <h1 className="text-3xl font-display font-bold text-foreground tracking-tight">Weekly Schedule</h1>
        <p className="text-muted-foreground mt-1">Plan your workouts for each day of the week.</p>
      </div>

      {DAYS.map(({ key, label }) => {
        const entry = getEntryForDay(key);
        const isToday = key === TODAY_DAY;
        const isEditing = editingDay === key;

        return (
          <Card
            key={key}
            className={`border transition-all ${
              isToday ? 'border-primary/60 shadow-glow' : 'border-border'
            } bg-card`}
          >
            <CardHeader className="pb-2 pt-4 px-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base font-display font-semibold text-foreground">
                    {label}
                  </CardTitle>
                  {isToday && (
                    <Badge variant="default" className="text-xs bg-primary text-primary-foreground">
                      Today
                    </Badge>
                  )}
                  {entry?.completed && (
                    <Badge variant="secondary" className="text-xs gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Done
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {!isEditing && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => startEdit(key)}
                      >
                        {entry ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                      </Button>
                      {entry && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDelete(key)}
                          disabled={deleteSchedule.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </>
                  )}
                  {isEditing && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      onClick={cancelEdit}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="px-4 pb-4">
              {!isEditing && entry && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">{entry.workoutName}</p>
                  {entry.timeReminder && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {entry.timeReminder}
                    </div>
                  )}
                  {/* Show set rows or fallback to workoutDetails */}
                  {entry.setRows && entry.setRows.length > 0 ? (
                    <ul className="space-y-1 mt-2">
                      {entry.setRows.map((row, idx) => (
                        <li key={String(row.id)} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span className="text-xs text-primary font-mono w-5 shrink-0">{idx + 1}.</span>
                          <span className={row.completed ? 'line-through opacity-50' : ''}>{row.description}</span>
                        </li>
                      ))}
                    </ul>
                  ) : entry.workoutDetails ? (
                    <p className="text-sm text-muted-foreground">{entry.workoutDetails}</p>
                  ) : null}
                </div>
              )}

              {!isEditing && !entry && (
                <p className="text-sm text-muted-foreground italic">No workout scheduled. Click + to add one.</p>
              )}

              {isEditing && (
                <div className="space-y-4 mt-2">
                  {/* Workout name */}
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Workout Name
                    </label>
                    <Input
                      placeholder="e.g. Upper Body Strength"
                      value={editForm.workoutName}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, workoutName: e.target.value }))}
                      className="bg-background border-border"
                    />
                  </div>

                  {/* Time reminder */}
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Time Reminder (optional)
                    </label>
                    <Input
                      placeholder="e.g. 7:00 AM"
                      value={editForm.timeReminder}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, timeReminder: e.target.value }))}
                      className="bg-background border-border"
                    />
                  </div>

                  {/* Set rows */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Sets / Exercises
                    </label>

                    <div className="space-y-2">
                      {editForm.setRows.map((row, idx) => (
                        <div key={row.localId} className="flex items-center gap-2">
                          <div className="flex items-center gap-1 shrink-0">
                            <GripVertical className="w-4 h-4 text-muted-foreground/40" />
                            <span className="text-xs text-primary font-mono w-5 text-right">{idx + 1}.</span>
                          </div>
                          <Input
                            placeholder={`Set ${idx + 1} — e.g. 3×10 Bench Press`}
                            value={row.description}
                            onChange={(e) => updateSetRowDescription(row.localId, e.target.value)}
                            className="bg-background border-border flex-1"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                            onClick={() => removeSetRow(row.localId)}
                            disabled={editForm.setRows.length === 1}
                            title="Remove set"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full border-dashed border-border text-muted-foreground hover:text-foreground hover:border-primary/50 mt-1"
                      onClick={addSetRow}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Set
                    </Button>
                  </div>

                  {/* Save / Cancel */}
                  <div className="flex gap-2 pt-1">
                    <Button
                      className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                      onClick={() => handleSave(key)}
                      disabled={createOrUpdate.isPending || !editForm.workoutName.trim()}
                    >
                      {createOrUpdate.isPending ? (
                        <span className="flex items-center gap-2">
                          <span className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground border-t-transparent" />
                          Saving…
                        </span>
                      ) : (
                        'Save'
                      )}
                    </Button>
                    <Button variant="outline" onClick={cancelEdit} className="border-border">
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

import React, { useState } from 'react';
import { Edit2, Trash2, Clock, Save, X, ChevronDown, ChevronUp, Loader2, AlertCircle } from 'lucide-react';
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

interface EditForm {
  workoutName: string;
  workoutDetails: string;
  timeReminder: string;
}

// Always use a stable, predictable ID for each day so TodaysWorkout can find it
function getStableId(day: DayOfWeek): string {
  return `${day}-entry`;
}

function ScheduleContent() {
  const { data: schedules = [], isLoading } = useGetWorkoutSchedules();
  const createOrUpdate = useCreateOrUpdateWorkoutSchedule();
  const deleteSchedule = useDeleteWorkoutSchedule();

  const [editingDay, setEditingDay] = useState<DayOfWeek | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({
    workoutName: '',
    workoutDetails: '',
    timeReminder: '',
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
      setEditForm({
        workoutName: existing.workoutName,
        workoutDetails: existing.workoutDetails,
        timeReminder: existing.timeReminder ?? '',
      });
    } else {
      setEditForm({ workoutName: '', workoutDetails: '', timeReminder: '' });
    }
    setEditingDay(day);
    setExpandedDays((prev) => new Set(prev).add(day));
  };

  const cancelEdit = () => {
    setEditingDay(null);
    setSaveError(null);
  };

  const handleSave = async () => {
    if (!editingDay) return;
    setSaveError(null);

    // Always use the stable ID format so TodaysWorkout can locate the entry
    const stableId = getStableId(editingDay);

    const schedule: WorkoutSchedule = {
      dayOfWeek: editingDay,
      workoutName: editForm.workoutName,
      workoutDetails: editForm.workoutDetails,
      timeReminder: editForm.timeReminder || undefined,
      completed: getScheduleForDay(editingDay)?.completed ?? false,
      // owner is overwritten by the backend with caller's principal
      owner: { _isPrincipal: true, toText: () => '2vxsx-fae', toUint8Array: () => new Uint8Array([4]) } as any,
    };

    try {
      await createOrUpdate.mutateAsync({ id: stableId, schedule });
      setEditingDay(null);
    } catch (err: any) {
      console.error('Save failed:', err);
      setSaveError(err?.message ?? 'Failed to save workout. Please try again.');
    }
  };

  const handleDelete = async (day: DayOfWeek) => {
    const stableId = getStableId(day);
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
        const isExpanded = expandedDays.has(key) || isEditing;

        return (
          <Card
            key={key}
            className={`border transition-all ${
              entry?.completed
                ? 'border-success/40 bg-success/5'
                : entry
                  ? 'border-primary/30 bg-card'
                  : 'border-border/40 bg-card/60'
            }`}
          >
            {/* Day Header Row */}
            <CardHeader
              className="py-3 px-4 cursor-pointer select-none"
              onClick={() => !isEditing && toggleExpand(key)}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      entry?.completed ? 'bg-success' : entry ? 'bg-primary' : 'bg-muted-foreground/30'
                    }`}
                  />
                  <CardTitle className="text-base font-bold text-foreground">{label}</CardTitle>
                  {entry && (
                    <span className="text-sm text-muted-foreground truncate hidden sm:block">
                      {entry.workoutName}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {entry?.completed && (
                    <Badge className="bg-success/20 text-success border-success/30 text-xs hidden sm:flex">
                      Done
                    </Badge>
                  )}
                  {entry && !isEditing && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          startEdit(key);
                        }}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(key);
                        }}
                        disabled={deleteSchedule.isPending}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </>
                  )}
                  {!entry && !isEditing && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-primary hover:text-primary hover:bg-primary/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        startEdit(key);
                      }}
                    >
                      + Add
                    </Button>
                  )}
                  {!isEditing && (
                    <span className="text-muted-foreground">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </span>
                  )}
                </div>
              </div>
            </CardHeader>

            {/* Expanded Content */}
            {isExpanded && (
              <CardContent className="px-4 pb-4 pt-0 space-y-3">
                {isEditing ? (
                  /* Edit Form */
                  <div className="space-y-3">
                    {saveError && (
                      <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-xs">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{saveError}</span>
                      </div>
                    )}

                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">
                        Workout Name *
                      </label>
                      <Input
                        placeholder="e.g. Upper Body Strength"
                        value={editForm.workoutName}
                        onChange={(e) => setEditForm((f) => ({ ...f, workoutName: e.target.value }))}
                        className="bg-background border-border/60"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">
                        Details
                      </label>
                      <Input
                        placeholder="e.g. Bench press, rows, shoulder press…"
                        value={editForm.workoutDetails}
                        onChange={(e) => setEditForm((f) => ({ ...f, workoutDetails: e.target.value }))}
                        className="bg-background border-border/60"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">
                        <Clock className="w-3 h-3 inline mr-1" />
                        Time Reminder (optional)
                      </label>
                      <Input
                        placeholder="e.g. 7:00 AM"
                        value={editForm.timeReminder}
                        onChange={(e) => setEditForm((f) => ({ ...f, timeReminder: e.target.value }))}
                        className="bg-background border-border/60"
                      />
                    </div>

                    <div className="flex gap-2 pt-1">
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={handleSave}
                        disabled={createOrUpdate.isPending || !editForm.workoutName.trim()}
                      >
                        {createOrUpdate.isPending ? (
                          <span className="flex items-center gap-1.5">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Saving…
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5">
                            <Save className="w-3.5 h-3.5" />
                            Save
                          </span>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={cancelEdit}
                        disabled={createOrUpdate.isPending}
                      >
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ) : entry ? (
                  /* View Mode */
                  <div className="space-y-2">
                    {entry.workoutDetails && (
                      <p className="text-sm text-muted-foreground">{entry.workoutDetails}</p>
                    )}
                    {entry.timeReminder && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {entry.timeReminder}
                      </div>
                    )}
                  </div>
                ) : null}
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

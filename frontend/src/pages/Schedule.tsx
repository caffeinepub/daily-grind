import { useState, useMemo } from 'react';
import { Edit2, Plus, Trash2, Check, X, Loader2, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useGetWorkoutSchedules,
  useCreateOrUpdateWorkoutSchedule,
  useDeleteWorkoutSchedule,
} from '../hooks/useQueries';
import { DayOfWeek, WorkoutScheduleEntry } from '../backend';
import { useInternetIdentity } from '../hooks/useInternetIdentity';

const DAYS_ORDER: { label: string; value: DayOfWeek }[] = [
  { label: 'Monday', value: DayOfWeek.monday },
  { label: 'Tuesday', value: DayOfWeek.tuesday },
  { label: 'Wednesday', value: DayOfWeek.wednesday },
  { label: 'Thursday', value: DayOfWeek.thursday },
  { label: 'Friday', value: DayOfWeek.friday },
  { label: 'Saturday', value: DayOfWeek.saturday },
  { label: 'Sunday', value: DayOfWeek.sunday },
];

const DAY_NAMES_MAP: Record<string, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
};

function getTodayDayOfWeek(): DayOfWeek {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayName = days[new Date().getDay()];
  return DayOfWeek[dayName as keyof typeof DayOfWeek];
}

interface EditFormState {
  workoutName: string;
  workoutDetails: string;
  timeReminder: string;
}

interface DayCardProps {
  day: { label: string; value: DayOfWeek };
  workout: WorkoutScheduleEntry | undefined;
  isToday: boolean;
  onSave: (day: DayOfWeek, form: EditFormState) => Promise<void>;
  onDelete: (workout: WorkoutScheduleEntry) => Promise<void>;
  isSaving: boolean;
  isDeleting: boolean;
}

function DayCard({ day, workout, isToday, onSave, onDelete, isSaving, isDeleting }: DayCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [form, setForm] = useState<EditFormState>({
    workoutName: workout?.workoutName || '',
    workoutDetails: workout?.workoutDetails || '',
    timeReminder: workout?.timeReminder || '',
  });

  const handleEdit = () => {
    setForm({
      workoutName: workout?.workoutName || '',
      workoutDetails: workout?.workoutDetails || '',
      timeReminder: workout?.timeReminder || '',
    });
    setIsEditing(true);
    setIsExpanded(true);
  };

  const handleSave = async () => {
    if (!form.workoutName.trim()) return;
    await onSave(day.value, form);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setForm({
      workoutName: workout?.workoutName || '',
      workoutDetails: workout?.workoutDetails || '',
      timeReminder: workout?.timeReminder || '',
    });
  };

  const handleDelete = async () => {
    if (!workout) return;
    await onDelete(workout);
  };

  return (
    <Card
      className={`border-border/40 transition-all ${
        isToday ? 'border-primary/40 bg-primary/5' : 'bg-card'
      } ${workout?.completed ? 'opacity-75' : ''}`}
    >
      <CardContent className="p-4">
        {/* Day Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className={`text-sm font-black uppercase tracking-wider ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>
              {day.label}
            </span>
            {isToday && (
              <Badge className="bg-primary/20 text-primary border-primary/30 text-xs font-bold px-1.5 py-0">
                Today
              </Badge>
            )}
            {workout?.completed && (
              <Badge className="bg-success/20 text-success border-success/30 text-xs font-bold px-1.5 py-0">
                Done ✓
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-1">
            {workout && !isEditing && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  onClick={() => setIsExpanded(!isExpanded)}
                >
                  {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-primary"
                  onClick={handleEdit}
                >
                  <Edit2 size={14} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                </Button>
              </>
            )}
            {!workout && !isEditing && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-primary hover:bg-primary/10 text-xs font-bold"
                onClick={handleEdit}
              >
                <Plus size={13} className="mr-1" />
                Add
              </Button>
            )}
          </div>
        </div>

        {/* Workout Display */}
        {workout && !isEditing && (
          <div className={`${isExpanded ? '' : 'hidden sm:block'}`}>
            <p className={`font-bold text-base ${workout.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
              {workout.workoutName}
            </p>
            {workout.timeReminder && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                <Clock size={11} />
                <span>{workout.timeReminder}</span>
              </div>
            )}
            {isExpanded && workout.workoutDetails && (
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{workout.workoutDetails}</p>
            )}
          </div>
        )}

        {/* Compact display for mobile */}
        {workout && !isEditing && !isExpanded && (
          <div className="sm:hidden">
            <p className={`font-bold text-base ${workout.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
              {workout.workoutName}
            </p>
            {workout.timeReminder && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                <Clock size={11} />
                <span>{workout.timeReminder}</span>
              </div>
            )}
          </div>
        )}

        {/* No workout placeholder */}
        {!workout && !isEditing && (
          <p className="text-sm text-muted-foreground/60 italic">Rest day — no workout scheduled</p>
        )}

        {/* Edit Form */}
        {isEditing && (
          <div className="space-y-3 mt-1">
            <div>
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 block">
                Workout Name *
              </Label>
              <Input
                value={form.workoutName}
                onChange={(e) => setForm({ ...form, workoutName: e.target.value })}
                placeholder="e.g. Upper Body Strength"
                className="bg-background border-border/60 focus:border-primary h-9 text-sm"
                autoFocus
              />
            </div>
            <div>
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 block">
                Details
              </Label>
              <Textarea
                value={form.workoutDetails}
                onChange={(e) => setForm({ ...form, workoutDetails: e.target.value })}
                placeholder="e.g. 3x10 bench press, 3x12 rows, 4x8 shoulder press..."
                className="bg-background border-border/60 focus:border-primary text-sm resize-none"
                rows={3}
              />
            </div>
            <div>
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 block">
                Time Reminder
              </Label>
              <Input
                value={form.timeReminder}
                onChange={(e) => setForm({ ...form, timeReminder: e.target.value })}
                placeholder="e.g. 6:00 AM, 7:30 PM"
                className="bg-background border-border/60 focus:border-primary h-9 text-sm"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <Button
                size="sm"
                onClick={handleSave}
                disabled={!form.workoutName.trim() || isSaving}
                className="btn-primary font-bold flex-1"
              >
                {isSaving ? (
                  <Loader2 size={14} className="animate-spin mr-1" />
                ) : (
                  <Check size={14} className="mr-1" />
                )}
                Save
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCancel}
                className="border-border/60"
              >
                <X size={14} />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Schedule() {
  const { data: schedules, isLoading } = useGetWorkoutSchedules();
  const { identity } = useInternetIdentity();
  const createOrUpdate = useCreateOrUpdateWorkoutSchedule();
  const deleteSchedule = useDeleteWorkoutSchedule();
  const [savingDay, setSavingDay] = useState<DayOfWeek | null>(null);
  const [deletingDay, setDeletingDay] = useState<DayOfWeek | null>(null);

  const todayDayOfWeek = getTodayDayOfWeek();

  const workoutsByDay = useMemo(() => {
    const map: Partial<Record<DayOfWeek, WorkoutScheduleEntry>> = {};
    if (schedules) {
      schedules.forEach((s) => {
        map[s.dayOfWeek] = s;
      });
    }
    return map;
  }, [schedules]);

  const getWorkoutId = (dayOfWeek: DayOfWeek): string => {
    const principal = identity?.getPrincipal().toString() || 'anon';
    const dayName = Object.entries(DayOfWeek).find(([, v]) => v === dayOfWeek)?.[0] || 'unknown';
    return `${principal}-${dayName}`;
  };

  const handleSave = async (day: DayOfWeek, form: EditFormState) => {
    if (!identity) return;
    setSavingDay(day);
    try {
      const id = getWorkoutId(day);
      const existing = workoutsByDay[day];
      await createOrUpdate.mutateAsync({
        id,
        schedule: {
          dayOfWeek: day,
          workoutName: form.workoutName.trim(),
          workoutDetails: form.workoutDetails.trim(),
          timeReminder: form.timeReminder.trim() || undefined,
          completed: existing?.completed || false,
          owner: identity.getPrincipal(),
        },
      });
    } finally {
      setSavingDay(null);
    }
  };

  const handleDelete = async (workout: WorkoutScheduleEntry) => {
    setDeletingDay(workout.dayOfWeek);
    try {
      const dayName = Object.entries(DayOfWeek).find(([, v]) => v === workout.dayOfWeek)?.[0] || 'unknown';
      const principal = identity?.getPrincipal().toString() || 'anon';
      const id = `${principal}-${dayName}`;
      await deleteSchedule.mutateAsync(id);
    } finally {
      setDeletingDay(null);
    }
  };

  const completedCount = schedules?.filter((s) => s.completed).length || 0;
  const totalCount = schedules?.length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-black">Weekly Schedule</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Plan your workouts for the week
          </p>
        </div>
        {totalCount > 0 && (
          <div className="text-right">
            <p className="text-2xl font-black text-primary">{completedCount}/{totalCount}</p>
            <p className="text-xs text-muted-foreground font-medium">completed</p>
          </div>
        )}
      </div>

      {/* Day Cards */}
      {isLoading ? (
        <div className="space-y-3">
          {DAYS_ORDER.map((day) => (
            <Card key={day.value} className="bg-card border-border/40">
              <CardContent className="p-4">
                <Skeleton className="h-5 w-24 bg-muted mb-2" />
                <Skeleton className="h-4 w-48 bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {DAYS_ORDER.map((day) => (
            <DayCard
              key={day.value}
              day={day}
              workout={workoutsByDay[day.value]}
              isToday={day.value === todayDayOfWeek}
              onSave={handleSave}
              onDelete={handleDelete}
              isSaving={savingDay === day.value}
              isDeleting={deletingDay === day.value}
            />
          ))}
        </div>
      )}

      {/* Tip */}
      {!isLoading && totalCount === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground text-sm">
            No workouts scheduled yet. Click <strong className="text-primary">Add</strong> next to any day to get started!
          </p>
        </div>
      )}
    </div>
  );
}

interface EditFormState {
  workoutName: string;
  workoutDetails: string;
  timeReminder: string;
}

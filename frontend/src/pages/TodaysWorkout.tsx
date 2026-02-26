import { useState } from 'react';
import {
  useGetWorkoutSchedules,
  useMarkWorkoutComplete,
  useGetRandomMotivationalMessage,
} from '../hooks/useQueries';
import { DayOfWeek, WorkoutSchedule } from '../backend';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, RefreshCw, Clock, Dumbbell, Flame, Calendar } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

const DAY_LABELS: Record<DayOfWeek, string> = {
  [DayOfWeek.monday]: 'Monday',
  [DayOfWeek.tuesday]: 'Tuesday',
  [DayOfWeek.wednesday]: 'Wednesday',
  [DayOfWeek.thursday]: 'Thursday',
  [DayOfWeek.friday]: 'Friday',
  [DayOfWeek.saturday]: 'Saturday',
  [DayOfWeek.sunday]: 'Sunday',
};

const DAY_ORDER: DayOfWeek[] = [
  DayOfWeek.monday,
  DayOfWeek.tuesday,
  DayOfWeek.wednesday,
  DayOfWeek.thursday,
  DayOfWeek.friday,
  DayOfWeek.saturday,
  DayOfWeek.sunday,
];

function getTodayDayOfWeek(): DayOfWeek {
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
}

// Must match the stable ID format used in Schedule.tsx: `${day}-entry`
function getWorkoutId(schedule: WorkoutSchedule): string {
  return `${schedule.dayOfWeek}-entry`;
}

export default function TodaysWorkout() {
  const today = getTodayDayOfWeek();
  const { data: schedules = [], isLoading } = useGetWorkoutSchedules();
  const { data: motivationalMessage, refetch: refetchMessage } = useGetRandomMotivationalMessage();
  const markComplete = useMarkWorkoutComplete();
  const queryClient = useQueryClient();

  const todayEntry = schedules.find((s) => s.dayOfWeek === today) ?? null;

  const handleToggleComplete = async () => {
    if (!todayEntry) return;
    const id = getWorkoutId(todayEntry);
    await markComplete.mutateAsync({ id, completed: !todayEntry.completed });
  };

  const handleRefreshMessage = () => {
    queryClient.removeQueries({ queryKey: ['randomMotivationalMessage'] });
    refetchMessage();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground tracking-tight">Today's Workout</h1>
        <p className="text-muted-foreground mt-1">
          {DAY_LABELS[today]} —{' '}
          {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </p>
      </div>

      {/* Motivational Banner */}
      {motivationalMessage && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="py-4 px-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <Flame className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <p className="text-sm text-foreground italic">"{motivationalMessage.message}"</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0 text-muted-foreground hover:text-primary"
                onClick={handleRefreshMessage}
                title="New quote"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Today's Workout Card */}
      {todayEntry ? (
        <Card
          className={`border transition-all ${
            todayEntry.completed
              ? 'border-success/50 shadow-[0_0_16px_rgba(0,200,100,0.15)]'
              : 'border-primary/40 shadow-glow'
          }`}
        >
          <CardHeader className="pb-2 pt-5 px-5">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Dumbbell className="w-5 h-5 text-primary" />
                  <CardTitle className="text-xl font-display font-bold text-foreground">
                    {todayEntry.workoutName}
                  </CardTitle>
                </div>
                {todayEntry.timeReminder && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {todayEntry.timeReminder}
                  </div>
                )}
              </div>
              {todayEntry.completed && (
                <Badge className="bg-success/20 text-success border-success/30 gap-1 shrink-0">
                  <CheckCircle2 className="w-3 h-3" />
                  Completed
                </Badge>
              )}
            </div>
          </CardHeader>

          <CardContent className="px-5 pb-5 space-y-4">
            {/* Workout details */}
            {todayEntry.workoutDetails && (
              <p className="text-sm text-muted-foreground leading-relaxed">
                {todayEntry.workoutDetails}
              </p>
            )}

            {/* Mark complete button */}
            <Button
              className={`w-full font-semibold transition-all ${
                todayEntry.completed
                  ? 'bg-success/20 text-success border border-success/30 hover:bg-success/30'
                  : 'bg-primary text-primary-foreground hover:bg-primary/90'
              }`}
              onClick={handleToggleComplete}
              disabled={markComplete.isPending}
            >
              {markComplete.isPending ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
                  Updating…
                </span>
              ) : todayEntry.completed ? (
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Mark as Incomplete
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Mark Workout Complete ✅
                </span>
              )}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border bg-card">
          <CardContent className="py-12 text-center space-y-3">
            <Dumbbell className="w-12 h-12 text-muted-foreground/30 mx-auto" />
            <p className="text-muted-foreground">No workout scheduled for today.</p>
            <p className="text-sm text-muted-foreground/60">
              Head to the Schedule page to add one!
            </p>
          </CardContent>
        </Card>
      )}

      {/* Week Overview */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            This Week
          </h2>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {DAY_ORDER.map((day) => {
            const entry = schedules.find((s) => s.dayOfWeek === day);
            const isToday = day === today;
            return (
              <div
                key={day}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg text-center transition-all ${
                  isToday
                    ? 'bg-primary/10 border border-primary/30'
                    : 'bg-card border border-border/50'
                }`}
              >
                <span
                  className={`text-xs font-medium ${isToday ? 'text-primary' : 'text-muted-foreground'}`}
                >
                  {DAY_LABELS[day].slice(0, 3)}
                </span>
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    entry?.completed
                      ? 'bg-success/20'
                      : entry
                        ? 'bg-primary/20'
                        : 'bg-muted/30'
                  }`}
                >
                  {entry?.completed ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                  ) : entry ? (
                    <Dumbbell className="w-3 h-3 text-primary/60" />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

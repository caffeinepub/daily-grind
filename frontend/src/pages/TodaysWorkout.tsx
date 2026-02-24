import { useMemo } from 'react';
import { Link } from '@tanstack/react-router';
import { CheckCircle2, Circle, Calendar, Clock, Dumbbell, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useGetWorkoutSchedules, useMarkWorkoutComplete, useRandomMotivationalMessage } from '../hooks/useQueries';
import { DayOfWeek, WorkoutScheduleEntry } from '../backend';
import { useGetCallerUserProfile } from '../hooks/useQueries';

const DAY_MAP: Record<string, DayOfWeek> = {
  sunday: DayOfWeek.sunday,
  monday: DayOfWeek.monday,
  tuesday: DayOfWeek.tuesday,
  wednesday: DayOfWeek.wednesday,
  thursday: DayOfWeek.thursday,
  friday: DayOfWeek.friday,
  saturday: DayOfWeek.saturday,
};

const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

function getTodayDayOfWeek(): DayOfWeek {
  const dayName = DAY_NAMES[new Date().getDay()];
  return DAY_MAP[dayName];
}

function getTodayLabel(): string {
  return DAY_NAMES[new Date().getDay()].charAt(0).toUpperCase() + DAY_NAMES[new Date().getDay()].slice(1);
}

// Generate a stable ID for a workout entry based on day
function getWorkoutId(entry: WorkoutScheduleEntry): string {
  const dayName = Object.entries(DayOfWeek).find(([, v]) => v === entry.dayOfWeek)?.[0] || 'unknown';
  return `${entry.owner.toString()}-${dayName}`;
}

export default function TodaysWorkout() {
  const { data: schedules, isLoading: schedulesLoading } = useGetWorkoutSchedules();
  const { data: motivationalMsg, isLoading: msgLoading, refetch: refetchMsg } = useRandomMotivationalMessage();
  const { data: userProfile } = useGetCallerUserProfile();
  const markComplete = useMarkWorkoutComplete();

  const todayDayOfWeek = getTodayDayOfWeek();

  const todayWorkout = useMemo(() => {
    if (!schedules) return null;
    return schedules.find((s) => s.dayOfWeek === todayDayOfWeek) || null;
  }, [schedules, todayDayOfWeek]);

  const handleToggleComplete = async () => {
    if (!todayWorkout) return;
    const id = getWorkoutId(todayWorkout);
    await markComplete.mutateAsync({ id, completed: !todayWorkout.completed });
  };

  const greeting = userProfile?.displayName ? `Hey, ${userProfile.displayName}!` : 'Hey, Athlete!';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-muted-foreground text-sm font-medium uppercase tracking-widest">
          {getTodayLabel()} · {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
        </p>
        <h1 className="text-3xl font-black mt-1">{greeting}</h1>
      </div>

      {/* Motivational Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/30 p-5">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="relative">
          <p className="text-xs font-bold uppercase tracking-widest text-primary mb-2">Daily Fuel 🔥</p>
          {msgLoading ? (
            <Skeleton className="h-6 w-3/4 bg-primary/10" />
          ) : (
            <p className="text-lg font-bold text-foreground leading-snug">
              "{motivationalMsg?.message || 'Push yourself because no one else is going to do it for you.'}"
            </p>
          )}
          <button
            onClick={() => refetchMsg()}
            className="mt-3 flex items-center gap-1.5 text-xs text-primary/70 hover:text-primary transition-colors font-semibold"
          >
            <RefreshCw size={12} />
            New message
          </button>
        </div>
      </div>

      {/* Today's Workout */}
      <div>
        <h2 className="text-lg font-black mb-3 flex items-center gap-2">
          <Dumbbell size={18} className="text-primary" />
          Today's Workout
        </h2>

        {schedulesLoading ? (
          <Card className="bg-card border-border/40">
            <CardContent className="p-6 space-y-3">
              <Skeleton className="h-7 w-1/2 bg-muted" />
              <Skeleton className="h-4 w-3/4 bg-muted" />
              <Skeleton className="h-4 w-2/3 bg-muted" />
              <Skeleton className="h-10 w-full bg-muted mt-4" />
            </CardContent>
          </Card>
        ) : todayWorkout ? (
          <Card className={`border-border/40 transition-all ${todayWorkout.completed ? 'bg-success/5 border-success/30' : 'bg-card'}`}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {todayWorkout.completed ? (
                      <CheckCircle2 size={20} className="text-success flex-shrink-0" />
                    ) : (
                      <Circle size={20} className="text-muted-foreground flex-shrink-0" />
                    )}
                    <h3 className={`text-xl font-black truncate ${todayWorkout.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                      {todayWorkout.workoutName}
                    </h3>
                  </div>

                  {todayWorkout.timeReminder && (
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-3 ml-7">
                      <Clock size={13} />
                      <span>{todayWorkout.timeReminder}</span>
                    </div>
                  )}

                  <p className="text-sm text-muted-foreground leading-relaxed ml-7">
                    {todayWorkout.workoutDetails}
                  </p>
                </div>
              </div>

              <Button
                onClick={handleToggleComplete}
                disabled={markComplete.isPending}
                className={`w-full mt-5 font-bold ${
                  todayWorkout.completed
                    ? 'bg-success/15 text-success border border-success/30 hover:bg-success/25'
                    : 'btn-primary'
                }`}
                variant={todayWorkout.completed ? 'outline' : 'default'}
              >
                {markComplete.isPending ? (
                  <Loader2 size={16} className="animate-spin mr-2" />
                ) : todayWorkout.completed ? (
                  '✅ Completed! Tap to undo'
                ) : (
                  '✅ Mark as Completed'
                )}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-card border-border/40 border-dashed">
            <CardContent className="p-8 text-center">
              <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
                <Calendar size={24} className="text-muted-foreground" />
              </div>
              <h3 className="font-bold text-foreground mb-1">Rest Day 😴</h3>
              <p className="text-sm text-muted-foreground mb-4">
                No workout scheduled for {getTodayLabel()}. Enjoy your rest or add one!
              </p>
              <Link to="/schedule">
                <Button variant="outline" size="sm" className="border-primary/40 text-primary hover:bg-primary/10">
                  Add Today's Workout
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Quick Week Overview */}
      {schedules && schedules.length > 0 && (
        <div>
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-3">This Week</h2>
          <div className="grid grid-cols-7 gap-1">
            {DAY_NAMES.map((day) => {
              const dayEnum = DAY_MAP[day];
              const workout = schedules.find((s) => s.dayOfWeek === dayEnum);
              const isToday = dayEnum === todayDayOfWeek;
              const shortDay = day.slice(0, 1).toUpperCase();

              return (
                <div
                  key={day}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                    isToday ? 'bg-primary/15 border border-primary/30' : 'bg-card border border-border/30'
                  }`}
                >
                  <span className={`text-xs font-bold ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>
                    {shortDay}
                  </span>
                  <div
                    className={`w-2 h-2 rounded-full ${
                      workout?.completed
                        ? 'bg-success'
                        : workout
                        ? isToday
                          ? 'bg-primary'
                          : 'bg-muted-foreground/40'
                        : 'bg-transparent border border-border/40'
                    }`}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

import { useMemo } from 'react';
import { TrendingUp, Flame, CheckCircle2, Target, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress as ProgressBar } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useGetWorkoutSchedules, useGetCallerUserProfile } from '../hooks/useQueries';
import { DayOfWeek, WorkoutScheduleEntry } from '../backend';

const DAYS_ORDER: { label: string; short: string; value: DayOfWeek }[] = [
  { label: 'Monday', short: 'Mon', value: DayOfWeek.monday },
  { label: 'Tuesday', short: 'Tue', value: DayOfWeek.tuesday },
  { label: 'Wednesday', short: 'Wed', value: DayOfWeek.wednesday },
  { label: 'Thursday', short: 'Thu', value: DayOfWeek.thursday },
  { label: 'Friday', short: 'Fri', value: DayOfWeek.friday },
  { label: 'Saturday', short: 'Sat', value: DayOfWeek.saturday },
  { label: 'Sunday', short: 'Sun', value: DayOfWeek.sunday },
];

function getTodayDayOfWeek(): DayOfWeek {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayName = days[new Date().getDay()];
  return DayOfWeek[dayName as keyof typeof DayOfWeek];
}

function calculateStreak(schedules: WorkoutScheduleEntry[]): number {
  const todayIndex = DAYS_ORDER.findIndex((d) => d.value === getTodayDayOfWeek());
  let streak = 0;

  for (let i = todayIndex; i >= 0; i--) {
    const day = DAYS_ORDER[i];
    const workout = schedules.find((s) => s.dayOfWeek === day.value);
    if (workout?.completed) {
      streak++;
    } else if (workout) {
      // Has a workout but not completed — break streak
      break;
    }
    // No workout scheduled = rest day, doesn't break streak
  }

  return streak;
}

function calculateWeeklyProgress(schedules: WorkoutScheduleEntry[]): {
  completed: number;
  total: number;
  percentage: number;
} {
  const total = schedules.length;
  const completed = schedules.filter((s) => s.completed).length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  return { completed, total, percentage };
}

export default function Progress() {
  const { data: schedules, isLoading } = useGetWorkoutSchedules();
  const { data: userProfile } = useGetCallerUserProfile();

  const todayDayOfWeek = getTodayDayOfWeek();

  const stats = useMemo(() => {
    if (!schedules) return null;
    const streak = calculateStreak(schedules);
    const weekly = calculateWeeklyProgress(schedules);
    return { streak, ...weekly };
  }, [schedules]);

  const workoutsByDay = useMemo(() => {
    const map: Partial<Record<DayOfWeek, WorkoutScheduleEntry>> = {};
    if (schedules) {
      schedules.forEach((s) => {
        map[s.dayOfWeek] = s;
      });
    }
    return map;
  }, [schedules]);

  const greeting = userProfile?.displayName ? `${userProfile.displayName}'s Progress` : 'Your Progress';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black">{greeting}</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Stats Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="bg-card border-border/40">
              <CardContent className="p-4">
                <Skeleton className="h-8 w-12 bg-muted mb-2" />
                <Skeleton className="h-4 w-20 bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {/* Completed This Week */}
          <Card className="bg-card border-border/40 col-span-1">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 size={16} className="text-success" />
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Completed</span>
              </div>
              <p className="text-3xl font-black text-foreground">{stats?.completed ?? 0}</p>
              <p className="text-xs text-muted-foreground mt-0.5">of {stats?.total ?? 0} workouts</p>
            </CardContent>
          </Card>

          {/* Streak */}
          <Card className="bg-card border-border/40 col-span-1">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Flame size={16} className="text-primary" />
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Streak</span>
              </div>
              <p className="text-3xl font-black text-foreground">{stats?.streak ?? 0}</p>
              <p className="text-xs text-muted-foreground mt-0.5">consecutive days</p>
            </CardContent>
          </Card>

          {/* Completion Rate */}
          <Card className="bg-card border-border/40 col-span-1">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp size={16} className="text-chart-2" />
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Rate</span>
              </div>
              <p className="text-3xl font-black text-foreground">{stats?.percentage ?? 0}%</p>
              <p className="text-xs text-muted-foreground mt-0.5">completion rate</p>
            </CardContent>
          </Card>

          {/* Scheduled */}
          <Card className="bg-card border-border/40 col-span-1">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Target size={16} className="text-chart-4" />
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Scheduled</span>
              </div>
              <p className="text-3xl font-black text-foreground">{stats?.total ?? 0}</p>
              <p className="text-xs text-muted-foreground mt-0.5">days this week</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Weekly Progress Bar */}
      <Card className="bg-card border-border/40">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-black text-sm uppercase tracking-wider text-muted-foreground">Weekly Progress</h3>
            <span className="text-sm font-black text-primary">{stats?.percentage ?? 0}%</span>
          </div>
          <ProgressBar
            value={stats?.percentage ?? 0}
            className="h-3 bg-muted"
          />
          <p className="text-xs text-muted-foreground mt-2">
            {stats?.completed ?? 0} of {stats?.total ?? 0} scheduled workouts completed
          </p>
        </CardContent>
      </Card>

      {/* Day-by-Day Breakdown */}
      <div>
        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
          <Calendar size={14} />
          Day Breakdown
        </h2>
        {isLoading ? (
          <div className="space-y-2">
            {DAYS_ORDER.map((d) => (
              <Skeleton key={d.value} className="h-14 w-full bg-muted rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {DAYS_ORDER.map((day) => {
              const workout = workoutsByDay[day.value];
              const isToday = day.value === todayDayOfWeek;

              return (
                <div
                  key={day.value}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                    isToday
                      ? 'border-primary/40 bg-primary/5'
                      : 'border-border/30 bg-card'
                  }`}
                >
                  {/* Status Icon */}
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      workout?.completed
                        ? 'bg-success/20'
                        : workout
                        ? isToday
                          ? 'bg-primary/20'
                          : 'bg-muted/50'
                        : 'bg-muted/20'
                    }`}
                  >
                    {workout?.completed ? (
                      <CheckCircle2 size={16} className="text-success" />
                    ) : workout ? (
                      <Target size={16} className={isToday ? 'text-primary' : 'text-muted-foreground'} />
                    ) : (
                      <span className="text-xs text-muted-foreground/40">—</span>
                    )}
                  </div>

                  {/* Day Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold ${isToday ? 'text-primary' : 'text-foreground'}`}>
                        {day.label}
                      </span>
                      {isToday && (
                        <span className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded font-bold">
                          Today
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {workout ? workout.workoutName : 'Rest day'}
                    </p>
                  </div>

                  {/* Status Badge */}
                  <div className="flex-shrink-0">
                    {workout?.completed ? (
                      <span className="text-xs font-bold text-success">Done ✓</span>
                    ) : workout ? (
                      <span className="text-xs font-medium text-muted-foreground">Pending</span>
                    ) : (
                      <span className="text-xs text-muted-foreground/40">—</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Motivational Footer */}
      {stats && stats.percentage === 100 && (
        <Card className="bg-gradient-to-br from-primary/20 to-primary/5 border-primary/30">
          <CardContent className="p-5 text-center">
            <p className="text-2xl mb-1">🏆</p>
            <p className="font-black text-foreground">Perfect Week!</p>
            <p className="text-sm text-muted-foreground mt-1">You crushed every workout this week. Legendary.</p>
          </CardContent>
        </Card>
      )}

      {stats && stats.total === 0 && (
        <Card className="bg-card border-border/40 border-dashed">
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground text-sm">
              No workouts scheduled yet. Head to the{' '}
              <a href="/schedule" className="text-primary font-bold hover:underline">
                Schedule
              </a>{' '}
              tab to plan your week!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

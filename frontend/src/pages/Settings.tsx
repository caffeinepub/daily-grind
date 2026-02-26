import { useState } from 'react';
import { Settings2, ChevronUp, ChevronDown, Minus, Trophy, Info, Loader2, Bell, BellOff, BellRing } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { useGetUserTier, useEvaluateAndAdvanceTier, useGetWorkoutSchedules } from '../hooks/useQueries';
import TierBadge, { TIERS, getTierStyle } from '../components/TierBadge';
import { Variant_up_down_same, TierProgressionResult } from '../backend';
import { useNotifications } from '../hooks/useNotifications';

function getCurrentWeekNumber(): bigint {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const diff = now.getTime() - start.getTime();
  const oneWeek = 1000 * 60 * 60 * 24 * 7;
  return BigInt(Math.floor(diff / oneWeek) + 1);
}

export default function Settings() {
  const { data: tier, isLoading: tierLoading } = useGetUserTier();
  const { data: schedules } = useGetWorkoutSchedules();
  const evaluateMutation = useEvaluateAndAdvanceTier();
  const [lastResult, setLastResult] = useState<TierProgressionResult | null>(null);

  const {
    permission,
    isEnabled,
    isLoading: notifLoading,
    permissionDenied,
    enableNotifications,
    disableNotifications,
    sendTestNotification,
  } = useNotifications();

  const completedCount = schedules?.filter((s) => s.completed).length ?? 0;
  const completionOf7 = Math.round((completedCount / 7) * 100);

  const handleEvaluate = async () => {
    try {
      const weekNumber = getCurrentWeekNumber();
      const result = await evaluateMutation.mutateAsync(weekNumber);
      setLastResult(result);
    } catch {
      // error handled by mutation state
    }
  };

  const handleNotificationToggle = async (checked: boolean) => {
    if (checked) {
      await enableNotifications();
    } else {
      await disableNotifications();
    }
  };

  const tierIndex = tier ? Number(tier.index) : 0;
  // TIERS is string[], so elements are plain strings
  const nextTierName = tierIndex < TIERS.length - 1 ? TIERS[tierIndex + 1] : null;
  const prevTierName = tierIndex > 0 ? TIERS[tierIndex - 1] : null;

  const notifUnsupported = permission === 'unsupported';

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
          <Settings2 size={20} className="text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-black">Settings</h1>
          <p className="text-muted-foreground text-sm">Tier progression & notifications</p>
        </div>
      </div>

      {/* Workout Reminders */}
      <Card className="bg-card border-border/40">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Bell size={16} className="text-primary" />
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Workout Reminders</h2>
          </div>

          {notifUnsupported ? (
            <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/40 border border-border/30">
              <BellOff size={16} className="text-muted-foreground mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground">
                Push notifications are not supported in your browser. Try opening the app in a modern browser like Chrome or Safari.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Toggle row */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <Label htmlFor="notif-toggle" className="text-sm font-semibold cursor-pointer">
                    Remind me every 6 hours
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Get a push notification with a motivational quote to complete your daily workout.
                  </p>
                </div>
                <Switch
                  id="notif-toggle"
                  checked={isEnabled}
                  onCheckedChange={handleNotificationToggle}
                  disabled={notifLoading || permission === 'loading'}
                />
              </div>

              {/* Loading indicator */}
              {notifLoading && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 size={12} className="animate-spin" />
                  <span>Updating notification settings…</span>
                </div>
              )}

              {/* Permission denied warning */}
              {permissionDenied && (
                <div className="flex items-start gap-3 p-3 rounded-xl bg-destructive/10 border border-destructive/30">
                  <BellOff size={15} className="text-destructive mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-destructive">Notifications blocked</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      You've blocked notifications for this site. To enable reminders, go to your browser settings and allow notifications for this app, then toggle back on.
                    </p>
                  </div>
                </div>
              )}

              {/* Active state info */}
              {isEnabled && !permissionDenied && (
                <div className="flex items-start gap-3 p-3 rounded-xl bg-success/10 border border-success/30">
                  <BellRing size={15} className="text-success mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-success">Reminders active</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      You'll receive a workout reminder with a motivational quote every 6 hours while your browser is running.
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs h-7 px-2 text-muted-foreground hover:text-foreground shrink-0"
                    onClick={sendTestNotification}
                  >
                    Test
                  </Button>
                </div>
              )}

              {/* Inactive hint */}
              {!isEnabled && !permissionDenied && permission !== 'loading' && (
                <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/40 border border-border/30">
                  <Info size={15} className="text-muted-foreground mt-0.5 shrink-0" />
                  <p className="text-xs text-muted-foreground">
                    Enable reminders to get notified every 6 hours with a motivational quote — even when you're not in the app.
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Current Tier */}
      <Card className="bg-card border-border/40">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Trophy size={16} className="text-primary" />
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Current Tier</h2>
          </div>

          {tierLoading ? (
            <Skeleton className="h-12 w-full bg-muted rounded-xl" />
          ) : tier ? (
            <div className="space-y-4">
              <TierBadge tier={tier} variant="full" />

              {/* Progress toward next tier */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Weekly completion</span>
                  <span className="font-bold">{completedCount}/7 days</span>
                </div>
                <Progress value={completionOf7} className="h-2 bg-muted" />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>≥70% to advance</span>
                  <span>{completionOf7}%</span>
                </div>
              </div>

              {/* Tier neighbors — TIERS is string[], so elements are plain strings */}
              <div className="flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-1 text-muted-foreground">
                  {prevTierName ? (
                    <>
                      <ChevronDown size={12} />
                      <span>{prevTierName}</span>
                    </>
                  ) : (
                    <>
                      <Minus size={12} />
                      <span>Floor</span>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  {nextTierName ? (
                    <>
                      <span>{nextTierName}</span>
                      <ChevronUp size={12} />
                    </>
                  ) : (
                    <>
                      <span>Max tier</span>
                      <Trophy size={12} className="text-primary" />
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No tier data available.</p>
          )}
        </CardContent>
      </Card>

      {/* Evaluate Tier */}
      <Card className="bg-card border-border/40">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUpIcon size={16} className="text-primary" />
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Tier Evaluation</h2>
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            Evaluate your performance for this week. Your tier will advance, hold, or drop based on how many workouts you completed (≥70% = advance, 40–69% = hold, &lt;40% = drop).
          </p>

          <Button
            onClick={handleEvaluate}
            disabled={evaluateMutation.isPending}
            className="w-full"
          >
            {evaluateMutation.isPending ? (
              <>
                <Loader2 size={14} className="mr-2 animate-spin" />
                Evaluating…
              </>
            ) : (
              'Evaluate This Week'
            )}
          </Button>

          {/* Result */}
          {lastResult && (
            <div className={`mt-4 p-3 rounded-xl border text-sm ${
              lastResult.direction === Variant_up_down_same.up
                ? 'bg-success/10 border-success/30 text-success'
                : lastResult.direction === Variant_up_down_same.down
                ? 'bg-destructive/10 border-destructive/30 text-destructive'
                : 'bg-muted/40 border-border/30 text-muted-foreground'
            }`}>
              <div className="flex items-center gap-2 font-bold mb-1">
                {lastResult.direction === Variant_up_down_same.up && <ChevronUp size={14} />}
                {lastResult.direction === Variant_up_down_same.down && <ChevronDown size={14} />}
                {lastResult.direction === Variant_up_down_same.same && <Minus size={14} />}
                <span>
                  {lastResult.direction === Variant_up_down_same.up && 'Tier Up!'}
                  {lastResult.direction === Variant_up_down_same.down && 'Tier Down'}
                  {lastResult.direction === Variant_up_down_same.same && 'Tier Held'}
                </span>
              </div>
              <p className="text-xs opacity-80">
                {lastResult.previousTier.name} → {lastResult.newTier.name}
              </p>
            </div>
          )}

          {evaluateMutation.isError && (
            <p className="mt-3 text-xs text-destructive">
              Evaluation failed. Please try again.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Tier Reference Grid */}
      <Card className="bg-card border-border/40">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Trophy size={16} className="text-primary" />
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">All Tiers</h2>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {TIERS.map((tierName, idx) => {
              // getTierStyle takes a tier name string
              const style = getTierStyle(tierName);
              const isCurrent = tier ? Number(tier.index) === idx : false;
              return (
                <div
                  key={idx}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-semibold transition-all ${
                    isCurrent
                      ? 'border-primary/60 bg-primary/10 text-primary'
                      : `border-border/30 ${style.bg} ${style.text}`
                  }`}
                >
                  <span>{style.icon}</span>
                  {/* tierName is already a plain string */}
                  <span>{tierName}</span>
                  {isCurrent && <span className="ml-auto text-[10px] font-black text-primary">YOU</span>}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Local icon alias to avoid import conflict with Progress component
function TrendingUpIcon({ size, className }: { size: number; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  );
}

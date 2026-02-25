import { useState } from 'react';
import { Settings2, ChevronUp, ChevronDown, Minus, Trophy, Info, Loader2, Bell, BellOff, BellRing } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { useUserTier, useEvaluateTier, useGetWorkoutSchedules } from '../hooks/useQueries';
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
  const { data: tier, isLoading: tierLoading } = useUserTier();
  const { data: schedules } = useGetWorkoutSchedules();
  const evaluateMutation = useEvaluateTier();
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
            <div className="flex flex-col items-center gap-3">
              <Skeleton className="h-32 w-48 rounded-2xl bg-muted" />
            </div>
          ) : tier ? (
            <div className="flex flex-col items-center gap-4">
              <TierBadge tier={tier} variant="full" />

              {/* Tier ladder context */}
              <div className="w-full space-y-1.5 text-sm">
                {nextTierName && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <ChevronUp size={14} className="text-success shrink-0" />
                    <span>Next: <span className="font-semibold text-foreground">{nextTierName}</span></span>
                  </div>
                )}
                {prevTierName && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <ChevronDown size={14} className="text-destructive shrink-0" />
                    <span>Previous: <span className="font-semibold text-foreground">{prevTierName}</span></span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm text-center py-4">No tier data available.</p>
          )}
        </CardContent>
      </Card>

      {/* Weekly Completion */}
      <Card className="bg-card border-border/40">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">This Week's Completion</h2>
            <span className="text-sm font-black text-primary">{completionOf7}%</span>
          </div>
          <Progress value={completionOf7} className="h-3 bg-muted mb-3" />
          <p className="text-xs text-muted-foreground">
            {completedCount} of 7 days completed ({completedCount} scheduled workouts done)
          </p>

          {/* Thresholds */}
          <div className="mt-4 space-y-2">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Advancement Thresholds</p>
            <div className={`flex items-center gap-2 text-xs rounded-lg px-3 py-2 ${completionOf7 >= 70 ? 'bg-success/10 border border-success/30' : 'bg-muted/50'}`}>
              <ChevronUp size={13} className={completionOf7 >= 70 ? 'text-success' : 'text-muted-foreground'} />
              <span className={completionOf7 >= 70 ? 'text-success font-semibold' : 'text-muted-foreground'}>
                ≥ 70% — Advance to next tier
              </span>
            </div>
            <div className={`flex items-center gap-2 text-xs rounded-lg px-3 py-2 ${completionOf7 >= 40 && completionOf7 < 70 ? 'bg-primary/10 border border-primary/30' : 'bg-muted/50'}`}>
              <Minus size={13} className={completionOf7 >= 40 && completionOf7 < 70 ? 'text-primary' : 'text-muted-foreground'} />
              <span className={completionOf7 >= 40 && completionOf7 < 70 ? 'text-primary font-semibold' : 'text-muted-foreground'}>
                40–69% — Hold current tier
              </span>
            </div>
            <div className={`flex items-center gap-2 text-xs rounded-lg px-3 py-2 ${completionOf7 < 40 ? 'bg-destructive/10 border border-destructive/30' : 'bg-muted/50'}`}>
              <ChevronDown size={13} className={completionOf7 < 40 ? 'text-destructive' : 'text-muted-foreground'} />
              <span className={completionOf7 < 40 ? 'text-destructive font-semibold' : 'text-muted-foreground'}>
                &lt; 40% — Drop one tier
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Evaluate Button */}
      <Card className="bg-card border-border/40">
        <CardContent className="p-5">
          <div className="flex items-start gap-2 mb-4">
            <Info size={15} className="text-muted-foreground mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground">
              Click "Evaluate This Week" at the end of each week to update your tier based on your workout completion. Your tier will advance, hold, or drop based on the thresholds above.
            </p>
          </div>

          <Button
            onClick={handleEvaluate}
            disabled={evaluateMutation.isPending || tierLoading}
            className="w-full font-bold"
            size="lg"
          >
            {evaluateMutation.isPending ? (
              <>
                <Loader2 size={16} className="animate-spin mr-2" />
                Evaluating…
              </>
            ) : (
              'Evaluate This Week'
            )}
          </Button>

          {/* Result feedback */}
          {lastResult && !evaluateMutation.isPending && (
            <div className={`mt-4 rounded-xl p-4 border text-sm font-semibold text-center ${
              lastResult.direction === Variant_up_down_same.up
                ? 'bg-success/10 border-success/30 text-success'
                : lastResult.direction === Variant_up_down_same.down
                ? 'bg-destructive/10 border-destructive/30 text-destructive'
                : 'bg-muted/50 border-border/40 text-muted-foreground'
            }`}>
              {lastResult.direction === Variant_up_down_same.up && (
                <span>🎉 Promoted! {lastResult.previousTier.name} → <strong>{lastResult.newTier.name}</strong></span>
              )}
              {lastResult.direction === Variant_up_down_same.down && (
                <span>📉 Dropped: {lastResult.previousTier.name} → <strong>{lastResult.newTier.name}</strong></span>
              )}
              {lastResult.direction === Variant_up_down_same.same && (
                <span>➡️ Held tier: <strong>{lastResult.newTier.name}</strong></span>
              )}
            </div>
          )}

          {evaluateMutation.isError && (
            <p className="mt-3 text-xs text-destructive text-center">
              {(evaluateMutation.error as Error)?.message ?? 'Evaluation failed. Please try again.'}
            </p>
          )}
        </CardContent>
      </Card>

      {/* All Tiers Reference */}
      <Card className="bg-card border-border/40">
        <CardContent className="p-5">
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">All Tiers</h2>
          <div className="grid grid-cols-2 gap-2">
            {TIERS.map((tierName, idx) => {
              const style = getTierStyle(tierName);
              const isCurrent = tier && Number(tier.index) === idx;
              return (
                <div
                  key={tierName}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-semibold transition-all ${
                    isCurrent
                      ? `${style.bg} ${style.border} ${style.text} ${style.glow}`
                      : 'bg-muted/30 border-border/20 text-muted-foreground'
                  }`}
                >
                  <span>{style.icon}</span>
                  <span>{tierName}</span>
                  {isCurrent && <span className="ml-auto text-[10px] font-black uppercase tracking-wider opacity-80">YOU</span>}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

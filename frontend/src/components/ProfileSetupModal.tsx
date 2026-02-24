import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2, Dumbbell } from 'lucide-react';
import { useSaveCallerUserProfile } from '../hooks/useQueries';

interface ProfileSetupModalProps {
  open: boolean;
}

export default function ProfileSetupModal({ open }: ProfileSetupModalProps) {
  const [displayName, setDisplayName] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const saveProfile = useSaveCallerUserProfile();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return;
    await saveProfile.mutateAsync({
      displayName: displayName.trim(),
      notificationsEnabled,
    });
  };

  return (
    <Dialog open={open}>
      <DialogContent className="bg-card border-border/60 max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Dumbbell size={20} className="text-primary" />
            </div>
            <DialogTitle className="text-xl font-black">Welcome to Daily Grind</DialogTitle>
          </div>
          <DialogDescription className="text-muted-foreground">
            Let's set up your profile to get started. What should we call you?
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-2">
          <div className="space-y-2">
            <Label htmlFor="displayName" className="text-sm font-semibold text-foreground">
              Your Name
            </Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Alex, Coach Mike..."
              className="bg-background border-border/60 focus:border-primary"
              autoFocus
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-background border border-border/40">
            <div>
              <p className="text-sm font-semibold text-foreground">Workout Reminders</p>
              <p className="text-xs text-muted-foreground">Enable daily workout notifications</p>
            </div>
            <Switch
              checked={notificationsEnabled}
              onCheckedChange={setNotificationsEnabled}
            />
          </div>

          <DialogFooter>
            <Button
              type="submit"
              disabled={!displayName.trim() || saveProfile.isPending}
              className="w-full btn-primary font-bold"
            >
              {saveProfile.isPending ? (
                <>
                  <Loader2 size={16} className="animate-spin mr-2" />
                  Setting up...
                </>
              ) : (
                "Let's Grind 🔥"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
